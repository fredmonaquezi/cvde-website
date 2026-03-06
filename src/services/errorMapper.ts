const DEFAULT_OPERATION_ERROR = 'Não foi possível concluir a operação. Tente novamente.'
const DEFAULT_LOAD_ERROR = 'Não foi possível carregar os dados. Tente novamente.'

type ErrorLike = {
  message?: string
  code?: string
  details?: string | null
  status?: number
}

function normalizeError(error: unknown): { message: string; code: string; details: string; status: number | null } {
  if (typeof error === 'string') {
    return {
      message: error,
      code: '',
      details: '',
      status: null,
    }
  }

  if (error && typeof error === 'object') {
    const candidate = error as ErrorLike
    return {
      message: candidate.message ?? '',
      code: candidate.code ?? '',
      details: candidate.details ?? '',
      status: typeof candidate.status === 'number' ? candidate.status : null,
    }
  }

  return {
    message: '',
    code: '',
    details: '',
    status: null,
  }
}

export function mapServiceError(error: unknown, fallback = DEFAULT_OPERATION_ERROR): string {
  const normalized = normalizeError(error)
  const message = normalized.message.trim()
  const messageLc = message.toLowerCase()
  const detailsLc = normalized.details.toLowerCase()
  const codeLc = normalized.code.toLowerCase()

  if (!message && !codeLc) {
    return fallback
  }

  if (
    messageLc.includes('network request failed') ||
    messageLc.includes('failed to fetch') ||
    messageLc.includes('fetch failed') ||
    messageLc.includes('network error')
  ) {
    return 'Falha de conexão. Verifique sua internet e tente novamente.'
  }

  if (
    messageLc.includes('invalid login credentials') ||
    messageLc.includes('invalid email or password')
  ) {
    return 'E-mail ou senha inválidos.'
  }

  if (messageLc.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.'
  }

  if (messageLc.includes('user already registered') || messageLc.includes('already registered')) {
    return 'Este e-mail já está cadastrado.'
  }

  if (messageLc.includes('password should be at least')) {
    return 'A senha deve ter no mínimo 6 caracteres.'
  }

  if (messageLc.includes('new password should be different')) {
    return 'A nova senha deve ser diferente da senha atual.'
  }

  if (
    messageLc.includes('refresh token') ||
    messageLc.includes('jwt expired') ||
    messageLc.includes('token has expired') ||
    messageLc.includes('session not found') ||
    messageLc.includes('invalid jwt')
  ) {
    return 'Sua sessão expirou. Faça login novamente.'
  }

  if (messageLc.includes('email rate limit exceeded') || messageLc.includes('rate limit')) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.'
  }

  if (
    codeLc === '42501' ||
    messageLc.includes('permission denied') ||
    messageLc.includes('row-level security') ||
    messageLc.includes('not allowed')
  ) {
    return 'Você não tem permissão para executar esta ação.'
  }

  if (codeLc === '23505' || messageLc.includes('duplicate key value') || detailsLc.includes('already exists')) {
    return 'Já existe um registro com esses dados.'
  }

  if (codeLc === '23503' || messageLc.includes('foreign key constraint')) {
    return 'Não foi possível concluir a operação porque há referência a um registro inexistente.'
  }

  if (codeLc === '23502' || messageLc.includes('null value in column')) {
    return 'Existem campos obrigatórios não preenchidos.'
  }

  if (codeLc === '22p02' || messageLc.includes('invalid input syntax')) {
    return 'Foi informado um valor em formato inválido.'
  }

  if (codeLc === '42p01' || messageLc.includes('relation') && messageLc.includes('does not exist')) {
    return 'Recurso ainda não configurado no banco de dados. Verifique as migrações.'
  }

  if (normalized.status !== null && normalized.status >= 500) {
    return 'O servidor encontrou um erro. Tente novamente em instantes.'
  }

  return fallback
}

export function mapServiceLoadError(error: unknown): string {
  return mapServiceError(error, DEFAULT_LOAD_ERROR)
}
