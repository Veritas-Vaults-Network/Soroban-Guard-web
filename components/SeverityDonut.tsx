'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { Severity } from '@/types/findings'

interface Props {
  counts: Record<Severity, number>
}

const COLORS: Record<Severity, string> = {
  Critical: '#f43f5e',
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#0ea5e9',
  Info: '#94a3b8',
}

export default function SeverityDonut({ counts }: Props) {
  const data = [
    { name: 'Critical', value: counts.Critical, color: COLORS.Critical },
    { name: 'High', value: counts.High, color: COLORS.High },
    { name: 'Medium', value: counts.Medium, color: COLORS.Medium },
    { name: 'Low', value: counts.Low, color: COLORS.Low },
  ].filter(item => item.value > 0)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) return null

  return (
    <div className="flex items-center justify-center">
      <div className="relative h-32 w-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-xs text-slate-500">findings</span>
        </div>
      </div>
    </div>
  )
}
