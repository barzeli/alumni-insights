import { useMemo, useRef, useState } from "react";
import GlobalFilters from "../components/common/GlobalFilters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Users, Calendar, Target } from "lucide-react";
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
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ViewContactsButton from "../components/common/ViewContactsButton";

export default function PreArmy() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const [filters, setFilters] = useState({ cohorts: [], pronouns: [] });

  const tableColumns = [
    { key: "full_name", label: "שם מלא" },
    { key: "cohort", label: "מחזור" },
    { key: "enlistment_date", label: "תאריך גיוס" },
    { key: "destination", label: "יעד גיוס" },
    { key: "destination_detail", label: "פירוט יעד" },
  ];

  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);

  // פונקציות עזר לקריאת נתונים לפי שמות העמודות המדויקים
  const getCohort = (row) =>
    row["איזה מחזור ושלוחה היית?"] || row.cohort || "-";
  const getName = (row) => row["שם מלא"] || row.full_name || "לא ידוע";
  const getStatus = (row) =>
    row['מה מצבי מול צה"ל / שירות לאומי'] || row.military_status || "";
  const getEnlistmentDate = (row) => row.enlistment_date_future || "";
  const getDestination = (row) => row.future_destination || "";
  const getDestinationDetail = (row) => row.destination_detail || "";

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

  const malshabData = useMemo(() => {
    if (!hasSurveyData) return null;

    // סינון מלש"בים לפי עמודה H - מה מצבי מול צה"ל / שירות לאומי = מלש"ב
    const malshabs = filteredSurveyData.filter((row) => {
      const status = getStatus(row);
      return status && status.includes("מלש");
    });

    // תאריכי גיוס לפי חודשים - עמודה I
    const monthGroups = {};
    malshabs.forEach((row) => {
      const dateVal = getEnlistmentDate(row);
      if (dateVal && dateVal.trim()) {
        // נסה לפרסר את התאריך
        let month = dateVal;
        // אם זה תאריך מלא, חלץ חודש ושנה
        if (
          dateVal.includes("/") ||
          dateVal.includes(".") ||
          dateVal.includes("-")
        ) {
          const parts = dateVal.split(/[\/\.\-]/);
          if (parts.length >= 2) {
            const monthNum = parseInt(parts[1]) || parseInt(parts[0]);
            const year = parts[2] || parts[1];
            const monthNames = [
              "ינואר",
              "פברואר",
              "מרץ",
              "אפריל",
              "מאי",
              "יוני",
              "יולי",
              "אוגוסט",
              "ספטמבר",
              "אוקטובר",
              "נובמבר",
              "דצמבר",
            ];
            if (monthNum >= 1 && monthNum <= 12) {
              month = `${monthNames[monthNum - 1]} ${year}`;
            }
          }
        }
        if (!monthGroups[month]) monthGroups[month] = [];
        monthGroups[month].push({ name: getName(row), cohort: getCohort(row) });
      }
    });

    const monthData = Object.entries(monthGroups).map(
      ([month, respondents]) => ({
        month,
        count: respondents.length,
        respondents,
      }),
    );

    // יעד גיוס - עמודה J (בחירה מרובה)
    const destinationGroups = {};
    malshabs.forEach((row) => {
      const dest = getDestination(row);
      if (dest && dest.trim()) {
        // פיצול תשובות מרובות
        const destinations = dest
          .split(/[,،]/)
          .map((d) => d.trim())
          .filter((d) => d);
        destinations.forEach((d) => {
          if (!destinationGroups[d]) destinationGroups[d] = [];
          destinationGroups[d].push({
            name: getName(row),
            cohort: getCohort(row),
          });
        });
      }
    });

    const destinationData = Object.entries(destinationGroups)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([destination, respondents]) => ({
        destination,
        count: respondents.length,
        respondents,
      }));

    // מלש"בים לפי מחזור - עמודה E + H
    const cohortGroups = {};
    malshabs.forEach((row) => {
      const cohort = getCohort(row);
      if (cohort && cohort !== "-") {
        if (!cohortGroups[cohort]) cohortGroups[cohort] = [];
        cohortGroups[cohort].push({ name: getName(row), cohort });
      }
    });

    const cohortData = Object.entries(cohortGroups).map(
      ([cohort, respondents]) => ({
        cohort,
        count: respondents.length,
        respondents,
      }),
    );

    // טבלה - עמודות B, E, I, J, L
    const tableData = malshabs.map((row) => ({
      full_name: getName(row),
      cohort: getCohort(row),
      enlistment_date: getEnlistmentDate(row) || "-",
      destination: getDestination(row) || "-",
      destination_detail: getDestinationDetail(row) || "-",
    }));

    return {
      total: malshabs.length,
      monthData,
      destinationData,
      cohortData,
      tableData,
    };
  }, [filteredSurveyData, hasSurveyData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">מלש"בים</h1>
        {hasSurveyData && (
          <PageExportButton
            pageData={{
              תאריכי_גיוס: {
                data: malshabData.monthData,
                columns: [
                  { key: "month", label: "חודש" },
                  { key: "count", label: "מספר" },
                ],
              },
              יעד_גיוס: {
                data: malshabData.destinationData,
                columns: [
                  { key: "destination", label: "יעד" },
                  { key: "count", label: "מספר" },
                ],
              },
              לפי_מחזור: {
                data: malshabData.cohortData,
                columns: [
                  { key: "cohort", label: "מחזור" },
                  { key: "count", label: "מספר" },
                ],
              },
              טבלה: { data: malshabData.tableData, columns: tableColumns },
            }}
            pageName="מלשבים"
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

          {/* ריבוע מידע - סהכ מלשבים */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="סהכ מלשבים"
              value={malshabData.total}
              icon={Users}
              color="orange"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* גרף עמודות - תאריכי גיוס לפי חודשים (עמודה I) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  תאריכי גיוס לפי חודשים
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="תאריכי גיוס לפי חודשים"
                    description="חלוקת תאריכי הגיוס לפי חודשים וספירת כמה מתגייסים באותו החודש"
                    dataSource="עמודה I - מתי התאריך גיוס"
                    calculation="ספירת מלש״בים לכל חודש"
                  />
                  <ChartExportButton
                    chartRef={chartRef1}
                    data={malshabData.monthData}
                    filename="תאריכי_גיוס_מלשבים"
                    dataColumns={[
                      { key: "month", label: "חודש" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef1}>
                  {malshabData.monthData.length > 0 ? (
                    <HorizontalBarChart
                      data={malshabData.monthData}
                      dataKey="month"
                      valueLabel="מספר מלש״בים"
                      singleColor="#f59e0b"
                    />
                  ) : (
                    <div className="h-50 flex items-center justify-center text-gray-500">
                      אין נתוני תאריכי גיוס
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* גרף עמודות - יעד גיוס (עמודה J) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  יעד גיוס
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="יעד גיוס"
                    description="חלוקה לפי יעד הגיוס של כל המלשבים (בחירה מרובה)"
                    dataSource="עמודה J - לאן הגיוס העתידי?"
                    calculation="ספירת מלש״בים לכל יעד"
                  />
                  <ChartExportButton
                    chartRef={chartRef2}
                    data={malshabData.destinationData}
                    filename="יעד_גיוס_מלשבים"
                    dataColumns={[
                      { key: "destination", label: "יעד" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef2}>
                  {malshabData.destinationData.length > 0 ? (
                    <HorizontalBarChart
                      data={malshabData.destinationData}
                      dataKey="destination"
                      valueLabel="מספר"
                      singleColor="#0891b2"
                      height={Math.max(
                        200,
                        malshabData.destinationData.length * 35,
                      )}
                    />
                  ) : (
                    <div className="h-50 flex items-center justify-center text-gray-500">
                      אין נתוני יעד גיוס
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* גרף עמודות - מלשבים לפי מחזור (עמודות E + H) */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f]">
                  מלש"בים לפי מחזור
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="מלש״בים לפי מחזור"
                    description="מספר המלש״בים מכל מחזור"
                    dataSource="עמודה E - מחזור + עמודה H - מצב מול צה״ל = מלש״ב"
                    calculation="ספירת מלש״בים מכל מחזור"
                  />
                  <ChartExportButton
                    chartRef={chartRef3}
                    data={malshabData.cohortData}
                    filename="מלשבים_לפי_מחזור"
                    dataColumns={[
                      { key: "cohort", label: "מחזור" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef3}>
                  {malshabData.cohortData.length > 0 ? (
                    <HorizontalBarChart
                      data={malshabData.cohortData}
                      dataKey="cohort"
                      valueLabel="מספר מלש״בים"
                      useCohortColors
                      height={250}
                    />
                  ) : (
                    <div className="h-50 flex items-center justify-center text-gray-500">
                      אין נתונים
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* טבלה - רשימת מלשבים (עמודות B, E, I, J) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[#1e3a5f]">
                רשימת מלש"בים
              </CardTitle>
              <div className="flex items-center gap-2">
                <ViewContactsButton
                  data={malshabData.tableData}
                  filterLabel="מלש״בים"
                />
                <TableExportButton
                  data={malshabData.tableData}
                  columns={tableColumns}
                  filename="רשימת_מלשבים"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={malshabData.tableData}
                columns={tableColumns}
                pageSize={15}
                filterableColumns={["cohort", "destination"]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
