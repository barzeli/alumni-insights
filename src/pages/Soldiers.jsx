import { useRef, useState } from "react";
import GlobalFilters from "../components/common/GlobalFilters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Calendar,
  Shield,
  GraduationCap,
  Award,
  List,
  BookOpen,
} from "lucide-react";
import NoDataView from "../components/common/NoDataView";
import ReusablePieChart from "../components/charts/ReusablePieChart";
import StatCard from "../components/common/StatCard";
import DataTable from "../components/common/DataTable";
import ChartInfoButton from "../components/charts/ChartInfoButton";
import { useSurveyData } from "../hooks/useSurveyData";
import { useSoldiersData } from "../hooks/useSoldiersData";
import { getCohortColor } from "../utils/colors";
import {
  ChartExportButton,
  TableExportButton,
  PageExportButton,
} from "../components/common/ExportButton";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ViewContactsButton from "../components/common/ViewContactsButton";
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

export default function Soldiers() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const [filters, setFilters] = useState({ cohorts: [], pronouns: [] });

  const tableColumns = [
    { key: "full_name", label: "שם מלא" },
    { key: "cohort", label: "מחזור" },
    { key: "soldier_type", label: "סוג שירות" },
    { key: "role_type", label: "אופי תפקיד" },
    { key: "command_course", label: "קורס פיקוד" },
    { key: "enlistment_date", label: "תאריך גיוס" },
    { key: "release_date", label: "תאריך שחרור" },
    { key: "courses_done", label: "קורסים" },
  ];

  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);
  const chartRef4 = useRef(null);
  const chartRef5 = useRef(null);
  const chartRef6 = useRef(null);

  /* Logic extracted to useSoldiersData hook */
  const { soldierData } = useSoldiersData(surveyData, hasSurveyData, filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">חיילים בסדיר</h1>
        {hasSurveyData && (
          <PageExportButton
            pageData={{
              לפי_מחזור: {
                data: soldierData.cohortData,
                columns: [
                  { key: "cohort", label: "מחזור" },
                  { key: "count", label: "מספר" },
                ],
              },
              אופי_תפקיד: {
                data: soldierData.roleTypeData,
                columns: [
                  { key: "role", label: "אופי תפקיד" },
                  { key: "count", label: "מספר" },
                ],
              },
              תאריכי_גיוס: {
                data: soldierData.enlistmentData,
                columns: [
                  { key: "period", label: "תקופה" },
                  { key: "count", label: "מספר" },
                ],
              },
              תאריכי_שחרור: {
                data: soldierData.releaseData,
                columns: [
                  { key: "period", label: "תקופה" },
                  { key: "count", label: "מספר" },
                ],
              },
              מפקדים: {
                data: soldierData.commandersData,
                columns: [
                  { key: "cohort", label: "מחזור" },
                  { key: "count", label: "מפקדים" },
                  { key: "total", label: "סה״כ" },
                  { key: "percentage", label: "אחוז" },
                ],
              },
              טבלה: { data: soldierData.tableData, columns: tableColumns },
            }}
            pageName="חיילים"
          />
        )}
      </div>

      {!hasSurveyData ? (
        <NoDataView />
      ) : (
        <>
          <GlobalFilters
            surveyData={surveyData}
            filters={filters}
            onFilterChange={setFilters}
          />

          {/* ריבועי מידע */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="סהכ חיילים"
              value={soldierData.total}
              subtitle="חיילים בסדיר/קבע + עתודאים"
              icon={Shield}
              color="blue"
            />
            <StatCard
              title="חיילים"
              value={soldierData.soldiersCount}
              subtitle="בסדיר או בקבע"
              icon={Shield}
              color="cyan"
            />
            <StatCard
              title="עתודאים"
              value={soldierData.atudaCount}
              icon={GraduationCap}
              color="purple"
            />
            <StatCard
              title="מפקדים"
              value={soldierData.totalCommanders}
              subtitle="יצאו לקורס פיקוד"
              icon={Award}
              color="orange"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* עוגה - חלוקה לפי מחזורים (עמודה E, H = חייל בסדיר) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f]">
                  חלוקה לפי מחזורים
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="חלוקה לפי מחזורים"
                    description="התפלגות החיילים בסדיר/קבע לפי מחזור (ללא עתודאים)"
                    dataSource="עמודה E - מחזור + עמודה H = חייל.ת בסדיר או בקבע"
                    calculation="ספירת חיילים מכל מחזור"
                  />
                  <ChartExportButton
                    chartRef={chartRef1}
                    data={soldierData.cohortData}
                    filename="חיילים_לפי_מחזור"
                    dataColumns={[
                      { key: "cohort", label: "מחזור" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef1}>
                  {soldierData.cohortData.length > 0 ? (
                    <ReusablePieChart
                      data={soldierData.cohortData.map((d) => ({
                        ...d,
                        color: getCohortColor(d.cohort),
                      }))}
                      dataKey="count"
                      nameKey="cohort"
                      colorKey="color"
                      height={400}
                      valueLabel="מספר חיילים"
                      filterKey="cohort"
                    />
                  ) : (
                    <div className="h-100 flex items-center justify-center text-gray-500">
                      אין נתונים
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* גרף עמודות - אופי תפקיד (עמודה R) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f]">
                  אופי התפקיד
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="אופי התפקיד"
                    description="חלוקה לפי אופי תפקיד + עתודאים כקטגוריה נפרדת"
                    dataSource="עמודה R - מה אופי התפקיד? (בחירה מרובה)"
                    calculation="ספירת חיילים לכל אופי תפקיד"
                  />
                  <ChartExportButton
                    chartRef={chartRef2}
                    data={soldierData.roleTypeData}
                    filename="אופי_תפקיד_חיילים"
                    dataColumns={[
                      { key: "role", label: "אופי תפקיד" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef2}>
                  {soldierData.roleTypeData.length > 0 ? (
                    <HorizontalBarChart
                      data={soldierData.roleTypeData}
                      dataKey="role"
                      valueLabel="מספר"
                      height={Math.max(
                        200,
                        soldierData.roleTypeData.length * 35,
                      )}
                    />
                  ) : (
                    <div className="h-50 flex items-center justify-center text-gray-500">
                      אין נתוני אופי תפקיד
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* עוגה - סדיר / קבע (עמודה O) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  סדיר / קבע
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="סדיר / קבע"
                    description="התפלגות החיילים לפי סוג שירות"
                    dataSource="עמודה O - בשירות סדיר/קבע"
                    calculation="ספירת חיילים לכל סוג"
                  />
                  <ChartExportButton
                    chartRef={chartRef6}
                    data={soldierData.serviceStatusData}
                    filename="סדיר_קבע"
                    dataColumns={[
                      { key: "status", label: "סוג" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef6}>
                  {soldierData.serviceStatusData.length > 0 ? (
                    <ReusablePieChart
                      data={soldierData.serviceStatusData.map((d, idx) => ({
                        ...d,
                        color: idx === 0 ? "#0891b2" : "#7c3aed",
                      }))}
                      dataKey="count"
                      nameKey="status"
                      colorKey="color"
                      height={300}
                      valueLabel="מספר"
                      filterKey="service_status"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-75 text-gray-500">
                      אין נתונים
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* רשימה - פירוט תפקידים "אחר" (עמודה S) */}
          {soldierData.otherRoleTypes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <List className="w-5 h-5" />
                  פירוט תפקידים שסימנו "אחר"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {soldierData.otherRoleTypes.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.cohort}</p>
                      <p className="text-sm text-gray-700 mt-1">{item.other}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* רשימה - קורסים שעשו (עמודה U) */}
          {soldierData.coursesDone.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  קורסים שעשו
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {soldierData.coursesDone.map((item, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.cohort}</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {item.courses}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* גרף עמודות - מפקדים לפי מחזור (עמודות E + Q + H) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                <Award className="w-5 h-5" />
                מפקדים לפי מחזור
              </CardTitle>
              <div className="flex items-center gap-2">
                <ChartInfoButton
                  title="מפקדים לפי מחזור"
                  description="חישוב מספר המפקדים מתוך כלל החיילים שענו על הסקר, לפי מחזורים. כל מחזור - 100% הם כלל החיילים במחזור והאחוז מפקדים מחושב מתוכו."
                  dataSource="עמודה Q - האם יצאת לקורס פיקוד? (תשובות כן: בדרגות נגד, קצין, מש״ק)"
                  calculation="ספירת תשובות 'כן' / סה״כ חיילים במחזור"
                />
                <ChartExportButton
                  chartRef={chartRef5}
                  data={soldierData.commandersData}
                  filename="מפקדים_לפי_מחזור"
                  dataColumns={[
                    { key: "cohort", label: "מחזור" },
                    { key: "count", label: "מפקדים" },
                    { key: "total", label: "סה״כ" },
                    { key: "percentage", label: "אחוז" },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div ref={chartRef5}>
                {soldierData.commandersData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(
                      300,
                      soldierData.commandersData.length * 60,
                    )}
                  >
                    <BarChart
                      data={soldierData.commandersData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="officer"
                        stackId="a"
                        name="קצינים"
                        fill="#1e3a5f"
                      />
                      <Bar
                        dataKey="nco"
                        stackId="a"
                        name="נגדים"
                        fill="#0891b2"
                      />
                      <Bar
                        dataKey="commander"
                        stackId="a"
                        name='מש"קים/מ"כים'
                        fill="#7c3aed"
                      />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="cohort"
                        type="category"
                        width={150}
                        textAnchor="end"
                        tickMargin={10}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-50 flex items-center justify-center text-gray-500">
                    אין נתוני מפקדים
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {soldierData.commandersData.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-orange-50 rounded-lg text-center"
                  >
                    <p className="text-xs text-gray-600">{item.cohort}</p>
                    <p className="text-lg font-bold text-orange-600">
                      {item.total_commanders} / {item.total}
                    </p>
                    <p className="text-sm text-orange-500">
                      {item.percentage}%
                    </p>
                    <div className="text-xs text-gray-600 mt-1">
                      {item.officer > 0 && (
                        <span className="block">קצינים: {item.officer}</span>
                      )}
                      {item.nco > 0 && (
                        <span className="block">נגדים: {item.nco}</span>
                      )}
                      {item.commander > 0 && (
                        <span className="block">מש"קים: {item.commander}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* גרפי תאריכים */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* גרף עמודות - תאריכי גיוס (עמודה M) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  תאריכי גיוס לפי מחצית שנה
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="תאריכי גיוס"
                    description="חישוב כל החיילים שהתגייסו לפי מחצית שנה"
                    dataSource="עמודה M - תאריך גיוס"
                    calculation="ספירת מתגייסים לכל מחצית"
                  />
                  <ChartExportButton
                    chartRef={chartRef3}
                    data={soldierData.enlistmentData}
                    filename="תאריכי_גיוס_חיילים"
                    dataColumns={[
                      { key: "period", label: "תקופה" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef3}>
                  {soldierData.enlistmentData.length > 0 ? (
                    <HorizontalBarChart
                      data={soldierData.enlistmentData}
                      dataKey="period"
                      valueLabel="מספר מתגייסים"
                      colorOffset={4}
                      height={Math.max(
                        200,
                        soldierData.enlistmentData.length * 40,
                      )}
                    />
                  ) : (
                    <div className="h-50 flex items-center justify-center text-gray-500">
                      אין נתוני תאריכי גיוס
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* גרף עמודות - תאריכי שחרור (עמודה N) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  תאריכי שחרור לפי מחצית שנה
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="תאריכי שחרור"
                    description="חישוב כל החיילים שמשתחררים לפי מחצית שנה"
                    dataSource="עמודה N - תאריך שיחרור"
                    calculation="ספירת משתחררים לכל מחצית"
                  />
                  <ChartExportButton
                    chartRef={chartRef4}
                    data={soldierData.releaseData}
                    filename="תאריכי_שחרור_חיילים"
                    dataColumns={[
                      { key: "period", label: "תקופה" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef4}>
                  {soldierData.releaseData.length > 0 ? (
                    <HorizontalBarChart
                      data={soldierData.releaseData}
                      dataKey="period"
                      valueLabel="מספר משתחררים"
                      colorOffset={8}
                      height={Math.max(
                        200,
                        soldierData.releaseData.length * 40,
                      )}
                    />
                  ) : (
                    <div className="h-50 flex items-center justify-center text-gray-500">
                      אין נתוני תאריכי שחרור
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* טבלה - רשימת חיילים */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[#1e3a5f]">
                רשימת חיילים
              </CardTitle>
              <div className="flex items-center gap-2">
                <ViewContactsButton
                  data={soldierData.tableData}
                  filterLabel="חיילים"
                />
                <TableExportButton
                  data={soldierData.tableData}
                  columns={tableColumns}
                  filename="רשימת_חיילים"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={soldierData.tableData}
                columns={tableColumns}
                pageSize={15}
                filterableColumns={[
                  "cohort",
                  "soldier_type",
                  "role_type",
                  "command_course",
                ]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
