import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export default function ChartInfoButton({
  title,
  description,
  dataSource,
  calculation,
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="h-6 w-6 p-0 text-gray-400 hover:text-[#0891b2] bg-transparent border-none cursor-pointer flex items-center justify-center rounded"
        >
          <Info className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a5f]">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {description && (
            <div>
              <p className="font-medium text-gray-700 mb-1">תיאור:</p>
              <p className="text-gray-600">{description}</p>
            </div>
          )}
          {dataSource && (
            <div>
              <p className="font-medium text-gray-700 mb-1">מקור הנתונים:</p>
              <p className="text-gray-600">{dataSource}</p>
            </div>
          )}
          {calculation && (
            <div>
              <p className="font-medium text-gray-700 mb-1">אופן החישוב:</p>
              <p className="text-gray-600">{calculation}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
