import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Users, Check, X, Eye, Phone, Mail, Filter } from "lucide-react";
import DataTable from "../components/common/DataTable";
import { useGraduatesFilter } from "../hooks/useGraduatesFilter";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import SurveyResponseViewer from "../components/common/SurveyResponseViewer";
import { TableExportButton } from "../components/common/ExportButton";

// Survey field options for filtering

export default function AllGraduates() {
  const {
    cohortFilter,
    setCohortFilter,
    genderFilter,
    setGenderFilter,
    surveyFilter,
    setSurveyFilter,
    surveyFieldFilters,
    updateSurveyFieldFilter,
    filterNames,
    filteredData,
    stats,
    cohorts,
    dynamicFilterOptions,
    activeFiltersCount,
    clearFilters,
    hasSurveyData,
  } = useGraduatesFilter();

  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedGraduateName, setSelectedGraduateName] = useState("");
  const [selectedSurveyName, setSelectedSurveyName] = useState("");

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
