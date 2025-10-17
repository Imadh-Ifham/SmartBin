import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PolicyAPI } from '../api/policyApi'

const KEY = ['policies'] as const

export const usePolicies = (params?: any) =>
  useQuery({ queryKey: KEY, queryFn: () => PolicyAPI.getAll(params) })

export const usePolicy = (id?: string) =>
  useQuery({ queryKey: [...KEY, id], queryFn: () => PolicyAPI.getById(id as string), enabled: !!id })

export const useCreatePolicy = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) => PolicyAPI.create(payload),
    onMutate: async (payload: any) => {
      await qc.cancelQueries({ queryKey: KEY })
      const previous = qc.getQueryData(KEY)
      qc.setQueryData(KEY, (old: any) => {
        const next = Array.isArray(old) ? [...old] : Array.isArray(old?.policies) ? [...old.policies] : []
        const temp = { ...(payload as any), _id: `tmp-${Date.now()}` }
        return [temp, ...next]
      })
      return { previous }
    },
    onError: (_err: any, _vars: any, context: any) => qc.setQueryData(KEY, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  } as any)
}

export const useUpdatePolicy = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: any) => PolicyAPI.update(vars.id, vars.payload),
    onMutate: async (vars: any) => {
      const { id, payload } = vars
      await qc.cancelQueries({ queryKey: KEY })
      const previous = qc.getQueryData(KEY)
      qc.setQueryData(KEY, (old: any) => {
        const list = Array.isArray(old) ? old : old?.policies ?? []
        return list.map((p: any) => (p._id === id ? { ...p, ...payload } : p))
      })
      return { previous }
    },
    onError: (_err: any, _vars: any, context: any) => qc.setQueryData(KEY, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  } as any)
}

export const useDeletePolicy = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PolicyAPI.remove(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: KEY })
      const previous = qc.getQueryData(KEY)
      qc.setQueryData(KEY, (old: any) => {
        const list = Array.isArray(old) ? old : old?.policies ?? []
        return list.filter((p: any) => p._id !== id)
      })
      return { previous }
    },
    onError: (_err: any, _var: any, context: any) => qc.setQueryData(KEY, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  } as any)
}

export const useApprovePolicy = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PolicyAPI.approve(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: KEY })
      const previous = qc.getQueryData(KEY)
      qc.setQueryData(KEY, (old: any) => {
        const list = Array.isArray(old) ? old : old?.policies ?? []
        return list.map((p: any) => (p._id === id ? { ...p, status: 'Active', complianceStatus: 'Compliant' } : p))
      })
      return { previous }
    },
    onError: (_err: any, _var: any, context: any) => qc.setQueryData(KEY, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  } as any)
}

export const useValidatePolicy = () => {
  // validation is a server-side check; no optimistic update
  return useMutation({ mutationFn: (payload: Partial<any>) => PolicyAPI.create(payload) } as any)
}

export const useRequestFeedback = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; payload: { stakeholderGroups?: string[]; message?: string } }) => PolicyAPI.requestFeedback(vars.id, vars.payload),
    onMutate: async (_vars: any) => {
      await qc.cancelQueries({ queryKey: KEY })
      // no optimistic change to list; we'll invalidate after
      return {}
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  } as any)
}

export const usePolicyVersions = (id?: string) =>
  useQuery({ queryKey: [...KEY, id, 'versions'], queryFn: () => PolicyAPI.getVersions(id as string), enabled: !!id })

export default usePolicies
