// Highly distinct color palette for better differentiation
const COHORT_COLORS = {
  "מחזור א": "#059669", // Green
  "מחזור ב": "#dc2626", // Red
  "מחזור ג": "#1e3a5f", // Dark blue
  "מחזור ד": "#7c3aed", // Purple
  "מחזור ה": "#ea580c", // Orange
  "מחזור ו": "#0891b2", // Cyan
  "נתיבי מחזור א": "#db2777", // Pink
};

// Very distinct colors for better visual separation
const DISTINCT_COLORS = [
  "#059669", // Green
  "#dc2626", // Red
  "#1e3a5f", // Dark blue
  "#7c3aed", // Purple
  "#ea580c", // Orange
  "#0891b2", // Cyan
  "#db2777", // Pink
  "#eab308", // Yellow
  "#14b8a6", // Teal
  "#6366f1", // Indigo
  "#f97316", // Light orange
  "#84cc16", // Lime
];

// צבעים לפי סטטוס
export const STATUS_COLORS = {
  'מלש"ב': "#f59e0b", // Amber
  חיילים: "#3b82f6", // Blue
  עתודאים: "#8b5cf6", // Purple
  משוחררים: "#10b981", // Emerald
  "שירות לאומי": "#ec4899", // Pink
};

// Pie chart colors - very distinct with maximum contrast
export const PIE_COLORS = [
  "#059669", // Green
  "#dc2626", // Red
  "#1e3a5f", // Dark blue
  "#7c3aed", // Purple
  "#ea580c", // Orange
  "#0891b2", // Cyan
  "#db2777", // Pink
  "#eab308", // Yellow
  "#14b8a6", // Teal
  "#6366f1", // Indigo
];

// Cohort-specific bar chart colors (consistent across charts) - main is dark, light is lighter
const COHORT_BAR_COLORS = {
  "מחזור א": { main: "#059669", light: "#6ee7b7" },
  "מחזור ב": { main: "#dc2626", light: "#fca5a5" },
  "מחזור ג": { main: "#1e3a5f", light: "#60a5fa" },
  "מחזור ד": { main: "#7c3aed", light: "#c4b5fd" },
  "מחזור ה": { main: "#ea580c", light: "#fdba74" },
  "מחזור ו": { main: "#0891b2", light: "#67e8f9" },
  "נתיבי מחזור א": { main: "#db2777", light: "#f9a8d4" },
};

export function getCohortColor(cohortName) {
  const shortName = cohortName
    ?.replace("אופקים למדע ", "")
    .replace("נתיבי מדע ", "נתיבי ");
  return COHORT_COLORS[shortName] || DISTINCT_COLORS[0];
}

export function getCohortBarColors(cohortName) {
  const shortName = cohortName
    ?.replace("אופקים למדע ", "")
    .replace("נתיבי מדע ", "נתיבי ");
  return (
    COHORT_BAR_COLORS[shortName] || {
      main: DISTINCT_COLORS[0],
      light: DISTINCT_COLORS[1],
    }
  );
}
