import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";

export default function DataTable({
  data,
  columns,
  searchable = true,
  pageSize = 10,
  showPagination = true,
  filterableColumns = [],
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});

  // Get unique values for filterable columns - support multi-select answers
  const filterOptions = useMemo(() => {
    const options = {};
    filterableColumns.forEach((colKey) => {
      const allValues = new Set();
      data.forEach((row) => {
        const value = row[colKey];
        if (value) {
          // Split by common separators for multi-select answers
          const parts = value.toString().split(/[,،;]/);
          parts.forEach((part) => {
            const trimmed = part.trim();
            if (trimmed) allValues.add(trimmed);
          });
        }
      });
      options[colKey] = [...allValues].sort();
    });
    return options;
  }, [data, filterableColumns]);

  const filteredData = useMemo(() => {
    let result = data;

    // Apply text search
    if (searchTerm) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return (
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          );
        }),
      );
    }

    // Apply column filters - support multi-select (AND logic)
    Object.entries(columnFilters).forEach(([colKey, selectedValues]) => {
      if (
        selectedValues &&
        Array.isArray(selectedValues) &&
        selectedValues.length > 0
      ) {
        result = result.filter((row) => {
          const cellValue = row[colKey];
          if (!cellValue) return false;
          // Check if ALL selected values are present in the cell
          return selectedValues.every((selected) =>
            cellValue.toString().includes(selected),
          );
        });
      }
    });

    return result;
  }, [data, searchTerm, columns, columnFilters]);

  const clearFilters = () => {
    setColumnFilters({});
    setSearchTerm("");
    setCurrentPage(1);
  };

  const toggleFilterValue = (colKey, value) => {
    setColumnFilters((prev) => {
      const current = prev[colKey] || [];
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [colKey]: newValues };
    });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    Object.values(columnFilters).some((v) => Array.isArray(v) && v.length > 0);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  return (
    <Card className="overflow-hidden">
      {(searchable || filterableColumns.length > 0) && (
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            {searchable && (
              <div className="relative w-full sm:w-auto sm:min-w-50">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="חיפוש חופשי..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pr-10"
                />
              </div>
            )}

            {filterableColumns.map((colKey) => {
              const column = columns.find((c) => c.key === colKey);
              if (!column || !filterOptions[colKey]?.length) return null;
              const selectedValues = columnFilters[colKey] || [];
              const hasSelection = selectedValues.length > 0;

              return (
                <Popover key={colKey}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-45 justify-between bg-white ${hasSelection ? "border-[#1e3a5f] text-[#1e3a5f]" : ""}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Filter className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {hasSelection
                            ? `${column.label} (${selectedValues.length})`
                            : column.label}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-62.5 p-2" align="start">
                    <div className="space-y-1 max-h-75 overflow-y-auto">
                      {filterOptions[colKey].map((option) => (
                        <div
                          key={option}
                          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => toggleFilterValue(colKey, option)}
                        >
                          <Checkbox
                            checked={selectedValues.includes(option)}
                            onCheckedChange={() =>
                              toggleFilterValue(colKey, option)
                            }
                          />
                          <span className="text-sm">{option}</span>
                        </div>
                      ))}
                    </div>
                    {hasSelection && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-red-500"
                        onClick={() =>
                          setColumnFilters((prev) => ({
                            ...prev,
                            [colKey]: [],
                          }))
                        }
                      >
                        נקה בחירה
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>
              );
            })}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-1" />
                נקה סינון
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  חיפוש: "{searchTerm}"
                </Badge>
              )}
              {Object.entries(columnFilters).map(([colKey, values]) => {
                if (!values || !Array.isArray(values) || values.length === 0)
                  return null;
                const column = columns.find((c) => c.key === colKey);
                return values.map((value) => (
                  <Badge
                    key={`${colKey}-${value}`}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-red-100"
                    onClick={() => toggleFilterValue(colKey, value)}
                  >
                    {column?.label}: {value}
                    <X className="w-3 h-3 mr-1" />
                  </Badge>
                ));
              })}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {getSortIcon(col.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-500"
                >
                  לא נמצאו נתונים
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <TableCell key={col.key} className="whitespace-nowrap">
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            מציג {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} מתוך{" "}
            {sortedData.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">
              עמוד {currentPage} מתוך {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
