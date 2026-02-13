import { useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { FileText, Brain } from "lucide-react";
import NoDataView from "../components/common/NoDataView";
import StatCard from "../components/common/StatCard";
import DataTable from "../components/common/DataTable";
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

export default function Bagrut() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const chartRef1 = useRef(null);

  const bagrutData = useMemo(() => {
    if (!hasSurveyData) return null;

    const released = surveyData.filter((row) => isReleased(row));

    const bagrutImprovers = released.filter(
      (row) => getValue(row, "released_improving_bagrut") === "כן",
    );
    const psychometricStudiers = released.filter(
      (row) => getValue(row, "released_psychometric") === "כן",
    );

    const tableData = released
      .filter(
        (row) =>
          getValue(row, "released_improving_bagrut") === "כן" ||
          getValue(row, "released_psychometric") === "כן",
      )
      .map((row) => ({
        full_name: getName(row),
        cohort: getCohort(row),
        released_improving_bagrut:
          getValue(row, "released_improving_bagrut") || "-",
        released_bagrut_subjects:
          getValue(row, "released_bagrut_subjects") || "-",
        released_psychometric: getValue(row, "released_psychometric") || "-",
        released_psychometric_status:
          getValue(row, "released_psychometric_status") || "-",
        released_psychometric_goal:
          getValue(row, "released_psychometric_goal") || "-",
      }));

    const psychometricStatusCounts = {};
    const psychometricStatusRespondents = {};
    psychometricStudiers.forEach((row) => {
      const status = getValue(row, "released_psychometric_status");
      if (status) {
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
    const psychometricStatusData = Object.entries(psychometricStatusCounts).map(
      ([status, count]) => ({
        status,
        count,
        respondents: psychometricStatusRespondents[status] || [],
      }),
    );

    return {
      bagrutCount: bagrutImprovers.length,
      psychometricCount: psychometricStudiers.length,
      psychometricStatusData,
      tableData,
    };
  }, [surveyData, hasSurveyData]);

  const tableColumns = [
    { key: "full_name", label: "שם מלא" },
    { key: "cohort", label: "מחזור" },
    { key: "released_improving_bagrut", label: "משפר בגרויות" },
    { key: "released_bagrut_subjects", label: "מקצועות" },
    { key: "released_psychometric", label: "לומד פסיכומטרי" },
    { key: "released_psychometric_status", label: "סטטוס פסיכומטרי" },
    { key: "released_psychometric_goal", label: "מטרה" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          משפרי בגרויות ופסיכומטרי
        </h1>
        {hasSurveyData && (
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
            pageName="משפרי_בגרויות"
          />
        )}
      </div>

      {!hasSurveyData ? (
        <NoDataView />
      ) : (
        <>
          <ReleasedSubNav currentPage="Bagrut" />

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
                <div className="flex items-center justify-center h-50">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-orange-500">
                      {bagrutData.bagrutCount}
                    </p>
                    <p className="text-gray-600 mt-2">בוגרים משפרים בגרויות</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f]">
                  לומדי פסיכומטרי
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
                    <div className="h-50 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-purple-500">
                          {bagrutData.psychometricCount}
                        </p>
                        <p className="text-gray-600 mt-2">לומדים לפסיכומטרי</p>
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
                רשימת משפרים
              </CardTitle>
              <div className="flex items-center gap-2">
                <ViewContactsButton
                  data={bagrutData.tableData}
                  filterLabel="משפרי בגרויות ופסיכומטרי"
                />
                <TableExportButton
                  data={bagrutData.tableData}
                  columns={tableColumns}
                  filename="רשימת_משפרים"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={bagrutData.tableData}
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
