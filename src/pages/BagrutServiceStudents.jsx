import { useMemo, useRef } from "react";
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
import { FileText, Upload, AlertCircle, Brain } from "lucide-react";
import StatCard from "../components/survey/StatCard";
import DataTable from "../components/survey/DataTable";
import { useSurveyData } from "../hooks/useSurveyData";
import {
  ChartExportButton,
  TableExportButton,
  PageExportButton,
} from "../components/export/ExportButton";
import {
  getValue,
  getName,
  getCohort,
} from "../components/survey/surveyDataHelpers";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ViewContactsButton from "../components/survey/ViewContactsButton";
import StudyingSubNav from "../components/survey/StudyingSubNav";

export default function BagrutServiceStudents() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const chartRef1 = useRef(null);

  const bagrutData = useMemo(() => {
    if (!hasSurveyData) return null;

    // סינון: חיילים או שירות לאומי (אינדקס 7)
    const inService = surveyData.filter((row) => {
      const status = getValue(row, "military_status") || "";
      return status.includes("חייל") || status.includes("שירות לאומי");
    });

    // משפרי בגרויות (אינדקס 53)
    const bagrutImprovers = inService.filter((row) => {
      const value = getValue(row, "improving_bagrut") || "";
      return value === "כן" || value.includes("כן") || value.includes("משפר");
    });

    // לומדי פסיכומטרי (אינדקס 55)
    const psychometricStudiers = inService.filter((row) => {
      const value = getValue(row, "studying_psychometric") || "";
      return value === "כן" || value.includes("כן");
    });

    // סטטוס פסיכומטרי (אינדקס 56)
    const psychometricStatusCounts = {};
    const psychometricStatusRespondents = {};
    psychometricStudiers.forEach((row) => {
      const status = getValue(row, "psychometric_status");
      if (status && status !== "-") {
        psychometricStatusCounts[status] =
          (psychometricStatusCounts[status] || 0) + 1;
        if (!psychometricStatusRespondents[status])
          psychometricStatusRespondents[status] = [];
        psychometricStatusRespondents[status].push({
          name: getName(row),
          cohort: getCohort(row),
        });
      }
    });
    const psychometricStatusData = Object.entries(psychometricStatusCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([status, count]) => ({
        status,
        count,
        respondents: psychometricStatusRespondents[status] || [],
      }));

    // נתוני טבלה - שימוש במפתחות המדויקים מהמיפוי החדש
    const tableData = inService
      .filter((row) => {
        const bagrut = getValue(row, "improving_bagrut") || "";
        const psycho = getValue(row, "studying_psychometric") || "";
        return (
          bagrut === "כן" ||
          bagrut.includes("כן") ||
          bagrut.includes("משפר") ||
          psycho === "כן" ||
          psycho.includes("כן")
        );
      })
      .map((row) => {
        // לוגיקה לשילוב שתי עמודות הלימוד במקביל (24 ו-46)
        const studyingParallel = getValue(row, "studying_parallel");

        return {
          full_name: getName(row),
          cohort: getCohort(row),
          improving_bagrut: getValue(row, "improving_bagrut") || "-",
          bagrut_subjects: getValue(row, "bagrut_subjects") || "-",
          studying_psychometric: getValue(row, "studying_psychometric") || "-",
          studying_parallel: studyingParallel || "-",
          psychometric_goal: getValue(row, "psychometric_goal") || "-",
        };
      });

    return {
      bagrutCount: bagrutImprovers.length,
      psychometricCount: psychometricStudiers.length,
      psychometricStatusData,
      tableData,
    };
  }, [surveyData, hasSurveyData]);

  if (!hasSurveyData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          חיילים משפרי בגרויות ופסיכומטרי
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
    { key: "improving_bagrut", label: "משפר בגרויות" },
    { key: "bagrut_subjects", label: "מקצועות" },
    { key: "studying_psychometric", label: "לומד פסיכומטרי" },
    { key: "studying_parallel", label: "לומד במקביל" },
    { key: "psychometric_goal", label: "מטרה/שאיפות" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          חיילים משפרי בגרויות ופסיכומטרי
        </h1>
        <PageExportButton
          pageData={{
            סטטוס_פסיכומטרי: {
              data: bagrutData.psychometricStatusData,
              columns: [
                { key: "status", label: "סטטוס" },
                { key: "count", label: "מספר" },
              ],
            },
            טבלה: { data: bagrutData.tableData, columns: tableColumns },
          }}
          pageName="חיילים_משפרי_בגרויות"
        />
      </div>

      <StudyingSubNav currentPage="BagrutServiceStudents" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="משפרי בגרויות"
          value={bagrutData.bagrutCount}
          icon={FileText}
          color="orange"
        />
        <StatCard
          title="לומדים לפסיכומטרי"
          value={bagrutData.psychometricCount}
          icon={Brain}
          color="purple"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#1e3a5f]">
              משפרי בגרויות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px]">
              <div className="text-center">
                <p className="text-5xl font-bold text-orange-500">
                  {bagrutData.bagrutCount}
                </p>
                <p className="text-gray-600 mt-2">חיילים משפרים בגרויות</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">
              סטטוס פסיכומטרי
            </CardTitle>
            <ChartExportButton
              chartRef={chartRef1}
              data={bagrutData.psychometricStatusData}
              filename="סטטוס_פסיכומטרי"
              dataColumns={[
                { key: "status", label: "סטטוס" },
                { key: "count", label: "מספר" },
              ]}
            />
          </CardHeader>
          <CardContent>
            <div ref={chartRef1}>
              {bagrutData.psychometricStatusData.length > 0 ? (
                <HorizontalBarChart
                  data={bagrutData.psychometricStatusData}
                  dataKey="status"
                  valueLabel="מספר"
                  singleColor="#8b5cf6"
                  height={200}
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>אין נתוני סטטוס פסיכומטרי</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#1e3a5f]">
            רשימת משפרים (בגרויות ופסיכומטרי)
          </CardTitle>
          <div className="flex items-center gap-2">
            <ViewContactsButton
              data={bagrutData.tableData}
              filterLabel="חיילים משפרי בגרויות ופסיכומטרי"
            />
            <TableExportButton
              data={bagrutData.tableData}
              columns={tableColumns}
              filename="חיילים_משפרים"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={bagrutData.tableData}
            columns={tableColumns}
            pageSize={15}
            filterableColumns={[
              "cohort",
              "improving_bagrut",
              "studying_psychometric",
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
