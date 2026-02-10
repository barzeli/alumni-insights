import { useState, useMemo } from "react";
import { useSurveyData } from "./useSurveyData";
import { STATUS_COLORS } from "../utils/colors";
import { getName, getCohort, getStatus } from "../utils/surveyDataHelpers";

export const useOverviewData = () => {
  const {
    surveyData,
    hasSurveyData,
    cohortCounts,
    totalGraduates,
    totalCohorts,
  } = useSurveyData();
  const [filters, setFilters] = useState({ cohorts: [], pronouns: [] });

  const filteredData = useMemo(() => {
    if (!hasSurveyData) return [];
    return surveyData.filter((row) => {
      const cohortVal = getCohort(row);
      const pronounVal = row.pronoun || "";
      const cohortMatch =
        filters.cohorts.length === 0 || filters.cohorts.includes(cohortVal);
      const pronounMatch =
        filters.pronouns.length === 0 || filters.pronouns.includes(pronounVal);
      return cohortMatch && pronounMatch;
    });
  }, [surveyData, hasSurveyData, filters]);

  const stats = useMemo(() => {
    if (!hasSurveyData || filteredData.length === 0)
      return {
        totalRespondents: 0,
        responseRate: "0",
        statusCounts: {
          malshab: 0,
          soldiers: 0,
          atuda: 0,
          released: 0,
          nationalService: 0,
        },
        pieData: [],
        cohortData: [],
      };

    // Count statuses
    let malshab = 0,
      soldiers = 0,
      atuda = 0,
      released = 0,
      nationalService = 0;

    filteredData.forEach((row) => {
      const status = getStatus(row);
      if (status.includes("מלש")) malshab++;
      else if (status.includes("חייל")) soldiers++;
      else if (status.includes("עתודאי")) atuda++;
      else if (status.includes("משוחרר")) released++;
      else if (status.includes("שירות לאומי")) nationalService++;
    });

    // Calculate response rate
    const filteredGraduatesCount =
      filters.cohorts.length > 0
        ? Object.entries(cohortCounts)
            .filter(([cohort]) => filters.cohorts.includes(cohort))
            .reduce((sum, [, count]) => sum + count, 0)
        : totalGraduates;

    const responseRate =
      filteredGraduatesCount > 0
        ? ((filteredData.length / filteredGraduatesCount) * 100).toFixed(1)
        : "0";

    // Pie chart data
    const getRespondentsByStatus = (statusCheck) => {
      return filteredData
        .filter((row) => statusCheck(getStatus(row)))
        .map((row) => ({
          name: getName(row),
          cohort: getCohort(row),
        }));
    };

    const pieData = [
      {
        name: 'מלש"ב',
        value: malshab,
        color: STATUS_COLORS['מלש"ב'],
        respondents: getRespondentsByStatus((s) => s.includes("מלש")),
      },
      {
        name: "חיילים בסדיר/קבע",
        value: soldiers,
        color: STATUS_COLORS["חיילים"],
        respondents: getRespondentsByStatus((s) => s.includes("חייל")),
      },
      {
        name: "עתודאים",
        value: atuda,
        color: STATUS_COLORS["עתודאים"],
        respondents: getRespondentsByStatus((s) => s.includes("עתודאי")),
      },
      {
        name: "משוחררים",
        value: released,
        color: STATUS_COLORS["משוחררים"],
        respondents: getRespondentsByStatus((s) => s.includes("משוחרר")),
      },
      {
        name: "שירות לאומי",
        value: nationalService,
        color: STATUS_COLORS["שירות לאומי"],
        respondents: getRespondentsByStatus((s) => s.includes("שירות לאומי")),
      },
    ].filter((d) => d.value > 0);

    // Cohort bar chart data
    const filteredCohortCounts =
      filters.cohorts.length > 0
        ? Object.fromEntries(
            Object.entries(cohortCounts).filter(([cohort]) =>
              filters.cohorts.includes(cohort),
            ),
          )
        : cohortCounts;

    const cohortData = Object.entries(filteredCohortCounts).map(
      ([cohort, totalValue]) => {
        const total = totalValue;
        const respondentsList = filteredData
          .filter((row) => getCohort(row) === cohort)
          .map((row) => ({ name: getName(row), cohort }));
        const respondentsCount = respondentsList.length;
        const percentage =
          total > 0 ? ((respondentsCount / total) * 100).toFixed(1) : "0";
        return {
          name: cohort,
          respondents: respondentsCount,
          total,
          percentage: parseFloat(percentage),
          respondentsList,
        };
      },
    );

    return {
      totalRespondents: filteredData.length,
      responseRate,
      statusCounts: { malshab, soldiers, atuda, released, nationalService },
      pieData,
      cohortData,
    };
  }, [filteredData, cohortCounts, totalGraduates, filters]);

  return {
    surveyData,
    hasSurveyData,
    cohortCounts,
    totalGraduates,
    totalCohorts,
    filters,
    setFilters,
    filteredData,
    stats,
  };
};
