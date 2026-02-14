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
const getDynamicColor = (index, offset = 0) => {
  const hue = ((index + offset) * 137.5) % 360;
  return `hsl(${hue}, 65%, 45%)`;
};

// --- רכיב חדש: מטפל בשבירת שורות בציר ה-Y ---
const CustomYAxisTick = ({ x, y, payload }) => {
  const MAX_CHARS_PER_LINE = 18;

  if (!payload || !payload.value) return null;

  const words = String(payload.value).split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    if ((currentLine + " " + words[i]).length <= MAX_CHARS_PER_LINE) {
      currentLine += " " + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-5}
        y={0}
        dy={lines.length === 1 ? 4 : -5}
        textAnchor="end"
        fill="#374151"
        fontSize={11}
        fontWeight="bold"
      >
        {lines.map((line, index) => (
          <tspan x={0} dy={index === 0 ? 0 : 14} key={index}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

const HorizontalBarChart = ({
  data,
  dataKey,
  valueKey = "count",
  height = 300,
  colorOffset = 0,
  valueLabel = "מספר",
  useCohortColors = false,
  singleColor = null,
  showPercentage = false,
  totalForPercentage = 0,
  filterKey = null,
  stacks = null,
  horizontal = true,
  margin,
  categoryAxisWidth = 150,
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
    return getDynamicColor(index, colorOffset);
  };

  const handleBarClick = (data) => {
    if (data && data.payload) {
      setSelectedData(data.payload);
    }
  };

  const defaultMargin = horizontal
    ? { top: 10, right: 30, left: 100, bottom: 10 }
    : { top: 10, right: 30, left: 10, bottom: 10 };

  return (
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : undefined}
          margin={margin || defaultMargin}
        >
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
                width={isStacked ? categoryAxisWidth : 180}
                tick={isStacked ? undefined : <CustomYAxisTick />}
                tickMargin={isStacked ? 10 : 20}
                interval={0}
                axisLine={true}
                tickLine={true}
                textAnchor="end"
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
          showPercentage={showPercentage}
          totalForPercentage={totalForPercentage}
        />
      )}
    </div>
  );
};

export default HorizontalBarChart;
