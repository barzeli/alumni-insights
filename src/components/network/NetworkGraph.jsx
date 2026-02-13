import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { useSurveyData } from "../../hooks/useSurveyData";
import { getCohortBarColors } from "../../utils/colors";

function normalizeStr(x) {
  return String(x ?? "").trim();
}
function normKey(x) {
  return normalizeStr(x).toLowerCase();
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function makeGraduatePrimaryId(grad, index) {
  const id = normalizeStr(grad?.id);
  if (id) return id;
  const uid = normalizeStr(grad?.uid);
  if (uid) return uid;
  const email = normalizeStr(grad?.email);
  if (email) return email;
  const fullName = normalizeStr(grad?.full_name);
  if (fullName) return fullName;
  return normalizeStr(index);
}
function getCohortColor(cohort) {
  if (!cohort || cohort === "לא ידוע") return "#9ca3af";
  return getCohortBarColors(cohort).main;
}
function domSafeId(x) {
  // כדי ש־htmlFor/id לא יישברו עם רווחים/תוים לא סטנדרטיים
  return String(x)
    .replace(/\s+/g, "_")
    .replace(/[^\w\-:.]/g, "");
}

// -------------------- edges --------------------
function directedKey(a, b) {
  return `${String(a)}→${String(b)}`;
}
function undirectedKey(a, b) {
  const x = String(a);
  const y = String(b);
  return x < y ? `${x}||${y}` : `${y}||${x}`;
}

function buildEdgesForDraw(edgesRaw, aliasToPrimaryId) {
  const edges = (edgesRaw || [])
    .filter(
      (e) =>
        e?.source != null &&
        e?.target != null &&
        String(e.source) !== String(e.target),
    )
    .map((e) => {
      const s0 = String(e.source);
      const t0 = String(e.target);
      const s =
        aliasToPrimaryId.get(s0) ?? aliasToPrimaryId.get(normKey(s0)) ?? s0;
      const t =
        aliasToPrimaryId.get(t0) ?? aliasToPrimaryId.get(normKey(t0)) ?? t0;
      return {
        source: String(s),
        target: String(t),
        weight: typeof e.weight === "number" ? e.weight : undefined,
      };
    })
    .filter((e) => e.source !== e.target);

  const hasWeight = edges.some((e) => typeof e.weight === "number");
  if (hasWeight) {
    const und = new Map();
    for (const e of edges) {
      const k = undirectedKey(e.source, e.target);
      const w = e.weight === 2 ? 2 : 1;
      const existing = und.get(k);
      if (!existing) und.set(k, { a: e.source, b: e.target, weight: w });
      else existing.weight = Math.max(existing.weight, w);
    }
    return Array.from(und.values()).map((x) => ({
      source: x.a,
      target: x.b,
      weight: x.weight,
    }));
  }

  const dir = new Set();
  const und = new Map();
  for (const e of edges) {
    dir.add(directedKey(e.source, e.target));
    const k = undirectedKey(e.source, e.target);
    if (!und.has(k)) und.set(k, { a: e.source, b: e.target, weight: 1 });
  }
  for (const obj of und.values()) {
    const mutual =
      dir.has(directedKey(obj.a, obj.b)) && dir.has(directedKey(obj.b, obj.a));
    obj.weight = mutual ? 2 : 1;
  }
  return Array.from(und.values()).map((x) => ({
    source: x.a,
    target: x.b,
    weight: x.weight,
  }));
}

// -------------------- node sizing & text --------------------
function nodeSize(node) {
  const label = String(node?.label ?? "");
  const base = 62;
  const extra = Math.min(50, Math.max(0, label.length - 14) * 1.3);
  return Math.max(62, Math.min(112, base + extra));
}

function drawWrappedText(
  ctx,
  text,
  x,
  y,
  maxWidth,
  maxHeight,
  preferredFontPx = 13,
) {
  const words = String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return;

  let fontPx = preferredFontPx;
  let lines = [];

  const buildLines = () => {
    const out = [];
    let current = "";
    for (const w of words) {
      const candidate = current ? `${current} ${w}` : w;
      if (ctx.measureText(candidate).width <= maxWidth) current = candidate;
      else {
        if (current) out.push(current);
        if (ctx.measureText(w).width > maxWidth) {
          let chunk = "";
          for (const ch of w) {
            const cand2 = chunk + ch;
            if (ctx.measureText(cand2).width <= maxWidth) chunk = cand2;
            else {
              if (chunk) out.push(chunk);
              chunk = ch;
            }
          }
          if (chunk) out.push(chunk);
          current = "";
        } else current = w;
      }
    }
    if (current) out.push(current);
    return out;
  };

  while (fontPx >= 9) {
    ctx.font = `800 ${fontPx}px Arial`;
    lines = buildLines();
    const lineHeight = Math.round(fontPx * 1.18);
    if (lines.length * lineHeight <= maxHeight) break;
    fontPx -= 1;
  }

  const lineHeight = Math.round(fontPx * 1.18);
  const totalHeight = lines.length * lineHeight;
  const startY = y - totalHeight / 2 + lineHeight / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < lines.length; i++) {
    const yy = startY + i * lineHeight;
    ctx.lineWidth = Math.max(3, Math.floor(fontPx / 2));
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.strokeText(lines[i], x, yy);

    ctx.fillStyle = "#000";
    ctx.fillText(lines[i], x, yy);
  }
}

