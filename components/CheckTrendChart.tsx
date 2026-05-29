'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  data: { date: string; count: number }[]
  checkName: string
}

export default function CheckTrendChart({ data, checkName }: Props) {
  return (
    <div className="rounded-xl border border-[#2a2d3a] bg-[#12151f] p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-300">
        Trend: <span className="font-mono text-indigo-400">{checkName}</span>
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0', marginBottom: 4 }}
            itemStyle={{ color: '#94a3b8' }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
