import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";

export default function NoDataView() {
  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        לא נמצאו נתוני סקר. לחץ על כפתור הרענון בראש העמוד כדי לבחור סקר.
      </AlertDescription>
    </Alert>
  );
}
