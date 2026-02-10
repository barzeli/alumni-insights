import { useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Shield, Star, MapPin, List } from "lucide-react";
import NoDataView from "../components/common/NoDataView";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import StatCard from "../components/common/StatCard";
import DataTable from "../components/common/DataTable";
import ChartInfoButton from "../components/charts/ChartInfoButton";
import { useSurveyData } from "../hooks/useSurveyData";
import {
  ChartExportButton,
  TableExportButton,
  PageExportButton,
} from "../components/common/ExportButton";
import {
  getValue,
  getName,
  getCohort,
  isReleased,
} from "../utils/surveyDataHelpers";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ViewContactsButton from "../components/common/ViewContactsButton";
import ReleasedSubNav from "../components/layout/ReleasedSubNav";

export default function ReleasedMilitary() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);

  const militaryData = useMemo(() => {
    if (!hasSurveyData) return null;

    const released = surveyData.filter((row) => isReleased(row));

    const kevaCounts = {};
    const kevaRespondents = {};
    released.forEach((row) => {
      const wasKeva = getValue(row, "was_keva");
      if (wasKeva === "כן") {
        const cohort = getCohort(row) || "לא ידוע";
        kevaCounts[cohort] = (kevaCounts[cohort] || 0) + 1;
        if (!kevaRespondents[cohort]) kevaRespondents[cohort] = [];
        kevaRespondents[cohort].push({
          name: getName(row),
          cohort: cohort,
        });
      }
    });
    const kevaData = Object.entries(kevaCounts).map(([cohort, count]) => ({
      cohort,
      count,
      respondents: kevaRespondents[cohort] || [],
    }));

    const pikudByCohortAndType = {};
    const pikudRespondents = {};

    released.forEach((row) => {
      const wasCommander = getValue(row, "was_commander");
      if (!wasCommander || wasCommander === "לא") return;

      const cohort = getCohort(row) || "לא ידוע";
      if (!pikudByCohortAndType[cohort]) {
        pikudByCohortAndType[cohort] = {
          cohort,
          קצונה: 0,
          נגד: 0,
          "חייל חובה": 0,
          total: 0,
        };
      }

      if (wasCommander.includes("קצונה")) {
        pikudByCohortAndType[cohort]["קצונה"]++;
      } else if (wasCommander.includes("נגד")) {
        pikudByCohortAndType[cohort]["נגד"]++;
      } else if (wasCommander.includes("חייל חובה")) {
        pikudByCohortAndType[cohort]["חייל חובה"]++;
      }
      pikudByCohortAndType[cohort].total++;

      if (!pikudRespondents[cohort]) pikudRespondents[cohort] = [];
      pikudRespondents[cohort].push({
        name: getName(row),
        cohort: cohort,
        type: wasCommander,
      });
    });

    const pikudData = Object.values(pikudByCohortAndType).map((item) => ({
      ...item,
      respondents: pikudRespondents[item.cohort] || [],
    }));

    const roleNatureCounts = {};
    const roleNatureRespondents = {};
    released.forEach((row) => {
      const nature = getValue(row, "role_nature");
      if (nature) {
        const natures = nature.split(",").map((n) => n.trim());
        natures.forEach((n) => {
          if (n) {
            roleNatureCounts[n] = (roleNatureCounts[n] || 0) + 1;
            if (!roleNatureRespondents[n]) roleNatureRespondents[n] = [];
            roleNatureRespondents[n].push({
              name: getName(row),
              cohort: getCohort(row),
            });
          }
        });
      }
    });
    const roleNatureData = Object.entries(roleNatureCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([nature, count]) => ({
        nature,
        count,
        respondents: roleNatureRespondents[nature] || [],
      }));

    const tableData = released.map((row) => ({
      full_name: getName(row),
      cohort: getCohort(row),
      was_keva: getValue(row, "was_keva") || "-",
      was_commander: getValue(row, "was_commander") || "-",
      last_role: getValue(row, "last_role") || "-",
      role_nature: getValue(row, "role_nature") || "-",
    }));

    // Other nature list (column 67)
    const otherNatureList = released
      .map((row) => ({
        name: getName(row),
        cohort: getCohort(row),
        other: getValue(row, "other_nature"),
      }))
      .filter(
        (item) => item.other && item.other.trim() !== "" && item.other !== "-",
      );

    return {
      total: released.length,
      kevaCount: Object.values(kevaCounts).reduce((a, b) => a + b, 0),
      commanderCount: pikudData.reduce((acc, item) => acc + item.total, 0),
      kevaData,
      pikudData,
      roleNatureData,
      tableData,
      otherNatureList,
    };
  }, [surveyData, hasSurveyData]);

  const tableColumns = [
    { key: "full_name", label: "שם מלא" },
    { key: "cohort", label: "מחזור" },
    { key: "was_keva", label: "שירות קבע" },
    { key: "was_commander", label: "היה מפקד" },
    { key: "last_role", label: "תפקיד אחרון" },
    { key: "role_nature", label: "אופי תפקיד" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          משוחררים - חלק צבאי
        </h1>
        {hasSurveyData && (
          <PageExportButton
            pageData={{
              שירות_קבע: {
                data: militaryData.kevaData,
                columns: [
                  { key: "cohort", label: "מחזור" },
                  { key: "count", label: "מספר" },
                ],
              },
              מפקדים: {
                data: militaryData.pikudData,
                columns: [
                  { key: "cohort", label: "מחזור" },
                  { key: "count", label: "מספר" },
                ],
              },
              אופי_תפקיד: {
                data: militaryData.roleNatureData,
                columns: [
                  { key: "nature", label: "אופי" },
                  { key: "count", label: "מספר" },
                ],
              },
              טבלה: { data: militaryData.tableData, columns: tableColumns },
            }}
            pageName="משוחררים_צבאי"
          />
        )}
      </div>

      <ReleasedSubNav currentPage="ReleasedMilitary" />

      {!hasSurveyData ? (
        <NoDataView />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="סהכ משוחררים"
              value={militaryData.total}
              icon={Shield}
              color="green"
            />
            <StatCard
              title="שירתו בקבע"
              value={militaryData.kevaCount}
              icon={Star}
              color="blue"
            />
            <StatCard
              title="היו מפקדים"
              value={militaryData.commanderCount}
              icon={MapPin}
              color="purple"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f]">
                  שירות קבע לפי מחזור
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="שירות קבע"
                    description="מספר המשוחררים ששירתו בקבע"
                    dataSource="עמודת 'האם שירתת בקבע?'"
                    calculation="ספירת התשובות החיוביות לכל מחזור"
                  />
                  <ChartExportButton
                    chartRef={chartRef1}
                    data={militaryData.kevaData}
                    filename="שירות_קבע_לפי_מחזור"
                    dataColumns={[
                      { key: "cohort", label: "מחזור" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef1}>
                  {militaryData.kevaData.length > 0 ? (
                    <HorizontalBarChart
                      data={militaryData.kevaData}
                      dataKey="cohort"
                      valueLabel="שירתו בקבע"
                      useCohortColors
                    />
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-gray-500">
                      אין נתוני שירות קבע
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f]">
                  מפקדים לפי מחזור ודרגה
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="מפקדים"
                    description="מספר המשוחררים שהיו מפקדים לפי דרגה"
                    dataSource="עמודת 'האם היית מפקד?'"
                    calculation="ספירת סוגי הפיקוד לכל מחזור"
                  />
                  <ChartExportButton
                    chartRef={chartRef2}
                    data={militaryData.pikudData}
                    filename="מפקדים_לפי_מחזור"
                    dataColumns={[
                      { key: "cohort", label: "מחזור" },
                      { key: "קצונה", label: "קצונה" },
                      { key: "נגד", label: "נגד" },
                      { key: "חייל חובה", label: "חייל חובה" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef2} className="h-[350px]">
                  {militaryData.pikudData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={militaryData.pikudData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="cohort"
                          type="category"
                          width={150}
                          textAnchor="end"
                          tickMargin={10}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="קצונה"
                          stackId="a"
                          fill="#1e3a5f"
                          name="קצונה"
                        />
                        <Bar
                          dataKey="נגד"
                          stackId="a"
                          fill="#0891b2"
                          name="נגד"
                        />
                        <Bar
                          dataKey="חייל חובה"
                          stackId="a"
                          fill="#7c3aed"
                          name="חייל חובה"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      אין נתוני מפקדים
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f]">
                  אופי תפקיד
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="אופי תפקיד"
                    description="התפלגות אופי התפקידים של המשוחררים"
                    dataSource="עמודת 'מה היה אופי התפקיד שלך?'"
                    calculation="ספירת המשיבים לכל סוג תפקיד"
                  />
                  <ChartExportButton
                    chartRef={chartRef3}
                    data={militaryData.roleNatureData}
                    filename="אופי_תפקיד_משוחררים"
                    dataColumns={[
                      { key: "nature", label: "אופי תפקיד" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef3}>
                  {militaryData.roleNatureData.length > 0 ? (
                    <HorizontalBarChart
                      data={militaryData.roleNatureData}
                      dataKey="nature"
                      valueLabel="מספר"
                      singleColor="#0891b2"
                      height={Math.max(
                        200,
                        militaryData.roleNatureData.length * 35,
                      )}
                    />
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-gray-500">
                      אין נתוני אופי תפקיד
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {militaryData.otherNatureList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <List className="w-5 h-5" />
                  פירוט אופי תפקיד - "אחר"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {militaryData.otherNatureList.map((item, idx) => (
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[#1e3a5f]">
                נתונים צבאיים של משוחררים
              </CardTitle>
              <div className="flex items-center gap-2">
                <ViewContactsButton
                  data={militaryData.tableData}
                  filterLabel="משוחררים"
                />
                <TableExportButton
                  data={militaryData.tableData}
                  columns={tableColumns}
                  filename="נתונים_צבאיים_משוחררים"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={militaryData.tableData}
                columns={tableColumns}
                pageSize={15}
                filterableColumns={["cohort", "was_keva", "was_commander"]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
