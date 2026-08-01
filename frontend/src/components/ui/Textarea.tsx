import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
  maxLength?: number
  showCount?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, fullWidth = true, id, maxLength, showCount, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const charCount = typeof props.value === 'string' ? props.value.length : 0
    const showMaxLength = showCount && maxLength !== undefined

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
            'px-4 py-3 text-sm transition-all duration-200 resize-y min-h-[80px]',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-950',
            error
              ? 'border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-red-500/50'
              : 'border-gray-200 dark:border-gray-700 focus:border-gray-400 focus:ring-gray-400/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          maxLength={maxLength}
          {...props}
        />
        <div className="flex justify-between mt-1.5">
          <div>
            {error && (
              <p id={`${textareaId}-error`} className="text-xs text-red-500 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            {hint && !error && (
              <p id={`${textareaId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">
                {hint}
              </p>
            )}
          </div>
          {showMaxLength && (
            <p className={cn(
              'text-xs tabular-nums',
              charCount > maxLength * 0.9 ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'
            )}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'

export default Textarea
