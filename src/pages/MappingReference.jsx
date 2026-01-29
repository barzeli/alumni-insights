import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { FileText, Search, Download } from "lucide-react";

// *** מיפוי מלא מתוך הקובץ המצורף ***
// מערך גולמי עם אפשרות לכפילויות
const RAW_MAPPING_DATA = [
  {
    field: "timestamp",
    index: 0,
    excel: "A",
    header: "חותמת זמן",
  },
  {
    field: "full_name",
    index: 1,
    excel: "B",
    header: "שם מלא",
  },
  {
    field: "full_name_manual",
    index: 2,
    excel: "C",
    header: "שם מלא (רק אם לא מצאת את עצמך ברשימה)",
  },
  {
    field: "pronoun",
    index: 3,
    excel: "D",
    header: "לשון פנייה",
  },
  {
    field: "cohort",
    index: 4,
    excel: "E",
    header: "איזה מחזור ושלוחה היית?",
  },
  {
    field: "house",
    index: 5,
    excel: "F",
    header: "באיזה בית גרתם?",
  },
  {
    field: "mentor",
    index: 6,
    excel: "G",
    header: "מי היה המדריך/ה האישי? ",
  },
  {
    field: "military_status",
    index: 7,
    excel: "H",
    header: "מה מצבי מול צה'ל / שירות לאומי",
  },
  {
    field: "phone",
    index: 90,
    excel: "CM",
    header: "מספר נייד (05XXXXXXXX)",
  },
  {
    field: "email",
    index: 91,
    excel: "CN",
    header: "מייל",
  },
  {
    field: "current_city",
    index: 92,
    excel: "CO",
    header: "יישוב מגורים (כרגע)",
  },
  {
    field: "family_status",
    index: 93,
    excel: "CP",
    header: "מצב משפחתי",
  },
  {
    index: 8,
    excel: "I",
    header: "מתי התאריך גיוס ",
  },
  {
    index: 9,
    excel: "J",
    header: "לאן הגיוס העתידי?",
  },
  {
    index: 10,
    excel: "K",
    header: "אם כתבת 'אחר' זה המקום לפרט (תפקיד צבאי)",
  },
  {
    index: 11,
    excel: "L",
    header: "פה המקום לכתוב יותר פירוט לאן הגיוס.",
  },
  {
    field: "enlistment_date",
    index: 12,
    excel: "M",
    header: "תאריך גיוס",
  },
  {
    field: "release_date",
    index: 13,
    excel: "N",
    header: "תאריך שיחרור",
  },
  {
    field: "service_status_check",
    index: 14,
    excel: "O",
    header: "בשירות סדיר/קבע",
  },
  {
    field: "current_role",
    index: 15,
    excel: "P",
    header: "באיזה תפקיד את.ה משרת?",
  },
  {
    field: "command_course_status",
    index: 16,
    excel: "Q",
    header: "האם יצאת לקורס פיקוד?",
  },
  {
    field: "role_type",
    index: 17,
    excel: "R",
    header: "מה אופי התפקיד?",
  },
  {
    field: "other_role_type",
    index: 18,
    excel: "S",
    header: "אם כתבת 'אחר' זה המקום לפרט (תפקיד צבאי) 2",
  },
  {
    field: "base_location",
    index: 19,
    excel: "T",
    header: "באיזה בסיס / איפה הבסיס? ",
  },
  {
    field: "courses_done",
    index: 20,
    excel: "U",
    header: "ספרי לנו בקצרה איזה קורסים עשית",
  },
  {
    field: "planned_courses",
    index: 21,
    excel: "V",
    header: "יש תכנון ליציאה לקורסים בעתיד? אם כן לאיזה קורס ומתי?",
  },
  {
    field: "post_release_plans",
    index: 22,
    excel: "W",
    header: "יש לך תוכניות לאחרי השחרור? ספר.י לנו אותם בבקשה",
  },
  {
    field: "return_to_mentor",
    index: 23,
    excel: "X",
    header: "חושב.ת לחזור להדריך במכינה אחרי הצבא?",
  },
  {
    field: "studying_parallel",
    index: 24,
    excel: "Y",
    header: "האם את.ה לומד.ת במקביל?",
  },
  {
    field: "atuda_stage",
    index: 25,
    excel: "Z",
    header: "באיזה שלב את.ה",
  },
  {
    field: "atuda_institution",
    index: 26,
    excel: "AA",
    header: "מוסד אקדמי בו את.ה לומד.ת?",
  },
  {
    field: "atuda_faculty",
    index: 27,
    excel: "AB",
    header: "פקולטת לימודים (ניתן לשלב כמה)",
  },
  {
    field: "atuda_track",
    index: 28,
    excel: "AC",
    header: "מה מסלול הלימודים?",
  },
  {
    field: "atuda_year",
    index: 29,
    excel: "AD",
    header: "שנה בתואר",
  },
  {
    field: "atuda_end_year",
    index: 30,
    excel: "AE",
    header: "צפי לסיום התואר",
  },
  {
    field: "atuda_role",
    index: 31,
    excel: "AF",
    header: "מה התפקיד המיועד?",
  },
  {
    field: "atuda_mil_service_start_planned",
    index: 32,
    excel: "AG",
    header: "מתי את.ה מתחיל.ה את השירות הצבאי?",
  },
  {
    field: "atuda_mil_service_end_planned",
    index: 33,
    excel: "AH",
    header: "מתי את.ה צפוי.ה לסיים את השירות הצבאי?",
  },
  {
    field: "atuda_mil_institution",
    index: 34,
    excel: "AI",
    header: "מוסד אקדמי בו למדת?",
  },
  {
    field: "atuda_mil_faculty",
    index: 35,
    excel: "AJ",
    header: "פקולטת לימודים (ניתן לשלב כמה) 2",
  },
  {
    field: "atuda_mil_track",
    index: 36,
    excel: "AK",
    header: "מה מסלול הלימודים? 2",
  },
  {
    field: "atuda_mil_grad_year",
    index: 37,
    excel: "AL",
    header: "באיזו שנה סיימת את התואר?",
  },
  {
    field: "atuda_mil_role",
    index: 38,
    excel: "AM",
    header: "מה התפקיד שאת.ה עושה?",
  },
  {
    field: "atuda_mil_service_start",
    index: 39,
    excel: "AN",
    header: "מתי התחלת את השירות הצבאי (אחרי הלימודים)",
  },
  {
    field: "atuda_mil_service_end",
    index: 40,
    excel: "AO",
    header: "מתי את.ה צפוי.ה לסיים את השירות הצבאי? 2",
  },
  {
    field: "national_start_date",
    index: 41,
    excel: "AP",
    header: "תאריך התחלה",
  },
  {
    field: "national_end_date",
    index: 42,
    excel: "AQ",
    header: "תאריך סיום",
  },
  {
    field: "national_role_desc",
    index: 43,
    excel: "AR",
    header: "ספר.י קצת על התפקיד",
  },
  {
    field: "national_location",
    index: 44,
    excel: "AS",
    header: "איפה עיקר הפעילות שלך?",
  },
  {
    field: "national_home_frequency",
    index: 45,
    excel: "AT",
    header: "כל כמה זמן יוצאים הבייתה?",
  },
  {
    field: "service_end_date_national",
    index: 59,
    excel: "BH",
    header: "תאריך סיום שירות",
  },
  {
    field: "national_service_where",
    index: 60,
    excel: "BI",
    header: "איפה עשית שירות לאומי",
  },
  {
    field: "studying_parallel_released",
    index: 46,
    excel: "AU",
    header: "האם את.ה לומד.ת במקביל? 2",
  },
  {
    field: "student_institution",
    index: 47,
    excel: "AV",
    header: "מוסד אקדמי בו את.ה לומד.ת? ",
  },
  {
    field: "student_faculty",
    index: 48,
    excel: "AW",
    header: "פקולטת לימודים (ניתן לשלב כמה) 3",
  },
  {
    field: "academic_track_type",
    index: 49,
    excel: "AX",
    header: "לומד.ת לתואר מלא או צובר נקודות זכות?",
  },
  {
    field: "student_track",
    index: 50,
    excel: "AY",
    header: "מה מסלול הלימודים? 3",
  },
  {
    field: "student_year",
    index: 51,
    excel: "AZ",
    header: "שנה בתואר 2",
  },
  {
    field: "end_year",
    index: 52,
    excel: "BA",
    header: "צפי לסיום התואר 2",
  },
  {
    field: "improving_bagrut",
    index: 53,
    excel: "BB",
    header: "משפר.ת בגריות?",
  },
  {
    field: "bagrut_subjects",
    index: 54,
    excel: "BC",
    header: "איזה בגריות אתה משפר?",
  },
  {
    field: "studying_psychometric",
    index: 55,
    excel: "BD",
    header: "לומד.ת לפיסכומטרי?",
  },
  {
    field: "psychometric_status",
    index: 56,
    excel: "BE",
    header: "משפר פסיכומטרי או עושה בפעם הראשונה",
  },
  {
    field: "psychometric_goal",
    index: 57,
    excel: "BF",
    header: "לכבוד מה? מה את.ה מתכנן.ת ללמוד?",
  },
  {
    field: "released_improving_bagrut",
    index: 79,
    excel: "CB",
    header: "משפר.ת בגריות? 2",
  },
  {
    field: "released_bagrut_subjects",
    index: 80,
    excel: "CC",
    header: "איזה בגריות אתה משפר? 2",
  },
  {
    field: "released_psychometric",
    index: 81,
    excel: "CD",
    header: "לומד.ת לפיסכומטרי? 2",
  },
  {
    field: "released_psychometric_status",
    index: 82,
    excel: "CE",
    header: "משפר פסיכומטרי או עושה בפעם הראשונה 2",
  },
  {
    field: "released_psychometric_goal",
    index: 83,
    excel: "CF",
    header: "לכבוד מה? מה את.ה מתכנן.ת ללמוד? 2",
  },
  {
    field: "service_type",
    index: 58,
    excel: "BG",
    header: "איזה שירות עשית?",
  },
  {
    field: "military_release_date_final",
    index: 61,
    excel: "BJ",
    header: "תאריך שחרור",
  },
  {
    field: "was_keva",
    index: 62,
    excel: "BK",
    header: "היית בקבע?",
  },
  {
    field: "was_commander",
    index: 63,
    excel: "BL",
    header: "האם היית מפקד.ת?",
  },
  {
    field: "last_role",
    index: 64,
    excel: "BM",
    header: "איפה שירתת? מה היה התפקיד האחרון שלך?",
  },
  {
    field: "role_nature",
    index: 65,
    excel: "BN",
    header: "מה היה אופי התפקיד?",
  },
  {
    field: "other_nature",
    index: 66,
    excel: "BO",
    header: "אם כתבת 'אחר' זה המקום לפרט (שירות צבאי)",
  },
  {
    field: "current_activity",
    index: 67,
    excel: "BP",
    header: "מה את.ה עושה עכשיו? (הדבר העיקרי ביותר בחיים שלך כרגע)",
  },
  {
    field: "current_activity_other",
    index: 68,
    excel: "BQ",
    header: "אם ענית 'אחר' זה המקום לפרט (מה עושה בחיים)",
  },
  {
    field: "travel_continent",
    index: 69,
    excel: "BR",
    header: "באיזה יבשת את.ה מטייל.ת כרגע?",
  },
  {
    field: "travel_start",
    index: 70,
    excel: "BS",
    header: "מתי טסת?",
  },
  {
    field: "travel_return",
    index: 71,
    excel: "BT",
    header: "מתי צפי חזרה",
  },
  {
    field: "travel_description",
    index: 72,
    excel: "BU",
    header: "ספר/י בקצרה מה מעשייך בימים אלו",
  },
  {
    field: "how_can_help",
    index: 73,
    excel: "BV",
    header: "איך אנחנו יכולים לעזור?",
  },
  {
    field: "help_as_org",
    index: 89,
    excel: "CL",
    header: "איך אנחנו יכולים לעזור לך כארגון?",
  },
  {
    field: "student_institution_v2",
    index: 74,
    excel: "BW",
    header: "מוסד אקדמי בו את.ה לומד.ת? 2",
  },
  {
    field: "student_faculty_v2",
    index: 75,
    excel: "BX",
    header: "פקולטת לימודים (ניתן לשלב כמה) 4",
  },
  {
    field: "student_track_v2",
    index: 76,
    excel: "BY",
    header: "מה מסלול הלימודים? 4",
  },
  {
    field: "student_year_v2",
    index: 77,
    excel: "BZ",
    header: "שנה בתואר 3",
  },
  {
    field: "student_end_year_v2",
    index: 78,
    excel: "CA",
    header: "צפי לסיום התואר 3",
  },
  {
    field: "parallel_activity",
    index: 84,
    excel: "CG",
    header: "מה עושה במקביל?",
  },
  {
    field: "parallel_activity_detail",
    index: 85,
    excel: "CH",
    header:
      "פה המקום להרחיב לנו עוד קצת. איפה את.ה עובד.ת? איפה מטייל.ת? או כל דבר אחר",
  },
  {
    field: "work_field",
    index: 86,
    excel: "CI",
    header: "מה התחום בו את.ה עובד.ת?",
  },
  {
    field: "work_more",
    index: 87,
    excel: "CJ",
    header: "רוצה לספר לנו עוד על העבודה?",
  },
  {
    field: "return_to_work_mechina",
    index: 88,
    excel: "CK",
    header: "חושב.ת לחזור לעבוד במכינה? (תענו בכנות לא נעלבים או משהו כזה)",
  },
  {
    field: "connection_1",
    index: 94,
    excel: "CQ",
    header: "1) אני בקשר עם...",
  },
  {
    field: "connection_2",
    index: 95,
    excel: "CR",
    header: "2) אני בקשר עם...",
  },
  {
    field: "connection_3",
    index: 96,
    excel: "CS",
    header: "3) אני בקשר עם...",
  },
  {
    field: "connection_4",
    index: 97,
    excel: "CT",
    header: "4) אני בקשר עם...",
  },
  {
    field: "connection_5",
    index: 98,
    excel: "CU",
    header: "5) אני בקשר עם...",
  },
  {
    field: "connection_6",
    index: 99,
    excel: "CV",
    header: "6) אני בקשר עם...",
  },
  {
    field: "connection_7",
    index: 100,
    excel: "CW",
    header: "7) אני בקשר עם...",
  },
  {
    field: "connection_8",
    index: 101,
    excel: "CX",
    header: "8) אני בקשר עם...",
  },
  {
    field: "connection_9",
    index: 102,
    excel: "CY",
    header: "9) אני בקשר עם...",
  },
  {
    field: "connection_10",
    index: 103,
    excel: "CZ",
    header: "10) אני בקשר עם...",
  },
  {
    field: "connection_extra",
    index: 104,
    excel: "DA",
    header:
      "11) וואו אם את.ה צריך.ה עוד מקום אז הכישורים החברתיים שלך בשמיים. כל הכבוד. כתוב.י פה את מי שלא סימנת כבר",
  },
  {
    field: "final_remarks",
    index: 105,
    excel: "DB",
    header: "יש לך עוד משהו שאתה רוצה לספר לנו או לבקש?",
  },
];

