import { useState, useCallback } from 'react'
import {
  Download,
  Printer,
  FileText,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react'
import Dropdown from '@/components/ui/Dropdown'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useTheme } from '@/hooks/useTheme'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DateRange {
  from: Date
  to: Date
}

interface ReportExporterProps {
  data: Record<string, unknown>
  dateRange: DateRange
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReportHTML(
  data: Record<string, unknown>,
  dateRange: DateRange,
  isDark: boolean,
): string {
  const stats = data as {
    total_queries?: number
    avg_confidence?: number
    avg_response_time?: number
    escalation_rate?: number
    total_documents?: number
    popular_questions?: Array<{
      question: string
      count: number
      avg_confidence: number
      last_asked: string
    }>
  }

  const fromStr = format(dateRange.from, 'MMM d, yyyy')
  const toStr = format(dateRange.to, 'MMM d, yyyy')

  const textColor = isDark ? '#e5e7eb' : '#111827'
  const mutedColor = isDark ? '#9ca3af' : '#6b7280'
  const borderColor = isDark ? '#374151' : '#e5e7eb'
  const headerBg = isDark ? '#1f2937' : '#f9fafb'
  const bgColor = isDark ? '#111827' : '#ffffff'

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return '#10b981'
    if (c >= 0.6) return '#f59e0b'
    return '#ef4444'
  }

  const questions = stats.popular_questions || []
  const questionsRows = questions
    .slice(0, 20)
    .map(
      (q, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid ${borderColor};color:${mutedColor};font-size:13px;font-family:monospace">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${borderColor};color:${textColor};font-size:13px;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${q.question}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${borderColor};color:${textColor};font-size:13px;text-align:right;font-weight:600">${q.count}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${borderColor};text-align:center">
          <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600;background:${confidenceColor(q.avg_confidence)}22;color:${confidenceColor(q.avg_confidence)}">${(q.avg_confidence * 100).toFixed(0)}%</span>
        </td>
      </tr>`,
    )
    .join('')

  const metrics = [
    { label: 'Total Queries', value: (stats.total_queries ?? 0).toLocaleString() },
    { label: 'Avg Confidence', value: ((stats.avg_confidence ?? 0) * 100).toFixed(1) + '%' },
    { label: 'Avg Response Time', value: Math.round(stats.avg_response_time ?? 0) + 'ms' },
    { label: 'Escalation Rate', value: ((stats.escalation_rate ?? 0) * 100).toFixed(1) + '%' },
    { label: 'Documents', value: (stats.total_documents ?? 0).toLocaleString() },
  ]

  const metricCards = metrics
    .map(
      (m) => `
    <div style="flex:1;min-width:140px;padding:16px;border-radius:12px;background:${headerBg};border:1px solid ${borderColor}">
      <div style="font-size:12px;color:${mutedColor};margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em">${m.label}</div>
      <div style="font-size:24px;font-weight:700;color:${textColor}">${m.value}</div>
    </div>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>FlowMind AI — Analytics Report</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: ${bgColor}; color: ${textColor}; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 32px; }
    @media print { .container { padding: 0; } }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${mutedColor}; background: ${headerBg}; border-bottom: 2px solid ${borderColor}; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div style="margin-bottom:32px">
      <h1 style="font-size:28px;font-weight:800;color:${textColor};margin:0 0 4px 0">FlowMind AI</h1>
      <p style="font-size:14px;color:${mutedColor};margin:0">Analytics Report &middot; ${fromStr} – ${toStr}</p>
      <p style="font-size:11px;color:${mutedColor};margin:8px 0 0 0">Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}</p>
    </div>

    <!-- Summary metrics -->
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:32px">
      ${metricCards}
    </div>

    <!-- Top Questions -->
    <div style="margin-bottom:24px">
      <h2 style="font-size:18px;font-weight:700;color:${textColor};margin:0 0 12px 0">Top Questions</h2>
      ${questionsRows.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Question</th>
              <th style="text-align:right">Count</th>
              <th style="text-align:center">Confidence</th>
            </tr>
          </thead>
          <tbody>${questionsRows}</tbody>
        </table>
      ` : '<p style="color:' + mutedColor + ';font-size:14px">No questions recorded for this period.</p>'}
    </div>

    <!-- Footer -->
    <div style="margin-top:40px;padding-top:16px;border-top:1px solid ${borderColor};font-size:11px;color:${mutedColor}">
      FlowMind AI Analytics &middot; Auto-generated report
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportExporter({ data, dateRange }: ReportExporterProps) {
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const openReportWindow = useCallback(() => {
    const html = buildReportHTML(data, dateRange, isDark)
    const win = window.open('', '_blank', 'width=900,height=700')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }, [data, dateRange, isDark])

  const handlePrint = useCallback(() => {
    openReportWindow()
  }, [openReportWindow])

  const handleSavePDF = useCallback(() => {
    openReportWindow()
  }, [openReportWindow])

  const handleCopy = useCallback(async () => {
    try {
      // Copy the raw text summary to clipboard
      const stats = data as {
        total_queries?: number
        avg_confidence?: number
        avg_response_time?: number
        escalation_rate?: number
        total_documents?: number
        popular_questions?: Array<{ question: string; count: number }>
      }
      const fromStr = format(dateRange.from, 'MMM d, yyyy')
      const toStr = format(dateRange.to, 'MMM d, yyyy')

      let text = `FlowMind AI Analytics Report\n${fromStr} – ${toStr}\n\n`
      text += `Total Queries: ${stats.total_queries ?? 0}\n`
      text += `Avg Confidence: ${((stats.avg_confidence ?? 0) * 100).toFixed(1)}%\n`
      text += `Avg Response Time: ${Math.round(stats.avg_response_time ?? 0)}ms\n`
      text += `Escalation Rate: ${((stats.escalation_rate ?? 0) * 100).toFixed(1)}%\n`
      text += `Documents: ${stats.total_documents ?? 0}\n\n`
      text += `Top Questions:\n`
      ;(stats.popular_questions || []).slice(0, 20).forEach((q, i) => {
        text += `  ${i + 1}. ${q.question} (${q.count} queries)\n`
      })

      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: open report window so user can select/copy
      openReportWindow()
    }
  }, [data, dateRange, isDark, openReportWindow])

  const dropdownItems = [
    {
      id: 'print',
      label: 'Print Report',
      icon: <Printer className="w-4 h-4" />,
    },
    {
      id: 'pdf',
      label: 'Save as PDF',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'copy',
      label: copied ? 'Copied!' : 'Copy Summary',
      icon: copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />,
      disabled: false,
    },
  ]

  const handleDropdownSelect = useCallback(
    (id: string) => {
      switch (id) {
        case 'print':
          handlePrint()
          break
        case 'pdf':
          handleSavePDF()
          break
        case 'copy':
          handleCopy()
          break
      }
    },
    [handlePrint, handleSavePDF, handleCopy],
  )

  return (
    <Dropdown
      trigger={
        <button
          className={cn(
            'inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'text-gray-700 dark:text-gray-300',
            'hover:bg-gray-50 dark:hover:bg-gray-700',
            'transition-colors duration-150 cursor-pointer',
            'shadow-sm',
          )}
          aria-label="Export report"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
      }
      items={dropdownItems}
      onSelect={handleDropdownSelect}
      align="right"
      label="Export report options"
    />
  )
}
