import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { FileText, Search, Download } from "lucide-react";
import { useMappingData } from "../hooks/useMappingData";

// *** מיפוי מלא מתוך הקובץ המצורף ***
// מערך גולמי עם אפשרות לכפילויות
export default function MappingReference() {
  const [searchTerm, setSearchTerm] = useState("");

  const { deduplicatedData, filteredData } = useMappingData(searchTerm);

  const handleExport = () => {
    const headers = ["אינדקס CSV", "עמודה באקסל", "שדות קוד", "כותרת"];
    const rows = deduplicatedData.map((item) => [
      item.index,
      item.excel,
      item.fields.join(", "),
      item.header,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "survey-mapping-reference.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-[#1e3a5f]" />
          <h1 className="text-2xl font-bold text-[#1e3a5f]">תיעוד מבנה הסקר</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#1e3a5f]">על תיעוד זה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-gray-600">
          <p>
            מסמך זה מכיל את המיפוי המלא והמעודכן של עמודות קובץ הסקר למערכת.
          </p>
          <p>
            כל שורה מתארת שדה במערכת, את המיקום שלו בקובץ ה-CSV (אינדקס העמודה),
            ואת התווית בעברית.
          </p>
          <p className="font-semibold text-[#1e3a5f]">
            סה"כ {deduplicatedData.length} שדות ייחודיים
          </p>
          <Button
            onClick={handleExport}
            className="bg-[#0891b2] hover:bg-[#0891b2]/90 gap-2"
          >
            <Download className="w-4 h-4" />
            ייצא לקובץ CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#1e3a5f]">
              מבנה השדות המלא
            </CardTitle>
            <div className="text-sm text-gray-500">
              {filteredData.length} מתוך {deduplicatedData.length} שדות
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="חיפוש לפי כותרת, אינדקס, עמודה או שדה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e3a5f] hover:bg-[#1e3a5f]">
                  <TableHead className="text-white font-semibold">
                    אינדקס CSV
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    עמודה באקסל
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    שדות במערכת
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    כותרת בסקר
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, idx) => (
                  <TableRow
                    key={`${item.index}_${item.excel}`}
                    className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <TableCell className="font-bold text-[#0891b2]">
                      {item.index}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-700">
                      {item.excel}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {item.fields.join(", ")}
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {item.header}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