// -------------------- layout --------------------
function layoutForceStatic(nodes, edges, width, height) {
  const margin = 42;
  const steps = 290;

  const restLen = 180;
  const kSpring = 0.024;
  const kRepel = 1500;
  const kCenter = 0.0048;
  const kCollide = 0.95;
  const damping = 0.86;

  nodes.forEach((n) => {
    n.size = nodeSize(n);
    n.r = n.size / 2;
    n.x = margin + Math.random() * (width - 2 * margin);
    n.y = margin + Math.random() * (height - 2 * margin);
    n.vx = 0;
    n.vy = 0;
  });

  const nodeIdx = new Map(nodes.map((n, i) => [String(n.id), i]));
  const eList = (edges || [])
    .map((e) => ({
      a: nodeIdx.get(String(e.source)),
      b: nodeIdx.get(String(e.target)),
      weight: e.weight || 1,
    }))
    .filter((e) => e.a !== undefined && e.b !== undefined && e.a !== e.b);

  for (let step = 0; step < steps; step++) {
    const fx = new Array(nodes.length).fill(0);
    const fy = new Array(nodes.length).fill(0);

    for (const e of eList) {
      const A = nodes[e.a];
      const B = nodes[e.b];
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const ux = dx / dist;
      const uy = dy / dist;

      const springStrength = kSpring * (e.weight === 2 ? 2.5 : 1);
      const force = springStrength * (dist - restLen);

      fx[e.a] += force * ux;
      fy[e.a] += force * uy;
      fx[e.b] -= force * ux;
      fy[e.b] -= force * uy;
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const A = nodes[i];
        const B = nodes[j];
        const dx = A.x - B.x;
        const dy = A.y - B.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const ux = dx / dist;
        const uy = dy / dist;

        const repel = kRepel / (dist * dist);
        fx[i] += repel * ux;
        fy[i] += repel * uy;
        fx[j] -= repel * ux;
        fy[j] -= repel * uy;

        const minDist = (A.r || 30) + (B.r || 30) + 14;
        if (dist < minDist) {
          const overlap = minDist - dist;
          const push = kCollide * overlap;
          fx[i] += push * ux;
          fy[i] += push * uy;
          fx[j] -= push * ux;
          fy[j] -= push * uy;
        }
      }
    }

    const cx = width / 2;
    const cy = height / 2;
    for (let i = 0; i < nodes.length; i++) {
      fx[i] += (cx - nodes[i].x) * kCenter;
      fy[i] += (cy - nodes[i].y) * kCenter;
    }

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.vx = (n.vx + fx[i]) * damping;
      n.vy = (n.vy + fy[i]) * damping;
      n.x += n.vx;
      n.y += n.vy;

      const r = n.r || 30;
      n.x = Math.max(margin + r, Math.min(width - margin - r, n.x));
      n.y = Math.max(margin + r, Math.min(height - margin - r, n.y));
    }
  }

  nodes.forEach((n) => {
    delete n.vx;
    delete n.vy;
  });

  for (let pass = 0; pass < 12; pass++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const A = nodes[i];
        const B = nodes[j];
        const dx = A.x - B.x;
        const dy = A.y - B.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const minDist = (A.r || 30) + (B.r || 30) + 14;
        if (dist < minDist) {
          moved = true;
          const ux = dx / dist;
          const uy = dy / dist;
          const push = (minDist - dist) * 0.62;
          A.x += ux * push;
          A.y += uy * push;
          B.x -= ux * push;
          B.y -= uy * push;
        }
      }
    }
    if (!moved) break;
  }

  return nodes;
}

