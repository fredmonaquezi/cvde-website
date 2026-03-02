export type ClinicAddressFields = {
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
}

export const BRAZIL_STATE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapa' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceara' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espirito Santo' },
  { value: 'GO', label: 'Goias' },
  { value: 'MA', label: 'Maranhao' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Para' },
  { value: 'PB', label: 'Paraiba' },
  { value: 'PR', label: 'Parana' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piaui' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondonia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'Sao Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

export function createEmptyClinicAddressFields(): ClinicAddressFields {
  return {
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
  }
}

export function parseClinicAddress(value: string | null | undefined): ClinicAddressFields {
  const emptyFields = createEmptyClinicAddressFields()

  if (!value?.trim()) {
    return emptyFields
  }

  const trimmedValue = value.trim()
  const matchedAddress = trimmedValue.match(/^(.*?),\s*(.*?)\s*-\s*(.*?),\s*(.*?)\s*-\s*([A-Z]{2})$/)

  if (!matchedAddress) {
    return {
      ...emptyFields,
      street: trimmedValue,
    }
  }

  const [, street, number, neighborhood, city, state] = matchedAddress

  return {
    street: street.trim(),
    number: number.trim(),
    neighborhood: neighborhood.trim(),
    city: city.trim(),
    state: state.trim(),
  }
}

export function buildClinicAddress(fields: ClinicAddressFields): string | null {
  const street = fields.street.trim()
  const number = fields.number.trim()
  const neighborhood = fields.neighborhood.trim()
  const city = fields.city.trim()
  const state = fields.state.trim()

  if (!street && !number && !neighborhood && !city && !state) {
    return null
  }

  return `${street}, ${number} - ${neighborhood}, ${city} - ${state}`
}

export function isClinicAddressComplete(fields: ClinicAddressFields): boolean {
  return (
    Boolean(fields.street.trim()) &&
    Boolean(fields.number.trim()) &&
    Boolean(fields.neighborhood.trim()) &&
    Boolean(fields.city.trim()) &&
    Boolean(fields.state.trim())
  )
}
