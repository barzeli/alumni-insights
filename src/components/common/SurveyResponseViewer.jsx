import { X } from "lucide-react";
import { Button } from "../ui/button";

// Hebrew labels for survey columns (Survey V2)
const COLUMN_LABELS = {
  full_name: "שם מלא",
  pronoun: "לשון פנייה",
  cohort: "איזה מחזור ושלוחה היית?",
  military_status: 'מה מצבי מול צה"ל...',
  enlistment_date_future: "מתי התאריך גיוס",
  future_destination: "לאן הגיוס העתידי?",
  enlistment_date: "תאריך גיוס",
  release_date: "תאריך שיחרור",
  current_role: "באיזה תפקיד את.ה משרת?",
  role_type: "מה אופי התפקיד?",
  base_location: "באיזה בסיס...",
  return_to_mentor: "לחזור להדריך במכינה?",
  studying_parallel: "האם את.ה לומד.ת במקביל?",
  atuda_stage: "באיזה שלב את.ה",
  atuda_institution: "מוסד אקדמי בו את.ה לומד.ת?",
  atuda_faculty: "פקולטת לימודים",
  atuda_track: "מה מסלול הלימודים?",
  atuda_year: "שנה בתואר",
  atuda_role: "מה התפקיד המיועד?",
  service_type: "איזה שירות עשית?",
  national_role_desc: "תפקיד בשירות לאומי?",
  national_start_date: "תאריך התחלת שירות",
  national_end_date: "תאריך סיום שירות",
  national_location: "איפה עשית שירות לאומי",
  was_keva: "היית בקבע?",
  was_commander: "האם היית מפקד.ת?",
  last_role: "איפה שירתת? תפקיד אחרון",
  role_nature: "מה היה אופי התפקיד?",
  current_activity: "מה את.ה עושה עכשיו?",
  travel_continent: "באיזה יבשת את.ה מטייל.ת?",
  travel_start: "מתי טסת?",
  travel_return: "מתי צפי חזרה",
  travel_description: "ספר/י בקצרה מה מעשייך",
  student_institution: "מוסד אקדמי בו את.ה לומד.ת?",
  student_faculty: "פקולטת לימודים",
  student_track: "תואר מלא או נקודות זכות?",
  student_year: "שנה בתואר",
  student_end_year: "צפי לסיום התואר",
  released_improving_bagrut: "משפר.ת בגריות?",
  released_bagrut_subjects: "איזה בגריות אתה משפר?",
  released_psychometric: "לומד.ת לפיסכומטרי?",
  released_psychometric_status: "משפר או פעם ראשונה",
  released_psychometric_goal: "לכבוד מה? מה מתכנן ללמוד?",
  work_field: "באיזה תחום את.ה עובד.ת?",
  work_more: "ספר.י לנו בקצרה על העבודה",
  return_to_work_mechina: "לחזור לעבוד במכינה?",
  phone: "מספר טלפון",
  email: "כתובת מייל",
};

export default function SurveyResponseViewer({
  response,
  onClose,
  graduateName,
  surveyName,
}) {
  if (!response) return null;

  // Filter only non-empty responses
  const filledResponses = Object.entries(response).filter(([, value]) => {
    return value && value.toString().trim() !== "";
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">תשובות סקר - {graduateName}</h2>
            {surveyName && (
              <p className="text-sm text-white/70">{surveyName}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="space-y-3">
            {filledResponses.map(([key, value]) => (
              <div key={key} className="border-b border-gray-100 pb-3">
                <p className="text-sm font-medium text-[#1e3a5f] mb-1">
                  {COLUMN_LABELS[key] || key}
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {String(value)}
                </p>
              </div>
            ))}
          </div>

          {filledResponses.length === 0 && (
            <p className="text-center text-gray-500 py-8">לא נמצאו תשובות</p>
          )}
        </div>
      </div>
    </div>
  );
}
