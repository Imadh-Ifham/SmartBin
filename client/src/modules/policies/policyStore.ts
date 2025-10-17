import type { Policy } from './types'
import { PolicyAPI } from './api/policyApi'

type PolicyItem = Policy & { id: string }
type Listener = (items: PolicyItem[]) => void

const normalize = (p: any): PolicyItem => {
  const id = (p?.id ?? p?._id ?? `tmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`) as string
  return { ...p, id }
}

class PolicyStore {
  private items: PolicyItem[] = []
  private listeners: Listener[] = []

  get() {
    return this.items.slice()
  }

  getById(id: string) {
    return this.items.find((p) => p.id === id)
  }

  set(items: Policy[] | PolicyItem[]) {
    this.items = (items as any).map(normalize)
    this.emit()
  }

  add(p: Policy | PolicyItem) {
    const item = normalize(p)
    this.items = [item, ...this.items]
    this.emit()
    return item
  }

  update(id: string, patch: Partial<Policy>) {
    this.items = this.items.map((it) => (it.id === id ? { ...it, ...patch } : it))
    this.emit()
  }

  replace(id: string, full: Policy) {
    const item = normalize(full)
    this.items = this.items.map((it) => (it.id === id ? item : it))
    // if not found, prepend
    if (!this.items.find((it) => it.id === item.id)) this.items = [item, ...this.items]
    this.emit()
  }

  remove(id: string) {
    this.items = this.items.filter((it) => it.id !== id)
    this.emit()
  }

  subscribe(fn: Listener) {
    this.listeners.push(fn)
    // initial emit
    fn(this.get())
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn)
    }
  }

  private emit() {
    const snapshot = this.get()
    this.listeners.forEach((l) => l(snapshot))
  }

  async fetch(params?: unknown) {
    try {
      const res = await PolicyAPI.getAll(params as any)
      const payload = res as any
      // res may be array or object { policies: [...] }
      const items = Array.isArray(payload) ? payload : (payload?.policies ?? payload?.data ?? [])
      this.set(items as Policy[])
      return this.get()
    } catch (err) {
      // leave whatever is present
      throw err
    }
  }
}

export const policyStore = new PolicyStore()
