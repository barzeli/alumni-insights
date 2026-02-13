import { useState, useEffect, useMemo } from "react";
import { useSurveyData } from "./useSurveyData";

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

export const useGraduatesFilter = () => {
  const { surveyData, hasSurveyData, graduates } = useSurveyData();
  const [cohortFilter, setCohortFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [surveyFilter, setSurveyFilter] = useState("all");
  const [surveyFieldFilters, setSurveyFieldFilters] = useState({});
  const [filterNames, setFilterNames] = useState([]);

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

  return {
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
  };
};
