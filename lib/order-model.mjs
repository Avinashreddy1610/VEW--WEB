export const ORDER_STAGES = ['Raw Material', 'Drawing', 'Turning', 'Gear Cutting', 'Heat Treatment', 'Jig Boring', 'Lapping', 'Sand Blasting', 'Grinding', 'Dispatched']
export const STAGE_STATES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'NOT_REQUIRED']
export function productProgress(item) {
  const stages = (item.stages || []).filter(s => s.status !== 'NOT_REQUIRED')
  const completed = stages.filter(s => s.status === 'COMPLETED').length
  return { percent: stages.length ? Math.round(100 * completed / stages.length) : 0,
    status: stages.some(s => s.status === 'ON_HOLD') ? 'On hold' : stages.length && completed === stages.length ? 'Completed' : stages.some(s => s.status !== 'NOT_STARTED') ? 'In production' : 'Queued' }
}
