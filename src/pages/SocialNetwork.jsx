import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Network,
  Table as TableIcon,
  Flame,
  AlertCircle,
  Upload,
} from "lucide-react";
import { useSurveyData } from "../hooks/useSurveyData";

import { getValue, getName } from "../components/survey/surveyDataHelpers";
import { getCohortBarColors } from "../components/survey/ChartColors";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils/createPageUrl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import NetworkGraph from "../components/network/NetworkGraph";
import ConnectionMatrix from "../components/network/ConnectionMatrix";
import Heatmap from "../components/network/Heatmap";

// פונקציות עזר לעיבוד טקסט ובניית גרף
function normalizeText(x) {
  if (x === null || x === undefined) return "";
  return String(x).replace(/\r/g, "\n").replace(/\s+/g, " ").trim();
}

function splitNames(cell) {
  const s = normalizeText(cell);
  if (!s) return [];
  return s
    .split(/[,;\n]/)
    .map(normalizeText)
    .filter(Boolean);
}

function buildGraph(rows, graduatesData, getNameFn, getValueFn) {
  const knownNames = new Set();
  rows.forEach((row) => {
    const n = normalizeText(getNameFn(row));
    if (n && n !== "לא ידוע") knownNames.add(n);
  });

  const nameToGraduateCohort = new Map();
  graduatesData.forEach((grad) => {
    const name = normalizeText(grad.full_name);
    if (name) nameToGraduateCohort.set(name, grad.cohort || "לא ידוע");
  });

  const nodesMap = new Map();
  const edgesMap = new Map();
  const unmatchedNames = new Set();

  function ensureNode(name, cohortVal, pronounVal, familyStatusVal) {
    if (!nodesMap.has(name)) {
      let finalCohort = cohortVal;
      if (!finalCohort || finalCohort === "לא ידוע") {
        finalCohort = nameToGraduateCohort.get(name) || "לא ידוע";
      }

      nodesMap.set(name, {
        id: name,
        label: name,
        cohort: finalCohort,
        pronoun: pronounVal || "",
        familyStatus: familyStatusVal || "",
        degree: 0,
        connections10Plus: false,
      });
    }
    return nodesMap.get(name);
  }

  rows.forEach((row) => {
    const source = normalizeText(getNameFn(row));
    if (!source || source === "לא ידוע") return;

    for (let idx = 94; idx <= 103; idx++) {
      const cell = getValueFn(row, `connection_${idx - 93}`);
      const targets = splitNames(cell);

      targets.forEach((target) => {
        if (!target || target === source) return;
        if (!knownNames.has(target)) unmatchedNames.add(target);
        const targetCohort = nameToGraduateCohort.get(target) || "לא ידוע";
        ensureNode(target, knownNames.has(target) ? "" : targetCohort, "", "");

        const pair = [source, target].sort();
        const edgeKey = pair.join("||");

        if (edgesMap.has(edgeKey)) {
          edgesMap.get(edgeKey).weight = 2;
        } else {
          edgesMap.set(edgeKey, {
            source: pair[0],
            target: pair[1],
            weight: 1,
          });
        }
      });
    }
  });

  const nodes = Array.from(nodesMap.values());
  const edges = Array.from(edgesMap.values());
  const degreeMap = new Map(nodes.map((n) => [n.id, 0]));
  edges.forEach((e) => {
    degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
  });
  nodes.forEach((n) => {
    n.degree = degreeMap.get(n.id) || 0;
  });

  return { nodes, edges, unmatchedNames: Array.from(unmatchedNames) };
}

