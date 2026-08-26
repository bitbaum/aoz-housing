/**
 * The shape every Server Action used with useActionState returns.
 * `success` carries a per-action payload for callers that need one
 * (e.g. the created product's id); most actions just need error/ok.
 */
export interface ActionState<T = undefined> {
  error?: string
  ok?: boolean
  data?: T
}

export const IDLE_STATE: ActionState = {}
