import { useMemo } from 'react'
import { format, addDays, startOfDay, startOfWeek, differenceInDays, subMonths } from 'date-fns'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HeatmapDataPoint {
  date: string
  count: number
}

interface HeatmapChartProps {
  data: HeatmapDataPoint[]
  title?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the CSS class pair for a given count value. */
function getLevelClasses(count: number): string {
  if (count === 0) return 'bg-gray-100 dark:bg-gray-800'
  if (count <= 3) return 'bg-green-200 dark:bg-green-900'
  if (count <= 7) return 'bg-green-400 dark:bg-green-700'
  if (count <= 12) return 'bg-green-600 dark:bg-green-500'
  return 'bg-green-800 dark:bg-green-400'
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HeatmapChart({ data, title }: HeatmapChartProps) {
  // Build a lookup map: "YYYY-MM-DD" → count
  const countMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const point of data) {
      const key = format(startOfDay(new Date(point.date)), 'yyyy-MM-dd')
      map.set(key, (map.get(key) ?? 0) + point.count)
    }
    return map
  }, [data])

  // Calculate the grid: last 6 months (183 days) grouped into weeks
  const grid = useMemo(() => {
    const today = startOfDay(new Date())
    const sixMonthsAgo = subMonths(today, 6)

    // Align to the start of the week that contains sixMonthsAgo (Sunday = 0)
    const gridStart = startOfWeek(sixMonthsAgo, { weekStartsOn: 0 })
    const totalDays = differenceInDays(today, gridStart) + 1
    const totalWeeks = Math.ceil(totalDays / 7)

    // Build week columns. Each column is an array of 7 cells (or fewer for the last column).
    const weeks: Array<Array<{ date: string; count: number } | null>> = []

    let current = gridStart
    for (let w = 0; w < totalWeeks; w++) {
      const week: Array<{ date: string; count: number } | null> = []
      for (let d = 0; d < 7; d++) {
        if (current <= today) {
          const key = format(current, 'yyyy-MM-dd')
          week.push({
            date: key,
            count: countMap.get(key) ?? 0,
          })
        } else {
          week.push(null)
        }
        current = addDays(current, 1)
      }
      weeks.push(week)
    }

    return weeks
  }, [countMap])

  // Month labels: detect the first week where the month changes
  const monthLabels = useMemo(() => {
    const labels: { label: string; colIndex: number }[] = []
    let lastMonth = ''
    grid.forEach((week, colIndex) => {
      // Find the first non-null cell in the week
      const firstCell = week.find((c) => c !== null)
      if (firstCell) {
        const month = format(new Date(firstCell.date + 'T00:00:00'), 'MMM')
        if (month !== lastMonth) {
          labels.push({ label: month, colIndex })
          lastMonth = month
        }
      }
    })
    return labels
  }, [grid])

  // Compute column position for month labels
  const getMonthStyle = (colIndex: number): React.CSSProperties => ({
    position: 'absolute' as const,
    left: `${colIndex * 14 + 28}px`, // 14px cell + gap, 28px for day-label offset
    top: 0,
  })

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      )}

      <div className="relative overflow-x-auto pb-2">
        {/* Month labels row */}
        {monthLabels.length > 0 && (
          <div className="relative h-5 mb-1">
            {monthLabels.map((m) => (
              <span
                key={m.label + m.colIndex}
                style={getMonthStyle(m.colIndex)}
                className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap"
              >
                {m.label}
              </span>
            ))}
          </div>
        )}

        {/* Grid: day labels + squares */}
        <div className="flex gap-0">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-[3px] pr-1" style={{ width: '28px' }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="flex items-center justify-end text-[10px] text-gray-500 dark:text-gray-400"
                style={{ height: '14px' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex gap-[3px]">
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, di) => {
                  if (cell === null) {
                    return (
                      <div
                        key={di}
                        className="w-[14px] h-[14px] rounded-[3px]"
                      />
                    )
                  }

                  const isSunday = di === 0
                  const isSaturday = di === 6

                  return (
                    <div
                      key={di}
                      className={cn(
                        'w-[14px] h-[14px] rounded-[3px] transition-colors duration-150 cursor-pointer',
                        getLevelClasses(cell.count),
                        // Subtle scale on hover
                        'hover:scale-125 hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600',
                        // Rounded corners on edges
                        isSunday && 'rounded-l-md',
                        isSaturday && 'rounded-r-md',
                      )}
                      title={`${format(new Date(cell.date + 'T00:00:00'), 'MMM d, yyyy')}: ${cell.count} ${cell.count === 1 ? 'query' : 'queries'}`}
                      role="gridcell"
                      aria-label={`${cell.date}: ${cell.count} queries`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-500 dark:text-gray-400">
          <span>Less</span>
          {[0, 1, 4, 8, 13].map((val) => (
            <div
              key={val}
              className={cn('w-[14px] h-[14px] rounded-[3px]', getLevelClasses(val))}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
