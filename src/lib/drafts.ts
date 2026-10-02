import type { Draft } from '../types'

export type DraftField = 'description' | 'amount' | 'date' | 'fund' | 'flow' | 'category'
export type DraftIssues = Partial<Record<DraftField, string>>

export const draftIssues = (draft: Draft): DraftIssues => {
  const issues: DraftIssues = {}
  if (!draft.description.trim()) issues.description = 'Keterangan wajib diisi.'
  if (!(draft.amount > 0)) issues.amount = 'Nominal harus lebih dari Rp0.'
  if (!draft.date) issues.date = 'Tanggal wajib diisi.'
  if (draft.fund === 'review') issues.fund = 'Pilih sumber dana.'
  if (draft.flow === 'review') issues.flow = 'Pilih arus kas.'
  return issues
}
