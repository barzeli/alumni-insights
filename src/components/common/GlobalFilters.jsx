import { useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Filter, X } from "lucide-react";

export default function GlobalFilters({ surveyData, filters, onFilterChange }) {
  const cohorts = useMemo(() => {
    const uniqueCohorts = [
      ...new Set(surveyData.map((row) => row.cohort).filter(Boolean)),
    ];
    return uniqueCohorts.sort();
  }, [surveyData]);

  const pronouns = useMemo(() => {
    const uniquePronouns = [
      ...new Set(surveyData.map((row) => row.pronoun).filter(Boolean)),
    ];
    return uniquePronouns.sort();
  }, [surveyData]);

  const toggleCohort = (cohort) => {
    const newCohorts = filters.cohorts.includes(cohort)
      ? filters.cohorts.filter((c) => c !== cohort)
      : [...filters.cohorts, cohort];
    onFilterChange({ ...filters, cohorts: newCohorts });
  };

  const togglePronoun = (pronoun) => {
    const newPronouns = filters.pronouns.includes(pronoun)
      ? filters.pronouns.filter((p) => p !== pronoun)
      : [...filters.pronouns, pronoun];
    onFilterChange({ ...filters, pronouns: newPronouns });
  };

  const clearFilters = () => {
    onFilterChange({ cohorts: [], pronouns: [] });
  };

  const hasActiveFilters =
    filters.cohorts.length > 0 || filters.pronouns.length > 0;

  return (
    <Card className="bg-gray-50">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1e3a5f]">
            <Filter className="w-4 h-4" />
            <span className="font-medium">סינון</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 ml-1" />
              נקה הכל
            </Button>
          )}
        </div>

        {/* Cohort filters */}
        <div>
          <p className="text-sm text-gray-600 mb-2">מחזור:</p>
          <div className="flex flex-wrap gap-2">
            {cohorts.map((cohort) => {
              const shortName = cohort;
              const isActive = filters.cohorts.includes(cohort);
              return (
                <Button
                  key={cohort}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCohort(cohort)}
                  className={
                    isActive ? "bg-[#1e3a5f] hover:bg-[#1e3a5f]/90" : ""
                  }
                >
                  {shortName}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Pronoun filters */}
        <div>
          <p className="text-sm text-gray-600 mb-2">לשון פנייה:</p>
          <div className="flex flex-wrap gap-2">
            {pronouns.map((pronoun) => {
              const isActive = filters.pronouns.includes(pronoun);
              return (
                <Button
                  key={pronoun}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePronoun(pronoun)}
                  className={
                    isActive ? "bg-[#0891b2] hover:bg-[#0891b2]/90" : ""
                  }
                >
                  {pronoun}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
