import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Users,
  UserCheck,
  Percent,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import StatCard from "../components/survey/StatCard";
import GlobalFilters from "../components/survey/GlobalFilters";
import ChartInfoButton from "../components/survey/ChartInfoButton";
import ChartTooltip from "../components/charts/ChartTooltip";
import { useSurveyData } from "../hooks/useSurveyData";
import ReusablePieChart from "../components/charts/ReusablePieChart";
import {
  getCohortBarColors,
  STATUS_COLORS,
} from "../components/survey/ChartColors";

export default function Overview() {
  const {
    surveyData,
    hasSurveyData,
    cohortCounts,
    totalGraduates,
    totalCohorts,
  } = useSurveyData();
  const [filters, setFilters] = useState({ cohorts: [], pronouns: [] });
  const [selectedBarData, setSelectedBarData] = useState(null);

  // פונקציות עזר לקריאת נתונים
  const getCohort = (row) =>
    row["איזה מחזור ושלוחה היית?"] || row.cohort || "-";
  const getName = (row) => row["שם מלא"] || row.full_name || "לא ידוע";
  const getStatus = (row) =>
    row['מה מצבי מול צה"ל / שירות לאומי'] || row.military_status || "";

  const filteredData = useMemo(() => {
    if (!hasSurveyData) return [];
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

  const stats = useMemo(() => {
    if (!hasSurveyData || filteredData.length === 0)
      return {
        totalRespondents: 0,
        responseRate: "0",
        statusCounts: {
          malshab: 0,
          soldiers: 0,
          atuda: 0,
          released: 0,
          nationalService: 0,
        },
        pieData: [],
        cohortData: [],
      };

    // ספירת סטטוסים לפי עמודה H
    let malshab = 0,
      soldiers = 0,
      atuda = 0,
      released = 0,
      nationalService = 0;

    filteredData.forEach((row) => {
      const status = getStatus(row);
      if (status.includes("מלש")) malshab++;
      else if (status.includes("חייל")) soldiers++;
      else if (status.includes("עתודאי")) atuda++;
      else if (status.includes("משוחרר")) released++;
      else if (status.includes("שירות לאומי")) nationalService++;
    });

    // חישוב אחוז מענה
    const filteredGraduatesCount =
      filters.cohorts.length > 0
        ? Object.entries(cohortCounts)
            .filter(([cohort]) => filters.cohorts.includes(cohort))
            .reduce((sum, [, count]) => sum + count, 0)
        : totalGraduates;

    const responseRate =
      filteredGraduatesCount > 0
        ? ((filteredData.length / filteredGraduatesCount) * 100).toFixed(1)
        : "0";

    // נתוני עוגה - חלוקה לפי שלב בחיים (עמודה H)
    const getRespondentsByStatus = (statusCheck) => {
      return filteredData
        .filter((row) => statusCheck(getStatus(row)))
        .map((row) => ({
          name: getName(row),
          cohort: getCohort(row),
        }));
    };

    const pieData = [
      {
        name: 'מלש"ב',
        value: malshab,
        color: STATUS_COLORS['מלש"ב'],
        respondents: getRespondentsByStatus((s) => s.includes("מלש")),
      },
      {
        name: "חיילים בסדיר/קבע",
        value: soldiers,
        color: STATUS_COLORS["חיילים"],
        respondents: getRespondentsByStatus((s) => s.includes("חייל")),
      },
      {
        name: "עתודאים",
        value: atuda,
        color: STATUS_COLORS["עתודאים"],
        respondents: getRespondentsByStatus((s) => s.includes("עתודאי")),
      },
      {
        name: "משוחררים",
        value: released,
        color: STATUS_COLORS["משוחררים"],
        respondents: getRespondentsByStatus((s) => s.includes("משוחרר")),
      },
      {
        name: "שירות לאומי",
        value: nationalService,
        color: STATUS_COLORS["שירות לאומי"],
        respondents: getRespondentsByStatus((s) => s.includes("שירות לאומי")),
      },
    ].filter((d) => d.value > 0);

    // נתוני גרף עמודות - עונים ואחוז מענה לפי מחזור (עמודה E)
    const filteredCohortCounts =
      filters.cohorts.length > 0
        ? Object.fromEntries(
            Object.entries(cohortCounts).filter(([cohort]) =>
              filters.cohorts.includes(cohort),
            ),
          )
        : cohortCounts;

    const cohortData = Object.entries(filteredCohortCounts).map(
      ([cohort, totalValue]) => {
        const total = totalValue;
        const respondentsList = filteredData
          .filter((row) => getCohort(row) === cohort)
          .map((row) => ({ name: getName(row), cohort }));
        const respondentsCount = respondentsList.length;
        const percentage =
          total > 0 ? ((respondentsCount / total) * 100).toFixed(1) : "0";
        return {
          name: cohort,
          respondents: respondentsCount,
          total,
          percentage: parseFloat(percentage),
          respondentsList,
        };
      },
    );

    return {
      totalRespondents: filteredData.length,
      responseRate,
      statusCounts: { malshab, soldiers, atuda, released, nationalService },
      pieData,
      cohortData,
    };
  }, [filteredData, cohortCounts, totalGraduates, filters]);

  if (!hasSurveyData || stats.totalRespondents === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          מבט כללי על תוצאות הסקר
        </h1>
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            לא נמצאו נתוני סקר. לחץ על כפתור הרענון בראש העמוד כדי לבחור סקר.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">
        מבט כללי על תוצאות הסקר
      </h1>

      <GlobalFilters
        surveyData={surveyData}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* ריבועי מידע */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="סהכ עונים"
          value={stats.totalRespondents}
          icon={UserCheck}
          color="cyan"
        />
        <StatCard
          title="אחוז מענה"
          value={`${stats.responseRate}%`}
          icon={Percent}
          color="green"
        />
        <StatCard
          title="סהכ בוגרים"
          value={totalGraduates}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="מספר מחזורים"
          value={totalCohorts}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* מספר בוגרים לפי מחזור */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#1e3a5f]">
            מספר בוגרים לפי מחזור
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(cohortCounts).map(([cohort, count]) => (
              <div
                key={cohort}
                className="bg-gray-50 rounded-lg p-3 text-center"
              >
                <p className="text-xs text-gray-500 mb-1">{cohort}</p>
                <p className="text-xl font-bold text-[#1e3a5f]">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* גרף עמודות מורכב - עונים ואחוז מענה לפי מחזור */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#1e3a5f]">
            מספר עונים ואחוז מענה לפי מחזור
          </CardTitle>
          <ChartInfoButton
            title="עונים ואחוז מענה לפי מחזור"
            description="כל מחזור מקבל עמודה כפולה: מספר העונים על הסקר ואחוז מענה מתוך כלל המחזור"
            dataSource="עמודה E - איזה מחזור ושלוחה היית?"
            calculation="אחוז מענה = מספר עונים / סה״כ בוגרים במחזור (מהמידע השמור)"
          />
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.cohortData}
                margin={{ bottom: 120, left: 10, right: 10 }}
                barCategoryGap="20%"
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={() => (
                    <ChartTooltip onClose={() => setSelectedBarData(null)} />
                  )}
                />
                <Legend
                  verticalAlign="top"
                  align="center"
                  height={50}
                  formatter={(value) =>
                    value === "respondents"
                      ? "מספר עונים (כהה)"
                      : value === "percentage"
                        ? "אחוז מענה (בהיר)"
                        : value
                  }
                />
                <Bar
                  yAxisId="left"
                  dataKey="respondents"
                  name="respondents"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => data && setSelectedBarData(data.payload)}
                  cursor="pointer"
                >
                  {stats.cohortData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getCohortBarColors(entry.name).main}
                    />
                  ))}
                </Bar>
                <Bar
                  yAxisId="right"
                  dataKey="percentage"
                  name="percentage"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => data && setSelectedBarData(data.payload)}
                  cursor="pointer"
                >
                  {stats.cohortData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getCohortBarColors(entry.name).light}
                    />
                  ))}
                </Bar>
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  tick={{ fontSize: 11, fill: "#374151" }}
                  tickMargin={10}
                />
                <YAxis
                  yAxisId="left"
                  orientation="right"
                  allowDecimals={false}
                  label={{
                    value: "מספר עונים",
                    angle: 90,
                    position: "insideRight",
                    style: { fontSize: 11, fill: "#1e3a5f" },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="left"
                  allowDecimals={false}
                  domain={[0, 100]}
                  label={{
                    value: "אחוז מענה",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "#0891b2" },
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
            {selectedBarData && (
              <ChartTooltip
                payload={selectedBarData}
                onClose={() => setSelectedBarData(null)}
                nameKey="name"
                valueLabel="עונים"
                filterKey="cohort"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* סיכום מהיר ועוגה */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#1e3a5f]">
              סיכום מהיר לפי סטטוס
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
                <p className="text-2xl font-bold text-amber-700">
                  {stats.statusCounts.malshab}
                </p>
                <p className="text-sm text-amber-600">מלש"בים</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <p className="text-2xl font-bold text-blue-700">
                  {stats.statusCounts.soldiers}
                </p>
                <p className="text-sm text-blue-600">חיילים בסדיר</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                <p className="text-2xl font-bold text-purple-700">
                  {stats.statusCounts.atuda}
                </p>
                <p className="text-sm text-purple-600">עתודאים</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <p className="text-2xl font-bold text-green-700">
                  {stats.statusCounts.released}
                </p>
                <p className="text-sm text-green-600">משוחררים</p>
              </div>
              <div className="bg-pink-50 rounded-lg p-4 text-center border border-pink-200">
                <p className="text-2xl font-bold text-pink-700">
                  {stats.statusCounts.nationalService}
                </p>
                <p className="text-sm text-pink-600">שירות לאומי</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">
              חלוקה לפי שלב בחיים
            </CardTitle>
            <ChartInfoButton
              title="חלוקה לפי שלב בחיים"
              description="התפלגות העונים לפי מצבם מול צה״ל / שירות לאומי"
              dataSource="עמודה H - מה מצבי מול צה״ל / שירות לאומי"
              calculation="אחוזים מחושבים מתוך סה״כ העונים לסקר"
            />
          </CardHeader>
          <CardContent>
            <ReusablePieChart
              data={stats.pieData}
              dataKey="value"
              nameKey="name"
              colorKey="color"
              height={400}
              outerRadius={80}
              innerRadius={40}
              labelFontSize={18}
              labelFontWeight="bold"
              valueLabel="מספר"
              showPercentage={true}
              totalForPercentage={stats.totalRespondents}
              filterKey="military_status"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
