import { Card, CardContent } from "../ui/card";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
}) {
  const colorClasses = {
    blue: "bg-[#1e3a5f]/10 text-[#1e3a5f]",
    cyan: "bg-[#0891b2]/10 text-[#0891b2]",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
    pink: "bg-pink-100 text-pink-700",
  };

  const iconColorClasses = {
    blue: "text-[#1e3a5f]",
    cyan: "text-[#0891b2]",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    pink: "text-pink-600",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
              <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
