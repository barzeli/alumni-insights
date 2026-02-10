import { useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Briefcase } from "lucide-react";
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
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ViewContactsButton from "../components/common/ViewContactsButton";
import ReleasedSubNav from "../components/layout/ReleasedSubNav";

export default function ReleasedWork() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const chartRef1 = useRef(null);

  const workData = useMemo(() => {
    if (!hasSurveyData) return null;

    const released = surveyData.filter((row) => isReleased(row));

    const workFieldCounts = {};
    const workFieldRespondents = {};
    released.forEach((row) => {
      const field = getValue(row, "work_field");
      if (field) {
        workFieldCounts[field] = (workFieldCounts[field] || 0) + 1;
        if (!workFieldRespondents[field]) workFieldRespondents[field] = [];
        workFieldRespondents[field].push({
          name: getName(row),
          cohort: getCohort(row),
        });
      }
    });

    const workFieldData = Object.entries(workFieldCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([field, count]) => ({
        field,
        count,
        respondents: workFieldRespondents[field] || [],
      }));

    const tableData = released
      .filter((row) => getValue(row, "work_field"))
      .map((row) => ({
        full_name: getName(row),
        cohort: getCohort(row),
        work_field: getValue(row, "work_field") || "-",
        work_more: getValue(row, "work_more") || "-",
      }));

    return {
      total: tableData.length,
      uniqueFields: workFieldData.length,
      workFieldData,
      tableData,
    };
  }, [surveyData, hasSurveyData]);

  const tableColumns = [
    { key: "full_name", label: "שם מלא" },
    { key: "cohort", label: "מחזור" },
    { key: "work_field", label: "תחום עבודה" },
    { key: "work_more", label: "פרטים נוספים" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">תחומי עבודה</h1>
        {hasSurveyData && (
          <PageExportButton
            pageData={{
              תחומי_עבודה: {
                data: workData.workFieldData,
                columns: [
                  { key: "field", label: "תחום" },
                  { key: "count", label: "מספר" },
                ],
              },
              טבלה: { data: workData.tableData, columns: tableColumns },
            }}
            pageName="תחומי_עבודה"
          />
        )}
      </div>

      <ReleasedSubNav currentPage="ReleasedWork" />

      {!hasSurveyData ? (
        <NoDataView />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="עובדים"
              value={workData.total}
              icon={Briefcase}
              color="purple"
            />
            <StatCard
              title="תחומי עבודה שונים"
              value={workData.uniqueFields}
              icon={Briefcase}
              color="blue"
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                התפלגות לפי תחום עבודה
              </CardTitle>
              <div className="flex items-center gap-2">
                <ChartInfoButton
                  title="תחומי עבודה"
                  description="התפלגות המשוחררים לפי תחום עבודה"
                  dataSource="עמודת 'באיזה תחום אתה עובד?'"
                  calculation="ספירת העובדים בכל תחום"
                />
                <ChartExportButton
                  chartRef={chartRef1}
                  data={workData.workFieldData}
                  filename="תחומי_עבודה"
                  dataColumns={[
                    { key: "field", label: "תחום" },
                    { key: "count", label: "מספר" },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div ref={chartRef1}>
                {workData.workFieldData.length > 0 ? (
                  <HorizontalBarChart
                    data={workData.workFieldData}
                    dataKey="field"
                    valueLabel="מספר עובדים"
                    singleColor="#8b5cf6"
                    height={Math.max(200, workData.workFieldData.length * 35)}
                  />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-gray-500">
                    אין נתוני תחומי עבודה
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[#1e3a5f]">
                רשימת עובדים
              </CardTitle>
              <div className="flex items-center gap-2">
                <ViewContactsButton
                  data={workData.tableData}
                  filterLabel="עובדים"
                />
                <TableExportButton
                  data={workData.tableData}
                  columns={tableColumns}
                  filename="רשימת_עובדים"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={workData.tableData}
                columns={tableColumns}
                pageSize={15}
                filterableColumns={["cohort", "work_field"]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
