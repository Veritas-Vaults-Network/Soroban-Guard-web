'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface DataPoint {
  date: string
  High: number
  Medium: number
  Low: number
}

interface Props {
  data: DataPoint[]
}

export default function SeverityTrendChart({ data }: Props) {
  return (
    <figure className="rounded-xl border border-[#2a2d3a] bg-[#12151f] p-5">
      <figcaption className="mb-4 text-sm font-semibold text-slate-300">Severity Trend</figcaption>

      {/* Screen reader accessible data table */}
      <div className="sr-only">
        <table>
          <caption>Severity Trend Data Table</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">High</th>
              <th scope="col">Medium</th>
              <th scope="col">Low</th>
            </tr>
          </thead>
          <tbody>
            {data.map((dp, i) => (
              <tr key={i}>
                <td>{dp.date}</td>
                <td>{dp.High}</td>
                <td>{dp.Medium}</td>
                <td>{dp.Low}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}
            />
            <Bar dataKey="High" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Medium" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Low" stackId="a" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
