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
import {
  School,
  Upload,
  AlertCircle,
  Calendar,
  ArrowRight,
} from "lucide-react";
import StatCard from "../components/survey/StatCard";
import DataTable from "../components/survey/DataTable";
import ChartInfoButton from "../components/survey/ChartInfoButton";
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
  getStatus,
} from "../components/survey/surveyDataHelpers";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ReusablePieChart from "../components/charts/ReusablePieChart";
import ViewContactsButton from "../components/survey/ViewContactsButton";

export default function AtudaStudies() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);
  const chartRef4 = useRef(null);

  const studiesData = useMemo(() => {
    if (!hasSurveyData) return null;

    // סינון: עתודאים + שלב לימודים
    const atudaimStudies = surveyData.filter((row) => {
      const status = getStatus(row);
      const stage = getValue(row, "atuda_stage") || "";
      const isAtuda = status && status.includes("עתודאי");
      const inStudies = stage.includes("לימודים") || stage.includes('דח"ש');
      return isAtuda && inStudies;
    });

    // Stat: מסיימי שנה ד' (אינדקס 29)
    const fourthYear = atudaimStudies.filter((row) => {
      const year = getValue(row, "atuda_year") || "";
      return year.includes("ד'") || year.includes("רביעית") || year === "4";
    });

    // גרף: מוסדות לימוד מובילים (אינדקס 26)
    const institutionCounts = {};
    const institutionRespondents = {};
    atudaimStudies.forEach((row) => {
      const inst = getValue(row, "atuda_institution");
      if (inst && inst.trim()) {
        institutionCounts[inst] = (institutionCounts[inst] || 0) + 1;
        if (!institutionRespondents[inst]) institutionRespondents[inst] = [];
        institutionRespondents[inst].push({
          name: getName(row),
          cohort: getCohort(row),
        });
      }
    });
    const institutionData = Object.entries(institutionCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([institution, count]) => ({
        institution,
        count,
        respondents: institutionRespondents[institution] || [],
      }));

    // גרף: חתך פקולטות (אינדקס 27) - Pie Chart
    const facultyCounts = {};
    const facultyRespondents = {};
    atudaimStudies.forEach((row) => {
      const faculty = getValue(row, "atuda_faculty");
      if (faculty && faculty.trim()) {
        const faculties = faculty
          .split(/[,،;]/)
          .map((f) => f.trim())
          .filter((f) => f);
        faculties.forEach((f) => {
          facultyCounts[f] = (facultyCounts[f] || 0) + 1;
          if (!facultyRespondents[f]) facultyRespondents[f] = [];
          facultyRespondents[f].push({
            name: getName(row),
            cohort: getCohort(row),
          });
        });
      }
    });
    const facultyData = Object.entries(facultyCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([faculty, count]) => ({
        faculty,
        count,
        respondents: facultyRespondents[faculty] || [],
      }));

    // גרף: שנת לימודים (אינדקס 29)
    const yearCounts = {};
    const yearRespondents = {};
    atudaimStudies.forEach((row) => {
      const year = getValue(row, "atuda_year");
      if (year && year.trim()) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
        if (!yearRespondents[year]) yearRespondents[year] = [];
        yearRespondents[year].push({
          name: getName(row),
          cohort: getCohort(row),
        });
      }
    });
    const yearData = Object.entries(yearCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => ({
        year,
        count,
        respondents: yearRespondents[year] || [],
      }));

    // גרף: עתודאים לפי מחזור
    const cohortCounts = {};
    const cohortRespondents = {};
    atudaimStudies.forEach((row) => {
      const cohort = getCohort(row);
      if (cohort && cohort !== "-") {
        cohortCounts[cohort] = (cohortCounts[cohort] || 0) + 1;
        if (!cohortRespondents[cohort]) cohortRespondents[cohort] = [];
        cohortRespondents[cohort].push({ name: getName(row), cohort: cohort });
      }
    });
    const cohortData = Object.entries(cohortCounts).map(([cohort, count]) => ({
      cohort,
      count,
      respondents: cohortRespondents[cohort] || [],
    }));

    // טבלה אקדמית
    const tableData = atudaimStudies.map((row) => ({
      full_name: getName(row),
      cohort: getCohort(row),
      stage: getValue(row, "atuda_stage") || "-",
      institution: getValue(row, "atuda_institution") || "-",
      faculty: getValue(row, "atuda_faculty") || "-",
      track: getValue(row, "atuda_track") || "-",
      year: getValue(row, "atuda_year") || "-",
      end_year: getValue(row, "atuda_end_year") || "-",
      role: getValue(row, "atuda_role") || "-",
    }));

    return {
      total: atudaimStudies.length,
      fourthYear: fourthYear.length,
      institutionData,
      facultyData,
      yearData,
      cohortData,
      tableData,
    };
  }, [surveyData, hasSurveyData]);

  if (!hasSurveyData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          עתודאים - שלב הלימודים
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
    { key: "stage", label: "שלב" },
    { key: "institution", label: "מוסד אקדמי" },
    { key: "faculty", label: "פקולטה" },
    { key: "track", label: "מסלול" },
    { key: "year", label: "שנה בתואר" },
    { key: "end_year", label: "צפי סיום" },
    { key: "role", label: "תפקיד מיועד" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Atuda")}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowRight className="w-4 h-4" />
              חזרה לעתודאים
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">
            עתודאים - שלב הלימודים
          </h1>
        </div>
        <PageExportButton
          pageData={{
            מוסדות: {
              data: studiesData.institutionData,
              columns: [
                { key: "institution", label: "מוסד" },
                { key: "count", label: "מספר" },
              ],
            },
            פקולטות: {
              data: studiesData.facultyData,
              columns: [
                { key: "faculty", label: "פקולטה" },
                { key: "count", label: "מספר" },
              ],
            },
            שנים: {
              data: studiesData.yearData,
              columns: [
                { key: "year", label: "שנה" },
                { key: "count", label: "מספר" },
              ],
            },
            טבלה: { data: studiesData.tableData, columns: tableColumns },
          }}
          pageName="עתודאים_לימודים"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="סטודנטים פעילים"
          value={studiesData.total}
          icon={School}
          color="blue"
        />
        <StatCard
          title="מסיימי שנה ד׳"
          value={studiesData.fourthYear}
          icon={Calendar}
          color="cyan"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">
              מוסדות לימוד מובילים
            </CardTitle>
            <div className="flex items-center gap-2">
              <ChartInfoButton
                title="מוסדות לימוד"
                description="התפלגות עתודאים לפי מוסד אקדמי"
                dataSource="אינדקס 26 - מוסד אקדמי"
                calculation="ספירת עתודאים בכל מוסד"
              />
              <ChartExportButton
                chartRef={chartRef1}
                data={studiesData.institutionData}
                filename="מוסדות_לימוד"
                dataColumns={[
                  { key: "institution", label: "מוסד" },
                  { key: "count", label: "מספר" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div ref={chartRef1}>
              {studiesData.institutionData.length > 0 ? (
                <HorizontalBarChart
                  data={studiesData.institutionData}
                  dataKey="institution"
                  valueLabel="מספר עתודאים"
                  singleColor="#3b82f6"
                  height={Math.max(
                    200,
                    studiesData.institutionData.length * 35,
                  )}
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  אין נתונים
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">
              חתך פקולטות
            </CardTitle>
            <div className="flex items-center gap-2">
              <ChartInfoButton
                title="פקולטות"
                description="התפלגות עתודאים לפי תחום לימוד"
                dataSource="אינדקס 27 - פקולטה"
                calculation="ספירת עתודאים בכל פקולטה"
              />
              <ChartExportButton
                chartRef={chartRef2}
                data={studiesData.facultyData}
                filename="פקולטות"
                dataColumns={[
                  { key: "faculty", label: "פקולטה" },
                  { key: "count", label: "מספר" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div ref={chartRef2}>
              {studiesData.facultyData.length > 0 ? (
                <ReusablePieChart
                  data={studiesData.facultyData}
                  dataKey="faculty"
                  title=""
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  אין נתונים
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">
              שנת לימודים
            </CardTitle>
            <div className="flex items-center gap-2">
              <ChartInfoButton
                title="שנת לימודים"
                description="התפלגות עתודאים לפי שנה בתואר"
                dataSource="אינדקס 29 - שנה בתואר"
                calculation="ספירת עתודאים בכל שנה"
              />
              <ChartExportButton
                chartRef={chartRef3}
                data={studiesData.yearData}
                filename="שנות_לימוד"
                dataColumns={[
                  { key: "year", label: "שנה" },
                  { key: "count", label: "מספר" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div ref={chartRef3}>
              {studiesData.yearData.length > 0 ? (
                <HorizontalBarChart
                  data={studiesData.yearData}
                  dataKey="year"
                  valueLabel="מספר עתודאים"
                  singleColor="#06b6d4"
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  אין נתונים
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">
              עתודאים לפי מחזור
            </CardTitle>
            <div className="flex items-center gap-2">
              <ChartInfoButton
                title="עתודאים לפי מחזור"
                description="התפלגות עתודאים בלימודים לפי מחזור"
                dataSource="אינדקס 4 - מחזור"
                calculation="ספירת עתודאים לפי מחזור"
              />
              <ChartExportButton
                chartRef={chartRef4}
                data={studiesData.cohortData}
                filename="עתודאים_לפי_מחזור"
                dataColumns={[
                  { key: "cohort", label: "מחזור" },
                  { key: "count", label: "מספר" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div ref={chartRef4}>
              {studiesData.cohortData.length > 0 ? (
                <HorizontalBarChart
                  data={studiesData.cohortData}
                  dataKey="cohort"
                  valueLabel="מספר עתודאים"
                  useCohortColors
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  אין נתונים
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#1e3a5f]">טבלה אקדמית</CardTitle>
          <div className="flex items-center gap-2">
            <ViewContactsButton
              data={studiesData.tableData}
              filterLabel="עתודאים בלימודים"
            />
            <TableExportButton
              data={studiesData.tableData}
              columns={tableColumns}
              filename="עתודאים_לימודים"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={studiesData.tableData}
            columns={tableColumns}
            pageSize={15}
            filterableColumns={["cohort", "institution", "faculty", "year"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
