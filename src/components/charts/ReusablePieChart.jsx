import { useState } from "react";
import { PieChart, Pie, ResponsiveContainer } from "recharts";
import ChartTooltip from "./ChartTooltip";

export default function ReusablePieChart({
  data = [],
  dataKey = "value",
  nameKey = "name",
  colorKey = "color",
  colors = null,
  height = 400,
  valueLabel = "כמות",
  filterKey = null,
}) {
  const [selectedData, setSelectedData] = useState(null);
  const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

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
    <div style={{ height, direction: "ltr" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <Pie
            data={coloredData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props) =>
              `${props[nameKey] || props.name} (${props[dataKey] || props.value})`
            }
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey={dataKey}
            paddingAngle={2}
            onClick={handlePieClick}
            cursor="pointer"
          />
        </PieChart>
      </ResponsiveContainer>

      {selectedData && (
        <ChartTooltip
          payload={selectedData}
          onClose={() => setSelectedData(null)}
          nameKey={nameKey}
          valueLabel={valueLabel}
          filterKey={filterKey}
          showPercentage={true}
          totalForPercentage={total}
        />
      )}
    </div>
  );
}
