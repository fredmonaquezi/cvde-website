export type ServiceResult<T> = {
  data: T | null
  error: string | null
}

export type ServiceMutationResult = {
  error: string | null
}
