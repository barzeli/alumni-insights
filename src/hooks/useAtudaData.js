import { useMemo } from "react";
import { useSurveyData } from "./useSurveyData";
import {
  getValue,
  getName,
  getCohort,
  getStatus,
} from "../utils/surveyDataHelpers";

export const useAtudaData = () => {
  const { surveyData, hasSurveyData } = useSurveyData();

  const atudaData = useMemo(() => {
    if (!hasSurveyData) return null;

    const atudaim = surveyData.filter((row) => {
      const status = getStatus(row);
      return status && status.includes("עתודאי");
    });

    // Stat: בלימודים (אינדקס 25 מכיל "לימודים" או "דח"ש")
    const inStudies = atudaim.filter((row) => {
      const stage = getValue(row, "atuda_stage") || "";
      return stage.includes("לימודים") || stage.includes('דח"ש');
    });

    // Stat: בשירות (אינדקס 25 מכיל "סדיר", "קבע" או "חובה")
    const inService = atudaim.filter((row) => {
      const stage = getValue(row, "atuda_stage") || "";
      return (
        stage.includes("סדיר") ||
        stage.includes("קבע") ||
        stage.includes("חובה")
      );
    });

    // גרף: התפלגות שלבים (אינדקס 25)
    const stageCounts = {};
    const stageRespondents = {};
    atudaim.forEach((row) => {
      const stage = getValue(row, "atuda_stage");
      if (stage && stage.trim()) {
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        if (!stageRespondents[stage]) stageRespondents[stage] = [];
        stageRespondents[stage].push({
          name: getName(row),
          cohort: getCohort(row),
        });
      }
    });
    const stageData = Object.entries(stageCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([stage, count]) => ({
        stage,
        count,
        respondents: stageRespondents[stage] || [],
      }));

    // גרף: התפלגות מחזורים (אינדקס 4)
    const cohortCounts = {};
    const cohortRespondents = {};
    atudaim.forEach((row) => {
      const cohort = getCohort(row);
      if (cohort && cohort !== "-") {
        cohortCounts[cohort] = (cohortCounts[cohort] || 0) + 1;
        if (!cohortRespondents[cohort]) cohortRespondents[cohort] = [];
        cohortRespondents[cohort].push({ name: getName(row), cohort: cohort });
      }
    });
    const cohortData = Object.entries(cohortCounts).map(([cohort, count]) => ({
      cohort,
      count,
      respondents: cohortRespondents[cohort] || [],
    }));

    // טבלה מאוחדת - Merged Columns (Fallback Logic)
    const tableData = atudaim.map((row) => {
      // מוסד אקדמי משולב: בדוק 26, אם ריק קח 34
      const institution =
        getValue(row, "atuda_institution") ||
        getValue(row, "atuda_mil_institution") ||
        "-";

      // פקולטה משולבת: בדוק 27, אם ריק קח 35
      const faculty =
        getValue(row, "atuda_faculty") ||
        getValue(row, "atuda_mil_faculty") ||
        "-";

      // מסלול משולב: בדוק 28, אם ריק קח 36
      const track =
        getValue(row, "atuda_track") || getValue(row, "atuda_mil_track") || "-";

      return {
        full_name: getName(row),
        cohort: getCohort(row),
        stage: getValue(row, "atuda_stage") || "-",
        institution,
        faculty,
        track,
      };
    });

    return {
      total: atudaim.length,
      inStudies: inStudies.length,
      inService: inService.length,
      stageData,
      cohortData,
      tableData,
    };
  }, [surveyData, hasSurveyData]);

  return { atudaData, hasSurveyData };
};
