// Highly distinct color palette for better differentiation
const COHORT_COLORS = {
  "מחזור א": "#059669", // Green
  "מחזור ב": "#dc2626", // Red
  "מחזור ג": "#1e3a5f", // Dark blue
  "מחזור ד": "#7c3aed", // Purple
  "מחזור ה": "#ea580c", // Orange
  "מחזור ו": "#0891b2", // Cyan
  "נתיבי א": "#db2777", // Pink
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
  "נתיבי א": { main: "#db2777", light: "#f9a8d4" },
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

// Helper to format date to quarter label in Hebrew
export function formatQuarterLabel(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return null;

  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  let quarterLabel;
  if (month >= 1 && month <= 3) {
    quarterLabel = "ינואר-מרץ";
  } else if (month >= 4 && month <= 6) {
    quarterLabel = "אפריל-יוני";
  } else if (month >= 7 && month <= 9) {
    quarterLabel = "יולי-ספטמבר";
  } else {
    quarterLabel = "אוקטובר-דצמבר";
  }

  return `${quarterLabel}\n${year}`;
}

// Get quarter key for grouping (sortable)
export function getQuarterKey(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return null;

  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const quarter = Math.ceil(month / 3);

  return `${year}-Q${quarter}`;
}

// Parse date from various formats - improved to handle more edge cases
export function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;

  // Clean up the string - remove leading/trailing whitespace and BOM
  const str = dateStr
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/\u200B/g, "");
  if (!str) return null;

  let d = null;

  // Try DD/MM/YYYY or D/M/YYYY format
  if (str.includes("/")) {
    const parts = str.split("/").map((p) => p.trim());
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);

      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      if (
        !isNaN(day) &&
        !isNaN(month) &&
        !isNaN(year) &&
        day >= 1 &&
        day <= 31 &&
        month >= 0 &&
        month <= 11
      ) {
        d = new Date(year, month, day);
      }
    }
  }
  // Try DD.MM.YYYY or D.M.YYYY format
  else if (str.includes(".")) {
    const parts = str.split(".").map((p) => p.trim());
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);

      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      if (
        !isNaN(day) &&
        !isNaN(month) &&
        !isNaN(year) &&
        day >= 1 &&
        day <= 31 &&
        month >= 0 &&
        month <= 11
      ) {
        d = new Date(year, month, day);
      }
    }
  }
  // Try DD-MM-YYYY or YYYY-MM-DD format
  else if (str.includes("-")) {
    const parts = str.split("-").map((p) => p.trim());
    if (parts.length === 3) {
      // Check if YYYY-MM-DD (year first)
      if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (
          !isNaN(day) &&
          !isNaN(month) &&
          !isNaN(year) &&
          day >= 1 &&
          day <= 31 &&
          month >= 0 &&
          month <= 11
        ) {
          d = new Date(year, month, day);
        }
      } else {
        // DD-MM-YYYY format
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);

        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }

        if (
          !isNaN(day) &&
          !isNaN(month) &&
          !isNaN(year) &&
          day >= 1 &&
          day <= 31 &&
          month >= 0 &&
          month <= 11
        ) {
          d = new Date(year, month, day);
        }
      }
    }
  }
  // Try standard Date parsing as fallback
  else {
    d = new Date(str);
  }

  return d && !isNaN(d.getTime()) ? d : null;
}
