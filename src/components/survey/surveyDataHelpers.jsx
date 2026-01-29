// פונקציות עזר פשוטות לגישה לנתוני סקר
// הנתונים נשמרים עם שמות העמודות המקוריים מה-CSV
// עמודות מרכזיות: B=שם מלא, E=מחזור, H=סטטוס צבאי

// פונקציה גנרית לקריאת ערך
export function getValue(row, key) {
  if (!row || !key) return null;
  if (row[key] !== undefined) return row[key];
  return null;
}

// עמודה B - שם מלא
export function getName(row) {
  if (!row) return "לא ידוע";
  return row["שם מלא"] || row.full_name || "לא ידוע";
}

// עמודה E - איזה מחזור ושלוחה היית?
export function getCohort(row) {
  if (!row) return "-";
  return row["איזה מחזור ושלוחה היית?"] || row.cohort || row["מחזור"] || "-";
}

// עמודה H - מה מצבי מול צה"ל / שירות לאומי
export function getStatus(row) {
  if (!row) return "";
  return row['מה מצבי מול צה"ל / שירות לאומי'] || row.military_status || "";
}

// --- פונקציות בדיקת סטטוס (עמודה H) ---
export function isReleased(row) {
  const status = getStatus(row);
  return status.includes("משוחרר");
}
