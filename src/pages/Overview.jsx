import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Users, UserCheck, Percent, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import StatCard from "../components/common/StatCard";
import GlobalFilters from "../components/common/GlobalFilters";
import ChartInfoButton from "../components/charts/ChartInfoButton";
import ChartTooltip from "../components/charts/ChartTooltip";
import ReusablePieChart from "../components/charts/ReusablePieChart";
import { getCohortBarColors } from "../utils/colors";
import { useOverviewData } from "../hooks/useOverviewData";
import NoDataView from "../components/common/NoDataView";

export default function Overview() {
  const {
    surveyData,
    hasSurveyData,
    cohortCounts,
    totalGraduates,
    totalCohorts,
    filters,
    setFilters,
    stats,
  } = useOverviewData();

  const [selectedBarData, setSelectedBarData] = useState(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">
        מבט כללי על תוצאות הסקר
      </h1>

      {!hasSurveyData || stats.totalRespondents === 0 ? (
        <NoDataView />
      ) : (
        <>
          <GlobalFilters
            surveyData={surveyData}
            filters={filters}
            onFilterChange={setFilters}
          />

          {/* ריבועי מידע */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="סהכ עונים"
              value={stats.totalRespondents}
              icon={UserCheck}
              color="cyan"
            />
            <StatCard
              title="אחוז מענה"
              value={`${stats.responseRate}%`}
              icon={Percent}
              color="green"
            />
            <StatCard
              title="סהכ בוגרים"
              value={totalGraduates}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="מספר מחזורים"
              value={totalCohorts}
              icon={BarChart3}
              color="purple"
            />
          </div>

          {/* מספר בוגרים לפי מחזור */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#1e3a5f]">
                מספר בוגרים לפי מחזור
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {Object.entries(cohortCounts).map(([cohort, count]) => (
                  <div
                    key={cohort}
                    className="bg-gray-50 rounded-lg p-3 text-center"
                  >
                    <p className="text-xs text-gray-500 mb-1">{cohort}</p>
                    <p className="text-xl font-bold text-[#1e3a5f]">{count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* גרף עמודות מורכב - עונים ואחוז מענה לפי מחזור */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[#1e3a5f]">
                מספר עונים ואחוז מענה לפי מחזור
              </CardTitle>
              <ChartInfoButton
                title="עונים ואחוז מענה לפי מחזור"
                description="כל מחזור מקבל עמודה כפולה: מספר העונים על הסקר ואחוז מענה מתוך כלל המחזור"
                dataSource="עמודה E - איזה מחזור ושלוחה היית?"
                calculation="אחוז מענה = מספר עונים / סה״כ בוגרים במחזור (מהמידע השמור)"
              />
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.cohortData}
                    margin={{ bottom: 120, left: 10, right: 10 }}
                    barCategoryGap="20%"
                    barGap={2}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      content={() => (
                        <ChartTooltip
                          onClose={() => setSelectedBarData(null)}
                        />
                      )}
                    />
                    <Legend
                      verticalAlign="top"
                      align="center"
                      height={50}
                      formatter={(value) =>
                        value === "respondents"
                          ? "מספר עונים (כהה)"
                          : value === "percentage"
                            ? "אחוז מענה (בהיר)"
                            : value
                      }
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="respondents"
                      name="respondents"
                      radius={[4, 4, 0, 0]}
                      onClick={(data) =>
                        data && setSelectedBarData(data.payload)
                      }
                      cursor="pointer"
                    >
                      {stats.cohortData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getCohortBarColors(entry.name).main}
                        />
                      ))}
                    </Bar>
                    <Bar
                      yAxisId="right"
                      dataKey="percentage"
                      name="percentage"
                      radius={[4, 4, 0, 0]}
                      onClick={(data) =>
                        data && setSelectedBarData(data.payload)
                      }
                      cursor="pointer"
                    >
                      {stats.cohortData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getCohortBarColors(entry.name).light}
                        />
                      ))}
                    </Bar>
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      interval={0}
                      tick={{ fontSize: 11, fill: "#374151" }}
                      tickMargin={10}
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="right"
                      allowDecimals={false}
                      label={{
                        value: "מספר עונים",
                        angle: 90,
                        position: "insideRight",
                        style: { fontSize: 11, fill: "#1e3a5f" },
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="left"
                      allowDecimals={false}
                      domain={[0, 100]}
                      label={{
                        value: "אחוז מענה",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 11, fill: "#0891b2" },
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
                {selectedBarData && (
                  <ChartTooltip
                    payload={selectedBarData}
                    onClose={() => setSelectedBarData(null)}
                    nameKey="name"
                    valueLabel="עונים"
                    filterKey="cohort"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* סיכום מהיר ועוגה */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#1e3a5f]">
                  סיכום מהיר לפי סטטוס
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
                    <p className="text-2xl font-bold text-amber-700">
                      {stats.statusCounts.malshab}
                    </p>
                    <p className="text-sm text-amber-600">מלש"בים</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                    <p className="text-2xl font-bold text-blue-700">
                      {stats.statusCounts.soldiers}
                    </p>
                    <p className="text-sm text-blue-600">חיילים בסדיר</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                    <p className="text-2xl font-bold text-purple-700">
                      {stats.statusCounts.atuda}
                    </p>
                    <p className="text-sm text-purple-600">עתודאים</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <p className="text-2xl font-bold text-green-700">
                      {stats.statusCounts.released}
                    </p>
                    <p className="text-sm text-green-600">משוחררים</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4 text-center border border-pink-200">
                    <p className="text-2xl font-bold text-pink-700">
                      {stats.statusCounts.nationalService}
                    </p>
                    <p className="text-sm text-pink-600">שירות לאומי</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f]">
                  חלוקה לפי שלב בחיים
                </CardTitle>
                <ChartInfoButton
                  title="חלוקה לפי שלב בחיים"
                  description="התפלגות העונים לפי מצבם מול צה״ל / שירות לאומי"
                  dataSource="עמודה H - מה מצבי מול צה״ל / שירות לאומי"
                  calculation="אחוזים מחושבים מתוך סה״כ העונים לסקר"
                />
              </CardHeader>
              <CardContent>
                <ReusablePieChart
                  data={stats.pieData}
                  dataKey="value"
                  nameKey="name"
                  colorKey="color"
                  height={400}
                  outerRadius={80}
                  innerRadius={40}
                  labelFontSize={18}
                  labelFontWeight="bold"
                  valueLabel="מספר"
                  showPercentage={true}
                  totalForPercentage={stats.totalRespondents}
                  filterKey="military_status"
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
