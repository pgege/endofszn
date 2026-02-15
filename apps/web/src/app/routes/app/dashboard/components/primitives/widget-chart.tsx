import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface DonutChartProps {
  type: 'donut'
  data: Array<{ name: string; value: number; color: string }>
  innerRadius?: number
  outerRadius?: number
}

interface BarChartProps {
  type: 'bar'
  data: Array<{ name: string; value: number }>
  color?: string
}

type WidgetChartProps = DonutChartProps | BarChartProps

export function WidgetChart(props: WidgetChartProps) {
  if (props.type === 'donut') {
    const { data, innerRadius = 40, outerRadius = 60 } = props
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            strokeWidth={2}
            stroke="hsl(var(--background))"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const { data, color = 'hsl(var(--primary))' } = props
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="value" fill={color} />
      </BarChart>
    </ResponsiveContainer>
  )
}
