import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Search, Users, X, Check, Network, ArrowDown } from "lucide-react";
import { useSurveyData } from "../../hooks/useSurveyData";
import { getCohortBarColors } from "../survey/ChartColors";

// --- פונקציות עזר ללוגיקה ---
function edgeKey(a, b) {
  const x = String(a);
  const y = String(b);
  return x < y ? `${x}||${y}` : `${y}||${x}`;
}

function normalizeStr(x) {
  return String(x ?? "").trim();
}

export default function ConnectionMatrix({ data }) {
  const { graduates } = useSurveyData();
  const inputEdges = Array.isArray(data?.edges) ? data.edges : [];

  // --- מצב (State) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // סגירת חלון החיפוש בלחיצה בחוץ
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- בניית אינדקס הבוגרים המלא ---
  const graduatesIndex = useMemo(() => {
    const pool = new Map();
    graduates.forEach((g) => {
      const name = normalizeStr(g.full_name);
      if (name) {
        pool.set(name, {
          id: name,
          name: name,
          cohort: normalizeStr(g.cohort) || "לא ידוע",
        });
      }
    });
    return Array.from(pool.values());
  }, [graduates]);

  // --- ארגון הבוגרים לפי מחזורים ---
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

  // --- סינון תוצאות לחיפוש ---
  const filteredSearch = useMemo(() => {
    const q = normalizeStr(searchTerm).toLowerCase();
    if (!q) return [];
    return graduatesIndex
      .filter((g) => g.name.toLowerCase().includes(q))
      .slice(0, 30);
  }, [searchTerm, graduatesIndex]);

  // --- פעולות בחירה ---
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

  // --- לוגיקת המטריצה (Default + Discovery) ---
  const { matrixColumns, matrixRows, adjacency } = useMemo(() => {
    // זיהוי כל מי שענה על הסקר (מופיע כ-source בקצוות)
    const sources = new Set();
    inputEdges.forEach((e) => {
      if (e.source) sources.add(String(e.source));
    });

    let columns, rows;
    const adj = new Set();

    if (selectedIds.size === 0) {
      // ברירת מחדל: הצגת המטריצה המלאה
      // טורים: כל מי שענה על הסקר
      columns = graduatesIndex.filter((p) => sources.has(String(p.id)));
      // שורות: כל הבוגרים
      rows = [...graduatesIndex].sort((a, b) =>
        a.name.localeCompare(b.name, "he"),
      );

      // כל הקשרים הקיימים
      inputEdges.forEach((e) => adj.add(edgeKey(e.source, e.target)));
    } else {
      // מצב סינון: לפי בחירה
      columns = graduatesIndex.filter(
        (p) => selectedIds.has(String(p.id)) && sources.has(String(p.id)),
      );

      const colIds = new Set(columns.map((c) => String(c.id)));
      const rowIds = new Set(selectedIds);

      // Discovery: הוספת כל מי שקשור לנבחרים
      inputEdges.forEach((e) => {
        const s = String(e.source);
        const t = String(e.target);
        if (colIds.has(s)) rowIds.add(t);
        if (colIds.has(t)) rowIds.add(s);
      });

      rows = graduatesIndex
        .filter((p) => rowIds.has(String(p.id)))
        .sort((a, b) => a.name.localeCompare(b.name, "he"));

      inputEdges.forEach((e) => {
        const s = String(e.source);
        const t = String(e.target);
        if (colIds.has(s) || colIds.has(t)) adj.add(edgeKey(s, t));
      });
    }

    return { matrixColumns: columns, matrixRows: rows, adjacency: adj };
  }, [selectedIds, inputEdges, graduatesIndex]);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-50 border-slate-200 overflow-visible z-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-md flex items-center gap-2 text-[#1e3a5f]">
            <Users className="w-5 h-5" />
            ניהול בחירת בוגרים ({selectedIds.size} נבחרו)
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="relative" ref={searchRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="חיפוש בוגר לסינון המטריצה..."
                  value={searchTerm}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  className="pr-10 bg-white"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-red-500 gap-1"
              >
                <X className="w-4 h-4" /> נקה סינון
              </Button>
            </div>

            {isSearchOpen && searchTerm.trim() && (
              <div className="absolute top-full right-0 left-0 mt-1 bg-white border rounded-md shadow-xl z-[100] max-h-[300px] overflow-y-auto">
                {filteredSearch.length ? (
                  filteredSearch.map((g) => (
                    <button
                      key={g.id}
                      className="w-full text-right px-4 py-3 hover:bg-blue-50 flex justify-between items-center border-b last:border-0"
                      onClick={() => toggleSelectId(g.id)}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                          {g.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {g.cohort}
                        </span>
                      </div>
                      {selectedIds.has(String(g.id)) ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                          <Check className="w-3 h-3 ml-1" /> נבחר
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-slate-300">
                          לחץ לבחירה
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400">
                    לא נמצאו תוצאות
                  </div>
                )}
              </div>
            )}
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
                          id={`matrix-select-${item.id}`}
                          checked={selectedIds.has(String(item.id))}
                          onCheckedChange={() => toggleSelectId(item.id)}
                        />
                        <label
                          htmlFor={`matrix-select-${item.id}`}
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

      <Card className="overflow-hidden">
        <CardHeader className="bg-white border-b">
          <CardTitle className="text-lg flex items-center gap-2 text-[#1e3a5f]">
            <Network className="w-5 h-5 text-cyan-600" />
            מטריצת קשרים חברתית {selectedIds.size === 0 ? "(מלאה)" : "(מסוננת)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {matrixColumns.length === 0 ? (
            <div className="p-16 text-center text-orange-500 bg-orange-50">
              לא נמצאו משיבים התואמים את הסינון.
            </div>
          ) : (
            <div className="overflow-auto max-h-[700px]">
              <table className="border-collapse text-[10px] w-full">
                <thead className="sticky top-0 z-30 shadow-sm">
                  <tr className="bg-slate-100">
                    <th className="sticky right-0 z-40 bg-slate-100 p-3 border text-right min-w-[200px] font-bold">
                      רשת קשרים (שורות)
                    </th>
                    {matrixColumns.map((col, i) => (
                      <th
                        key={col.id}
                        className="p-2 border min-w-[45px] text-center align-bottom bg-slate-50"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] text-slate-400 mb-1">
                            {i + 1}
                          </span>
                          <span className="font-bold whitespace-nowrap rotate-180 [writing-mode:vertical-lr] min-h-[160px] py-4 text-[#1e3a5f]">
                            {col.name}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row) => {
                    const isSelected = selectedIds.has(String(row.id));
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-blue-50/50 transition-colors ${isSelected ? "bg-blue-50/20" : ""}`}
                      >
                        <td
                          className={`sticky right-0 z-20 p-2 border text-right whitespace-nowrap bg-white shadow-sm ${
                            isSelected
                              ? "font-bold text-[#1e3a5f]"
                              : "text-slate-500 italic"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor: getCohortBarColors(row.cohort)
                                  .main,
                              }}
                            />
                            <span className="truncate max-w-[150px]">
                              {row.name}
                            </span>
                            {isSelected && (
                              <Check className="w-3 h-3 text-blue-500" />
                            )}
                          </div>
                        </td>
                        {matrixColumns.map((col) => {
                          const hasLink = adjacency.has(
                            edgeKey(row.id, col.id),
                          );
                          const isSelf = row.id === col.id;
                          return (
                            <td
                              key={`${row.id}-${col.id}`}
                              className={`p-2 border text-center ${isSelf ? "bg-slate-100" : ""}`}
                            >
                              {hasLink && !isSelf ? (
                                <div className="w-2.5 h-2.5 bg-[#0891b2] rounded-full mx-auto shadow-sm ring-2 ring-cyan-100" />
                              ) : isSelf ? (
                                <span className="text-slate-200">/</span>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
