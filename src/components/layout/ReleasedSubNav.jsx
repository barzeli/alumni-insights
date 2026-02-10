import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils/createPageUrl";
import { Button } from "../ui/button";
import {
  Shield,
  GraduationCap,
  BookOpen,
  Plane,
  Briefcase,
  HelpCircle,
  ChevronLeft,
} from "lucide-react";

const subPages = [
  { name: "חלק צבאי", page: "ReleasedMilitary", icon: Shield },
  { name: "סטודנטים", page: "ReleasedStudents", icon: GraduationCap },
  { name: "בגרות ופסיכומטרי", page: "Bagrut", icon: BookOpen },
  { name: "נוסעים", page: "ReleasedTravelers", icon: Plane },
  { name: "עובדים", page: "ReleasedWork", icon: Briefcase },
  { name: "מרגישים אבודים", page: "ReleasedLost", icon: HelpCircle },
];

export default function ReleasedSubNav({ currentPage }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">עמודי משוחררים</h3>
        <Link to={createPageUrl("Released")}>
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            <ChevronLeft className="w-3 h-3" />
            סקירה כללית
          </Button>
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {subPages.map((item) => (
          <Link key={item.page} to={createPageUrl(item.page)}>
            <Button
              variant={currentPage === item.page ? "default" : "outline"}
              size="sm"
              className="gap-2"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
