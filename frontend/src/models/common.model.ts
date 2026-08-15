import { ValidationRule } from 'vuetify'

export interface Form<Data> {
  valid: boolean
  pending?: boolean
  data: Data
  // Aligné sur `ValidationRule` de Vuetify, dont la signature est également `(value: any)` :
  // une règle reçoit la valeur brute du champ, de type inconnu à la déclaration
  rules?: Partial<Record<keyof Data, ValidationRule[]>>
}

export interface UniqueResponse {
  unique: boolean
}

export interface ValidResponse {
  valid: boolean
}
