import { useMemo, useRef, useState } from "react";
import GlobalFilters from "../components/survey/GlobalFilters";
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
  Upload,
  AlertCircle,
  Calendar,
  Shield,
  GraduationCap,
  Award,
  List,
  BookOpen,
} from "lucide-react";
import ReusablePieChart from "../components/charts/ReusablePieChart";
import StatCard from "../components/survey/StatCard";
import DataTable from "../components/survey/DataTable";
import ChartInfoButton from "../components/survey/ChartInfoButton";
import { useSurveyData } from "../hooks/useSurveyData";
import {
  getCohortColor,
  formatQuarterLabel,
  getQuarterKey,
  parseDate,
} from "../components/survey/ChartColors";
import {
  ChartExportButton,
  TableExportButton,
  PageExportButton,
} from "../components/export/ExportButton";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ViewContactsButton from "../components/survey/ViewContactsButton";
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

  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);
  const chartRef4 = useRef(null);
  const chartRef5 = useRef(null);
  const chartRef6 = useRef(null);

  // פונקציות עזר לקריאת נתונים לפי שמות העמודות המדויקים
  const getCohort = (row) =>
    row["איזה מחזור ושלוחה היית?"] || row.cohort || "-";
  const getName = (row) => row["שם מלא"] || row.full_name || "לא ידוע";
  const getStatus = (row) =>
    row['מה מצבי מול צה"ל / שירות לאומי'] || row.military_status || "";
  const getEnlistmentDate = (row) => row.enlistment_date || "";
  const getReleaseDate = (row) => row.release_date || "";
  const getServiceStatus = (row) => row.service_status_check || "";
  const getCommandCourse = (row) => row.command_course_status || "";
  const getRoleType = (row) => row.role_type || "";
  const getOtherRoleType = (row) => row.other_role_type || "";
  const getCoursesDone = (row) => row.courses_done || "";

  const filteredSurveyData = useMemo(() => {
    if (!hasSurveyData) return [];
    if (filters.cohorts.length === 0 && filters.pronouns.length === 0)
      return surveyData;
    return surveyData.filter((row) => {
      const cohortVal = getCohort(row);
      const pronounVal = row.pronoun || "";
      const cohortMatch =
        filters.cohorts.length === 0 || filters.cohorts.includes(cohortVal);
      const pronounMatch =
        filters.pronouns.length === 0 || filters.pronouns.includes(pronounVal);
      return cohortMatch && pronounMatch;
    });
  }, [surveyData, hasSurveyData, filters]);

  const soldierData = useMemo(() => {
    if (!hasSurveyData)
      return {
        total: 0,
        soldiersCount: 0,
        atudaCount: 0,
        totalCommanders: 0,
        cohortData: [],
        roleTypeData: [],
        serviceStatusData: [],
        otherRoleTypes: [],
        coursesDone: [],
        releaseData: [],
        enlistmentData: [],
        commandersData: [],
        tableData: [],
      };

    // סינון חיילים בסדיר/קבע לפי עמודה H
    const soldiers = filteredSurveyData.filter((row) => {
      const status = getStatus(row);
      return status && status.includes("חייל");
    });

    // סינון עתודאים לפי עמודה H
    const atudaim = filteredSurveyData.filter((row) => {
      const status = getStatus(row);
      return status && status.includes("עתודאי");
    });

    const totalSoldiers = soldiers.length + atudaim.length;

    // ספירת מפקדים - עמודה Q (רק מחיילים בסדיר)
    let totalCommanders = 0;
    soldiers.forEach((row) => {
      const commandStatus = getCommandCourse(row);
      if (commandStatus && commandStatus.includes("כן")) {
        totalCommanders++;
      }
    });

    // עוגה - חלוקה לפי מחזורים (עמודה E) - רק חיילים בסדיר (לא עתודאים)
    const cohortCounts = {};
    const cohortRespondents = {};
    soldiers.forEach((row) => {
      const cohort = getCohort(row);
      if (cohort && cohort !== "-") {
        cohortCounts[cohort] = (cohortCounts[cohort] || 0) + 1;
        if (!cohortRespondents[cohort]) cohortRespondents[cohort] = [];
        cohortRespondents[cohort].push({ name: getName(row), cohort });
      }
    });
    const cohortData = Object.entries(cohortCounts).map(([cohort, count]) => ({
      cohort,
      count,
      respondents: cohortRespondents[cohort] || [],
    }));

    // גרף עמודות - אופי תפקיד (עמודה R) - חיילים + עתודאים
    const roleTypeCounts = {};
    const roleTypeRespondents = {};

    // חיילים - עמודה R
    soldiers.forEach((row) => {
      const roleType = getRoleType(row);
      if (roleType && roleType.trim()) {
        const roles = roleType
          .split(/[,،]/)
          .map((r) => r.trim())
          .filter((r) => r);
        roles.forEach((role) => {
          roleTypeCounts[role] = (roleTypeCounts[role] || 0) + 1;
          if (!roleTypeRespondents[role]) roleTypeRespondents[role] = [];
          roleTypeRespondents[role].push({
            name: getName(row),
            cohort: getCohort(row),
          });
        });
      }
    });

    // עתודאים - הוסף כקטגוריה נפרדת
    if (atudaim.length > 0) {
      roleTypeCounts["עתודאי"] = atudaim.length;
      roleTypeRespondents["עתודאי"] = atudaim.map((row) => ({
        name: getName(row),
        cohort: getCohort(row),
      }));
    }

    const roleTypeData = Object.entries(roleTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([role, count]) => ({
        role,
        count,
        respondents: roleTypeRespondents[role] || [],
      }));

    // עוגה - סדיר / קבע (עמודה O)
    const serviceStatusCounts = {};
    const serviceStatusRespondents = {};
    soldiers.forEach((row) => {
      const serviceStatus = getServiceStatus(row);
      if (serviceStatus && serviceStatus.trim()) {
        serviceStatusCounts[serviceStatus] =
          (serviceStatusCounts[serviceStatus] || 0) + 1;
        if (!serviceStatusRespondents[serviceStatus])
          serviceStatusRespondents[serviceStatus] = [];
        serviceStatusRespondents[serviceStatus].push({
          name: getName(row),
          cohort: getCohort(row),
        });
      }
    });
    const serviceStatusData = Object.entries(serviceStatusCounts).map(
      ([status, count]) => ({
        status,
        count,
        respondents: serviceStatusRespondents[status] || [],
      }),
    );

    // רשימה - פירוט תפקידים "אחר" (עמודה S)
    const otherRoleTypes = soldiers
      .map((row) => ({
        name: getName(row),
        cohort: getCohort(row),
        other: getOtherRoleType(row),
      }))
      .filter(
        (item) => item.other && item.other.trim() !== "" && item.other !== "-",
      );

    // רשימה - קורסים שעשו (עמודה U)
    const coursesDone = soldiers
      .map((row) => ({
        name: getName(row),
        cohort: getCohort(row),
        courses: getCoursesDone(row),
      }))
      .filter(
        (item) =>
          item.courses && item.courses.trim() !== "" && item.courses !== "-",
      );

    // גרף עמודות - תאריכי שחרור לפי מחצית שנה (עמודה N)
    const releaseQuarters = {};
    const releaseRespondents = {};
    soldiers.forEach((row) => {
      const dateVal = getReleaseDate(row);
      const d = parseDate(dateVal);
      if (d) {
        const quarterKey = getQuarterKey(d);
        const quarterLabel = formatQuarterLabel(d);
        if (quarterKey && quarterLabel) {
          if (!releaseQuarters[quarterKey])
            releaseQuarters[quarterKey] = { label: quarterLabel, count: 0 };
          releaseQuarters[quarterKey].count++;
          if (!releaseRespondents[quarterKey])
            releaseRespondents[quarterKey] = [];
          releaseRespondents[quarterKey].push({
            name: getName(row),
            cohort: getCohort(row),
          });
        }
      }
    });
    const releaseData = Object.entries(releaseQuarters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        period: data.label,
        count: data.count,
        respondents: releaseRespondents[key] || [],
      }));

    // גרף עמודות - תאריכי גיוס לפי מחצית שנה (עמודה M)
    const enlistmentQuarters = {};
    const enlistmentRespondents = {};
    soldiers.forEach((row) => {
      const dateVal = getEnlistmentDate(row);
      const d = parseDate(dateVal);
      if (d) {
        const quarterKey = getQuarterKey(d);
        const quarterLabel = formatQuarterLabel(d);
        if (quarterKey && quarterLabel) {
          if (!enlistmentQuarters[quarterKey])
            enlistmentQuarters[quarterKey] = { label: quarterLabel, count: 0 };
          enlistmentQuarters[quarterKey].count++;
          if (!enlistmentRespondents[quarterKey])
            enlistmentRespondents[quarterKey] = [];
          enlistmentRespondents[quarterKey].push({
            name: getName(row),
            cohort: getCohort(row),
          });
        }
      }
    });
    const enlistmentData = Object.entries(enlistmentQuarters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        period: data.label,
        count: data.count,
        respondents: enlistmentRespondents[key] || [],
      }));

    // גרף עמודות - מפקדים לפי מחזור (עמודות E + Q + H) - פירוט לפי סוג מפקד
    const commandersByCohort = {};
    const totalByCohort = {};

    soldiers.forEach((row) => {
      const cohort = getCohort(row);
      if (!cohort || cohort === "-") return;

      totalByCohort[cohort] = (totalByCohort[cohort] || 0) + 1;

      if (!commandersByCohort[cohort]) {
        commandersByCohort[cohort] = {
          cohort,
          officer: 0,
          nco: 0,
          commander: 0,
          total_commanders: 0,
          respondents: [],
        };
      }

      const commandStatus = getCommandCourse(row);
      if (commandStatus) {
        if (commandStatus.includes("קצין")) {
          commandersByCohort[cohort].officer++;
          commandersByCohort[cohort].total_commanders++;
          commandersByCohort[cohort].respondents.push({
            name: getName(row),
            type: "קצין",
          });
        } else if (commandStatus.includes("נגד")) {
          commandersByCohort[cohort].nco++;
          commandersByCohort[cohort].total_commanders++;
          commandersByCohort[cohort].respondents.push({
            name: getName(row),
            type: "נגד",
          });
        } else if (
          commandStatus.includes('מש"ק') ||
          commandStatus.includes('מ"כ')
        ) {
          commandersByCohort[cohort].commander++;
          commandersByCohort[cohort].total_commanders++;
          commandersByCohort[cohort].respondents.push({
            name: getName(row),
            type: 'מש"ק/מ"כ',
          });
        }
      }
    });

    const commandersData = Object.entries(commandersByCohort)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cohort, data]) => ({
        cohort,
        officer: data.officer,
        nco: data.nco,
        commander: data.commander,
        total_commanders: data.total_commanders,
        total: totalByCohort[cohort] || 0,
        percentage:
          totalByCohort[cohort] > 0
            ? Math.round((data.total_commanders / totalByCohort[cohort]) * 100)
            : 0,
        respondents: data.respondents,
      }));

    // טבלה - רשימת חיילים (עמודות B, E, M, N, O, P, Q, R, S, T, U, V)
    const tableData = [...soldiers, ...atudaim].map((row) => {
      const status = getStatus(row);
      const isAtuda = status && status.includes("עתודאי");
      return {
        full_name: getName(row),
        cohort: getCohort(row),
        soldier_type: isAtuda ? "עתודאי" : "סדיר/קבע",
        enlistment_date: getEnlistmentDate(row) || "-",
        release_date: getReleaseDate(row) || "-",
        service_status: getServiceStatus(row) || "-",
        command_course: getCommandCourse(row) || "-",
        role_type: isAtuda ? "עתודאי" : getRoleType(row) || "-",
        courses_done: getCoursesDone(row) || "-",
      };
    });

    return {
      total: totalSoldiers,
      soldiersCount: soldiers.length,
      atudaCount: atudaim.length,
      totalCommanders,
      cohortData,
      roleTypeData,
      serviceStatusData,
      otherRoleTypes,
      coursesDone,
      releaseData,
      enlistmentData,
      commandersData,
      tableData,
    };
  }, [filteredSurveyData, hasSurveyData]);

  if (!hasSurveyData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">חיילים בסדיר</h1>
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
    { key: "soldier_type", label: "סוג שירות" },
    { key: "enlistment_date", label: "תאריך גיוס" },
    { key: "release_date", label: "תאריך שחרור" },
    { key: "service_status", label: "סדיר/קבע" },
    { key: "command_course", label: "קורס פיקוד" },
    { key: "role_type", label: "אופי תפקיד" },
    { key: "courses_done", label: "קורסים" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">חיילים בסדיר</h1>
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
      </div>

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
                <div className="h-[400px] flex items-center justify-center text-gray-500">
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
                  height={Math.max(200, soldierData.roleTypeData.length * 35)}
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
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
                <div className="flex items-center justify-center h-[300px] text-gray-500">
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
                  <p className="text-sm text-gray-700 mt-1">{item.courses}</p>
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
                height={Math.max(300, soldierData.commandersData.length * 60)}
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
                  <Bar dataKey="nco" stackId="a" name="נגדים" fill="#0891b2" />
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
              <div className="h-[200px] flex items-center justify-center text-gray-500">
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
                <p className="text-sm text-orange-500">{item.percentage}%</p>
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
                  height={Math.max(200, soldierData.enlistmentData.length * 40)}
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
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
                  height={Math.max(200, soldierData.releaseData.length * 40)}
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
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
          <CardTitle className="text-lg text-[#1e3a5f]">רשימת חיילים</CardTitle>
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
    </div>
  );
}
