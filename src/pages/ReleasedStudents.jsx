import { useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { GraduationCap, School, BookOpen, Calendar } from "lucide-react";
import NoDataView from "../components/common/NoDataView";
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
import ReusableBarChart from "../components/charts/ReusableBarChart";
import ViewContactsButton from "../components/common/ViewContactsButton";
import ReleasedSubNav from "../components/layout/ReleasedSubNav";

export default function ReleasedStudents() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);
  const chartRef4 = useRef(null);

  const studentData = useMemo(() => {
    if (!hasSurveyData) return null;

    const released = surveyData.filter((row) => isReleased(row));
    const students = released.filter((row) => {
      const activity = getValue(row, "current_activity");
      const institution = getValue(row, "student_institution");
      return (
        (activity &&
          (activity.includes("סטודנט") || activity.includes("התחלתי ללמוד"))) ||
        institution
      );
    });

    const cohortCounts = {};
    const cohortRespondents = {};
    students.forEach((row) => {
      const cohort = getCohort(row) || "לא ידוע";
      cohortCounts[cohort] = (cohortCounts[cohort] || 0) + 1;
      if (!cohortRespondents[cohort]) cohortRespondents[cohort] = [];
      cohortRespondents[cohort].push({
        name: getName(row),
        cohort: cohort,
      });
    });
    const cohortData = Object.entries(cohortCounts).map(([cohort, count]) => ({
      cohort,
      count,
      respondents: cohortRespondents[cohort] || [],
    }));

    const institutionCounts = {};
    const institutionRespondents = {};
    students.forEach((row) => {
      const inst = getValue(row, "student_institution");
      if (inst) {
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

    const facultyCounts = {};
    const facultyRespondents = {};
    students.forEach((row) => {
      const faculty = getValue(row, "student_faculty");
      if (faculty && faculty.trim()) {
        // Handle multi-select with various separators
        const faculties = faculty
          .split(/[,،;]/)
          .map((f) => f.trim())
          .filter((f) => f);
        if (faculties.length > 0) {
          faculties.forEach((f) => {
            facultyCounts[f] = (facultyCounts[f] || 0) + 1;
            if (!facultyRespondents[f]) facultyRespondents[f] = [];
            facultyRespondents[f].push({
              name: getName(row),
              cohort: getCohort(row),
            });
          });
        } else {
          // Single value case
          facultyCounts[faculty] = (facultyCounts[faculty] || 0) + 1;
          if (!facultyRespondents[faculty]) facultyRespondents[faculty] = [];
          facultyRespondents[faculty].push({
            name: getName(row),
            cohort: getCohort(row),
          });
        }
      }
    });
    const facultyData = Object.entries(facultyCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([faculty, count]) => ({
        faculty,
        count,
        respondents: facultyRespondents[faculty] || [],
      }));

    const yearCounts = {};
    const yearRespondents = {};
    students.forEach((row) => {
      const year = getValue(row, "student_year");
      if (year && year.trim()) {
        const yearVal = year.trim();
        yearCounts[yearVal] = (yearCounts[yearVal] || 0) + 1;
        if (!yearRespondents[yearVal]) yearRespondents[yearVal] = [];
        yearRespondents[yearVal].push({
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

    const tableData = students.map((row) => ({
      full_name: getName(row),
      cohort: getCohort(row),
      institution: getValue(row, "student_institution") || "-",
      faculty: getValue(row, "student_faculty") || "-",
      track: getValue(row, "student_track") || "-",
      year: getValue(row, "student_year") || "-",
      end_year: getValue(row, "student_end_year") || "-",
    }));

    return {
      total: students.length,
      cohortData,
      institutionData,
      facultyData,
      yearData,
      tableData,
    };
  }, [surveyData, hasSurveyData]);

  const tableColumns = [
    { key: "full_name", label: "שם מלא" },
    { key: "cohort", label: "מחזור" },
    { key: "institution", label: "מוסד לימודים" },
    { key: "faculty", label: "פקולטה" },
    { key: "track", label: "מסלול" },
    { key: "year", label: "שנה בתואר" },
    { key: "end_year", label: "צפי סיום" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">סטודנטים משוחררים</h1>
        {hasSurveyData && (
          <PageExportButton
            pageData={{
              לפי_מחזור: {
                data: studentData.cohortData,
                columns: [
                  { key: "cohort", label: "מחזור" },
                  { key: "count", label: "מספר" },
                ],
              },
              מוסד_לימודים: {
                data: studentData.institutionData,
                columns: [
                  { key: "institution", label: "מוסד" },
                  { key: "count", label: "מספר" },
                ],
              },
              פקולטות: {
                data: studentData.facultyData,
                columns: [
                  { key: "faculty", label: "פקולטה" },
                  { key: "count", label: "מספר" },
                ],
              },
              שנה_בתואר: {
                data: studentData.yearData,
                columns: [
                  { key: "year", label: "שנה" },
                  { key: "count", label: "מספר" },
                ],
              },
              טבלה: { data: studentData.tableData, columns: tableColumns },
            }}
            pageName="סטודנטים_משוחררים"
          />
        )}
      </div>

      <ReleasedSubNav currentPage="ReleasedStudents" />

      {!hasSurveyData ? (
        <NoDataView />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="סהכ סטודנטים"
              value={studentData.total}
              icon={GraduationCap}
              color="blue"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f]">
                  סטודנטים לפי מחזור
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="סטודנטים לפי מחזור"
                    description="מספר הסטודנטים המשוחררים מכל מחזור"
                    dataSource="סינון משוחררים + פעילות = סטודנט"
                    calculation="ספירת הסטודנטים מכל מחזור"
                  />
                  <ChartExportButton
                    chartRef={chartRef1}
                    data={studentData.cohortData}
                    filename="סטודנטים_לפי_מחזור"
                    dataColumns={[
                      { key: "cohort", label: "מחזור" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef1}>
                  {studentData.cohortData.length > 0 ? (
                    <ReusableBarChart
                      data={studentData.cohortData}
                      dataKey="cohort"
                      valueLabel="מספר סטודנטים"
                      useCohortColors
                    />
                  ) : (
                    <div className="h-50 flex items-center justify-center text-gray-500">
                      אין נתונים
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <School className="w-5 h-5" />
                  מוסד לימודים
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="מוסד לימודים"
                    description="התפלגות הסטודנטים לפי מוסד לימודים"
                    dataSource="עמודת 'באיזה מוסד אתה לומד?'"
                    calculation="ספירת הסטודנטים בכל מוסד"
                  />
                  <ChartExportButton
                    chartRef={chartRef2}
                    data={studentData.institutionData}
                    filename="סטודנטים_לפי_מוסד"
                    dataColumns={[
                      { key: "institution", label: "מוסד" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef2}>
                  {studentData.institutionData.length > 0 ? (
                    <ReusableBarChart
                      data={studentData.institutionData}
                      dataKey="institution"
                      valueLabel="מספר"
                      singleColor="#0891b2"
                      height={Math.max(
                        200,
                        studentData.institutionData.length * 35,
                      )}
                    />
                  ) : (
                    <div className="h-50 flex items-center justify-center text-gray-500">
                      אין נתוני מוסד לימודים
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  פקולטות
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="פקולטות"
                    description="התפלגות הסטודנטים לפי פקולטה"
                    dataSource="עמודת 'באיזו פקולטה אתה לומד?'"
                    calculation="ספירת הסטודנטים בכל פקולטה"
                  />
                  <ChartExportButton
                    chartRef={chartRef3}
                    data={studentData.facultyData}
                    filename="סטודנטים_לפי_פקולטה"
                    dataColumns={[
                      { key: "faculty", label: "פקולטה" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef3}>
                  {studentData.facultyData.length > 0 ? (
                    <ReusableBarChart
                      data={studentData.facultyData}
                      dataKey="faculty"
                      valueLabel="מספר"
                      singleColor="#8b5cf6"
                      height={Math.max(
                        200,
                        studentData.facultyData.length * 35,
                      )}
                    />
                  ) : (
                    <div className="h-50 flex items-center justify-center text-gray-500">
                      אין נתוני פקולטות
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  שנה בתואר
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="שנה בתואר"
                    description="התפלגות הסטודנטים לפי שנה בתואר"
                    dataSource="עמודת 'באיזו שנה בתואר אתה?'"
                    calculation="ספירת הסטודנטים בכל שנה"
                  />
                  <ChartExportButton
                    chartRef={chartRef4}
                    data={studentData.yearData}
                    filename="סטודנטים_לפי_שנה"
                    dataColumns={[
                      { key: "year", label: "שנה" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef4}>
                  {studentData.yearData.length > 0 ? (
                    <ReusableBarChart
                      data={studentData.yearData}
                      dataKey="year"
                      valueLabel="מספר סטודנטים"
                      singleColor="#10b981"
                    />
                  ) : (
                    <div className="h-50 flex items-center justify-center text-gray-500">
                      אין נתוני שנה בתואר
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[#1e3a5f]">
                רשימת סטודנטים
              </CardTitle>
              <div className="flex items-center gap-2">
                <ViewContactsButton
                  data={studentData.tableData}
                  filterLabel="סטודנטים משוחררים"
                />
                <TableExportButton
                  data={studentData.tableData}
                  columns={tableColumns}
                  filename="רשימת_סטודנטים"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={studentData.tableData}
                columns={tableColumns}
                pageSize={15}
                filterableColumns={["cohort", "institution", "faculty", "year"]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
