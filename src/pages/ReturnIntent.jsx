import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils/createPageUrl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  RotateCcw,
  Upload,
  AlertCircle,
  UserCheck,
  Shield,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import StatCard from "../components/survey/StatCard";
import DataTable from "../components/survey/DataTable";
import { useSurveyData } from "../hooks/useSurveyData";
import { SimplePieLabel } from "../components/survey/PieChartLabel";
import {
  ChartExportButton,
  TableExportButton,
  PageExportButton,
} from "../components/export/ExportButton";
import {
  getValue,
  getName,
  getCohort,
  getStatus,
} from "../components/survey/surveyDataHelpers";
import GlobalFilters from "../components/survey/GlobalFilters";

// הגדרת צבעים קבועה
const ANSWER_COLORS = {
  כן: "#10b981", // ירוק
  אולי: "#f59e0b", // כתום
  default: "#cbd5e1", // אפור
};

export default function ReturnIntent() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const [filters, setFilters] = useState({ cohorts: [], pronouns: [] });
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);

  const filteredSurveyData = useMemo(() => {
    if (!hasSurveyData) return [];
    if (filters.cohorts.length === 0 && filters.pronouns.length === 0)
      return surveyData;
    return surveyData.filter((row) => {
      const cohortVal = getCohort(row);
      const pronounVal = getValue(row, "pronoun");
      const cohortMatch =
        filters.cohorts.length === 0 || filters.cohorts.includes(cohortVal);
      const pronounMatch =
        filters.pronouns.length === 0 || filters.pronouns.includes(pronounVal);
      return cohortMatch && pronounMatch;
    });
  }, [surveyData, hasSurveyData, filters]);

  const returnData = useMemo(() => {
    if (!hasSurveyData) return null;

    // פונקציית ניקוי (משאירה רק 'כן' או 'אולי')
    const cleanAnswer = (val) => {
      if (!val) return null;
      const str = String(val).trim();
      if (str.includes("כן")) return "כן";
      if (str.includes("אולי")) return "אולי";
      return null;
    };

    // -----------------------------------------------------------
    // לוגיקה למשוחררים
    // -----------------------------------------------------------
    const releasedRaw = filteredSurveyData.filter((row) => {
      const rawVal = getValue(row, "return_to_work_mechina");
      const ans = cleanAnswer(rawVal);
      return ans === "כן" || ans === "אולי";
    });

    const releasedCounts = { כן: 0, אולי: 0 };
    releasedRaw.forEach((row) => {
      const rawVal = getValue(row, "return_to_work_mechina");
      const ans = cleanAnswer(rawVal);
      if (ans) releasedCounts[ans]++;
    });

    const releasedPieData = Object.entries(releasedCounts)
      .filter(([_, count]) => count > 0)
      .map(([answer, count]) => ({
        answer,
        count,
        fill: ANSWER_COLORS[answer] || ANSWER_COLORS.default,
      }));

    const releasedTableData = releasedRaw.map((row) => ({
      full_name: getName(row),
      cohort: getCohort(row),
      answer: cleanAnswer(getValue(row, "return_to_work_mechina")),
      status: getStatus(row) || "משוחרר/ת (לפי מענה)",
    }));

    // -----------------------------------------------------------
    // לוגיקה לחיילים
    // -----------------------------------------------------------
    const soldiersRaw = filteredSurveyData.filter((row) => {
      const rawVal = getValue(row, "return_to_mentor");
      const ans = cleanAnswer(rawVal);
      return ans === "כן" || ans === "אולי";
    });

    const soldierCounts = { כן: 0, אולי: 0 };
    soldiersRaw.forEach((row) => {
      const rawVal = getValue(row, "return_to_mentor");
      const ans = cleanAnswer(rawVal);
      if (ans) soldierCounts[ans]++;
    });

    const soldierPieData = Object.entries(soldierCounts)
      .filter(([_, count]) => count > 0)
      .map(([answer, count]) => ({
        answer,
        count,
        fill: ANSWER_COLORS[answer] || ANSWER_COLORS.default,
      }));

    const soldiersTableData = soldiersRaw.map((row) => ({
      full_name: getName(row),
      cohort: getCohort(row),
      answer: cleanAnswer(getValue(row, "return_to_mentor")),
      status: getStatus(row) || "חייל/ת (לפי מענה)",
    }));

    return {
      releasedCount: releasedRaw.length,
      soldiersCount: soldiersRaw.length,
      totalInterested: releasedRaw.length + soldiersRaw.length,
      releasedPieData,
      soldierPieData,
      releasedTableData,
      soldiersTableData,
    };
  }, [filteredSurveyData, hasSurveyData]);

  if (!hasSurveyData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          רצון לחזור להדריך במכינה
        </h1>
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            לא נמצאו נתוני סקר. יש להעלות קובץ סקר תחילה.
          </AlertDescription>
        </Alert>
        <Link to={createPageUrl("Overview")}>
          <Button className="bg-[#0891b2] hover:bg-[#0891b2]/90 gap-2">
            <Upload className="w-4 h-4" />
            העלאת קובץ סקר
          </Button>
        </Link>
      </div>
    );
  }

  const tableColumns = [
    { key: "full_name", label: "שם מלא" },
    { key: "cohort", label: "מחזור" },
    { key: "status", label: "סטטוס מוצהר" },
    { key: "answer", label: "תשובה" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">
            רצון לחזור לצוות המכינה
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            ניתוח מענה לשאלות חזרה לחיילים, למשוחררים)
          </p>
        </div>
        <PageExportButton
          pageData={{
            משוחררים_גרף: {
              data: returnData.releasedPieData,
              columns: [
                { key: "answer", label: "תשובה" },
                { key: "count", label: "מספר" },
              ],
            },
            חיילים_גרף: {
              data: returnData.soldierPieData,
              columns: [
                { key: "answer", label: "תשובה" },
                { key: "count", label: "מספר" },
              ],
            },
            משוחררים_טבלה: {
              data: returnData.releasedTableData,
              columns: tableColumns,
            },
            חיילים_טבלה: {
              data: returnData.soldiersTableData,
              columns: tableColumns,
            },
          }}
          pageName="רצון_לחזור"
        />
      </div>

      <GlobalFilters
        surveyData={surveyData}
        filters={filters}
        onFilterChange={setFilters}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="משוחררים"
          value={returnData.releasedCount}
          subtitle='ענו "כן" או "אולי"'
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="חיילים"
          value={returnData.soldiersCount}
          subtitle='ענו "כן" או "אולי"'
          icon={Shield}
          color="blue"
        />
        <StatCard
          title="סה״כ פוטנציאל גיוס"
          value={returnData.totalInterested}
          icon={RotateCcw}
          color="purple"
        />
      </div>

      {/* גרפים */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* גרף משוחררים */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg text-[#1e3a5f]">משוחררים</CardTitle>
            </div>
            <ChartExportButton
              chartRef={chartRef1}
              data={returnData.releasedPieData}
              filename="משוחררים_רצון_לחזור"
              dataColumns={[
                { key: "answer", label: "תשובה" },
                { key: "count", label: "מספר" },
              ]}
            />
          </CardHeader>
          <CardContent className="flex-1 min-h-[350px]">
            <div className="h-[350px] w-full" ref={chartRef1}>
              {returnData.releasedPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart
                    margin={{ top: 20, right: 40, left: 40, bottom: 20 }}
                  >
                    <Pie
                      data={returnData.releasedPieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="answer"
                      labelLine={false}
                      label={(props) => (
                        <SimplePieLabel
                          {...props}
                          outerRadius={props.outerRadius + 20}
                          fontSize={14}
                          fontWeight="bold"
                        />
                      )}
                    >
                      {returnData.releasedPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          strokeWidth={1}
                          stroke="#fff"
                        />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                  <span>אין נתונים </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* גרף חיילים */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg text-[#1e3a5f]">חיילים</CardTitle>
            </div>
            <ChartExportButton
              chartRef={chartRef2}
              data={returnData.soldierPieData}
              filename="חיילים_רצון_לחזור"
              dataColumns={[
                { key: "answer", label: "תשובה" },
                { key: "count", label: "מספר" },
              ]}
            />
          </CardHeader>
          <CardContent className="flex-1 min-h-[350px]">
            <div className="h-[350px] w-full" ref={chartRef2}>
              {returnData.soldierPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart
                    margin={{ top: 20, right: 40, left: 40, bottom: 20 }}
                  >
                    <Pie
                      data={returnData.soldierPieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="answer"
                      labelLine={false}
                      label={(props) => (
                        <SimplePieLabel
                          {...props}
                          outerRadius={props.outerRadius + 20}
                          fontSize={14}
                          fontWeight="bold"
                        />
                      )}
                    >
                      {returnData.soldierPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          strokeWidth={1}
                          stroke="#fff"
                        />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                  <span>אין נתונים </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* טבלאות */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base text-[#1e3a5f]">
              משוחררים מעוניינים
            </CardTitle>
            <TableExportButton
              data={returnData.releasedTableData}
              columns={tableColumns}
              filename="משוחררים_מעוניינים"
            />
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={returnData.releasedTableData}
              columns={tableColumns}
              pageSize={5}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base text-[#1e3a5f]">
              חיילים מעוניינים
            </CardTitle>
            <TableExportButton
              data={returnData.soldiersTableData}
              columns={tableColumns}
              filename="חיילים_מעוניינים"
            />
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={returnData.soldiersTableData}
              columns={tableColumns}
              pageSize={5}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
