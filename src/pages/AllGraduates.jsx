import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Users, Check, X, Eye, Phone, Mail, Filter } from "lucide-react";
import DataTable from "../components/survey/DataTable";
import { useSurveyData } from "../hooks/useSurveyData";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import SurveyResponseViewer from "../components/survey/SurveyResponseViewer";
import { TableExportButton } from "../components/export/ExportButton";

// Survey field options for filtering
const SURVEY_FILTER_OPTIONS = {
  military_status: {
    label: "שלב בחיים",
    options: [
      'מלש"ב',
      "חייל.ת בסדיר / קבע",
      "עתודאי.ת",
      "שירות לאומי",
      "משוחרר.ת משירות צבאי או לאומי",
    ],
  },
  cohort: {
    label: "מחזור",
    options: [], // Will be populated dynamically
  },
  role_type: {
    label: "אופי תפקיד",
    options: [],
  },
  service_type: {
    label: "סוג שירות",
    options: [],
  },
  current_activity: {
    label: "פעילות נוכחית",
    options: [],
  },
  student_institution: {
    label: "מוסד לימודים",
    options: [],
  },
  student_faculty: {
    label: "פקולטה",
    options: [],
  },
  atuda_institution: {
    label: "מוסד אקדמי (עתודה)",
    options: [],
  },
  travel_continent: {
    label: "יבשת טיול",
    options: [],
  },
  work_field: {
    label: "תחום עבודה",
    options: [],
  },
};
export default function AllGraduates() {
  const { surveyData, hasSurveyData, graduates } = useSurveyData();
  const [cohortFilter, setCohortFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [surveyFilter, setSurveyFilter] = useState("all");
  const [surveyFieldFilters, setSurveyFieldFilters] = useState({});
  const [filterNames, setFilterNames] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedGraduateName, setSelectedGraduateName] = useState("");
  const [selectedSurveyName, setSelectedSurveyName] = useState("");

  // Parse URL params for filters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filterKey = urlParams.get("filter_key");
    const filterValue = urlParams.get("filter_value");
    const useStoredNames = urlParams.get("use_stored_names");

    if (useStoredNames === "true") {
      const storedNames = localStorage.getItem("chartTooltipFilterNames");
      if (storedNames) {
        try {
          const names = JSON.parse(storedNames);
          setFilterNames(names);
          localStorage.removeItem("chartTooltipFilterNames");
        } catch (e) {
          console.error("Error parsing stored names:", e);
        }
      }
    }

    const fromTable = urlParams.get("fromTable");
    if (fromTable === "true") {
      const storedNames = localStorage.getItem("tableFilterNames");
      if (storedNames) {
        try {
          const names = JSON.parse(storedNames);
          setFilterNames(names);
          localStorage.removeItem("tableFilterNames");
        } catch (e) {
          console.error("Error parsing table names:", e);
        }
      }
    }

    if (filterKey && filterValue) {
      setSurveyFieldFilters((prev) => ({
        ...prev,
        [filterKey]: filterValue,
      }));
    }
  }, []);

  // Build dynamic filter options from survey data
  const dynamicFilterOptions = useMemo(() => {
    if (!hasSurveyData) return SURVEY_FILTER_OPTIONS;

    const options = { ...SURVEY_FILTER_OPTIONS };

    Object.keys(options).forEach((key) => {
      const uniqueValues = new Set();
      surveyData.forEach((row) => {
        const value = row[key];
        if (value) {
          const values = value.split(",").map((v) => v.trim());
          values.forEach((v) => {
            if (v) uniqueValues.add(v);
          });
        }
      });
      if (uniqueValues.size > 0) {
        options[key].options = [...uniqueValues].sort();
      }
    });

    const cohortSet = new Set(graduates.map((g) => g.cohort).filter(Boolean));
    options.cohort.options = [...cohortSet].sort();

    return options;
  }, [surveyData, hasSurveyData, graduates]);

  const surveyRespondentsMap = useMemo(() => {
    if (!hasSurveyData) return new Map();
    const map = new Map();
    surveyData.forEach((row) => {
      const name = row.full_name || row.full_name_manual || "";
      map.set(name.trim().toLowerCase(), row);
    });
    return map;
  }, [surveyData, hasSurveyData]);

  const graduatesWithStatus = useMemo(() => {
    return graduates.map((grad) => {
      const fullName = grad.full_name.trim().toLowerCase();
      const surveyResponse = surveyRespondentsMap.get(fullName);

      return {
        ...grad,
        answered_survey: !!surveyResponse,
        survey_response: surveyResponse || null,
      };
    });
  }, [surveyRespondentsMap, graduates]);

  const cohorts = useMemo(() => {
    return [...new Set(graduates.map((g) => g.cohort))].sort();
  }, [graduates]);

  const filteredData = useMemo(() => {
    if (filterNames.length > 0) {
      return graduatesWithStatus.filter((grad) => {
        const gradName = grad.full_name.trim();
        return filterNames.some(
          (name) =>
            name.toLowerCase() === gradName.toLowerCase() ||
            gradName.includes(name) ||
            name.includes(gradName),
        );
      });
    }

    return graduatesWithStatus.filter((grad) => {
      const cohortMatch =
        cohortFilter === "all" || grad.cohort === cohortFilter;
      const genderMatch =
        genderFilter === "all" || grad.gender === genderFilter;
      const surveyMatch =
        surveyFilter === "all" ||
        (surveyFilter === "yes" && grad.answered_survey) ||
        (surveyFilter === "no" && !grad.answered_survey);

      let surveyFieldMatch = true;
      Object.entries(surveyFieldFilters).forEach(([key, value]) => {
        if (value && value !== "all" && grad.survey_response) {
          const fieldValue = grad.survey_response[key] || "";
          if (!fieldValue.includes(value)) surveyFieldMatch = false;
        } else if (value && value !== "all" && !grad.survey_response) {
          surveyFieldMatch = false;
        }
      });

      return cohortMatch && genderMatch && surveyMatch && surveyFieldMatch;
    });
  }, [
    graduatesWithStatus,
    cohortFilter,
    genderFilter,
    surveyFilter,
    surveyFieldFilters,
    filterNames,
  ]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const answered = filteredData.filter((g) => g.answered_survey).length;
    return { total, answered, notAnswered: total - answered };
  }, [filteredData]);

  const openSurveyResponse = (grad, surveyName = "סקר נוכחי") => {
    if (grad.survey_response) {
      setSelectedResponse(grad.survey_response);
      setSelectedGraduateName(grad.full_name);
      setSelectedSurveyName(surveyName);
    }
  };

  const tableColumns = useMemo(
    () => [
      { key: "first_name", label: "שם פרטי" },
      { key: "last_name", label: "שם משפחה" },
      { key: "gender", label: "מין" },
      { key: "cohort", label: "מחזור", render: (val) => val || "-" },
      {
        key: "phone",
        label: "טלפון",
        render: (val) =>
          val ? (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-gray-400" />
              {val}
            </span>
          ) : (
            "-"
          ),
      },
      {
        key: "email",
        label: "מייל",
        render: (val) =>
          val ? (
            <a
              href={`mailto:${val}`}
              className="flex items-center gap-1 text-[#0891b2] hover:underline"
            >
              <Mail className="w-3 h-3" />
              {val}
            </a>
          ) : (
            "-"
          ),
      },
      {
        key: "answered_survey",
        label: "ענה על הסקר",
        render: (val) =>
          val ? (
            <span className="flex items-center gap-1 text-green-600">
              <Check className="w-4 h-4" /> כן
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-500">
              <X className="w-4 h-4" /> לא
            </span>
          ),
      },
      {
        key: "survey_response",
        label: "תשובות",
        render: (val, row) =>
          row.answered_survey ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openSurveyResponse(row);
              }}
              className="gap-1 text-[#0891b2] border-[#0891b2] hover:bg-[#0891b2]/10"
            >
              <Eye className="w-4 h-4" /> צפה
            </Button>
          ) : (
            "-"
          ),
      },
    ],
    [],
  );

  const clearFilters = () => {
    setCohortFilter("all");
    setGenderFilter("all");
    setSurveyFilter("all");
    setSurveyFieldFilters({});
    setFilterNames([]);
    // Clear URL params
    window.history.replaceState({}, "", window.location.pathname);
  };

  const updateSurveyFieldFilter = (key, value) => {
    setSurveyFieldFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const activeFiltersCount =
    Object.values(surveyFieldFilters).filter((v) => v && v !== "all").length +
    (cohortFilter !== "all" ? 1 : 0) +
    (genderFilter !== "all" ? 1 : 0) +
    (surveyFilter !== "all" ? 1 : 0) +
    (filterNames.length > 0 ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">כל הבוגרים</h1>
        <div className="flex items-center gap-2 bg-[#1e3a5f]/10 px-4 py-2 rounded-lg">
          <Users className="w-5 h-5 text-[#1e3a5f]" />
          <span className="font-bold text-[#1e3a5f]">{stats.total}</span>
          <span className="text-gray-600">בוגרים</span>
          <span className="text-gray-400 mx-2">|</span>
          <span className="text-green-600">{stats.answered} ענו</span>
          <span className="text-gray-400 mx-1">•</span>
          <span className="text-red-500">{stats.notAnswered} לא ענו</span>
        </div>
      </div>

      {/* Active filters indicator */}
      {(activeFiltersCount > 0 || filterNames.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-[#0891b2]" />
          <span className="text-sm text-gray-600">סינון פעיל:</span>
          {filterNames.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {filterNames.length} שמות ספציפיים
            </Badge>
          )}
          {Object.entries(surveyFieldFilters).map(([key, value]) => {
            if (!value || value === "all") return null;
            const label = dynamicFilterOptions[key]?.label || key;
            return (
              <Badge key={key} variant="secondary" className="text-xs">
                {label}: {value}
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-red-500 h-6 text-xs"
          >
            נקה הכל
          </Button>
        </div>
      )}

      {/* Basic Filters */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm text-gray-600 block mb-1">מחזור</label>
              <Select value={cohortFilter} onValueChange={setCohortFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="כל המחזורים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המחזורים</SelectItem>
                  {cohorts.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-sm text-gray-600 block mb-1">מין</label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="הכל" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="זכר">זכר</SelectItem>
                  <SelectItem value="נקבה">נקבה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-sm text-gray-600 block mb-1">
                מילוי סקר
              </label>
              <Select value={surveyFilter} onValueChange={setSurveyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="הכל" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="yes">ענו על הסקר</SelectItem>
                  <SelectItem value="no">לא ענו על הסקר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={clearFilters}>
              נקה סינון
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Survey Field Filters */}
      {hasSurveyData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#1e3a5f] flex items-center gap-2">
              <Filter className="w-4 h-4" />
              סינון לפי נתוני הסקר
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Object.entries(dynamicFilterOptions).map(([key, config]) => {
                if (config.options.length === 0) return null;
                return (
                  <div key={key} className="min-w-0">
                    <label className="text-xs text-gray-600 block mb-1 truncate">
                      {config.label}
                    </label>
                    <Select
                      value={surveyFieldFilters[key] || "all"}
                      onValueChange={(v) => updateSurveyFieldFilter(key, v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="הכל" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">הכל</SelectItem>
                        {config.options.slice(0, 20).map((opt) => (
                          <SelectItem key={opt} value={opt} className="text-xs">
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#1e3a5f]">רשימת בוגרים</CardTitle>
          <TableExportButton
            data={filteredData}
            columns={[
              { key: "first_name", label: "שם פרטי" },
              { key: "last_name", label: "שם משפחה" },
              { key: "full_name", label: "שם מלא" },
              { key: "gender", label: "מין" },
              { key: "cohort", label: "מחזור" },
              { key: "phone", label: "טלפון" },
              { key: "email", label: "מייל" },
              { key: "city", label: "מקום מגורים" },
            ]}
            filename="רשימת_בוגרים"
          />
        </CardHeader>
        <CardContent>
          <DataTable data={filteredData} columns={tableColumns} pageSize={25} />
        </CardContent>
      </Card>

      {selectedResponse && (
        <SurveyResponseViewer
          response={selectedResponse}
          graduateName={selectedGraduateName}
          surveyName={selectedSurveyName}
          onClose={() => {
            setSelectedResponse(null);
            setSelectedGraduateName("");
            setSelectedSurveyName("");
          }}
        />
      )}
    </div>
  );
}
