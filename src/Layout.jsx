import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils/createPageUrl";
import {
  Home,
  Users,
  UserCheck,
  GraduationCap,
  Heart,
  UserMinus,
  BookOpen,
  RotateCcw,
  ChevronDown,
  Menu,
  X,
  List,
  RefreshCw,
  MessageSquare,
  Network,
  LogOut,
  FileText,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { useAuth } from "./context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import SystemStartDialog from "./components/survey/SystemStartDialog";
import SyncStatusIndicator from "./components/survey/SyncStatusIndicator";
import logo from "./assets/logo.jpg";

const navItems = [
  { name: "מבט כללי", page: "Overview", icon: Home },
  { name: 'מלש"בים', page: "PreArmy", icon: Users },
  { name: "חיילים בסדיר", page: "Soldiers", icon: UserCheck },
  { name: "עתודאים", page: "Atuda", icon: GraduationCap },
  { name: "שירות לאומי", page: "NationalService", icon: Heart },
  { name: "לומדים במהלך שירות", page: "StudyingDuringService", icon: BookOpen },
  { name: "משוחררים", page: "Released", icon: UserMinus },
  { name: "רצון לחזור", page: "ReturnIntent", icon: RotateCcw },
  { name: "תשובות פתוחות", page: "FinalRemarks", icon: MessageSquare },
  { name: "רשת חברתית", page: "SocialNetwork", icon: Network },
  { name: "פרטי קשר של הבוגרים", page: "AllGraduates", icon: List },
  { name: "תיעוד מבנה הסקר", page: "MappingReference", icon: FileText },
];

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Show survey dialog on fresh page load
  const [showSurveyDialog, setShowSurveyDialog] = useState(() => {
    const dialogShown = sessionStorage.getItem("showSurveyDialog");
    return !dialogShown;
  });

  const handleSurveyLoaded = () => {
    sessionStorage.setItem("showSurveyDialog", "true");
    setShowSurveyDialog(false);
    // Trigger re-render of data across all pages
    window.dispatchEvent(new Event("surveyDataUpdated"));
    // Navigate to Overview page
    navigate(createPageUrl("Overview"));
  };

  const handleRefresh = () => {
    // מחק את הסשן ופתח את דיאלוג בחירת הקובץ
    sessionStorage.removeItem("showSurveyDialog");
    setShowSurveyDialog(true);
  };

  // Add event listener for opening survey dialog from other components
  useEffect(() => {
    const handleOpenDialog = () => {
      setShowSurveyDialog(true);
    };

    window.addEventListener("openSurveyDialog", handleOpenDialog);
    return () =>
      window.removeEventListener("openSurveyDialog", handleOpenDialog);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <SystemStartDialog
        open={showSurveyDialog}
        onClose={() => {
          sessionStorage.setItem("showSurveyDialog", "true");
          setShowSurveyDialog(false);
        }}
        onSurveyLoaded={handleSurveyLoaded}
      />
      <style>{`
        :root {
          --primary-dark: #1e3a5f;
          --primary-light: #0891b2;
          --accent: #06b6d4;
        }
      `}</style>

      {/* Header */}
      <header className="bg-gradient-to-l from-[#1e3a5f] to-[#0891b2] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold">מערכת ניתוח סקר בוגרים</h1>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <SyncStatusIndicator />
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={handleRefresh}
                title="רענון ובחירת סקר"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>

            {/* Desktop Navigation - Using Dropdown Menu */}
            <div className="hidden md:flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3 border-l border-white/20 pl-4">
                  <div className="flex flex-col items-start text-right">
                    <span className="text-xs text-white/70">מחובר כ:</span>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-white/20"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={logout}
                    title="התנתקות"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/20 gap-2"
                  >
                    <Menu className="w-5 h-5" />
                    <span>תפריט</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.name} className="p-0">
                      <Link
                        to={createPageUrl(item.page)}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-right justify-between ${
                          currentPageName === item.page ||
                          (item.page === "Released" &&
                            (currentPageName?.includes("Released") ||
                              currentPageName === "Bagrut")) ||
                          (item.page === "StudyingDuringService" &&
                            currentPageName?.includes("ServiceStudents"))
                            ? "bg-gray-100"
                            : ""
                        }`}
                      >
                        <span className="text-sm flex-1 text-right">
                          {item.name}
                        </span>
                        <item.icon className="w-4 h-4 shrink-0" />
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="ghost"
                className="text-white"
                onClick={handleRefresh}
                title="רענון ובחירת סקר"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                className="text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-white/20 py-2">
            <div className="max-w-7xl mx-auto px-4 space-y-1">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mb-2">
                <SyncStatusIndicator />
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-white hover:bg-white/20 gap-2 text-right"
                  >
                    <span className="text-sm flex-1 text-right">
                      {item.name}
                    </span>
                    <item.icon className="w-4 h-4 shrink-0" />
                  </Button>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p className="text-sm text-white/70">
            מערכת ניתוח סקר בוגרים © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="המכינה המדעית"
              className="h-8 w-auto rounded"
            />
            <span className="text-sm font-medium">המכינה המדעית</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
