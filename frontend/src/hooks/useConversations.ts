import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsAPI } from '@/lib/api'
import type { Conversation } from '@/types'

/**
 * Fetches conversation list with optional limit.
 *
 * @example
 * const { conversations, isLoading } = useConversations(50)
 */
export function useConversations(limit = 50) {
  const { data, isLoading, error, refetch } = useQuery<Conversation[]>({
    queryKey: ['conversations', limit],
    queryFn: () => conversationsAPI.list(limit).then((r) => r.data),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  return {
    conversations: data ?? [],
    isLoading,
    error,
    refetch,
  }
}

/**
 * Star / unstar a conversation (optimistic).
 */
export function useStarConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, starred }: { id: string; starred: boolean }) => {
      // Simulate API call — replace with real endpoint
      await new Promise((r) => setTimeout(r, 300))
      return { id, starred }
    },
    onMutate: async ({ id, starred }) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] })
      const prev = queryClient.getQueryData<Conversation[]>(['conversations'])
      queryClient.setQueryData<Conversation[]>(
        ['conversations'],
        (old) =>
          old?.map((c) => (c.id === id ? { ...c, starred } : c)) ?? [],
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['conversations'], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Add a tag to a conversation.
 */
export function useTagConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      await new Promise((r) => setTimeout(r, 200))
      return { id, tags }
    },
    onMutate: async ({ id, tags }) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] })
      const prev = queryClient.getQueryData<Conversation[]>(['conversations'])
      queryClient.setQueryData<Conversation[]>(
        ['conversations'],
        (old) =>
          old?.map((c) => (c.id === id ? { ...c, tags } : c)) ?? [],
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['conversations'], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
