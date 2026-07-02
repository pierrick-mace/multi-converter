export interface UnitDefinition {
  id: string
  label: string
  symbol: string
  factor: number
}

export interface UnitModule {
  units: UnitDefinition[]
  defaultFrom: string
  defaultTo: string
}
