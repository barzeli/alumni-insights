import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function StackedBarChart({
  data,
  categoryKey,
  stacks = [],
  horizontal = true,
  height = 300,
  margin,
  categoryAxisWidth = 150,
}) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-gray-500 border rounded bg-slate-50"
      >
        אין נתונים להצגה
      </div>
    );
  }

  const defaultMargin = horizontal
    ? { top: 10, right: 30, left: 100, bottom: 10 }
    : { top: 10, right: 30, left: 10, bottom: 10 };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : undefined}
        margin={margin || defaultMargin}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Legend />
        {stacks.map((stack) => (
          <Bar
            key={stack.dataKey}
            dataKey={stack.dataKey}
            stackId="a"
            name={stack.name || stack.dataKey}
            fill={stack.color}
          />
        ))}
        {horizontal ? (
          <>
            <XAxis type="number" />
            <YAxis
              dataKey={categoryKey}
              type="category"
              width={categoryAxisWidth}
              textAnchor="end"
              tickMargin={10}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={categoryKey} />
            <YAxis />
          </>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
