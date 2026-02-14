import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Rectangle,
  Tooltip,
  Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { getCohortColor } from "../../utils/colors";

// פונקציית צבעים ברירת מחדל
const getDynamicColor = (index) => {
  const hue = (index * 137.5) % 360;
  return `hsl(${hue}, 65%, 45%)`;
};

const ReusableBarChart = ({
  data,
  dataKey,
  valueKey = "count",
  height = 300,
  valueLabel = "מספר",
  useCohortColors = false,
  singleColor = null,
  filterKey = null,
  stacks = null,
  horizontal = true,
}) => {
  const [selectedData, setSelectedData] = useState(null);

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

  const isStacked = !!stacks;

  const getBarColor = (entry, index) => {
    if (singleColor) return singleColor;
    if (useCohortColors && entry[dataKey]) {
      return getCohortColor(entry[dataKey]);
    }
    if (entry.role === "עתודאי" || entry[dataKey] === "עתודאי") {
      return "#8b5cf6";
    }
    return getDynamicColor(index);
  };

  const handleBarClick = (data) => {
    if (data && data.payload) {
      setSelectedData(data.payload);
    }
  };

  return (
    <div style={{ height, width: "100%", direction: "ltr" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"}>
          <CartesianGrid strokeDasharray="3 3" />

          {isStacked ? (
            <>
              {stacks.map((stack) => (
                <Bar
                  key={stack.dataKey}
                  dataKey={stack.dataKey}
                  stackId="a"
                  name={stack.name || stack.dataKey}
                  fill={stack.color}
                />
              ))}
              <Tooltip />
              <Legend />
            </>
          ) : (
            <Bar
              dataKey={valueKey}
              barSize={25}
              onClick={handleBarClick}
              cursor="pointer"
              shape={(props) => (
                <Rectangle
                  {...props}
                  fill={getBarColor(props.payload, props.index)}
                  radius={[0, 4, 4, 0]}
                />
              )}
            />
          )}

          {horizontal ? (
            <>
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey={dataKey}
                width={180}
                tickMargin={10}
                interval={0}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={dataKey} />
              <YAxis />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>

      {!isStacked && selectedData && (
        <ChartTooltip
          payload={selectedData}
          onClose={() => setSelectedData(null)}
          nameKey={dataKey}
          valueLabel={valueLabel}
          filterKey={filterKey || dataKey}
          showPercentage={false}
        />
      )}
    </div>
  );
};

export default ReusableBarChart;
