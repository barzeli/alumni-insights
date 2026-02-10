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
  ShieldCheck,
  Upload,
  AlertCircle,
  Briefcase,
  ArrowRight,
} from "lucide-react";
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
  getStatus,
} from "../utils/surveyDataHelpers";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ViewContactsButton from "../components/common/ViewContactsButton";

export default function AtudaMilitary() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);

  const militaryData = useMemo(() => {
    if (!hasSurveyData) return null;

    // סינון: עתודאים + שלב צבאי
    const atudaimMilitary = surveyData.filter((row) => {
      const status = getStatus(row);
      const stage = getValue(row, "atuda_stage") || "";
      const isAtuda = status && status.includes("עתודאי");
      const inService =
        stage.includes("סדיר") ||
        stage.includes("קבע") ||
        stage.includes("חובה");
      return isAtuda && inService;
    });

    // Stat: משרתים בקבע
    const inKeva = atudaimMilitary.filter((row) => {
      const stage = getValue(row, "atuda_stage") || "";
      const track = getValue(row, "atuda_mil_track") || "";
      return stage.includes("קבע") || track.includes("קבע");
    });

    // גרף: מפת תפקידים (אינדקס 38)
    const roleCounts = {};
    const roleRespondents = {};
    atudaimMilitary.forEach((row) => {
      const role = getValue(row, "atuda_mil_role");
      if (role && role.trim()) {
        roleCounts[role] = (roleCounts[role] || 0) + 1;
        if (!roleRespondents[role]) roleRespondents[role] = [];
        roleRespondents[role].push({
          name: getName(row),
          cohort: getCohort(row),
        });
      }
    });
    const roleData = Object.entries(roleCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([role, count]) => ({
        role,
        count,
        respondents: roleRespondents[role] || [],
      }));

    // גרף: רקע אקדמי (אינדקס 34)
    const institutionCounts = {};
    const institutionRespondents = {};
    atudaimMilitary.forEach((row) => {
      const inst = getValue(row, "atuda_mil_institution");
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

    // גרף: ותק בשירות (אינדקס 39) - קיבוץ לפי שנה
    const serviceYearCounts = {};
    const serviceYearRespondents = {};
    atudaimMilitary.forEach((row) => {
      const startDate = getValue(row, "atuda_mil_service_start");
      if (startDate && startDate.trim()) {
        // נסה לחלץ שנה מהתאריך
        const yearMatch = startDate.match(/\d{4}/);
        const year = yearMatch ? yearMatch[0] : startDate;
        serviceYearCounts[year] = (serviceYearCounts[year] || 0) + 1;
        if (!serviceYearRespondents[year]) serviceYearRespondents[year] = [];
        serviceYearRespondents[year].push({
          name: getName(row),
          cohort: getCohort(row),
        });
      }
    });
    const serviceYearData = Object.entries(serviceYearCounts)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([year, count]) => ({
        year,
        count,
        respondents: serviceYearRespondents[year] || [],
      }));

    // טבלה צבאית
    const tableData = atudaimMilitary.map((row) => ({
      full_name: getName(row),
      cohort: getCohort(row),
      stage: getValue(row, "atuda_stage") || "-",
      role: getValue(row, "atuda_mil_role") || "-",
      service_start: getValue(row, "atuda_mil_service_start") || "-",
      service_end: getValue(row, "atuda_mil_service_end") || "-",
      institution: getValue(row, "atuda_mil_institution") || "-",
      faculty: getValue(row, "atuda_mil_faculty") || "-",
      track: getValue(row, "atuda_mil_track") || "-",
      grad_year: getValue(row, "atuda_mil_grad_year") || "-",
    }));

    return {
      total: atudaimMilitary.length,
      inKeva: inKeva.length,
      roleData,
      institutionData,
      serviceYearData,
      tableData,
    };
  }, [surveyData, hasSurveyData]);

  if (!hasSurveyData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          עתודאים - השלב הצבאי
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
    { key: "stage", label: "שלב במסלול" },
    { key: "role", label: "תפקיד נוכחי" },
    { key: "service_start", label: "תחילת שירות" },
    { key: "service_end", label: "צפי שחרור" },
    { key: "institution", label: "מוסד אקדמי (עבר)" },
    { key: "faculty", label: "פקולטה" },
    { key: "track", label: "מסלול" },
    { key: "grad_year", label: "שנת סיום תואר" },
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
            עתודאים - השלב הצבאי
          </h1>
        </div>
        <PageExportButton
          pageData={{
            תפקידים: {
              data: militaryData.roleData,
              columns: [
                { key: "role", label: "תפקיד" },
                { key: "count", label: "מספר" },
              ],
            },
            מוסדות: {
              data: militaryData.institutionData,
              columns: [
                { key: "institution", label: "מוסד" },
                { key: "count", label: "מספר" },
              ],
            },
            ותק: {
              data: militaryData.serviceYearData,
              columns: [
                { key: "year", label: "שנת תחילה" },
                { key: "count", label: "מספר" },
              ],
            },
            טבלה: { data: militaryData.tableData, columns: tableColumns },
          }}
          pageName="עתודאים_צבאי"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="סה״כ בשירות"
          value={militaryData.total}
          icon={ShieldCheck}
          color="green"
        />
        <StatCard
          title="משרתים בקבע"
          value={militaryData.inKeva}
          icon={Briefcase}
          color="purple"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">
              מפת תפקידים
            </CardTitle>
            <div className="flex items-center gap-2">
              <ChartInfoButton
                title="מפת תפקידים"
                description="התפלגות עתודאים לפי תפקיד צבאי נוכחי"
                dataSource="אינדקס 38 - תפקיד נוכחי"
                calculation="ספירת עתודאים בכל תפקיד"
              />
              <ChartExportButton
                chartRef={chartRef1}
                data={militaryData.roleData}
                filename="תפקידים_צבאיים"
                dataColumns={[
                  { key: "role", label: "תפקיד" },
                  { key: "count", label: "מספר" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div ref={chartRef1}>
              {militaryData.roleData.length > 0 ? (
                <HorizontalBarChart
                  data={militaryData.roleData}
                  dataKey="role"
                  valueLabel="מספר עתודאים"
                  singleColor="#10b981"
                  height={Math.max(200, militaryData.roleData.length * 35)}
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
            <CardTitle className="text-lg text-[#1e3a5f]">רקע אקדמי</CardTitle>
            <div className="flex items-center gap-2">
              <ChartInfoButton
                title="רקע אקדמי"
                description="מוסדות לימוד בהם למדו העתודאים"
                dataSource="אינדקס 34 - מוסד אקדמי (עבר)"
                calculation="ספירת עתודאים לפי מוסד לימוד"
              />
              <ChartExportButton
                chartRef={chartRef2}
                data={militaryData.institutionData}
                filename="רקע_אקדמי"
                dataColumns={[
                  { key: "institution", label: "מוסד" },
                  { key: "count", label: "מספר" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div ref={chartRef2}>
              {militaryData.institutionData.length > 0 ? (
                <HorizontalBarChart
                  data={militaryData.institutionData}
                  dataKey="institution"
                  valueLabel="מספר עתודאים"
                  singleColor="#3b82f6"
                  height={Math.max(
                    200,
                    militaryData.institutionData.length * 35,
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

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">ותק בשירות</CardTitle>
            <div className="flex items-center gap-2">
              <ChartInfoButton
                title="ותק בשירות"
                description="התפלגות עתודאים לפי שנת תחילת שירות"
                dataSource="אינדקס 39 - תחילת שירות"
                calculation="קיבוץ לפי שנת תחילה"
              />
              <ChartExportButton
                chartRef={chartRef3}
                data={militaryData.serviceYearData}
                filename="ותק_שירות"
                dataColumns={[
                  { key: "year", label: "שנה" },
                  { key: "count", label: "מספר" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div ref={chartRef3}>
              {militaryData.serviceYearData.length > 0 ? (
                <HorizontalBarChart
                  data={militaryData.serviceYearData}
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
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#1e3a5f]">טבלה צבאית</CardTitle>
          <div className="flex items-center gap-2">
            <ViewContactsButton
              data={militaryData.tableData}
              filterLabel="עתודאים בשירות"
            />
            <TableExportButton
              data={militaryData.tableData}
              columns={tableColumns}
              filename="עתודאים_צבאי"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={militaryData.tableData}
            columns={tableColumns}
            pageSize={15}
            filterableColumns={["cohort", "stage", "role", "institution"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
