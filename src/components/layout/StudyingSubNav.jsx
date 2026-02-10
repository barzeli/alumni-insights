import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils/createPageUrl";
import { Button } from "../ui/button";
import { ArrowRight, GraduationCap, FileText } from "lucide-react";

const subPages = [
  {
    name: "לומדים לתואר ראשון",
    page: "DegreeServiceStudents",
    icon: GraduationCap,
  },
  {
    name: "משלימי בגרויות ופסיכומטרי",
    page: "BagrutServiceStudents",
    icon: FileText,
  },
];

export default function StudyingSubNav({ currentPage }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1e3a5f]">
          לומדים במהלך שירות
        </h2>
        <Link to={createPageUrl("StudyingDuringService")}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לסקירה כללית
          </Button>
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {subPages.map((page) => (
          <Link key={page.page} to={createPageUrl(page.page)}>
            <Button
              variant={currentPage === page.page ? "default" : "outline"}
              className={`gap-2 ${currentPage === page.page ? "bg-[#1e3a5f]" : ""}`}
            >
              <page.icon className="w-4 h-4" />
              {page.name}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
