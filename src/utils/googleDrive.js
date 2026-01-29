/**
 * Utility functions for interacting with Google Drive and Sheets API
 */

/**
 * Fetches CSV data from a Google Sheet given its ID and an access token
 * @param {string} spreadsheetId - The ID of the Google Sheet
 * @param {string} accessToken - Google OAuth2 access token
 * @returns {Promise<string>} The CSV content of the first sheet
 */
export async function fetchGoogleSheetAsCSV(spreadsheetId, accessToken) {
  if (!spreadsheetId || !accessToken) {
    throw new Error("Spreadsheet ID and Access Token are required");
  }

  // We can use the export endpoint for Google Sheets
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 403 || response.status === 401) {
      throw new Error("Authentication error. Please sign in again.");
    }
    throw new Error(`Failed to fetch sheet: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Extracts spreadsheet ID from a Google Sheets URL
 * @param {string} url - Google Sheets URL
 * @returns {string|null} The extracted ID or null
 */
export function extractSpreadsheetId(url) {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Saves the sync configuration to localStorage
 * @param {object} config - { surveySheetId, graduatesSheetId }
 */
export function saveSyncConfig(config) {
  localStorage.setItem("google_drive_sync_config", JSON.stringify(config));
}

/**
 * Gets the sync configuration from localStorage
 * @returns {object|null}
 */
export function getSyncConfig() {
  const config = localStorage.getItem("google_drive_sync_config");
  return config ? JSON.parse(config) : null;
}
