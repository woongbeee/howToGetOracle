export interface ColumnDef {
  name: string
  type: string
  nullable: boolean
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  references?: { table: string; column: string }
}

export interface ForeignKey {
  column: string
  refTable: string
  refColumn: string
}

export type RowData = Record<string, string | number | null>

export interface SchemaTable {
  name: string
  schema: string
  description: string
  columns: ColumnDef[]
  foreignKeys: ForeignKey[]
  rows: RowData[]
}

export interface Schema {
  name: string
  label: string
  color: string
  tables: SchemaTable[]
}