export default function SocialNetwork() {
  const { surveyData, hasSurveyData, graduates } = useSurveyData();
  const [selectedCohorts, setSelectedCohorts] = useState(new Set());
  const [showUnknown, setShowUnknown] = useState(false);

  const networkData = useMemo(() => {
    if (!hasSurveyData) return null;
    const result = buildGraph(surveyData, graduates, getName, getValue);
    const cohorts = Array.from(
      new Set(result.nodes.map((n) => n.cohort).filter((c) => c !== "לא ידוע")),
    ).sort();
    return { ...result, cohorts };
  }, [surveyData, hasSurveyData, graduates]);

  useEffect(() => {
    if (networkData) {
      setSelectedCohorts(new Set(networkData.cohorts));
      setShowUnknown(true);
    }
  }, [networkData]);

  const filteredData = useMemo(() => {
    if (!networkData) return null;
    const filteredNodes = networkData.nodes.filter((node) => {
      if (node.cohort === "לא ידוע") return showUnknown;
      return selectedCohorts.has(node.cohort);
    });

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = networkData.edges.filter(
      (link) => nodeIds.has(link.source) && nodeIds.has(link.target),
    );

    const degreeMap = new Map(filteredNodes.map((n) => [n.id, 0]));
    filteredEdges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
    });
    filteredNodes.forEach((n) => {
      n.degree = degreeMap.get(n.id) || 0;
    });

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [networkData, selectedCohorts, showUnknown]);

  const toggleCohort = (cohort) => {
    setSelectedCohorts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cohort)) newSet.delete(cohort);
      else newSet.add(cohort);
      return newSet;
    });
  };

  if (!hasSurveyData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">רשת קשרים חברתיים</h1>
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            לא נמצאו נתוני סקר. יש להעלות קובץ סקר תחילה.
          </AlertDescription>
        </Alert>
        <Link to={createPageUrl("Overview")}>
          <Button className="bg-[#0891b2] hover:bg-[#0891b2]/90 gap-2">
            <Upload className="w-4 h-4" />
            העלאת קובץ סקר
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">רשת קשרים חברתיים</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              סה"כ בוגרים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">
              {filteredData?.nodes.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              סה"כ קשרים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-cyan-600">
              {filteredData?.edges.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              שמות לא מזוהים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {networkData?.unmatchedNames.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <FamilyStatusByCohort data={filteredData?.nodes || []} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">סינון לפי מחזור</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {networkData?.cohorts.map((cohort) => (
              <div key={cohort} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCohorts.has(cohort)}
                  onCheckedChange={() => toggleCohort(cohort)}
                />
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getCohortBarColors(cohort).main }}
                />
                <span>{cohort}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showUnknown}
                onCheckedChange={setShowUnknown}
              />
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <span>לא ידוע</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="graph" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto gap-4 bg-transparent p-0">
          <TabsTrigger
            value="graph"
            className="flex flex-col items-center justify-center gap-3 aspect-square border-2 border-gray-200 rounded-xl data-[state=active]:border-[#0891b2] data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
          >
            <Network className="w-8 h-8" />
            <span className="font-bold text-base">גרף רשת</span>
          </TabsTrigger>

          <TabsTrigger
            value="matrix"
            className="flex flex-col items-center justify-center gap-3 aspect-square border-2 border-gray-200 rounded-xl data-[state=active]:border-[#0891b2] data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
          >
            <TableIcon className="w-8 h-8" />
            <span className="font-bold text-base">מטריצת קשרים</span>
          </TabsTrigger>

          <TabsTrigger
            value="heatmap"
            className="flex flex-col items-center justify-center gap-3 aspect-square border-2 border-gray-200 rounded-xl data-[state=active]:border-[#0891b2] data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
          >
            <Flame className="w-8 h-8" />
            <span className="font-bold text-base">מפת חום</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="graph">
            <NetworkGraph data={filteredData} />
          </TabsContent>
          <TabsContent value="matrix">
            <ConnectionMatrix data={filteredData} />
          </TabsContent>
          <TabsContent value="heatmap">
            <Heatmap data={filteredData} />
          </TabsContent>
        </div>
      </Tabs>

      {networkData?.unmatchedNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-orange-600">
              שמות לא מזוהים בסקר
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              השמות הבאים הופיעו בשדות הקשרים אך אינם קיימים כמשיבים בסקר:
            </p>
            <div className="flex flex-wrap gap-2">
              {networkData.unmatchedNames.map((name) => (
                <Badge key={name} variant="outline" className="text-orange-600">
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FamilyStatusByCohort({ data }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const cohortStatusMap = {};
    data.forEach((node) => {
      const cohort = node.cohort;
      const familyStatus = node.familyStatus || "לא צוין";
      if (cohort && cohort !== "לא ידוע") {
        if (!cohortStatusMap[cohort]) cohortStatusMap[cohort] = {};
        cohortStatusMap[cohort][familyStatus] =
          (cohortStatusMap[cohort][familyStatus] || 0) + 1;
      }
    });

    const allStatuses = new Set();
    Object.values(cohortStatusMap).forEach((statuses) => {
      Object.keys(statuses).forEach((status) => allStatuses.add(status));
    });

    const formattedData = Object.entries(cohortStatusMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cohort, statuses]) => {
        const dataPoint = { cohort };
        allStatuses.forEach((status) => {
          dataPoint[status] = statuses[status] || 0;
        });
        return dataPoint;
      });

    return { chartData: formattedData, statuses: Array.from(allStatuses) };
  }, [data]);

  if (!chartData.chartData || chartData.chartData.length === 0) return null;

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">מצב משפחתי לפי מחזור</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cohort" />
            <YAxis />
            <Tooltip />
            <Legend />
            {chartData.statuses.map((status, index) => (
              <Bar
                key={status}
                dataKey={status}
                fill={COLORS[index % COLORS.length]}
                name={status}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
