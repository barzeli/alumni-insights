import { useState } from "react";
import { PieChart, Pie, ResponsiveContainer, Legend } from "recharts";
import ChartTooltip from "./ChartTooltip";

// Simple Pie Label
function SimplePieLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
  value,
  fontSize = 12,
  fontWeight = "normal",
}) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 45;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{
        fontSize,
        fontWeight,
        paintOrder: "stroke",
        stroke: "white",
        strokeWidth: 3,
      }}
    >
      {name} ({value})
    </text>
  );
}

export default function ReusablePieChart({
  data = [],
  dataKey = "value",
  nameKey = "name",
  colorKey = "color",
  colors = null,
  height = 400,
  outerRadius = 80,
  innerRadius = 40,
  paddingAngle = 5,
  labelFontSize = 14,
  labelFontWeight = "bold",
  valueLabel = "כמות",
  showPercentage = true,
  totalForPercentage = null,
  filterKey = null,
  showLegend = false,
  stroke,
  strokeWidth = 2,
  labelLine = true,
}) {
  const [selectedData, setSelectedData] = useState(null);
  const total =
    totalForPercentage ||
    data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

  const defaultColors = [
    "#1e3a5f",
    "#0891b2",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#3b82f6",
    "#ef4444",
    "#06b6d4",
    "#84cc16",
  ];

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        אין נתונים להצגה
      </div>
    );
  }

  const handlePieClick = (data) => {
    if (data && data.payload) {
      setSelectedData(data.payload);
    }
  };

  const coloredData = data.map((entry, index) => ({
    ...entry,
    fill:
      entry[colorKey] ||
      (colors
        ? colors[index % colors.length]
        : defaultColors[index % defaultColors.length]),
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <Pie
            data={coloredData}
            cx="50%"
            cy="50%"
            labelLine={labelLine}
            label={(props) => (
              <SimplePieLabel
                {...props}
                outerRadius={props.outerRadius + 40}
                name={props[nameKey] || props.name}
                value={props[dataKey] || props.value}
                fontSize={labelFontSize}
                fontWeight={labelFontWeight}
              />
            )}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={dataKey}
            paddingAngle={paddingAngle}
            onClick={handlePieClick}
            cursor="pointer"
            strokeWidth={strokeWidth}
            stroke={stroke}
          />
          {showLegend && (
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          )}
        </PieChart>
      </ResponsiveContainer>

      {selectedData && (
        <ChartTooltip
          payload={selectedData}
          onClose={() => setSelectedData(null)}
          nameKey={nameKey}
          valueLabel={valueLabel}
          filterKey={filterKey}
          showPercentage={showPercentage}
          totalForPercentage={total}
        />
      )}
    </div>
  );
}
