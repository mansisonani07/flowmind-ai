import { useMutation } from '@tanstack/react-query'
import { queryAPI } from '@/lib/api'
import type { QueryRequest, PlaygroundQueryResponse } from '@/types'

/**
 * Execute a playground query and return detailed response data including
 * chunks retrieved, embedding metrics, and generation timing.
 *
 * @example
 * const { mutate: ask, data, isLoading } = useQueryPlayground()
 * ask({ question: 'What is the refund policy?' })
 */
export function useQueryPlayground() {
  return useMutation<PlaygroundQueryResponse, Error, QueryRequest>({
    mutationFn: (data) =>
      queryAPI.ask(data).then((res) => res.data as PlaygroundQueryResponse),
    retry: 1,
  })
}
