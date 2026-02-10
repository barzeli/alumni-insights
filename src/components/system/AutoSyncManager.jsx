import { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { syncWithGoogleDrive } from "../../hooks/useSurveyData";
import { getSyncConfig } from "../../utils/googleDrive";

/**
 * Component that manages automatic synchronization on application load
 */
export default function AutoSyncManager() {
  const { isAuthenticated, googleAccessToken, isTokenExpired } = useAuth();
  const syncAttempted = useRef(false);

  useEffect(() => {
    const performSync = async () => {
      if (
        isAuthenticated &&
        googleAccessToken &&
        !isTokenExpired() &&
        !syncAttempted.current
      ) {
        const config = getSyncConfig();
        if (config && (config.surveySheetId || config.graduatesSheetId)) {
          syncAttempted.current = true;
          console.log("[AutoSync] Triggering automatic sync on load...");
          try {
            await syncWithGoogleDrive(
              {
                surveySheetId: config.surveySheetId,
                graduatesSheetId: config.graduatesSheetId,
              },
              googleAccessToken,
            );
          } catch (err) {
            console.error("[AutoSync] Automatic sync failed:", err);
          }
        }
      }
    };

    performSync();
  }, [isAuthenticated, googleAccessToken]);

  return null; // This component doesn't render anything
}
