import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { MessageSquare, AlertCircle } from "lucide-react";
import StatCard from "../components/common/StatCard";
import { useSurveyData } from "../hooks/useSurveyData";
import { PageExportButton } from "../components/common/ExportButton";
import {
  getValue,
  getName,
  getCohort,
  getStatus,
} from "../utils/surveyDataHelpers";

export default function FinalRemarks() {
  const { surveyData, hasSurveyData } = useSurveyData();

  const remarksData = useMemo(() => {
    if (!hasSurveyData) return null;

    // Group remarks by military status instead of cohort
    const remarksByStatus = {};
    let totalRemarks = 0;

    surveyData.forEach((row) => {
      // Get remark using unified getValue function
      const remark = getValue(row, "final_remarks");

      if (remark && remark.trim() && remark.trim() !== "-") {
        // Use military_status (col 7) instead of cohort (col 4)
        const status = getStatus(row) || "סטטוס לא צוין";

        if (!remarksByStatus[status]) {
          remarksByStatus[status] = [];
        }

        remarksByStatus[status].push({
          name: getName(row),
          remark: remark.trim(),
          originalCohort: getCohort(row),
        });
        totalRemarks++;
      }
    });

    // Sort statuses alphabetically
    const sortedStatuses = Object.keys(remarksByStatus).sort();

    return { remarksByStatus, sortedStatuses, totalRemarks };
  }, [surveyData, hasSurveyData]);

  if (!hasSurveyData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          תשובות פתוחות - לפי סטטוס
        </h1>
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            לא נמצאו נתוני סקר. יש להעלות קובץ סקר תחילה.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepare export data
  const exportData = [];
  if (remarksData) {
    remarksData.sortedStatuses.forEach((status) => {
      remarksData.remarksByStatus[status].forEach((item) => {
        exportData.push({
          status,
          name: item.name,
          remark: item.remark,
          cohort: item.originalCohort,
        });
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          תשובות פתוחות - מה עוד יש לכם להגיד
        </h1>
        <PageExportButton
          pageData={{
            תשובות_לפי_סטטוס: {
              data: exportData,
              columns: [
                { key: "status", label: "סטטוס צבאי" },
                { key: "name", label: "שם" },
                { key: "remark", label: "תשובה" },
                { key: "cohort", label: "מחזור מקורי" },
              ],
            },
          }}
          pageName="תשובות_פתוחות_לפי_סטטוס"
        />
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <MessageSquare className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          כאן מרוכזות התשובות הפתוחות, בחלוקה לפי הסטטוס הנוכחי של הבוגרים
          (צבא/שירות/משוחררים וכו').
        </AlertDescription>
      </Alert>

      <StatCard
        title="סה״כ תשובות"
        value={remarksData?.totalRemarks || 0}
        subtitle="בוגרים שכתבו תשובה פתוחה"
        icon={MessageSquare}
        color="blue"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {remarksData?.sortedStatuses.map((status) => (
          <Card key={status} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-l from-[#1e3a5f] to-[#0891b2] text-white">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{status}</span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  {remarksData.remarksByStatus[status].length} תשובות
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-[400px] overflow-y-auto space-y-3">
              {remarksData.remarksByStatus[status].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-gray-900 font-bold">
                      {item.name}
                    </p>
                    <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                      {item.originalCohort}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {item.remark}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {(!remarksData || remarksData.totalRemarks === 0) && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>לא נמצאו תשובות פתוחות בסקר</p>
            <p className="text-xs mt-2 text-gray-400">
              (ודא שהעמודה 'final_remarks' ממופה כראוי לעמודה 107 בקובץ הסקר)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
