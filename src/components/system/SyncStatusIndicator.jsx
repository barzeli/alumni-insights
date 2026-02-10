import { useState, useEffect } from "react";
import { CheckCircle, RefreshCw, AlertCircle, Cloud } from "lucide-react";
import { Badge } from "../ui/badge";

export default function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState({
    status: "idle", // idle | loading | success | error
    lastSync: null,
    recordCount: 0,
  });

  useEffect(() => {
    const loadStatus = () => {
      const statusData = localStorage.getItem("googleSheetsSyncStatus");
      if (statusData) {
        setSyncStatus(JSON.parse(statusData));
      } else {
        setSyncStatus({ status: "idle", lastSync: null, recordCount: 0 });
      }
    };

    loadStatus();

    // האזנה לעדכוני סנכרון
    const handleSyncUpdate = () => loadStatus();
    window.addEventListener("syncStatusUpdated", handleSyncUpdate);

    return () =>
      window.removeEventListener("syncStatusUpdated", handleSyncUpdate);
  }, []);

  const { status, lastSync, recordCount } = syncStatus;

  if (status === "idle" && !lastSync) {
    return (
      <Badge
        variant="outline"
        className="bg-gray-50 border-gray-200 text-gray-500 gap-1.5 px-2.5 py-1"
      >
        <Cloud className="w-3.5 h-3.5 opacity-50" />
        <span className="text-xs font-medium">לא סונכרן</span>
      </Badge>
    );
  }

  if (status === "loading") {
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 border-blue-200 text-blue-700 gap-1.5 px-2.5 py-1"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs font-medium">מסנכרן...</span>
      </Badge>
    );
  }

  if (status === "error") {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 border-red-200 text-red-700 gap-1.5 px-2.5 py-1"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">שגיאת סנכרון</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-green-50 border-green-200 text-green-700 gap-1.5 px-2.5 py-1"
    >
      <CheckCircle className="w-3.5 h-3.5" />
      <div className="flex items-center gap-1.5">
        <Cloud className="w-3 h-3" />
        <span className="text-xs font-medium">{recordCount} רשומות</span>
        {lastSync && (
          <span className="text-[10px] opacity-70">
            •{" "}
            {new Date(lastSync).toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </Badge>
  );
}
