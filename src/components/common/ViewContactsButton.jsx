import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Users } from "lucide-react";
import { createPageUrl } from "../../utils/createPageUrl";

export default function ViewContactsButton({ data, filterLabel = "מהטבלה" }) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Store the names from the table data in localStorage
    const names = data
      .map((row) => row.full_name || row.full_name_manual || "")
      .filter((n) => n && n !== "-");
    localStorage.setItem("tableFilterNames", JSON.stringify(names));
    localStorage.setItem("tableFilterLabel", filterLabel);

    // Navigate to AllGraduates with a special filter flag
    navigate(createPageUrl("AllGraduates") + "?fromTable=true");
  };

  if (!data || data.length === 0) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="gap-2 text-[#1e3a5f] border-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
    >
      <Users className="w-4 h-4" />
      פרטי קשר ({data.length})
    </Button>
  );
}
