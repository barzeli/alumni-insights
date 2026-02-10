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
