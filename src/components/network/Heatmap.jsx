import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Search, Users, X, LayoutGrid, ArrowDown } from "lucide-react";
import { useSurveyData } from "../../hooks/useSurveyData";
import { getCohortBarColors } from "../../utils/colors";

// פונקציית עזר לנרמול מחרוזות [cite: 6]
function normalizeStr(x) {
  return String(x ?? "").trim();
}

export default function HeatmapAnalysis() {
  const { graduates, surveyData } = useSurveyData();

  // --- מצב (State) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  // --- בניית אינדקס הבוגרים והצלבה עם נתוני הסקר ---
  const graduatesIndex = useMemo(() => {
    // יצירת מיפוי שם -> נתוני סקר
    const surveyDataMap = new Map();
    if (Array.isArray(surveyData)) {
      surveyData.forEach((row) => {
        const name = normalizeStr(row?.full_name || row?.["שם מלא"]);
        if (name) {
          surveyDataMap.set(name, row);
        }
      });
    }

    const pool = new Map();
    graduates.forEach((g) => {
      const name = normalizeStr(g.full_name);
      if (name) {
        const surveyRow = surveyDataMap.get(name);
        pool.set(name, {
          ...g,
          ...surveyRow, // מיזוג עם נתוני הסקר (כולל האינדקסים 94-104)
          id: name,
          name: name,
          cohort: normalizeStr(g.cohort) || "לא ידוע",
        });
      }
    });
    return Array.from(pool.values());
  }, [graduates, surveyData]);

  // --- ארגון הבוגרים לפי מחזורים לסידור הלחצנים [cite: 13] ---
  const groupedGraduates = useMemo(() => {
    const groups = {};
    graduatesIndex.forEach((grad) => {
      if (!groups[grad.cohort]) groups[grad.cohort] = [];
      groups[grad.cohort].push(grad);
    });

    Object.keys(groups).forEach((cohort) => {
      groups[cohort].sort((a, b) => a.name.localeCompare(b.name, "he"));
    });

    return Object.entries(groups).sort((a, b) =>
      a[0].localeCompare(b[0], "he"),
    );
  }, [graduatesIndex]);

  // --- לוגיקת חישוב ניקוד - ספירת תשובות קיימות ---
  const calculateScore = (g) => {
    // בדיקת אינדקס 104
    const val104 = g[104] || g["104"];
    if (val104 && String(val104).trim().length > 0) {
      return "10+";
    }

    // ספירת תשובות באינדקסים 94 עד 103
    let count = 0;
    for (let i = 94; i <= 103; i++) {
      const val = g[i] || g[String(i)];
      // אם התא אינו ריק, זה נחשב כנקודה
      if (val !== undefined && val !== null && String(val).trim().length > 0) {
        count++;
      }
    }
    return count;
  };

  // --- עיבוד נתונים למפת החום (ממוין מהגבוה לנמוך) ---
  const heatmapData = useMemo(() => {
    // ברירת מחדל: מציג הכל אם אין בחירה
    const displayList =
      selectedIds.size === 0
        ? graduatesIndex
        : graduatesIndex.filter((g) => selectedIds.has(String(g.id)));

    return displayList
      .map((g) => ({
        id: g.id,
        name: g.name,
        cohort: g.cohort,
        score: calculateScore(g), // מעבירים את כל אובייקט הבוגר
      }))
      .sort((a, b) => {
        const valA = a.score === "10+" ? 99 : Number(a.score);
        const valB = b.score === "10+" ? 99 : Number(b.score);

        if (valB !== valA) return valB - valA; // מיון יורד
        return a.name.localeCompare(b.name, "he");
      });
  }, [selectedIds, graduatesIndex]);

  // --- פעולות בחירה [cite: 14, 15] ---
  const toggleSelectId = (id) => {
    const sid = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {/* כרטיס ניהול בחירה - סידור זהה למטריצה [cite: 20, 21] */}
      <Card className="bg-slate-50 border-slate-200 overflow-visible z-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-md flex items-center gap-2 text-[#1e3a5f]">
            <Users className="w-5 h-5" />
            ניהול בחירת בוגרים (
            {selectedIds.size === 0 ? "הכל מוצג" : `${selectedIds.size} נבחרו`})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="חיפוש בוגר..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 bg-white"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-red-500 gap-1"
              >
                <X className="w-4 h-4" /> נקה בחירה
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
              <ArrowDown className="w-3 h-3" /> רשימה מלאה לפי מחזורים
            </p>
            <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
              {groupedGraduates.map(([cohort, grads]) => (
                <div key={cohort} className="space-y-3">
                  <div className="flex items-center gap-2 sticky top-0 bg-slate-50 py-1 z-10">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <Badge
                      variant="outline"
                      className="bg-white border-slate-300 text-[#1e3a5f] font-bold"
                    >
                      {cohort} ({grads.length})
                    </Badge>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
                    {grads.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 group"
                      >
                        <Checkbox
                          id={`heatmap-select-${item.id}`}
                          checked={selectedIds.has(String(item.id))}
                          onCheckedChange={() => toggleSelectId(item.id)}
                        />
                        <label
                          htmlFor={`heatmap-select-${item.id}`}
                          className={`text-[11px] cursor-pointer truncate transition-all ${
                            selectedIds.has(String(item.id))
                              ? "font-bold text-blue-700"
                              : "text-slate-600 group-hover:text-slate-900"
                          }`}
                        >
                          {item.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* תצוגת מפת החום */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white border-b">
          <CardTitle className="text-lg flex items-center gap-2 text-[#1e3a5f]">
            <LayoutGrid className="w-5 h-5 text-orange-500" />
            מפת חום - צבירת נקודות (94-104)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-slate-50/30">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {heatmapData.map((item) => {
              const score = item.score;
              const isPlus = score === "10+";
              const numScore = isPlus ? 11 : Number(score);

              const bgColor = isPlus
                ? "bg-purple-100 border-purple-300"
                : numScore >= 7
                  ? "bg-red-100 border-red-300"
                  : numScore >= 4
                    ? "bg-orange-100 border-orange-300"
                    : numScore >= 1
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-slate-200 opacity-60";

              const textColor = isPlus
                ? "text-purple-700"
                : numScore >= 7
                  ? "text-red-700"
                  : numScore >= 4
                    ? "text-orange-700"
                    : numScore >= 1
                      ? "text-blue-700"
                      : "text-slate-400";

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all shadow-sm ${bgColor}`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full mb-2"
                    style={{
                      backgroundColor: getCohortBarColors(item.cohort).main,
                    }}
                  />
                  <span className="text-[11px] font-bold text-slate-800 leading-tight min-h-[32px] flex items-center justify-center">
                    {item.name}
                  </span>
                  <div className={`text-xl font-black mt-2 ${textColor}`}>
                    {score}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
