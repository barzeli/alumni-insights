import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Globe,
  Users,
  Database,
  RefreshCw,
} from "lucide-react";
import {
  parseSurveyCSV,
  parseGraduatesCSV,
  loadGraduatesFile,
  syncWithGoogleDrive,
} from "../../hooks/useSurveyData";
import { useAuth } from "../../context/AuthContext";
import {
  extractSpreadsheetId,
  saveSyncConfig,
  getSyncConfig,
} from "../../utils/googleDrive";

export default function SystemStartDialog({ open, onClose, onSurveyLoaded }) {
  const { googleAccessToken, googleLogin, isTokenExpired } = useAuth();
  const [activeTab, setActiveTab] = useState("auto");

  // Auto Sync State
  const [autoSyncUrls, setAutoSyncUrls] = useState({
    surveyUrl: "",
    graduatesUrl: "",
  });
  const [syncResults, setSyncResults] = useState(null);

  // Survey State
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Graduates State
  const [graduatesFile, setGraduatesFile] = useState(null);
  const [graduatesError, setGraduatesError] = useState(null);

  useEffect(() => {
    // Load Sync Config
    const config = getSyncConfig();
    if (config) {
      setAutoSyncUrls({
        surveyUrl: config.surveyUrl || "",
        graduatesUrl: config.graduatesUrl || "",
      });
    }
  }, [open]);

  // --- Auto Sync Logic ---
  const handleAutoSync = async () => {
    if (!googleAccessToken || isTokenExpired()) {
      setError(
        "פג תוקף ההרשאות מ-Google. אנא לחץ על 'רענון הרשאות' והתחבר מחדש.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setSyncResults(null);

    try {
      const surveySheetId = extractSpreadsheetId(autoSyncUrls.surveyUrl);
      const graduatesSheetId = extractSpreadsheetId(autoSyncUrls.graduatesUrl);

      if (!surveySheetId && !graduatesSheetId) {
        setError("אנא הזן לפחות קישור אחד תקין של Google Sheets");
        setIsLoading(false);
        return;
      }

      const config = { surveySheetId, graduatesSheetId, ...autoSyncUrls };
      saveSyncConfig(config);

      const results = await syncWithGoogleDrive(
        { surveySheetId, graduatesSheetId },
        googleAccessToken,
      );

      setSyncResults(results);
      if (results.errors.length > 0 && !results.survey && !results.graduates) {
        setError(results.errors.join(", "));
      } else {
        setTimeout(() => {
          onSurveyLoaded();
          if (!results.errors.length) onClose();
        }, 1500);
      }
    } catch (err) {
      setError("שגיאה בסנכרון: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Survey Logic ---
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const name = selectedFile.name.toLowerCase();
      if (
        name.endsWith(".csv") ||
        name.endsWith(".xlsx") ||
        name.endsWith(".xls")
      ) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("יש להעלות קובץ CSV או אקסל (xlsx/xls)");
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const data = parseSurveyCSV(text);
      if (data && data.length > 0) {
        localStorage.setItem("surveyData", JSON.stringify(data));
        onSurveyLoaded();
        onClose();
      } else {
        setError("לא נמצאו נתונים");
      }
    } catch (err) {
      setError("שגיאה: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Graduates Logic ---
  const handleGraduatesFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.name.toLowerCase().endsWith(".csv")) {
      setGraduatesFile(selectedFile);
      setGraduatesError(null);
    } else {
      setGraduatesError("יש להעלות קובץ CSV בלבד");
    }
  };

  const handleGraduatesUpload = async () => {
    if (!graduatesFile) return;
    setIsLoading(true);
    setGraduatesError(null);

    try {
      const text = await graduatesFile.text();
      const graduates = parseGraduatesCSV(text);
      if (graduates.length > 0) {
        loadGraduatesFile(graduates);
        setActiveTab("survey");
      } else {
        setGraduatesError("לא נמצאו בוגרים בקובץ");
      }
    } catch (err) {
      setGraduatesError("שגיאה: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-xl [&>button]:hidden overflow-hidden"
        dir="rtl"
      >
        <DialogHeader className="text-right">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl text-[#1e3a5f] w-full text-right">
              הגדרת מערכת
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            הגדרת מקורות הנתונים למערכת: סנכרון אוטומטי מ-Google Sheets או העלאת
            קבצים ידנית.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
          dir="rtl"
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="auto" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              סנכרון אוטומטי
            </TabsTrigger>
            <TabsTrigger value="graduates" className="gap-2">
              <Users className="w-4 h-4" />
              בוגרים (ידני)
            </TabsTrigger>
            <TabsTrigger value="survey" className="gap-2">
              <Database className="w-4 h-4" />
              סקר (ידני)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="space-y-6 text-right">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-right">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-blue-900">
                    סנכרון ישיר מ-Google Drive
                  </h3>
                  <p className="text-xs text-blue-700">
                    הנתונים יתעדכנו אוטומטית בכל פעם
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium block text-right">
                    קישור לקובץ בוגרים (Google Sheets)
                  </Label>
                  <Input
                    value={autoSyncUrls.graduatesUrl}
                    onChange={(e) =>
                      setAutoSyncUrls((p) => ({
                        ...p,
                        graduatesUrl: e.target.value,
                      }))
                    }
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="text-right bg-white"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium block text-right">
                    קישור לקובץ תגובות סקר (Google Sheets)
                  </Label>
                  <Input
                    value={autoSyncUrls.surveyUrl}
                    onChange={(e) =>
                      setAutoSyncUrls((p) => ({
                        ...p,
                        surveyUrl: e.target.value,
                      }))
                    }
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="text-right bg-white"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleAutoSync}
              disabled={
                isLoading ||
                (!autoSyncUrls.surveyUrl && !autoSyncUrls.graduatesUrl) ||
                isTokenExpired()
              }
              className={`w-full h-12 text-lg ${
                isTokenExpired()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 ml-2 animate-spin" />
                  מסנכרן...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 ml-2" />
                  סנכרון עכשיו
                </>
              )}
            </Button>

            {isTokenExpired() && (
              <div className="space-y-3">
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 ml-2 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-sm">
                    פג תוקף החיבור ל-Google Security. יש לרענן את הגישה לקבצים
                    כדי להמשיך לסנכרן.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  onClick={() => googleLogin()}
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  רענון הרשאות Google
                </Button>
              </div>
            )}
            {syncResults && (
              <div className="space-y-2">
                {syncResults.graduates !== null && (
                  <Alert className="bg-green-50 border-green-200 text-right">
                    <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                    <AlertDescription className="text-green-800">
                      סונכרנו {syncResults.graduates} בוגרים
                    </AlertDescription>
                  </Alert>
                )}
                {syncResults.survey !== null && (
                  <Alert className="bg-green-50 border-green-200 text-right">
                    <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                    <AlertDescription className="text-green-800">
                      סונכרנו {syncResults.survey} תשובות
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="graduates" className="space-y-4 text-right">
            <div
              className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer"
              onClick={() =>
                document.getElementById("grad-file-upload").click()
              }
            >
              <input
                id="grad-file-upload"
                type="file"
                accept=".csv"
                onChange={handleGraduatesFileChange}
                className="hidden"
              />
              <Users className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm">
                {graduatesFile
                  ? graduatesFile.name
                  : "לחץ להעלאת קובץ בוגרים (CSV)"}
              </p>
            </div>
            <Button
              onClick={handleGraduatesUpload}
              disabled={!graduatesFile || isLoading}
              className="w-full bg-[#0891b2] text-white"
            >
              טען קובץ בוגרים
            </Button>
            {graduatesError && (
              <Alert variant="destructive" className="text-right">
                <AlertCircle className="h-4 w-4 ml-2" />
                <AlertDescription>{graduatesError}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="survey" className="space-y-4 text-right">
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer"
              onClick={() =>
                document.getElementById("survey-file-upload").click()
              }
            >
              <input
                id="survey-file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileSpreadsheet className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm">
                {file ? file.name : "לחץ לבחירת קובץ (CSV)"}
              </p>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className="w-full bg-[#0891b2] text-white"
            >
              העלה קובץ
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4 text-right">
            <AlertCircle className="h-4 w-4 ml-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 pt-2 border-t mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-11 border-gray-300 font-medium"
          >
            לדאשבורד
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
