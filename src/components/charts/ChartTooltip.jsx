import { Button } from "../ui/button";
import { ExternalLink, X } from "lucide-react";
import { createPageUrl } from "../../utils/createPageUrl";

export default function ChartTooltip({
  payload,
  label,
  onClose,
  nameKey = "name",
  valueLabel = "כמות",
  showPercentage = false,
  totalForPercentage = 0,
  filterKey = null,
}) {
  if (!payload) return null;

  const data =
    Array.isArray(payload) && payload[0] ? payload[0].payload : payload;

  if (!data) return null;

  const names = data.respondents || data.respondentsList || [];
  const count =
    Array.isArray(payload) && payload[0]?.value
      ? payload[0].value
      : data.value || data.count || 0;
  const displayName = label || data[nameKey] || data.name;

  const percentage =
    totalForPercentage > 0
      ? ((count / totalForPercentage) * 100).toFixed(1)
      : null;

  const handleNavigateToGraduates = (e) => {
    e.stopPropagation();
    const params = new URLSearchParams();

    const keyToFilter = filterKey || nameKey;

    if (displayName && keyToFilter) {
      params.set("filter_key", keyToFilter);
      params.set("filter_value", displayName);
    }

    // שמירת רשימת השמות בלוקל סטורג' במקום ב-URL כדי למנוע בעיות אורך
    if (names.length > 0) {
      const namesList = names.map((p) => p.name || p);
      localStorage.setItem(
        "chartTooltipFilterNames",
        JSON.stringify(namesList),
      );
      params.set("use_stored_names", "true");
    }

    const url = createPageUrl(`AllGraduates?${params.toString()}`);
    window.location.href = url;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#1e3a5f] rounded-lg shadow-2xl p-5 max-w-md w-full relative mx-4 flex flex-col"
        style={{ minWidth: "300px", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="סגור"
        >
          <X size={20} />
        </button>

        <p className="font-bold text-[#1e3a5f] text-xl mb-4 text-center border-b-2 border-[#0891b2] pb-2 mt-1">
          {displayName}
        </p>

        <div className="flex justify-center gap-6 mb-4 bg-gray-50 p-2 rounded shrink-0">
          <p className="text-base text-gray-800">
            <span className="font-semibold">{valueLabel}:</span>{" "}
            <span className="text-[#1e3a5f] font-bold text-lg">{count}</span>
          </p>
          {showPercentage && percentage && (
            <p className="text-base text-gray-800">
              <span className="font-semibold">אחוז:</span>{" "}
              <span className="text-[#0891b2] font-bold">{percentage}%</span>
            </p>
          )}
        </div>

        {names.length > 0 && (
          <div className="border-t-2 border-gray-200 pt-3 mt-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1 shrink-0">
              <p className="text-sm font-bold text-[#1e3a5f]">
                רשימת משיבים ({names.length}):
              </p>
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1 h-7 text-[#0891b2] border-[#0891b2] hover:bg-[#0891b2]/10"
                onClick={handleNavigateToGraduates}
              >
                <ExternalLink className="w-3 h-3" />
                צפה בכולם
              </Button>
            </div>

            <div className="overflow-y-auto bg-linear-to-b from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200 custom-scrollbar">
              <ul className="text-sm space-y-2">
                {names.map((person, idx) => (
                  <li
                    key={idx}
                    className="text-gray-800 flex justify-between items-center py-2 px-3 bg-white rounded border-r-4 border-[#0891b2] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <span className="font-medium">{person.name || person}</span>
                    {person.cohort && (
                      <span className="text-[#1e3a5f] text-xs font-medium bg-gray-100 px-2 py-0.5 rounded ml-2">
                        {person.cohort}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
