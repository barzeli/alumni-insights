import { useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils/createPageUrl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { UserMinus, Percent } from "lucide-react";
import ReusablePieChart from "../components/charts/ReusablePieChart";
import StatCard from "../components/common/StatCard";
import NoDataView from "../components/common/NoDataView";
import { Button } from "../components/ui/button";

import ChartInfoButton from "../components/charts/ChartInfoButton";

import { useSurveyData } from "../hooks/useSurveyData";
import { PIE_COLORS } from "../utils/colors";
import {
  getValue,
  getName,
  getCohort,
  isReleased,
} from "../utils/surveyDataHelpers";

import GlobalFilters from "../components/common/GlobalFilters";
import {
  ChartExportButton,
  PageExportButton,
} from "../components/common/ExportButton";
import ReusableBarChart from "../components/charts/ReusableBarChart";

export default function Released() {
  const { surveyData, hasSurveyData } = useSurveyData();
  const [filters, setFilters] = useState({ cohorts: [], pronouns: [] });

  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);

  const filteredSurveyData = useMemo(() => {
    if (!hasSurveyData) return [];
    if (filters.cohorts.length === 0 && filters.pronouns.length === 0)
      return surveyData;
    return surveyData.filter((row) => {
      const cohortVal = getCohort(row);
      const pronounVal = getValue(row, "pronoun");
      const cohortMatch =
        filters.cohorts.length === 0 || filters.cohorts.includes(cohortVal);
      const pronounMatch =
        filters.pronouns.length === 0 || filters.pronouns.includes(pronounVal);
      return cohortMatch && pronounMatch;
    });
  }, [surveyData, hasSurveyData, filters]);

  const releasedData = useMemo(() => {
    if (!hasSurveyData) return null;

    const released = filteredSurveyData.filter((row) => isReleased(row));

    const cohortCountsMap = {};
    const cohortRespondentsMap = {};
    released.forEach((row) => {
      const cohort = getCohort(row);
      if (cohort && cohort !== "-") {
        cohortCountsMap[cohort] = (cohortCountsMap[cohort] || 0) + 1;
        if (!cohortRespondentsMap[cohort]) cohortRespondentsMap[cohort] = [];
        cohortRespondentsMap[cohort].push({
          name: getName(row),
          cohort: cohort,
        });
      }
    });

    const cohortData = Object.entries(cohortCountsMap).map(
      ([cohort, total]) => {
        const count = cohortCountsMap[cohort] || 0;
        const percentage = ((count / total) * 100).toFixed(1);
        return {
          cohort,
          fullCohort: cohort,
          count,
          total,
          percentage: parseFloat(percentage),
          respondents: cohortRespondentsMap[cohort] || [],
        };
      },
    );

    const serviceTypeCounts = {};
    const serviceTypeRespondents = {};
    released.forEach((row) => {
      const serviceType = getValue(row, "service_type");
      if (serviceType && serviceType.trim()) {
        // Handle multi-select answers
        const types = serviceType
          .split(/[,،]/)
          .map((t) => t.trim())
          .filter((t) => t);
        types.forEach((type) => {
          serviceTypeCounts[type] = (serviceTypeCounts[type] || 0) + 1;
          if (!serviceTypeRespondents[type]) serviceTypeRespondents[type] = [];
          serviceTypeRespondents[type].push({
            name: getName(row),
            cohort: getCohort(row),
          });
        });
      }
    });
    const serviceTypeData = Object.entries(serviceTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({
        type,
        count,
        respondents: serviceTypeRespondents[type] || [],
      }));

    return { total: released.length, cohortData, serviceTypeData };
  }, [filteredSurveyData, hasSurveyData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          משוחררים - סקירה כללית
        </h1>
        {hasSurveyData && (
          <PageExportButton
            pageData={{
              לפי_מחזור: {
                data: releasedData.cohortData,
                columns: [
                  { key: "cohort", label: "מחזור" },
                  { key: "count", label: "מספר" },
                  { key: "percentage", label: "אחוז" },
                ],
              },
              סוג_שירות: {
                data: releasedData.serviceTypeData,
                columns: [
                  { key: "type", label: "סוג שירות" },
                  { key: "count", label: "מספר" },
                ],
              },
            }}
            pageName="משוחררים"
          />
        )}
      </div>

      {!hasSurveyData ? (
        <NoDataView />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Link to={createPageUrl("ReleasedMilitary")}>
              <Button variant="outline">חלק צבאי</Button>
            </Link>
            <Link to={createPageUrl("ReleasedStudents")}>
              <Button variant="outline">סטודנטים</Button>
            </Link>
            <Link to={createPageUrl("Bagrut")}>
              <Button variant="outline">משפרי בגרויות</Button>
            </Link>
            <Link to={createPageUrl("ReleasedTravelers")}>
              <Button variant="outline">מטיילים</Button>
            </Link>
            <Link to={createPageUrl("ReleasedWork")}>
              <Button variant="outline">תחומי עבודה</Button>
            </Link>
            <Link to={createPageUrl("ReleasedLost")}>
              <Button variant="outline">מרגישים אבודים</Button>
            </Link>
          </div>

          <GlobalFilters
            surveyData={surveyData}
            filters={filters}
            onFilterChange={setFilters}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="סהכ משוחררים"
              value={releasedData.total}
              icon={UserMinus}
              color="green"
            />
            <StatCard
              title="אחוז מכלל העונים"
              value={`${((releasedData.total / surveyData.length) * 100).toFixed(1)}%`}
              icon={Percent}
              color="cyan"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#1e3a5f]">
                  משוחררים לפי מחזור (מספר + אחוז)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="משוחררים לפי מחזור"
                    description="מספר המשוחררים מכל מחזור ואחוזם"
                    dataSource="עמודת 'שלב בחיים' = משוחרר"
                    calculation="אחוזים מחושבים מתוך סה״כ הבוגרים בכל מחזור"
                  />
                  <ChartExportButton
                    chartRef={chartRef1}
                    data={releasedData.cohortData}
                    filename="משוחררים_לפי_מחזור"
                    dataColumns={[
                      { key: "cohort", label: "מחזור" },
                      { key: "count", label: "מספר" },
                      { key: "percentage", label: "אחוז" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef1}>
                  {releasedData.cohortData.length > 0 ? (
                    <ReusableBarChart
                      data={releasedData.cohortData}
                      dataKey="cohort"
                      valueLabel="מספר משוחררים"
                      useCohortColors
                      height={Math.max(
                        200,
                        releasedData.cohortData.length * 40,
                      )}
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
                <CardTitle className="text-lg text-[#1e3a5f]">
                  חלוקה לפי סוג שירות
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ChartInfoButton
                    title="סוג שירות"
                    description="התפלגות המשוחררים לפי סוג השירות"
                    dataSource="עמודת 'באיזה סוג שירות שירתת?'"
                    calculation="ספירת מספר המשוחררים לכל סוג שירות"
                  />
                  <ChartExportButton
                    chartRef={chartRef2}
                    data={releasedData.serviceTypeData}
                    filename="משוחררים_סוג_שירות"
                    dataColumns={[
                      { key: "type", label: "סוג שירות" },
                      { key: "count", label: "מספר" },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartRef2}>
                  {releasedData.serviceTypeData.length > 0 ? (
                    <ReusablePieChart
                      data={releasedData.serviceTypeData.map((d, idx) => ({
                        ...d,
                        color: PIE_COLORS[idx % PIE_COLORS.length],
                      }))}
                      dataKey="count"
                      nameKey="type"
                      colorKey="color"
                      height={400}
                      valueLabel="מספר"
                      filterKey="service_type"
                    />
                  ) : (
                    <div className="h-100 flex items-center justify-center text-gray-500">
                      אין נתוני סוג שירות
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
