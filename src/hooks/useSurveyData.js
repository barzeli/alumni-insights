import { useState, useEffect } from "react";

import { DEFAULT_COLUMN_MAPPING } from "../utils/defaultColumnMapping";
import { fetchGoogleSheetAsCSV } from "../utils/googleDrive";

export function parseGraduatesCSV(text) {
  const lines = text.split("\n");
  const graduates = [];

  if (lines.length < 2) return [];

  // Fixed column indices (8 columns):
  // 0: First Name
  // 1: Last Name
  // 2: Full Name
  // 3: Gender
  // 4: Phone
  // 5: Email
  // 6: City
  // 7: Cohort

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const fullName = values[2] || "";
    const cohort = values[7] || "";

    if (fullName && cohort) {
      graduates.push({
        first_name: values[0] || "",
        last_name: values[1] || "",
        full_name: fullName,
        gender: values[3] || "",
        phone: values[4] || "",
        email: values[5] || "",
        city: values[6] || "",
        cohort: cohort,
      });
    }
  }

  return graduates;
}

/**
 * פענוח CSV מרכזי - מקור האמת היחיד למערכת
 * מטפל נכון בגרשיים, תווים מיוחדים, ושורות עם אנטר בתוך תאים
 * @param {string} text - תוכן קובץ CSV
 * @param {object} columnMapping - מיפוי אינדקסים לשמות שדות (אופציונלי)
 * @returns {Array} מערך של אובייקטים עם הנתונים הממופים
 */
