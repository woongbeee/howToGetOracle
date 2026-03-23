import { useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Handle,
  Position,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { SCHEMAS } from '@/data/index'
import type { SchemaTable } from '@/data/types'

// ─── Custom Table Node ─────────────────────────────────────────────────────

interface TableNodeData extends Record<string, unknown> {
  table: SchemaTable
  schemaColor: string
}

function TableNode({ data }: NodeProps) {
  const { table, schemaColor } = data as TableNodeData

  const isBlue = schemaColor === 'blue'
  const headerBg     = isBlue ? 'rgba(4,116,212,0.07)'  : 'rgba(5,150,105,0.07)'
  const headerBorder = isBlue ? 'rgba(4,116,212,0.2)'   : 'rgba(5,150,105,0.2)'
  const headerColor  = isBlue ? '#0474D4'               : '#059669'
  const nodeBorder   = isBlue ? 'rgba(4,116,212,0.25)'  : 'rgba(5,150,105,0.25)'

  return (
    <div
      className="min-w-[210px] overflow-hidden rounded-lg"
      style={{
        border: `1px solid ${nodeBorder}`,
        background: '#ffffff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      <Handle type="target" position={Position.Left}   id="l-t" style={{ background: '#0474D4', borderColor: '#6596F3', opacity: 0.8 }} />
      <Handle type="source" position={Position.Left}   id="l-s" style={{ background: '#0474D4', borderColor: '#6596F3', opacity: 0.8 }} />
      <Handle type="target" position={Position.Right}  id="r-t" style={{ background: '#0474D4', borderColor: '#6596F3', opacity: 0.8 }} />
      <Handle type="source" position={Position.Right}  id="r-s" style={{ background: '#0474D4', borderColor: '#6596F3', opacity: 0.8 }} />
      <Handle type="target" position={Position.Top}    id="t-t" style={{ background: '#0474D4', borderColor: '#6596F3', opacity: 0.8 }} />
      <Handle type="source" position={Position.Top}    id="t-s" style={{ background: '#0474D4', borderColor: '#6596F3', opacity: 0.8 }} />
      <Handle type="target" position={Position.Bottom} id="b-t" style={{ background: '#0474D4', borderColor: '#6596F3', opacity: 0.8 }} />
      <Handle type="source" position={Position.Bottom} id="b-s" style={{ background: '#0474D4', borderColor: '#6596F3', opacity: 0.8 }} />

      {/* Table header */}
      <div className="px-3 py-1.5" style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}>
        <span className="font-mono text-[11px] font-bold tracking-wide" style={{ color: headerColor }}>
          {table.schema}.{table.name}
        </span>
      </div>

      {/* Column rows */}
      <div>
        {table.columns.map((col) => (
          <div
            key={col.name}
            className="flex items-center gap-1.5 px-2.5 py-[3px]"
            style={{ borderBottom: '1px solid #f0f1f4' }}
          >
            <span className="w-9 shrink-0 font-mono text-[9px] font-bold">
              {col.isPrimaryKey && col.isForeignKey ? (
                <span style={{ color: '#7c3aed' }}>PK·FK</span>
              ) : col.isPrimaryKey ? (
                <span style={{ color: '#ECB332' }}>PK</span>
              ) : col.isForeignKey ? (
                <span style={{ color: '#0474D4' }}>FK</span>
              ) : null}
            </span>
            <span className="flex-1 truncate font-mono text-[11px]" style={{ color: '#111827' }}>
              {col.name}
            </span>
            <span className="shrink-0 font-mono text-[9px]" style={{ color: '#697485' }}>
              {col.type.replace(/\(.+\)/, '')}
            </span>
            {!col.nullable && (
              <span className="shrink-0 font-mono text-[9px] font-bold" style={{ color: '#ef4444' }}>*</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const NODE_TYPES = { tableNode: TableNode }

// ─── Manual layouts per schema ────────────────────────────────────────────
//
// HR dependency chain:
//   REGIONS → COUNTRIES → LOCATIONS → DEPARTMENTS
//                                          ↕
//                              JOBS → EMPLOYEES → JOB_HISTORY
//
// CO dependency chain:
//   STORES ──┐
//   CUSTOMERS─┤→ ORDERS → ORDER_ITEMS
//   PRODUCTS ─┘

const C = 280  // column width
const R = 60   // row gap between nodes

function nodeHeight(colCount: number) {
  return colCount * 22 + 36
}

const MANUAL_LAYOUT: Record<string, Record<string, { x: number; y: number }>> = {
  HR: (() => {
    // Col 0: REGIONS
    // Col 1: COUNTRIES
    // Col 2: LOCATIONS
    // Col 3: DEPARTMENTS (top), JOBS (bottom)
    // Col 4: EMPLOYEES (center)
    // Col 5: JOB_HISTORY (bottom)
    const col = (n: number) => n * C
    return {
      REGIONS:     { x: col(0), y: 80 },
      COUNTRIES:   { x: col(1), y: 80 },
      LOCATIONS:   { x: col(2), y: 0 },
      JOBS:        { x: col(3), y: 420 },
      DEPARTMENTS: { x: col(3), y: 0 },
      EMPLOYEES:   { x: col(4), y: 160 },
      JOB_HISTORY: { x: col(5), y: 300 },
    }
  })(),
  CO: (() => {
    const col = (n: number) => n * C
    return {
      CUSTOMERS:   { x: col(0), y: 0 },
      STORES:      { x: col(0), y: 160 },
      PRODUCTS:    { x: col(0), y: 360 },
      ORDERS:      { x: col(1), y: 80 },
      ORDER_ITEMS: { x: col(2), y: 160 },
    }
  })(),
}

function getLayout(
  tables: SchemaTable[],
  schemaName: string,
): Record<string, { x: number; y: number }> {
  const manual = MANUAL_LAYOUT[schemaName]
  if (manual) return manual

  // Fallback: simple left-to-right by FK depth
  const depth: Record<string, number> = {}
  const visited = new Set<string>()
  const deps: Record<string, string[]> = {}
  for (const t of tables) {
    deps[t.name] = t.foreignKeys
      .filter((fk) => fk.refTable !== t.name)
      .map((fk) => fk.refTable)
  }
  function visit(name: string) {
    if (visited.has(name)) return
    visited.add(name)
    let max = -1
    for (const dep of deps[name] ?? []) {
      visit(dep)
      max = Math.max(max, depth[dep] ?? 0)
    }
    depth[name] = max + 1
  }
  for (const t of tables) visit(t.name)

  const cols: Record<number, string[]> = {}
  for (const [name, d] of Object.entries(depth)) (cols[d] ??= []).push(name)

  const positions: Record<string, { x: number; y: number }> = {}
  for (const [colStr, names] of Object.entries(cols)) {
    const col = Number(colStr)
    let y = 0
    for (const name of names) {
      positions[name] = { x: col * C, y }
      y += nodeHeight(tables.find((t) => t.name === name)?.columns.length ?? 4) + R
    }
  }
  return positions
}

// ─── SchemaDiagramView ────────────────────────────────────────────────────

export function SchemaDiagramView() {
  const [schemaName, setSchemaName] = useState(SCHEMAS[0].name)
  const schema = SCHEMAS.find((s) => s.name === schemaName) ?? SCHEMAS[0]

  const initialNodes: Node[] = useMemo(() => {
    const positions = getLayout(schema.tables, schema.name)
    return schema.tables.map((table) => ({
      id: table.name,
      type: 'tableNode',
      position: positions[table.name] ?? { x: 0, y: 0 },
      data: { table, schemaColor: schema.color } satisfies TableNodeData,
    }))
  }, [schema])

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = []
    for (const table of schema.tables) {
      for (const fk of table.foreignKeys) {
        if (fk.refTable === table.name) continue // skip self-ref
        edges.push({
          id: `${table.name}.${fk.column}->${fk.refTable}.${fk.refColumn}`,
          source: table.name,
          target: fk.refTable,
          type: 'smoothstep',
          label: `${fk.column}`,
          labelStyle: { fill: '#4b5563', fontSize: 9 },
          labelBgStyle: { fill: '#030712', fillOpacity: 0.9 },
          labelBgPadding: [4, 2] as [number, number],
          style: { stroke: '#F25016', strokeWidth: 1.5, opacity: 0.85 },
          markerEnd: { type: 'arrowclosed' as const, color: '#F25016', width: 12, height: 12 },
        })
      }
    }
    return edges
  }, [schema])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div
        className="flex shrink-0 items-center gap-3 px-4 py-2"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Schema ERD
        </span>
        <div className="flex gap-1">
          {SCHEMAS.map((s) => {
            const active = schema.name === s.name
            return (
              <button
                key={s.name}
                onClick={() => setSchemaName(s.name)}
                className="rounded px-3 py-1 font-mono text-xs font-medium transition-all"
                style={
                  active
                    ? { background: s.color === 'blue' ? 'rgba(4,31,155,0.5)' : 'rgba(4,80,60,0.5)',
                        color: s.color === 'blue' ? '#6596F3' : '#34d399',
                        border: `1px solid ${s.color === 'blue' ? '#0474D4' : '#059669'}` }
                    : { color: 'var(--text-muted)', border: '1px solid transparent' }
                }
              >
                {s.name} — {s.label}
              </button>
            )
          })}
        </div>
        <div className="ml-auto flex items-center gap-3 font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>{schema.tables.length} tables</span>
          <span>{initialEdges.length} FK relations</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-5" style={{ background: 'var(--tangerine)' }} />
            <span style={{ color: 'var(--tangerine)' }}>FK reference</span>
          </span>
        </div>
      </div>

      {/* React Flow canvas */}
      <div className="flex-1" style={{ background: 'var(--bg-base)' }}>
        <ReactFlow
          key={schemaName}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={2}
          colorMode="light"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e2e2" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => {
              const d = n.data as TableNodeData
              return d?.schemaColor === 'blue' ? '#6596F3' : '#6ee7b7'
            }}
            maskColor="rgba(245,245,245,0.75)"
            style={{ background: '#ffffff', border: '1px solid #e2e2e2' }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}
