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
import { GraduationCap, Upload, AlertCircle } from "lucide-react";
import StatCard from "../components/common/StatCard";
import DataTable from "../components/common/DataTable";
import { useSurveyData } from "../hooks/useSurveyData";
import {
  ChartExportButton,
  TableExportButton,
  PageExportButton,
} from "../components/common/ExportButton";
import { getValue, getName, getCohort } from "../utils/surveyDataHelpers";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ViewContactsButton from "../components/common/ViewContactsButton";
import StudyingSubNav from "../components/layout/StudyingSubNav";

export default function DegreeServiceStudents() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);

  const studentsData = useMemo(() => {
    if (!hasSurveyData) return null;

    // סינון: חיילים/שירות לאומי שלומדים לתואר (מבוסס מיפוי מתוקן 2)
    const degreeStudents = surveyData.filter((row) => {
      const status = getValue(row, "military_status") || "";
      const institution = getValue(row, "student_institution");

      // בדיקה אם חייל/שירות לאומי
      const isInService =
        status.includes("חייל") || status.includes("שירות לאומי");

      // בדיקה אם לומד (מוסד אינו ריק ואינו "לא לומד")
      const hasInstitution =
        institution && institution.trim() !== "" && institution !== "לא לומד";

      return isInService && hasInstitution;
    });

    // גרף: מוסדות לימוד (אינדקס 47)
    const institutionCounts = {};
    const institutionRespondents = {};
    degreeStudents.forEach((row) => {
      const institution = getValue(row, "student_institution");
      if (institution && institution !== "-") {
        institutionCounts[institution] =
          (institutionCounts[institution] || 0) + 1;
        if (!institutionRespondents[institution])
          institutionRespondents[institution] = [];
        institutionRespondents[institution].push({
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

    // גרף: פקולטות (אינדקס 48)
    const facultyCounts = {};
    const facultyRespondents = {};
    degreeStudents.forEach((row) => {
      const faculty = getValue(row, "student_faculty");
      if (faculty && faculty !== "-") {
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

    // גרף: סוג מסלול (אינדקס 49)
    const trackTypeCounts = {};
    const trackTypeRespondents = {};
    degreeStudents.forEach((row) => {
      const trackType = getValue(row, "academic_track_type");
      if (trackType && trackType !== "-") {
        trackTypeCounts[trackType] = (trackTypeCounts[trackType] || 0) + 1;
        if (!trackTypeRespondents[trackType])
          trackTypeRespondents[trackType] = [];
        trackTypeRespondents[trackType].push({
          name: getName(row),
          cohort: getCohort(row),
        });
      }
    });
    const trackTypeData = Object.entries(trackTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([trackType, count]) => ({
        trackType,
        count,
        respondents: trackTypeRespondents[trackType] || [],
      }));

    // הכנת נתוני טבלה עם המפתחות הנכונים מהמיפוי
    const tableData = degreeStudents.map((row) => ({
      full_name: getName(row),
      cohort: getCohort(row),
      student_institution: getValue(row, "student_institution") || "-",
      student_faculty: getValue(row, "student_faculty") || "-",
      student_track: getValue(row, "student_track") || "-",
      academic_track_type: getValue(row, "academic_track_type") || "-",
      end_year: getValue(row, "end_year") || "-",
    }));

    return {
      total: degreeStudents.length,
      institutionData,
      facultyData,
      trackTypeData,
      tableData,
    };
  }, [surveyData, hasSurveyData]);

  if (!hasSurveyData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          חיילים לומדים לתואר ראשון
        </h1>
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            לא נמצאו נתוני סקר. יש להעלות קובץ סקר תחילה.
          </AlertDescription>
        </Alert>
        <Link to="/">
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
    { key: "student_institution", label: "מוסד לימודים" },
    { key: "student_faculty", label: "פקולטה" },
    { key: "student_track", label: "מסלול לימודים" },
    { key: "academic_track_type", label: "סוג מסלול" },
    { key: "end_year", label: "צפי סיום" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          חיילים לומדים לתואר ראשון
        </h1>
        <PageExportButton
          pageData={{
            מוסדות: {
              data: studentsData.institutionData,
              columns: [
                { key: "institution", label: "מוסד" },
                { key: "count", label: "מספר" },
              ],
            },
            פקולטות: {
              data: studentsData.facultyData,
              columns: [
                { key: "faculty", label: "פקולטה" },
                { key: "count", label: "מספר" },
              ],
            },
            סוג_מסלול: {
              data: studentsData.trackTypeData,
              columns: [
                { key: "trackType", label: "סוג" },
                { key: "count", label: "מספר" },
              ],
            },
            טבלה: { data: studentsData.tableData, columns: tableColumns },
          }}
          pageName="חיילים_לומדים_לתואר"
        />
      </div>

      <StudyingSubNav currentPage="DegreeServiceStudents" />

      <div className="grid grid-cols-1 gap-4">
        <StatCard
          title="סה״כ חיילים לומדים לתואר"
          value={studentsData.total}
          icon={GraduationCap}
          color="blue"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">
              מוסדות אקדמיים
            </CardTitle>
            <ChartExportButton
              chartRef={chartRef1}
              data={studentsData.institutionData}
              filename="מוסדות_אקדמיים"
              dataColumns={[
                { key: "institution", label: "מוסד" },
                { key: "count", label: "מספר" },
              ]}
            />
          </CardHeader>
          <CardContent>
            <div ref={chartRef1}>
              {studentsData.institutionData.length > 0 ? (
                <HorizontalBarChart
                  data={studentsData.institutionData}
                  dataKey="institution"
                  valueLabel="מספר"
                  singleColor="#1e3a5f"
                  height={Math.max(
                    250,
                    studentsData.institutionData.length * 45,
                  )}
                />
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  אין נתונים
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">פקולטות</CardTitle>
            <ChartExportButton
              chartRef={chartRef2}
              data={studentsData.facultyData}
              filename="פקולטות"
              dataColumns={[
                { key: "faculty", label: "פקולטה" },
                { key: "count", label: "מספר" },
              ]}
            />
          </CardHeader>
          <CardContent>
            <div ref={chartRef2}>
              {studentsData.facultyData.length > 0 ? (
                <HorizontalBarChart
                  data={studentsData.facultyData}
                  dataKey="faculty"
                  valueLabel="מספר"
                  singleColor="#0891b2"
                  height={Math.max(250, studentsData.facultyData.length * 45)}
                />
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  אין נתונים
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#1e3a5f]">
            סוג מסלול (תואר / צבירה)
          </CardTitle>
          <ChartExportButton
            chartRef={chartRef3}
            data={studentsData.trackTypeData}
            filename="סוג_מסלול"
            dataColumns={[
              { key: "trackType", label: "סוג" },
              { key: "count", label: "מספר" },
            ]}
          />
        </CardHeader>
        <CardContent>
          <div ref={chartRef3}>
            {studentsData.trackTypeData.length > 0 ? (
              <HorizontalBarChart
                data={studentsData.trackTypeData}
                dataKey="trackType"
                valueLabel="מספר"
                singleColor="#8b5cf6"
                height={200}
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
            רשימת חיילים לומדים
          </CardTitle>
          <div className="flex items-center gap-2">
            <ViewContactsButton
              data={studentsData.tableData}
              filterLabel="חיילים לומדים לתואר"
            />
            <TableExportButton
              data={studentsData.tableData}
              columns={tableColumns}
              filename="חיילים_לומדים"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={studentsData.tableData}
            columns={tableColumns}
            pageSize={15}
            filterableColumns={[
              "cohort",
              "student_institution",
              "student_faculty",
              "academic_track_type",
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