export function parseSurveyCSV(text, columnMapping = DEFAULT_COLUMN_MAPPING) {
  const result = [];
  let currentRow = [];
  let currentCell = "";
  let insideQuotes = false;
  let rowNumber = 0;

  console.log("[CSV Parser] Starting to parse CSV file...");

  // Parse character by character to handle line breaks inside quoted fields
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote (two consecutive quotes inside a quoted field)
        currentCell += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      // End of cell
      currentRow.push(currentCell);
      currentCell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      // End of row (but not if we're inside quotes)
      if (char === "\r" && nextChar === "\n") {
        i++; // Skip \n in \r\n
      }

      // Add last cell
      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
      }

      // Process row if not empty
      if (currentRow.length > 0 && currentRow.some((cell) => cell)) {
        if (rowNumber === 0) {
          // Skip header row
          console.log(
            `[CSV Parser] Header row detected with ${currentRow.length} columns`,
          );
        } else {
          // Map data row
          const row = {};
          let hasTimestamp = false;

          currentRow.forEach((value, index) => {
            const key = columnMapping[index];
            if (key) {
              // Clean value: remove surrounding quotes and whitespace
              const cleanValue = value.replace(/^["']|["']$/g, "").trim();

              // Only set the value if:
              // 1. The new value is not empty
              // 2. OR the existing value for this key is currently empty/undefined
              // This prevents an empty column from overriding a previously filled column with the same key
              if (cleanValue || !row[key]) {
                row[key] = cleanValue;
              }

              if (key === "timestamp" && cleanValue) {
                hasTimestamp = true;
              }
            }
          });

          // Validate row has timestamp (column 0)
          if (hasTimestamp) {
            result.push(row);
          } else {
            console.warn(
              `[CSV Parser] Row ${rowNumber} skipped - missing or empty timestamp. First 5 cells:`,
              currentRow.slice(0, 5),
            );
          }
        }

        currentRow = [];
        currentCell = "";
        rowNumber++;
      }
    } else {
      // Regular character
      currentCell += char;
    }
  }

  // Handle last row if file doesn't end with newline
  if (currentRow.length > 0 || currentCell) {
    currentRow.push(currentCell);
    if (rowNumber > 0 && currentRow.some((cell) => cell)) {
      const row = {};
      let hasTimestamp = false;

      currentRow.forEach((value, index) => {
        const key = columnMapping[index];
        if (key) {
          const cleanValue = value.replace(/^["']|["']$/g, "").trim();

          // Only set the value if:
          // 1. The new value is not empty
          // 2. OR the existing value for this key is currently empty/undefined
          if (cleanValue || !row[key]) {
            row[key] = cleanValue;
          }

          if (key === "timestamp" && cleanValue) {
            hasTimestamp = true;
          }
        }
      });

      if (hasTimestamp) {
        result.push(row);
      } else {
        console.warn(
          `[CSV Parser] Last row (${rowNumber}) skipped - missing timestamp`,
        );
      }
    }
  }

  console.log(
    `[CSV Parser] ✓ Successfully parsed ${result.length} valid data rows from ${rowNumber} total rows (including header)`,
  );

  if (result.length < rowNumber - 1) {
    console.warn(
      `[CSV Parser] ⚠️ Warning: ${
        rowNumber - 1 - result.length
      } row(s) were skipped due to missing timestamps`,
    );
  }

  return result;
}

// פונקציות עזר לבוגרים
function getGraduatesData() {
  return JSON.parse(localStorage.getItem("graduatesData") || "[]");
}

function calculateTotalCohorts() {
  const uniqueOfakimCohorts = new Set(
    getGraduatesData()
      .map((g) => g.cohort)
      .filter((cohort) => cohort && cohort.includes("אופקים למדע")),
  );
  return uniqueOfakimCohorts.size;
}

function calculateCohortCounts() {
  const counts = {};
  getGraduatesData().forEach((g) => {
    if (g.cohort) {
      counts[g.cohort] = (counts[g.cohort] || 0) + 1;
    }
  });
  return counts;
}

// Hook ראשי לנתוני סקר
export function useSurveyData() {
  const [surveyData, setSurveyData] = useState([]);
  const [graduatesData, setGraduatesData] = useState(getGraduatesData());

  useEffect(() => {
    // טעינה ראשונית ממה שיש בזיכרון בלבד - ללא סנכרון אוטומטי
    const stored = localStorage.getItem("surveyData");
    if (stored) {
      setSurveyData(JSON.parse(stored));
    }

    const handleSurveyChange = () => {
      const stored = localStorage.getItem("surveyData");
      if (stored) setSurveyData(JSON.parse(stored));
    };

    const handleGraduatesChange = () => {
      setGraduatesData(getGraduatesData());
    };

    window.addEventListener("surveyDataUpdated", handleSurveyChange);
    window.addEventListener("graduatesDataUpdated", handleGraduatesChange);

    return () => {
      window.removeEventListener("surveyDataUpdated", handleSurveyChange);
      window.removeEventListener("graduatesDataUpdated", handleGraduatesChange);
    };
  }, []);

  const cohortCounts = calculateCohortCounts();
  const totalGraduates = graduatesData.length;
  const totalCohorts = calculateTotalCohorts();

  return {
    surveyData,
    graduates: graduatesData,
    cohortCounts,
    totalGraduates,
    totalCohorts,
    hasSurveyData: surveyData.length > 0,
  };
}

export function loadGraduatesFile(data) {
  localStorage.setItem("graduatesData", JSON.stringify(data));
  window.dispatchEvent(new Event("graduatesDataUpdated"));
}

/**
 * סנכרון אוטומטי מ-Google Drive
 */
export async function syncWithGoogleDrive(config, accessToken) {
  const { surveySheetId, graduatesSheetId } = config;
  const results = { survey: null, graduates: null, errors: [] };

  console.log("[Sync] Starting Google Drive sync...");

  // Set loading status
  const initialStatus = {
    status: "loading",
    lastSync: localStorage.getItem("googleSheetsSyncStatus")
      ? JSON.parse(localStorage.getItem("googleSheetsSyncStatus")).lastSync
      : null,
    recordCount: localStorage.getItem("googleSheetsSyncStatus")
      ? JSON.parse(localStorage.getItem("googleSheetsSyncStatus")).recordCount
      : 0,
  };
  localStorage.setItem("googleSheetsSyncStatus", JSON.stringify(initialStatus));
  window.dispatchEvent(new Event("syncStatusUpdated"));

  // 1. Sync Graduates if ID exists
  if (graduatesSheetId) {
    try {
      console.log("[Sync] Fetching graduates sheet...");
      const text = await fetchGoogleSheetAsCSV(graduatesSheetId, accessToken);
      const graduates = parseGraduatesCSV(text);
      if (graduates.length > 0) {
        loadGraduatesFile(graduates);
        results.graduates = graduates.length;
        console.log(`[Sync] Successfully synced ${graduates.length} graduates`);
      } else {
        results.errors.push("לא נמצאו בוגרים בקובץ הבוגרים ב-Google Drive");
      }
    } catch (err) {
      console.error("[Sync] Graduates sync error:", err);
      results.errors.push(`שגיאה בסנכרון בוגרים: ${err.message}`);
    }
  }

  // 2. Sync Survey if ID exists
  if (surveySheetId) {
    try {
      console.log("[Sync] Fetching survey sheet...");
      const text = await fetchGoogleSheetAsCSV(surveySheetId, accessToken);
      const surveyData = parseSurveyCSV(text);
      if (surveyData.length > 0) {
        localStorage.setItem("surveyData", JSON.stringify(surveyData));
        window.dispatchEvent(new Event("surveyDataUpdated"));
        results.survey = surveyData.length;
        console.log(
          `[Sync] Successfully synced ${surveyData.length} survey responses`,
        );
      } else {
        results.errors.push("לא נמצאו תשובות בקובץ הסקר ב-Google Drive");
      }
    } catch (err) {
      console.error("[Sync] Survey sync error:", err);
      results.errors.push(`שגיאה בסנכרון סקר: ${err.message}`);
    }
  }

  // Update sync status indicator
  const status = {
    status:
      results.errors.length > 0
        ? results.survey || results.graduates
          ? "success"
          : "error"
        : "success",
    lastSync: new Date().toISOString(),
    recordCount: results.survey || 0,
    errors: results.errors,
  };
  localStorage.setItem("googleSheetsSyncStatus", JSON.stringify(status));
  window.dispatchEvent(new Event("syncStatusUpdated"));

  return results;
}
