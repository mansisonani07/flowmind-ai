import { useState, useMemo } from 'react'
import { startOfDay, subDays, startOfMonth, format } from 'date-fns'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

interface Preset {
  label: string
  getRange: () => DateRange
}

const presets: Preset[] = [
  {
    label: 'Last 7 days',
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: 'Last 30 days',
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: 'Last 90 days',
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 89)),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: 'This Month',
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: startOfDay(new Date()),
    }),
  },
]

function formatDateForInput(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function getActivePreset(value: DateRange): string | null {
  for (const preset of presets) {
    const range = preset.getRange()
    if (
      formatDateForInput(range.from) === formatDateForInput(value.from) &&
      formatDateForInput(range.to) === formatDateForInput(value.to)
    ) {
      return preset.label
    }
  }
  return null
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState(formatDateForInput(value.from))
  const [customTo, setCustomTo] = useState(formatDateForInput(value.to))

  const activePreset = useMemo(() => getActivePreset(value), [value])

  const handlePresetClick = (preset: Preset) => {
    const range = preset.getRange()
    setCustomFrom(formatDateForInput(range.from))
    setCustomTo(formatDateForInput(range.to))
    setShowCustom(false)
    onChange(range)
  }

  const handleCustomApply = () => {
    const from = new Date(customFrom + 'T00:00:00')
    const to = new Date(customTo + 'T00:00:00')
    onChange({ from: startOfDay(from), to: startOfDay(to) })
  }

  const handleCustomToggle = () => {
    setShowCustom((prev) => !prev)
    if (!showCustom) {
      setCustomFrom(formatDateForInput(value.from))
      setCustomTo(formatDateForInput(value.to))
    }
  }

  return (
    <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const isActive = activePreset === preset.label && !showCustom
            return (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                )}
              >
                {preset.label}
              </button>
            )
          })}

          {/* Custom toggle */}
          <button
            onClick={handleCustomToggle}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer',
              showCustom
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
            )}
          >
            Custom
            {showCustom ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Custom date inputs */}
        {showCustom && (
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                From
              </label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400"
              />
            </div>
            <div className="pt-4">
              <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                To
              </label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400"
              />
            </div>
            <div className="pt-4">
              <button
                onClick={handleCustomApply}
                className="px-3 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