// -------------------- adjacency for direct neighbors --------------------
function buildUndirectedAdj(edges) {
  const adj = new Map();
  const ensure = (id) => {
    const k = String(id);
    if (!adj.has(k)) adj.set(k, new Set());
    return adj.get(k);
  };
  for (const e of edges) {
    const a = String(e.source);
    const b = String(e.target);
    if (a === b) continue;
    ensure(a).add(b);
    ensure(b).add(a);
  }
  return adj;
}

function neighborsOneHop(selectedIds, adj) {
  const keep = new Set();
  for (const sid0 of selectedIds) {
    const sid = String(sid0);
    keep.add(sid);
    const neigh = adj.get(sid);
    if (!neigh) continue;
    for (const n of neigh.values()) keep.add(String(n));
  }
  return keep;
}

export default function NetworkGraph({ data }) {
  const canvasRef = useRef(null);

  const width = 1040;
  const height = 680;

  const [positions, setPositions] = useState(new Map());
  const [draggingNode, setDraggingNode] = useState(null);
  const [panning, setPanning] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  // zoom/pan
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);

  // shuffle
  const [layoutNonce, setLayoutNonce] = useState(0);

  // search
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);

  const { graduates, surveyData } = useSurveyData();

  const {
    nodesAll,
    edgesAll,
    respondentIdSet,
    graduatesIndex,
    groupedGraduates,
  } = useMemo(() => {
    const grads = Array.isArray(graduates) ? graduates : [];
    const answers = Array.isArray(surveyData) ? surveyData : [];

    const aliasMap = new Map();
    const addAlias = (key, id) => {
      const k = normalizeStr(key);
      if (!k) return;
      aliasMap.set(k, id);
      aliasMap.set(k.toLowerCase(), id);
    };

    const nodes = grads.map((g, idx) => {
      const id = makeGraduatePrimaryId(g, idx);
      const fullName = normalizeStr(g?.full_name);
      const cohort = normalizeStr(g?.cohort) || "לא ידוע";

      addAlias(String(idx), id);
      addAlias(fullName, id);
      addAlias(g?.id, id);
      addAlias(g?.uid, id);
      addAlias(g?.email, id);

      return { id: String(id), label: fullName, cohort };
    });

    const tokens = new Set();
    for (const row of answers) {
      const name =
        normalizeStr(row?.full_name) ||
        normalizeStr(row?.FullName) ||
        normalizeStr(row?.name) ||
        normalizeStr(row?.שם_מלא) ||
        normalizeStr(row?.["שם מלא"]) ||
        normalizeStr(row?.graduate_name);

      const id =
        normalizeStr(row?.graduate_id) ||
        normalizeStr(row?.id) ||
        normalizeStr(row?.uid) ||
        normalizeStr(row?.email);

      if (name) tokens.add(name);
      if (id) tokens.add(id);
    }

    const respondentIds = new Set();
    if (Array.isArray(data?.respondentIds) && data.respondentIds.length > 0) {
      data.respondentIds.forEach((x) => respondentIds.add(String(x)));
    } else {
      for (const t of tokens) {
        const mapped = aliasMap.get(t) ?? aliasMap.get(t.toLowerCase());
        if (mapped) respondentIds.add(String(mapped));
      }
    }

    const rawEdges = Array.isArray(data?.edges) ? data.edges : [];
    if (respondentIds.size === 0 && rawEdges.length > 0) {
      for (const e of rawEdges) {
        if (e?.source == null) continue;
        const s0 = String(e.source);
        const mapped = aliasMap.get(s0) ?? aliasMap.get(s0.toLowerCase()) ?? s0;
        respondentIds.add(String(mapped));
      }
    }

    const edges = buildEdgesForDraw(
      Array.isArray(data?.edges) ? data.edges : [],
      aliasMap,
    );

    const gIndex = nodes
      .map((n) => ({ id: n.id, name: n.label, cohort: n.cohort }))
      .filter((x) => x.name)
      .sort((a, b) => a.name.localeCompare(b.name, "he"));

    const groupsMap = new Map();
    for (const g of gIndex) {
      const c = g.cohort || "לא ידוע";
      if (!groupsMap.has(c)) groupsMap.set(c, []);
      groupsMap.get(c).push(g);
    }
    for (const [c, arr] of groupsMap.entries()) {
      arr.sort((a, b) => a.name.localeCompare(b.name, "he"));
      groupsMap.set(c, arr);
    }
    const grouped = Array.from(groupsMap.entries())
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]), "he"))
      .map(([cohort, gradsArr]) => ({
        cohort,
        grads: gradsArr,
      }));

    return {
      nodesAll: nodes,
      edgesAll: edges,
      respondentIdSet: respondentIds,
      graduatesIndex: gIndex,
      groupedGraduates: grouped,
    };
  }, [graduates, surveyData, data?.edges, data?.respondentIds]);

  const isRespondent = (id) => respondentIdSet.has(String(id));
  const adj = useMemo(() => buildUndirectedAdj(edgesAll), [edgesAll]);

  // ✅ "ניקוי מלבד בחירה" קורה אוטומטית
  const visibleIdSet = useMemo(() => {
    if (selectedIds.size === 0)
      return new Set(nodesAll.map((n) => String(n.id)));
    return neighborsOneHop(selectedIds, adj);
  }, [selectedIds, adj, nodesAll]);

  const nodesVisible = useMemo(
    () => nodesAll.filter((n) => visibleIdSet.has(String(n.id))),
    [nodesAll, visibleIdSet],
  );
  const edgesVisible = useMemo(
    () =>
      edgesAll.filter(
        (e) =>
          visibleIdSet.has(String(e.source)) &&
          visibleIdSet.has(String(e.target)),
      ),
    [edgesAll, visibleIdSet],
  );

  // layout
  useEffect(() => {
    if (!nodesAll.length) return;
    const tmp = nodesAll.map((n) => ({
      ...n,
      x: 0,
      y: 0,
    }));
    layoutForceStatic(tmp, edgesAll, width, height);

    const pos = new Map();
    tmp.forEach((n) =>
      pos.set(String(n.id), {
        x: n.x,
        y: n.y,
        size: n.size || 62,
        r: n.r || 31,
      }),
    );
    setPositions(pos);
  }, [nodesAll, edgesAll, width, height, layoutNonce]);

  // close search popover on outside click
  useEffect(() => {
    function onDown(e) {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target)) setIsSearchOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // transforms
  const screenToWorld = (sx, sy) => ({
    x: (sx - offset.x) / zoom,
    y: (sy - offset.y) / zoom,
  });

  // collision resolve for dragging/centering
  const resolveCollisionForOne = (id, candidate, map) => {
    const me = map.get(id);
    if (!me) return candidate;

    let x = candidate.x;
    let y = candidate.y;
    const rMe = (me.size || 60) / 2;

    for (const otherId0 of visibleIdSet.values()) {
      const otherId = String(otherId0);
      if (otherId === id) continue;
      const p = map.get(otherId);
      if (!p) continue;

      const rO = (p.size || 60) / 2;
      const dx = x - p.x;
      const dy = y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
      const minDist = rMe + rO + 14;

      if (dist < minDist) {
        const ux = dx / dist;
        const uy = dy / dist;
        const push = minDist - dist;
        x += ux * push;
        y += uy * push;
      }
    }

    x = Math.max(30 + rMe, Math.min(width - 30 - rMe, x));
    y = Math.max(30 + rMe, Math.min(height - 30 - rMe, y));
    return { x, y };
  };

  const moveToCenter = (id) => {
    const sid = String(id);
    setPositions((prev) => {
      const next = new Map(prev);
      const p = next.get(sid);
      if (!p) return prev;

      const centerWorld = { x: width / 2, y: height / 2 };
      const resolved = resolveCollisionForOne(sid, centerWorld, next);
      p.x = resolved.x;
      p.y = resolved.y;
      next.set(sid, p);

      for (let pass = 0; pass < 6; pass++) {
        for (const otherId0 of visibleIdSet.values()) {
          const otherId = String(otherId0);
          if (otherId === sid) continue;
          const op = next.get(otherId);
          if (!op) continue;

          const rS = (p.size || 60) / 2;
          const rO = (op.size || 60) / 2;
          const dx = op.x - p.x;
          const dy = op.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
          const minDist = rS + rO + 16;

          if (dist < minDist) {
            const ux = dx / dist;
            const uy = dy / dist;
            const push = (minDist - dist) * 0.95;
            op.x += ux * push;
            op.y += uy * push;
            op.x = Math.max(30 + rO, Math.min(width - 30 - rO, op.x));
            op.y = Math.max(30 + rO, Math.min(height - 30 - rO, op.y));
            next.set(otherId, op);
          }
        }
      }
      return next;
    });
  };

  // selection toggle
  const toggleSelect = (id, { recenter = true } = {}) => {
    const sid = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
    setLastSelectedId(sid);
    if (recenter) moveToCenter(sid);
  };

  // search filtered
  const filteredSearch = useMemo(() => {
    const q = normalizeStr(searchTerm).toLowerCase();
    if (!isSearchOpen) return [];
    if (!q) return graduatesIndex.slice(0, 30);
    return graduatesIndex
      .filter((g) => g.name.toLowerCase().includes(q))
      .slice(0, 30);
  }, [searchTerm, graduatesIndex, isSearchOpen]);

  const handlePickFromSearch = (g) => {
    toggleSelect(g.id, { recenter: true });
    setSearchTerm("");
    setIsSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus?.());
  };

  // draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !positions.size) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    for (const link of edgesVisible) {
      const a = positions.get(String(link.source));
      const b = positions.get(String(link.target));
      if (!a || !b) continue;

      const mutual = link.weight === 2;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      ctx.lineWidth = mutual ? 3.6 : 1.1;
      ctx.strokeStyle = mutual ? "rgba(0,0,0,0.52)" : "rgba(175,175,175,0.20)";
      ctx.stroke();
    }

    // 2. Draw nodes
    for (const node of nodesVisible) {
      const id = String(node.id);
      const p = positions.get(id);
      if (!p) continue;

      const size = p.size || nodeSize(node);
      const r = size / 2;

      const fill = getCohortColor(node.cohort);
      const resp = isRespondent(id);

      const hovered = hoveredId === id;
      const selected = selectedIds.has(id);

      ctx.beginPath();

      if (resp) {
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
      } else {
        const half = r;
        const x0 = p.x - half;
        const y0 = p.y - half;
        const rad = 11;

        ctx.moveTo(x0 + rad, y0);
        ctx.lineTo(x0 + 2 * half - rad, y0);
        ctx.quadraticCurveTo(x0 + 2 * half, y0, x0 + 2 * half, y0 + rad);
        ctx.lineTo(x0 + 2 * half, y0 + 2 * half - rad);
        ctx.quadraticCurveTo(
          x0 + 2 * half,
          y0 + 2 * half,
          x0 + 2 * half - rad,
          y0 + 2 * half,
        );
        ctx.lineTo(x0 + rad, y0 + 2 * half);
        ctx.quadraticCurveTo(x0, y0 + 2 * half, x0, y0 + 2 * half - rad);
        ctx.lineTo(x0, y0 + rad);
        ctx.quadraticCurveTo(x0, y0, x0 + rad, y0);

        ctx.fillStyle = fill;
        ctx.fill();
      }

      // stroke
      ctx.lineWidth = selected ? 4.5 : hovered ? 3.5 : 1.2;
      ctx.strokeStyle = selected
        ? "#2563eb"
        : hovered
          ? "#4b5563"
          : "rgba(0,0,0,0.12)";
      ctx.stroke();
    }

    // 3. Draw labels ON TOP of all nodes
    for (const node of nodesVisible) {
      const id = String(node.id);
      const p = positions.get(id);
      if (!p) continue;

      const size = p.size || nodeSize(node);
      const hovered = hoveredId === id;
      const selected = selectedIds.has(id);

      if (selected || hovered || zoom > 0.6) {
        drawWrappedText(ctx, node.label, p.x, p.y, size - 16, size - 16);
      }
    }

    ctx.restore();
  }, [
    nodesVisible,
    edgesVisible,
    positions,
    width,
    height,
    hoveredId,
    selectedIds,
    respondentIdSet,
    visibleIdSet,
    zoom,
    offset,
  ]);

  // hit test
  const pickNodeAtWorld = (wx, wy) => {
    let best = null;
    let bestD2 = Infinity;

    for (const node of nodesVisible) {
      const id = String(node.id);
      const p = positions.get(id);
      if (!p) continue;

      const size = p.size;
      const r = size / 2;
      const resp = isRespondent(id);

      let inside = false;
      if (resp) {
        const dx = p.x - wx;
        const dy = p.y - wy;
        const d2 = dx * dx + dy * dy;
        inside = d2 <= r * r;
        if (inside && d2 < bestD2) {
          bestD2 = d2;
          best = node;
        }
      } else {
        const x0 = p.x - r;
        const y0 = p.y - r;
        inside = wx >= x0 && wx <= x0 + 2 * r && wy >= y0 && wy <= y0 + 2 * r;
        if (inside) {
          const dx = p.x - wx;
          const dy = p.y - wy;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD2) {
            bestD2 = d2;
            best = node;
          }
        }
      }
    }
    return best;
  };

  // mouse
  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { x: wx, y: wy } = screenToWorld(sx, sy);

    const picked = pickNodeAtWorld(wx, wy);
    if (!picked) {
      setPanning({
        startX: sx,
        startY: sy,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
      });
      return;
    }

    const id = String(picked.id);
    const p = positions.get(id);
    if (!p) return;

    toggleSelect(id, { recenter: true });
    setDraggingNode({ id, offsetX: wx - p.x, offsetY: wy - p.y });
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (panning) {
      setOffset({
        x: panning.startOffsetX + (sx - panning.startX),
        y: panning.startOffsetY + (sy - panning.startY),
      });
      return;
    }

    const { x: wx, y: wy } = screenToWorld(sx, sy);

    if (draggingNode) {
      setPositions((prev) => {
        const next = new Map(prev);
        const p = next.get(draggingNode.id);
        if (!p) return prev;

        const candidate = {
          x: wx - draggingNode.offsetX,
          y: wy - draggingNode.offsetY,
        };
        const resolved = resolveCollisionForOne(
          draggingNode.id,
          candidate,
          next,
        );
        p.x = resolved.x;
        p.y = resolved.y;
        next.set(draggingNode.id, p);
        return next;
      });
      return;
    }

    const picked = pickNodeAtWorld(wx, wy);
    setHoveredId(picked ? String(picked.id) : null);
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    setPanning(null);
  };

  const handleWheel = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const oldZoom = zoom;
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newZoom = clamp(oldZoom * factor, 0.45, 2.6);
    if (newZoom === oldZoom) return;

    const world = screenToWorld(sx, sy);
    setZoom(newZoom);
    setOffset({ x: sx - world.x * newZoom, y: sy - world.y * newZoom });
  };

  const handleShuffle = () => {
    setLayoutNonce((x) => x + 1);
    setTimeout(() => {
      if (lastSelectedId) moveToCenter(lastSelectedId);
    }, 0);
  };

  const zoomIn = () => setZoom((z) => clamp(z * 1.12, 0.45, 2.6));
  const zoomOut = () => setZoom((z) => clamp(z / 1.12, 0.45, 2.6));
  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const cursorStyle = draggingNode ? "grabbing" : panning ? "grabbing" : "grab";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          רשת קשרים – עונים (עיגול) / לא ענו (ריבוע)
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* TOP CONTROLS */}
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <Button variant="outline" onClick={handleShuffle}>
            ערבוב רשת
          </Button>

          <Button
            variant="outline"
            onClick={clearSelection}
            disabled={selectedIds.size === 0}
          >
            נקה בחירה
          </Button>

          <Button variant="outline" onClick={zoomOut}>
            זום -
          </Button>
          <Button variant="outline" onClick={zoomIn}>
            זום +
          </Button>
          <Button variant="outline" onClick={resetView}>
            איפוס תצוגה
          </Button>

          {/* SEARCH */}
          <div className="w-105 relative" ref={searchWrapRef}>
            <Input
              ref={searchInputRef}
              placeholder="חפש/י בוגר/ת לבחירה…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
            />

            {isSearchOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-sm max-h-70 overflow-auto">
                {filteredSearch.length > 0 ? (
                  filteredSearch.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handlePickFromSearch(g)}
                      className="w-full text-right px-3 py-2 hover:bg-gray-50 text-sm flex justify-between"
                    >
                      <span className="font-medium">
                        {g.name}{" "}
                        <span className="text-gray-500">({g.cohort})</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {selectedIds.has(String(g.id)) ? "נבחר" : ""}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-3 text-sm text-gray-500 text-center">
                    לא נמצאו תוצאות
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto text-xs text-gray-600 flex gap-4 items-center">
            <span>
              נבחרו: <span className="font-semibold">{selectedIds.size}</span>
            </span>
            <span>
              זום:{" "}
              <span className="font-semibold">{Math.round(zoom * 100)}%</span>
            </span>
            <span>
              <span className="inline-block w-3 h-3 rounded-full bg-gray-700 mr-1" />
              ענה = עיגול
            </span>
            <span>
              <span className="inline-block w-3 h-3 bg-gray-200 border border-gray-500 mr-1" />
              לא ענה = ריבוע
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          {/* COHORT CHECKBOX LIST */}
          <div className="w-85 shrink-0">
            <div className="border rounded-xl p-2">
              <div className="text-sm font-semibold mb-2">
                בחירת בוגרים לפי מחזור
              </div>

              {/* שינוי יחיד: פריסת הבחירה כמו במטריצה (כותרת מחזור + Grid) */}
              <div className="max-h-160 overflow-auto pr-1 space-y-6">
                {groupedGraduates.map((group) => (
                  <div key={group.cohort} className="space-y-3">
                    <div className="flex items-center gap-2 sticky top-0 bg-white py-1 z-10">
                      <div className="h-px bg-slate-200 flex-1" />
                      <Badge
                        variant="outline"
                        className="bg-white border-slate-300 text-slate-800 font-bold"
                        title={`מחזור ${group.cohort}`}
                      >
                        {group.cohort} ({group.grads.length})
                      </Badge>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {group.grads.map((g) => {
                        const checked = selectedIds.has(String(g.id));
                        const cid = domSafeId(`network-select-${g.id}`);
                        return (
                          <div
                            key={g.id}
                            className="flex items-center gap-2 group"
                          >
                            <Checkbox
                              id={cid}
                              checked={checked}
                              onCheckedChange={() =>
                                toggleSelect(g.id, { recenter: true })
                              }
                            />
                            <label
                              htmlFor={cid}
                              className={`text-[11px] cursor-pointer truncate transition-all ${
                                checked
                                  ? "font-bold text-blue-700"
                                  : "text-slate-600 group-hover:text-slate-900"
                              }`}
                              title={g.name}
                            >
                              {g.name}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-xs text-gray-500">
                שים לב: ברגע שבוחרים בוגר/ים – נשארים רק הם והשכנים הישירים
                שלהם.
              </div>
            </div>
          </div>

          {/* CANVAS */}
          <div className="flex-1">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                cursor: cursorStyle,
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
            />
            <div className="mt-2 text-xs text-gray-500">
              גלגלת = זום. גרירה על שטח ריק = Pan. גרירה על צומת = הזזה.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
