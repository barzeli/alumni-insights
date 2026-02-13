import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { Download, FileSpreadsheet, Image, FileJson } from "lucide-react";

// Convert data array to CSV string
function dataToCSV(data, columns) {
  if (!data || data.length === 0) return "";

  // Use provided columns or infer from data
  const headers = columns
    ? columns.map((c) => c.label || c.key)
    : Object.keys(data[0]);
  const keys = columns ? columns.map((c) => c.key) : Object.keys(data[0]);

  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          // Escape commas and quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(","),
    ),
  ];

  return "\uFEFF" + csvRows.join("\n"); // BOM for Hebrew support in Excel
}

// Download file helper
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export chart as image with proper padding for labels
async function exportChartAsImage(
  chartRef,
  filename,
  format = "png",
  title = "",
) {
  if (!chartRef?.current) return;

  const svgElement = chartRef.current.querySelector("svg");
  if (!svgElement) return;

  // Clone SVG to modify it
  const clonedSvg = svgElement.cloneNode(true);

  // Get original dimensions
  const originalWidth = parseFloat(
    svgElement.getAttribute("width") ||
      svgElement.getBoundingClientRect().width.toString(),
  );
  const originalHeight = parseFloat(
    svgElement.getAttribute("height") ||
      svgElement.getBoundingClientRect().height.toString(),
  );

  // Add padding for labels that might be cut off
  const padding = { top: 60, right: 80, bottom: 40, left: 80 };
  const newWidth = originalWidth + padding.left + padding.right;
  const newHeight = originalHeight + padding.top + padding.bottom;

  // Update SVG dimensions
  clonedSvg.setAttribute("width", newWidth.toString());
  clonedSvg.setAttribute("height", newHeight.toString());
  clonedSvg.setAttribute(
    "viewBox",
    `${-padding.left} ${-padding.top} ${newWidth} ${newHeight}`,
  );

  // Add white background
  const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bgRect.setAttribute("x", (-padding.left).toString());
  bgRect.setAttribute("y", (-padding.top).toString());
  bgRect.setAttribute("width", newWidth.toString());
  bgRect.setAttribute("height", newHeight.toString());
  bgRect.setAttribute("fill", "white");
  clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

  // Add title if provided
  if (title) {
    const titleElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    titleElement.setAttribute("x", (originalWidth / 2).toString());
    titleElement.setAttribute("y", (-padding.top + 25).toString());
    titleElement.setAttribute("text-anchor", "middle");
    titleElement.setAttribute("font-size", "18");
    titleElement.setAttribute("font-weight", "bold");
    titleElement.setAttribute("fill", "#1e3a5f");
    titleElement.setAttribute("font-family", "Arial, sans-serif");
    titleElement.textContent = title;
    clonedSvg.appendChild(titleElement);
  }

  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });

  if (format === "svg") {
    downloadFile(svgData, `${filename}.svg`, "image/svg+xml");
    return;
  }

  // Convert SVG to PNG
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new window.Image();

  return new Promise((resolve) => {
    img.onload = () => {
      const scale = 2; // Higher resolution
      canvas.width = newWidth * scale;
      canvas.height = newHeight * scale;
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${filename}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            resolve();
          }
        }, "image/png");
      }
    };
    img.src = URL.createObjectURL(svgBlob);
  });
}

// Export button for charts
export function ChartExportButton({
  chartRef,
  data,
  filename = "chart",
  dataColumns,
  title = "",
}) {
  const handleExportCSV = () => {
    const csv = dataToCSV(data, dataColumns);
    downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8");
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename}.json`, "application/json");
  };

  const handleExportPNG = () => {
    exportChartAsImage(chartRef, filename, "png", title);
  };

  const handleExportSVG = () => {
    exportChartAsImage(chartRef, filename, "svg", title);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="ייצוא">
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>ייצוא גרף</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportPNG}>
          <Image className="h-4 w-4 ml-2" />
          תמונה (PNG)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportSVG}>
          <Image className="h-4 w-4 ml-2" />
          וקטור (SVG)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>ייצוא נתונים</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="h-4 w-4 ml-2" />
          אקסל (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="h-4 w-4 ml-2" />
          JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export button for tables
export function TableExportButton({ data, columns, filename = "table" }) {
  const handleExportCSV = () => {
    const csv = dataToCSV(data, columns);
    downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8");
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename}.json`, "application/json");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="ייצוא">
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>ייצוא טבלה</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="h-4 w-4 ml-2" />
          אקסל (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="h-4 w-4 ml-2" />
          JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export all page data
export function PageExportButton({ pageData, pageName = "page" }) {
  const handleExportAll = () => {
    // Create a ZIP-like structure as multiple CSV files in one download
    // For simplicity, we'll export as a single JSON with all data
    const json = JSON.stringify(pageData, null, 2);
    downloadFile(json, `${pageName}_all_data.json`, "application/json");
  };

  const handleExportAllCSV = () => {
    // Export each dataset as separate CSV content combined
    let combinedCSV = "";
    Object.entries(pageData).forEach(([key, { data, columns }]) => {
      if (data && data.length > 0) {
        combinedCSV += `\n--- ${key} ---\n`;
        combinedCSV += dataToCSV(data, columns);
        combinedCSV += "\n\n";
      }
    });
    downloadFile(
      "\uFEFF" + combinedCSV,
      `${pageName}_all.csv`,
      "text/csv;charset=utf-8",
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          ייצוא כל העמוד
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportAllCSV}>
          <FileSpreadsheet className="h-4 w-4 ml-2" />
          כל הנתונים (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportAll}>
          <FileJson className="h-4 w-4 ml-2" />
          כל הנתונים (JSON)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
