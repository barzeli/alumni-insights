import { useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Heart, Calendar } from "lucide-react";
import NoDataView from "../components/common/NoDataView";
import StatCard from "../components/common/StatCard";
import DataTable from "../components/common/DataTable";
import GlobalFilters from "../components/common/GlobalFilters";
import ChartInfoButton from "../components/charts/ChartInfoButton";
import { useSurveyData } from "../hooks/useSurveyData";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ViewContactsButton from "../components/common/ViewContactsButton";
import { parseDate as parseGlobalDate } from "../utils/dateUtils";
import {
  TableExportButton,
  PageExportButton,
  ChartExportButton,
} from "../components/common/ExportButton";

export default function NationalService() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const [filters, setFilters] = useState({ cohorts: [], pronouns: [] });
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);

  // Filter data based on filters
  const filteredData = useMemo(() => {
    if (!hasSurveyData) return [];
    if (filters.cohorts.length === 0 && filters.pronouns.length === 0)
      return surveyData;
    return surveyData.filter((row) => {
      const cohort = row.cohort || "";
      const pronoun = row.pronoun || "";
      const matchCohort =
        filters.cohorts.length === 0 || filters.cohorts.includes(cohort);
      const matchPronoun =
        filters.pronouns.length === 0 || filters.pronouns.includes(pronoun);
      return matchCohort && matchPronoun;
    });
  }, [surveyData, hasSurveyData, filters]);

  // Process national service data
  const serviceData = useMemo(() => {
    if (!hasSurveyData) {
      return { total: 0, startData: [], endData: [], tableData: [] };
    }

    // Filter only national service participants
    const nationalRows = filteredData.filter((row) => {
      const status = row.military_status || "";
      return status.includes("שירות לאומי");
    });

    // Use improved global parseDate function
    const parseDate = parseGlobalDate;

    // Format quarter label
    const formatQuarterLabel = (date) => {
      if (!date) return null;
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      let quarterLabel;
      if (month >= 1 && month <= 3) quarterLabel = "ינואר-מרץ";
      else if (month >= 4 && month <= 6) quarterLabel = "אפריל-יוני";
      else if (month >= 7 && month <= 9) quarterLabel = "יולי-ספטמבר";
      else quarterLabel = "אוקטובר-דצמבר";
      return `${quarterLabel} ${year}`;
    };

    // Get quarter key for sorting
    const getQuarterKey = (date) => {
      if (!date) return null;
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const quarter = Math.ceil(month / 3);
      return `${year}-Q${quarter}`;
    };

    // Process START dates
    const startBuckets = {};
    nationalRows.forEach((row) => {
      const dateRaw = row.national_start_date;
      const d = parseDate(dateRaw);
      if (!d) return;

      const qKey = getQuarterKey(d);
      const label = formatQuarterLabel(d);
      if (!startBuckets[qKey]) {
        startBuckets[qKey] = { label, count: 0, respondents: [] };
      }
      startBuckets[qKey].count++;
      startBuckets[qKey].respondents.push({
        name: row.full_name || "לא ידוע",
        cohort: row.cohort || "-",
      });
    });

    const startData = Object.entries(startBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => ({
        period: data.label,
        count: data.count,
        respondents: data.respondents,
      }));

    // Process END dates
    const endBuckets = {};
    nationalRows.forEach((row) => {
      const dateRaw = row.national_end_date;
      const d = parseDate(dateRaw);
      if (!d) return;

      const qKey = getQuarterKey(d);
      const label = formatQuarterLabel(d);
      if (!endBuckets[qKey]) {
        endBuckets[qKey] = { label, count: 0, respondents: [] };
      }
      endBuckets[qKey].count++;
      endBuckets[qKey].respondents.push({
        name: row.full_name || "לא ידוע",
        cohort: row.cohort || "-",
      });
    });

    const endData = Object.entries(endBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => ({
        period: data.label,
        count: data.count,
        respondents: data.respondents,
      }));

    // Table data
    const tableData = nationalRows.map((row) => ({
      full_name: row.full_name || "לא ידוע",
      cohort: row.cohort || "-",
      start_date: row.national_start_date || "-",
      end_date: row.national_end_date || "-",
      role_desc: row.national_role_desc || "-",
      location: row.national_location || "-",
      home_frequency: row.national_home_frequency || "-",
      studying: row.studying_parallel || "-",
    }));

    return {
      total: nationalRows.length,
      startData,
      endData,
      tableData,
    };
  }, [filteredData, hasSurveyData]);

  // No data state
  const tableColumns = [
    { key: "full_name", label: "שם מלא" },
    { key: "cohort", label: "מחזור" },
    { key: "start_date", label: "תאריך התחלה" },
    { key: "end_date", label: "תאריך סיום" },
    { key: "role_desc", label: "תיאור תפקיד" },
    { key: "location", label: "מיקום" },
    { key: "home_frequency", label: "תדירות חופשות" },
    { key: "studying", label: "לומד/ת במקביל" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">שירות לאומי</h1>
        {hasSurveyData && (
          <PageExportButton
            pageData={{
              תאריכי_התחלה: {
                data: serviceData.startData,
                columns: [
                  { key: "period", label: "תקופה" },
                  { key: "count", label: "מספר" },
                ],
              },
              תאריכי_סיום: {
                data: serviceData.endData,
                columns: [
                  { key: "period", label: "תקופה" },
                  { key: "count", label: "מספר" },
                ],
              },
              טבלה: {
                data: serviceData.tableData,
                columns: tableColumns,
              },
            }}
            pageName="שירות_לאומי"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="סה״כ בשירות לאומי"
              value={serviceData.total}
              icon={Heart}
              color="pink"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  תאריכי התחלה לפי רבעון
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="תאריכי התחלה"
                    description="התפלגות תאריכי התחלת השירות הלאומי"
                    dataSource="עמודת 'תאריך התחלה'"
                    calculation="ספירת מספר המתחילים בכל רבעון"
                  />
                  <ChartExportButton
                    chartRef={chartRef1}
                    data={serviceData.startData}
                    filename="תאריכי_התחלה_לאומי"
                    dataColumns={[
                      { key: "period", label: "תקופה" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef1}>
                  {serviceData.startData.length > 0 ? (
                    <HorizontalBarChart
                      data={serviceData.startData}
                      dataKey="period"
                      valueKey="count"
                      valueLabel="מספר מתחילות"
                      singleColor="#ec4899"
                      height={Math.max(220, serviceData.startData.length * 40)}
                    />
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-gray-500">
                      אין נתוני תאריכי התחלה
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  תאריכי סיום לפי רבעון
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="תאריכי סיום"
                    description="התפלגות תאריכי סיום השירות הלאומי"
                    dataSource="עמודת 'תאריך סיום'"
                    calculation="ספירת מספר המסיימים בכל רבעון"
                  />
                  <ChartExportButton
                    chartRef={chartRef2}
                    data={serviceData.endData}
                    filename="תאריכי_סיום_לאומי"
                    dataColumns={[
                      { key: "period", label: "תקופה" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef2}>
                  {serviceData.endData.length > 0 ? (
                    <HorizontalBarChart
                      data={serviceData.endData}
                      dataKey="period"
                      valueKey="count"
                      valueLabel="מספר מסיימות"
                      singleColor="#f472b6"
                      height={Math.max(220, serviceData.endData.length * 40)}
                    />
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-gray-500">
                      אין נתוני תאריכי סיום
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[#1e3a5f]">
                רשימת המשרתות בשירות לאומי
              </CardTitle>
              <div className="flex items-center gap-2">
                <ViewContactsButton
                  data={serviceData.tableData}
                  filterLabel="שירות לאומי"
                />
                <TableExportButton
                  data={serviceData.tableData}
                  columns={tableColumns}
                  filename="שירות_לאומי"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={serviceData.tableData}
                columns={tableColumns}
                pageSize={15}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
