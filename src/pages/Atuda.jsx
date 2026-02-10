import { useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { GraduationCap, School, ShieldCheck, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils/createPageUrl";
import NoDataView from "../components/common/NoDataView";
import StatCard from "../components/common/StatCard";
import DataTable from "../components/common/DataTable";

import ChartInfoButton from "../components/charts/ChartInfoButton";
import {
  ChartExportButton,
  TableExportButton,
  PageExportButton,
} from "../components/common/ExportButton";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ViewContactsButton from "../components/common/ViewContactsButton";
import { useAtudaData } from "../hooks/useAtudaData";

export default function Atuda() {
  const { atudaData, hasSurveyData } = useAtudaData();
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);

  const tableColumns = [
    { key: "full_name", label: "שם מלא" },
    { key: "cohort", label: "מחזור" },
    { key: "stage", label: "שלב" },
    { key: "institution", label: "מוסד אקדמי (משולב)" },
    { key: "faculty", label: "פקולטה (משולבת)" },
    { key: "track", label: "מסלול (משולב)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">עתודאים</h1>
        {hasSurveyData && (
          <PageExportButton
            pageData={{
              שלבים: {
                data: atudaData.stageData,
                columns: [
                  { key: "stage", label: "שלב" },
                  { key: "count", label: "מספר" },
                ],
              },
              מחזורים: {
                data: atudaData.cohortData,
                columns: [
                  { key: "cohort", label: "מחזור" },
                  { key: "count", label: "מספר" },
                ],
              },
              טבלה: { data: atudaData.tableData, columns: tableColumns },
            }}
            pageName="עתודאים"
          />
        )}
      </div>

      {!hasSurveyData ? (
        <NoDataView />
      ) : (
        <>
          <Alert className="bg-purple-50 border-purple-200">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              שימו לב: העתודאים נספרים בנפרד ולא מופיעים בעמוד החיילים
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="סה״כ עתודאים"
              value={atudaData.total}
              icon={GraduationCap}
              color="purple"
            />
            <StatCard
              title="בלימודים"
              value={atudaData.inStudies}
              icon={School}
              color="blue"
            />
            <StatCard
              title="בשירות"
              value={atudaData.inService}
              icon={ShieldCheck}
              color="green"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link to={createPageUrl("AtudaStudies")}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                    <School className="w-5 h-5" />
                    שלב הלימודים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-blue-600">
                      {atudaData.inStudies}
                    </p>
                    <p className="text-gray-600">
                      עתודאים בשלב הלימודים האקדמיים
                    </p>
                    <Button className="w-full mt-4">צפייה בפירוט →</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl("AtudaMilitary")}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    השלב הצבאי
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-green-600">
                      {atudaData.inService}
                    </p>
                    <p className="text-gray-600">עתודאים בשלב השירות הצבאי</p>
                    <Button className="w-full mt-4">צפייה בפירוט →</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f]">
                  התפלגות שלבים
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="התפלגות שלבים"
                    description="כמות עתודאים בכל שלב במסלול"
                    dataSource="אינדקס 25 - באיזה שלב את.ה"
                    calculation="ספירת עתודאים לפי שלב"
                  />
                  <ChartExportButton
                    chartRef={chartRef1}
                    data={atudaData.stageData}
                    filename="התפלגות_שלבים"
                    dataColumns={[
                      { key: "stage", label: "שלב" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef1}>
                  {atudaData.stageData.length > 0 ? (
                    <HorizontalBarChart
                      data={atudaData.stageData}
                      dataKey="stage"
                      valueLabel="מספר עתודאים"
                      singleColor="#7c3aed"
                      height={Math.max(200, atudaData.stageData.length * 40)}
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
                  התפלגות מחזורים
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="התפלגות מחזורים"
                    description="כמות עתודאים מכל מחזור"
                    dataSource="אינדקס 4 - מחזור"
                    calculation="ספירת עתודאים לפי מחזור"
                  />
                  <ChartExportButton
                    chartRef={chartRef2}
                    data={atudaData.cohortData}
                    filename="עתודאים_לפי_מחזור"
                    dataColumns={[
                      { key: "cohort", label: "מחזור" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef2}>
                  {atudaData.cohortData.length > 0 ? (
                    <HorizontalBarChart
                      data={atudaData.cohortData}
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
              <CardTitle className="text-lg text-[#1e3a5f]">
                רשימת עתודאים מאוחדת
              </CardTitle>
              <div className="flex items-center gap-2">
                <ViewContactsButton
                  data={atudaData.tableData}
                  filterLabel="עתודאים"
                />
                <TableExportButton
                  data={atudaData.tableData}
                  columns={tableColumns}
                  filename="רשימת_עתודאים"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={atudaData.tableData}
                columns={tableColumns}
                pageSize={15}
                filterableColumns={["cohort", "stage", "institution"]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
