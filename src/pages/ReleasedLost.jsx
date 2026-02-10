import { useMemo } from "react";
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
import { HelpCircle, Upload, AlertCircle, Heart } from "lucide-react";
import StatCard from "../components/common/StatCard";
import DataTable from "../components/common/DataTable";
import { useSurveyData } from "../hooks/useSurveyData";
import {
  TableExportButton,
  PageExportButton,
} from "../components/common/ExportButton";
import ViewContactsButton from "../components/common/ViewContactsButton";
import {
  getValue,
  getName,
  getCohort,
  isReleased,
} from "../utils/surveyDataHelpers";
import ReleasedSubNav from "../components/layout/ReleasedSubNav";

export default function ReleasedLost() {
  const { surveyData, hasSurveyData } = useSurveyData();

  const lostData = useMemo(() => {
    if (!hasSurveyData) return null;

    // 1. סינון משוחררים
    const released = surveyData.filter((row) => isReleased(row));

    // 2. סינון "מחפשים את עצמם" (עמודה 68)
    const lostPeopleRaw = released.filter((row) => {
      const activity = getValue(row, "current_activity");
      if (!activity) return false;
      const cleanedActivity = String(activity).trim();
      return cleanedActivity.includes("מחפש את עצמי");
    });

    // 3. מיפוי הנתונים לטבלה
    const lostPeople = lostPeopleRaw.map((row) => ({
      full_name: getName(row),
      cohort: getCohort(row),
      travel_description: getValue(row, "travel_description") || "-",
      how_can_help: getValue(row, "how_can_help") || "-",
      phone: getValue(row, "phone") || "-",
      email: getValue(row, "email") || "-",
    }));

    // ספירה לפי מחזור
    const cohortCounts = {};
    lostPeople.forEach((person) => {
      const cohort = person.cohort;
      if (cohort && cohort !== "-")
        cohortCounts[cohort] = (cohortCounts[cohort] || 0) + 1;
    });

    const cohortData = Object.entries(cohortCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([cohort, count]) => ({ cohort, count }));

    return { total: lostPeople.length, cohortData, tableData: lostPeople };
  }, [surveyData, hasSurveyData]);

  if (!hasSurveyData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">מרגישים אבודים</h1>
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            לא נמצאו נתוני סקר. יש להעלות קובץ סקר תחילה.
          </AlertDescription>
        </Alert>
        <Link to="/">
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
    { key: "travel_description", label: "מה הם עושים כרגע" },
    { key: "how_can_help", label: "איך אפשר לעזור" },
    { key: "phone", label: "טלפון" },
    { key: "email", label: "אימייל" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">מרגישים אבודים</h1>
        <PageExportButton
          pageData={{
            לפי_מחזור: {
              data: lostData.cohortData,
              columns: [
                { key: "cohort", label: "מחזור" },
                { key: "count", label: "מספר" },
              ],
            },
            טבלה: { data: lostData.tableData, columns: tableColumns },
          }}
          pageName="מרגישים_אבודים"
        />
      </div>

      <ReleasedSubNav currentPage="ReleasedLost" />

      <Alert className="bg-orange-50 border-orange-200">
        <Heart className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          בוגרים אלה ציינו שהם מחפשים את עצמם כרגע.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="מרגישים אבודים"
          value={lostData.total}
          icon={HelpCircle}
          color="orange"
        />
      </div>

      {lostData.cohortData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#1e3a5f]">
              חלוקה לפי מחזור
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {lostData.cohortData.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-orange-50 rounded-lg text-center"
                >
                  <p className="text-sm text-gray-600">{item.cohort}</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {item.count}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            רשימת בוגרים שמרגישים אבודים
          </CardTitle>
          <div className="flex items-center gap-2">
            <ViewContactsButton
              data={lostData.tableData}
              filterLabel="מרגישים אבודים"
            />
            <TableExportButton
              data={lostData.tableData}
              columns={tableColumns}
              filename="מרגישים_אבודים"
            />
          </div>
        </CardHeader>
        <CardContent>
          {lostData.tableData.length > 0 ? (
            <DataTable
              data={lostData.tableData}
              columns={tableColumns}
              pageSize={15}
              filterableColumns={["cohort", "full_name"]}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              לא נמצאו בוגרים העונים להגדרה זו בנתונים הקיימים.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
