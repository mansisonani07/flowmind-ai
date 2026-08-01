import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsAPI } from '@/lib/api'
import type { DocumentInfo } from '@/types'

export function useDocuments() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsAPI.list().then((r) => r.data),
  })

  return {
    documents: data?.documents ?? ([] as DocumentInfo[]),
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch,
  }
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (filename: string) => documentsAPI.delete(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => documentsAPI.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}