import { useMemo } from "react";
import {
  formatQuarterLabel,
  getQuarterKey,
  parseDate,
} from "../components/survey/ChartColors";
import {
  getName,
  getCohort,
  getStatus,
} from "../components/survey/surveyDataHelpers";

// Helper functions for reading data
const getEnlistmentDate = (row) => row.enlistment_date || "";
const getReleaseDate = (row) => row.release_date || "";
const getServiceStatus = (row) => row.service_status_check || "";
const getCommandCourse = (row) => row.command_course_status || "";
const getRoleType = (row) => row.role_type || "";
const getOtherRoleType = (row) => row.other_role_type || "";
const getCoursesDone = (row) => row.courses_done || "";

export const useSoldiersData = (surveyData, hasSurveyData, filters) => {
  const filteredSurveyData = useMemo(() => {
    if (!hasSurveyData) return [];
    if (filters.cohorts.length === 0 && filters.pronouns.length === 0)
      return surveyData;
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

  const soldierData = useMemo(() => {
    if (!hasSurveyData)
      return {
        total: 0,
        soldiersCount: 0,
        atudaCount: 0,
        totalCommanders: 0,
        cohortData: [],
        roleTypeData: [],
        serviceStatusData: [],
        otherRoleTypes: [],
        coursesDone: [],
        releaseData: [],
        enlistmentData: [],
        commandersData: [],
        tableData: [],
      };

    // Filter soldiers (Regular/Permanent) - Column H
    const soldiers = filteredSurveyData.filter((row) => {
      const status = getStatus(row);
      return status && status.includes("חייל");
    });

    // Filter Atudaim - Column H
    const atudaim = filteredSurveyData.filter((row) => {
      const status = getStatus(row);
      return status && status.includes("עתודאי");
    });

    const totalSoldiers = soldiers.length + atudaim.length;

    // Commanders count - Column Q (only from soldiers)
    let totalCommanders = 0;
    soldiers.forEach((row) => {
      const commandStatus = getCommandCourse(row);
      if (commandStatus && commandStatus.includes("כן")) {
        totalCommanders++;
      }
    });

    // Pie Chart - Cohort distribution (Column E) - Only soldiers
    const cohortCounts = {};
    const cohortRespondents = {};
    soldiers.forEach((row) => {
      const cohort = getCohort(row);
      if (cohort && cohort !== "-") {
        cohortCounts[cohort] = (cohortCounts[cohort] || 0) + 1;
        if (!cohortRespondents[cohort]) cohortRespondents[cohort] = [];
        cohortRespondents[cohort].push({ name: getName(row), cohort });
      }
    });
    const cohortData = Object.entries(cohortCounts).map(([cohort, count]) => ({
      cohort,
      count,
      respondents: cohortRespondents[cohort] || [],
    }));

    // Bar Chart - Role Type (Column R) - Soldiers + Atudaim
    const roleTypeCounts = {};
    const roleTypeRespondents = {};

    // Soldiers - Column R
    soldiers.forEach((row) => {
      const roleType = getRoleType(row);
      if (roleType && roleType.trim()) {
        const roles = roleType
          .split(/[,،]/)
          .map((r) => r.trim())
          .filter((r) => r);
        roles.forEach((role) => {
          roleTypeCounts[role] = (roleTypeCounts[role] || 0) + 1;
          if (!roleTypeRespondents[role]) roleTypeRespondents[role] = [];
          roleTypeRespondents[role].push({
            name: getName(row),
            cohort: getCohort(row),
          });
        });
      }
    });

    // Atudaim - Add as separate category
    if (atudaim.length > 0) {
      roleTypeCounts["עתודאי"] = atudaim.length;
      roleTypeRespondents["עתודאי"] = atudaim.map((row) => ({
        name: getName(row),
        cohort: getCohort(row),
      }));
    }

    const roleTypeData = Object.entries(roleTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([role, count]) => ({
        role,
        count,
        respondents: roleTypeRespondents[role] || [],
      }));

    // Pie Chart - Service Status (Column O)
    const serviceStatusCounts = {};
    const serviceStatusRespondents = {};
    soldiers.forEach((row) => {
      const serviceStatus = getServiceStatus(row);
      if (serviceStatus && serviceStatus.trim()) {
        serviceStatusCounts[serviceStatus] =
          (serviceStatusCounts[serviceStatus] || 0) + 1;
        if (!serviceStatusRespondents[serviceStatus])
          serviceStatusRespondents[serviceStatus] = [];
        serviceStatusRespondents[serviceStatus].push({
          name: getName(row),
          cohort: getCohort(row),
        });
      }
    });
    const serviceStatusData = Object.entries(serviceStatusCounts).map(
      ([status, count]) => ({
        status,
        count,
        respondents: serviceStatusRespondents[status] || [],
      }),
    );

    // List - Other Role Types (Column S)
    const otherRoleTypes = soldiers
      .map((row) => ({
        name: getName(row),
        cohort: getCohort(row),
        other: getOtherRoleType(row),
      }))
      .filter(
        (item) => item.other && item.other.trim() !== "" && item.other !== "-",
      );

    // List - Courses Done (Column U)
    const coursesDone = soldiers
      .map((row) => ({
        name: getName(row),
        cohort: getCohort(row),
        courses: getCoursesDone(row),
      }))
      .filter(
        (item) =>
          item.courses && item.courses.trim() !== "" && item.courses !== "-",
      );

    // Bar Chart - Release Dates by Half Year (Column N)
    const releaseQuarters = {};
    const releaseRespondents = {};
    soldiers.forEach((row) => {
      const dateVal = getReleaseDate(row);
      const d = parseDate(dateVal);
      if (d) {
        const quarterKey = getQuarterKey(d);
        const quarterLabel = formatQuarterLabel(d);
        if (quarterKey && quarterLabel) {
          if (!releaseQuarters[quarterKey])
            releaseQuarters[quarterKey] = { label: quarterLabel, count: 0 };
          releaseQuarters[quarterKey].count++;
          if (!releaseRespondents[quarterKey])
            releaseRespondents[quarterKey] = [];
          releaseRespondents[quarterKey].push({
            name: getName(row),
            cohort: getCohort(row),
          });
        }
      }
    });
    const releaseData = Object.entries(releaseQuarters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        period: data.label,
        count: data.count,
        respondents: releaseRespondents[key] || [],
      }));

    // Bar Chart - Enlistment Dates by Half Year (Column M)
    const enlistmentQuarters = {};
    const enlistmentRespondents = {};
    soldiers.forEach((row) => {
      const dateVal = getEnlistmentDate(row);
      const d = parseDate(dateVal);
      if (d) {
        const quarterKey = getQuarterKey(d);
        const quarterLabel = formatQuarterLabel(d);
        if (quarterKey && quarterLabel) {
          if (!enlistmentQuarters[quarterKey])
            enlistmentQuarters[quarterKey] = { label: quarterLabel, count: 0 };
          enlistmentQuarters[quarterKey].count++;
          if (!enlistmentRespondents[quarterKey])
            enlistmentRespondents[quarterKey] = [];
          enlistmentRespondents[quarterKey].push({
            name: getName(row),
            cohort: getCohort(row),
          });
        }
      }
    });
    const enlistmentData = Object.entries(enlistmentQuarters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        period: data.label,
        count: data.count,
        respondents: enlistmentRespondents[key] || [],
      }));

    // Bar Chart - Commanders by Cohort
    const commandersByCohort = {};
    const totalByCohort = {};

    soldiers.forEach((row) => {
      const cohort = getCohort(row);
      if (!cohort || cohort === "-") return;

      totalByCohort[cohort] = (totalByCohort[cohort] || 0) + 1;

      if (!commandersByCohort[cohort]) {
        commandersByCohort[cohort] = {
          cohort,
          officer: 0,
          nco: 0,
          commander: 0,
          total_commanders: 0,
          respondents: [],
        };
      }

      const commandStatus = getCommandCourse(row);
      if (commandStatus) {
        if (commandStatus.includes("קצין")) {
          commandersByCohort[cohort].officer++;
          commandersByCohort[cohort].total_commanders++;
          commandersByCohort[cohort].respondents.push({
            name: getName(row),
            type: "קצין",
          });
        } else if (commandStatus.includes("נגד")) {
          commandersByCohort[cohort].nco++;
          commandersByCohort[cohort].total_commanders++;
          commandersByCohort[cohort].respondents.push({
            name: getName(row),
            type: "נגד",
          });
        } else if (
          commandStatus.includes('מש"ק') ||
          commandStatus.includes('מ"כ')
        ) {
          commandersByCohort[cohort].commander++;
          commandersByCohort[cohort].total_commanders++;
          commandersByCohort[cohort].respondents.push({
            name: getName(row),
            type: 'מש"ק/מ"כ',
          });
        }
      }
    });

    const commandersData = Object.entries(commandersByCohort)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cohort, data]) => ({
        cohort,
        officer: data.officer,
        nco: data.nco,
        commander: data.commander,
        total_commanders: data.total_commanders,
        total: totalByCohort[cohort] || 0,
        percentage:
          totalByCohort[cohort] > 0
            ? Math.round((data.total_commanders / totalByCohort[cohort]) * 100)
            : 0,
        respondents: data.respondents,
      }));

    // Table Data
    const tableData = [...soldiers, ...atudaim].map((row) => {
      const status = getStatus(row);
      const isAtuda = status && status.includes("עתודאי");
      return {
        full_name: getName(row),
        cohort: getCohort(row),
        soldier_type: isAtuda ? "עתודאי" : "סדיר/קבע",
        enlistment_date: getEnlistmentDate(row) || "-",
        release_date: getReleaseDate(row) || "-",
        service_status: getServiceStatus(row) || "-",
        command_course: getCommandCourse(row) || "-",
        role_type: isAtuda ? "עתודאי" : getRoleType(row) || "-",
        courses_done: getCoursesDone(row) || "-",
      };
    });

    return {
      total: totalSoldiers,
      soldiersCount: soldiers.length,
      atudaCount: atudaim.length,
      totalCommanders,
      cohortData,
      roleTypeData,
      serviceStatusData,
      otherRoleTypes,
      coursesDone,
      releaseData,
      enlistmentData,
      commandersData,
      tableData,
    };
  }, [filteredSurveyData, hasSurveyData]);

  // If you also need filteredSurveyData, return it too.
  return { soldierData, filteredSurveyData };
};
