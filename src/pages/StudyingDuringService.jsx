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
import { Upload, AlertCircle, GraduationCap, FileText } from "lucide-react";
import { useSurveyData } from "../hooks/useSurveyData";
import { getValue } from "../utils/surveyDataHelpers";

export default function StudyingDuringService() {
  const { surveyData, hasSurveyData } = useSurveyData();

  const overviewData = useMemo(() => {
    if (!hasSurveyData) return null;

    // 1. סינון בסיסי: חיילים ובנות שירות (אינדקס 7)
    const inService = surveyData.filter((row) => {
      const status = getValue(row, "military_status") || "";
      return status.includes("חייל") || status.includes("שירות לאומי");
    });

    // 2. לומדים לתואר (אינדקס 47) - בודק אם קיים מוסד לימודים תקין
    const degreeStudents = inService.filter((row) => {
      const institution = getValue(row, "student_institution");
      return (
        institution &&
        institution.trim() !== "" &&
        institution !== "לא לומד" &&
        institution !== "-"
      );
    });

    // 3. משפרי בגרויות (אינדקס 53)
    const bagrutImprovers = inService.filter((row) => {
      const val = getValue(row, "improving_bagrut") || "";
      return val === "כן" || val.includes("כן") || val.includes("משפר");
    });

    // 4. פסיכומטרי (אינדקס 55)
    const psychometricStudiers = inService.filter((row) => {
      const val = getValue(row, "studying_psychometric") || "";
      return val === "כן" || val.includes("כן");
    });

    // 5. לומדים במקביל - שקלול של עמודות 24 ו-46 לפי המיפוי החדש
    const studyingParallelCount = inService.filter((row) => {
      const val = getValue(row, "studying_parallel") || "";
      return val === "כן" || val.includes("כן");
    }).length;

    return {
      totalInService: inService.length,
      studyingParallel: studyingParallelCount,
      degreeStudents: degreeStudents.length,
      bagrutImprovers: bagrutImprovers.length,
      psychometricStudiers: psychometricStudiers.length,
    };
  }, [surveyData, hasSurveyData]);

  if (!hasSurveyData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          לומדים במהלך שירות
        </h1>
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            לא נמצאו נתוני סקר. יש להעלות קובץ סקר תחילה.
          </AlertDescription>
        </Alert>
        <Link to={createPageUrl("Overview")}>
          <Button className="bg-[#0891b2] hover:bg-[#0891b2]/90 gap-2">
            <Upload className="w-4 h-4" />
            העלאת קובץ סקר
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">לומדים במהלך שירות</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Link to={createPageUrl("DegreeServiceStudents")}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-r-4 border-cyan-500">
            <CardHeader>
              <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                לומדים לתואר ראשון
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-cyan-600">
                  {overviewData.degreeStudents}
                </p>
                <p className="text-gray-600">
                  חיילים הרשומים למוסדות אקדמיים במקביל לשירות
                </p>
                <Button className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white">
                  צפייה בפירוט מוסדות ומסלולים →
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl("BagrutServiceStudents")}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-r-4 border-orange-500">
            <CardHeader>
              <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                <FileText className="w-5 h-5" />
                משלימי בגרויות ופסיכומטרי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-3xl font-bold text-orange-500">
                      {overviewData.bagrutImprovers}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">
                      משפרי בגרויות
                    </p>
                  </div>
                  <div className="h-12 w-px bg-gray-200"></div>
                  <div>
                    <p className="text-3xl font-bold text-purple-500">
                      {overviewData.psychometricStudiers}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">
                      לומדי פסיכומטרי
                    </p>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white">
                  צפייה בפירוט מקצועות ומטרות →
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