export default function MappingReference() {
  const [searchTerm, setSearchTerm] = useState("");

  // איחוד שורות כפולות (Deduplication)
  const deduplicatedData = useMemo(() => {
    const grouped = {};
    RAW_MAPPING_DATA.forEach((item) => {
      const key = `${item.index}_${item.excel}`;
      if (!grouped[key]) {
        grouped[key] = {
          index: item.index,
          excel: item.excel,
          header: item.header,
          fields: [],
        };
      }
      if (!grouped[key].fields.includes(item.field)) {
        grouped[key].fields.push(item.field);
      }
    });
    return Object.values(grouped).sort((a, b) => a.index - b.index);
  }, []);

  // חיפוש בטבלה
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return deduplicatedData;
    const term = searchTerm.toLowerCase();
    return deduplicatedData.filter(
      (item) =>
        (item.header && item.header.toLowerCase().includes(term)) ||
        String(item.index).includes(term) ||
        (item.excel && item.excel.toLowerCase().includes(term)) ||
        (item.fields &&
          item.fields.some((f) => f && f.toLowerCase().includes(term))),
    );
  }, [deduplicatedData, searchTerm]);

  const handleExport = () => {
    const headers = ["אינדקס CSV", "עמודה באקסל", "שדות קוד", "כותרת"];
    const rows = deduplicatedData.map((item) => [
      item.index,
      item.excel,
      item.fields.join(", "),
      item.header,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "survey-mapping-reference.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-[#1e3a5f]" />
          <h1 className="text-2xl font-bold text-[#1e3a5f]">תיעוד מבנה הסקר</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#1e3a5f]">על תיעוד זה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-gray-600">
          <p>
            מסמך זה מכיל את המיפוי המלא והמעודכן של עמודות קובץ הסקר למערכת.
          </p>
          <p>
            כל שורה מתארת שדה במערכת, את המיקום שלו בקובץ ה-CSV (אינדקס העמודה),
            ואת התווית בעברית.
          </p>
          <p className="font-semibold text-[#1e3a5f]">
            סה"כ {deduplicatedData.length} שדות ייחודיים
          </p>
          <Button
            onClick={handleExport}
            className="bg-[#0891b2] hover:bg-[#0891b2]/90 gap-2"
          >
            <Download className="w-4 h-4" />
            ייצא לקובץ CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">
              מבנה השדות המלא
            </CardTitle>
            <div className="text-sm text-gray-500">
              {filteredData.length} מתוך {deduplicatedData.length} שדות
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="חיפוש לפי כותרת, אינדקס, עמודה או שדה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e3a5f] hover:bg-[#1e3a5f]">
                  <TableHead className="text-white font-semibold">
                    אינדקס CSV
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    עמודה באקסל
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    שדות במערכת
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    כותרת בסקר
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, idx) => (
                  <TableRow
                    key={`${item.index}_${item.excel}`}
                    className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <TableCell className="font-bold text-[#0891b2]">
                      {item.index}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-700">
                      {item.excel}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {item.fields.join(", ")}
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {item.header}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
