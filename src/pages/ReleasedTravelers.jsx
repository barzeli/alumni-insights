import { useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Plane } from "lucide-react";
import NoDataView from "../components/common/NoDataView";
import ReusablePieChart from "../components/charts/ReusablePieChart";
import StatCard from "../components/common/StatCard";
import DataTable from "../components/common/DataTable";
import { useSurveyData } from "../hooks/useSurveyData";
import {
  getValue,
  getName,
  getCohort,
  isReleased,
} from "../utils/surveyDataHelpers";
import {
  ChartExportButton,
  TableExportButton,
  PageExportButton,
} from "../components/common/ExportButton";
import ViewContactsButton from "../components/common/ViewContactsButton";
import ReleasedSubNav from "../components/layout/ReleasedSubNav";

const COLORS = [
  "#06b6d4",
  "#0891b2",
  "#0e7490",
  "#155e75",
  "#164e63",
  "#22d3ee",
  "#67e8f9",
];

export default function ReleasedTravelers() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const chartRef1 = useRef(null);

  const travelData = useMemo(() => {
    if (!hasSurveyData) return null;

    const released = surveyData.filter((row) => isReleased(row));

    const travelers = released.filter((row) => {
      const activity = getValue(row, "current_activity");
      return (
        activity && (activity.includes("מטייל") || activity.includes("טיול"))
      );
    });

    const continentCounts = {};
    const continentRespondents = {};
    travelers.forEach((row) => {
      const continent = getValue(row, "travel_continent");
      if (continent) {
        continentCounts[continent] = (continentCounts[continent] || 0) + 1;
        if (!continentRespondents[continent])
          continentRespondents[continent] = [];
        continentRespondents[continent].push({
          name: getName(row),
          cohort: getCohort(row),
        });
      }
    });

    const continentData = Object.entries(continentCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([continent, count]) => ({
        continent,
        count,
        respondents: continentRespondents[continent] || [],
      }));

    const tableData = travelers.map((row) => ({
      full_name: getName(row),
      cohort: getCohort(row),
      continent: getValue(row, "travel_continent") || "-",
      travel_start: getValue(row, "travel_start") || "-",
      travel_return: getValue(row, "travel_return") || "-",
      description: getValue(row, "travel_description") || "-",
    }));

    return { total: travelers.length, continentData, tableData };
  }, [surveyData, hasSurveyData]);

  const tableColumns = [
    { key: "full_name", label: "שם מלא" },
    { key: "cohort", label: "מחזור" },
    { key: "continent", label: "יבשת" },
    { key: "travel_start", label: "תאריך יציאה" },
    { key: "travel_return", label: "צפי חזרה" },
    { key: "description", label: "תיאור" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">מטיילים</h1>
        {hasSurveyData && (
          <PageExportButton
            pageData={{
              יבשות: {
                data: travelData.continentData,
                columns: [
                  { key: "continent", label: "יבשת" },
                  { key: "count", label: "מספר" },
                ],
              },
              מטיילים: { data: travelData.tableData, columns: tableColumns },
            }}
            pageName="מטיילים"
          />
        )}
      </div>

      <ReleasedSubNav currentPage="ReleasedTravelers" />

      {!hasSurveyData ? (
        <NoDataView />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="מטיילים כרגע"
              value={travelData.total}
              icon={Plane}
              color="cyan"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  חלוקה לפי יבשות
                </CardTitle>
                <ChartExportButton
                  chartRef={chartRef1}
                  data={travelData.continentData}
                  filename="מטיילים_לפי_יבשת"
                  dataColumns={[
                    { key: "continent", label: "יבשת" },
                    { key: "count", label: "מספר" },
                  ]}
                />
              </CardHeader>
              <CardContent>
                <div className="h-100" ref={chartRef1}>
                  {travelData.continentData.length > 0 ? (
                    <ReusablePieChart
                      data={travelData.continentData}
                      dataKey="count"
                      nameKey="continent"
                      colors={COLORS}
                      height={400}
                      valueLabel="מספר"
                      filterKey="travel_continent"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      אין נתוני יבשות
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#1e3a5f]">סיכום</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {travelData.continentData.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium">{item.continent}</span>
                      <span className="text-lg font-bold text-cyan-600">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[#1e3a5f]">
                רשימת מטיילים
              </CardTitle>
              <div className="flex items-center gap-2">
                <ViewContactsButton
                  data={travelData.tableData}
                  filterLabel="מטיילים"
                />
                <TableExportButton
                  data={travelData.tableData}
                  columns={tableColumns}
                  filename="רשימת_מטיילים"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={travelData.tableData}
                columns={tableColumns}
                pageSize={15}
                filterableColumns={["cohort", "continent"]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
