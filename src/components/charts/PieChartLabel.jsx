const RADIAN = Math.PI / 180;

// Simple label showing just name and count
export function SimplePieLabel({ cx, cy, midAngle, outerRadius, name, value }) {
  const radius = outerRadius * 1.45;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={9}
    >
      {name}: {value}
    </text>
  );
}
