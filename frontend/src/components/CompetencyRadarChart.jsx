import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const DEFAULT_PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

/**
 * CompetencyRadarChart
 * Visualizes 5 core assessment dimensions:
 * Technical Accuracy, Communication Clarity, Problem Solving, STAR Compliance, Confidence.
 * Supports both single candidate mode (via `rubric` prop) and multi-candidate overlay (via `candidates` prop).
 */
export default function CompetencyRadarChart({
  rubric,
  candidates = null,
  benchmark = 7.5,
  size = "normal",
}) {
  const isMulti = Array.isArray(candidates) && candidates.length > 0;

  const subjects = [
    { key: "technicalAccuracy", subject: "Tech Accuracy" },
    { key: "communicationClarity", subject: "Communication" },
    { key: "problemSolving", subject: "Problem Solving" },
    { key: "starCompliance", subject: "STAR Method" },
    { key: "confidenceBodyLanguage", subject: "Confidence" },
  ];

  let data = [];
  if (isMulti) {
    data = subjects.map((s) => {
      const row = {
        subject: s.subject,
        benchmark,
        fullMark: 10,
      };
      candidates.forEach((cand, idx) => {
        const val = Number(cand.rubric?.[s.key] ?? 7.5);
        row[`cand_${idx}`] = val;
      });
      return row;
    });
  } else {
    data = subjects.map((s) => ({
      subject: s.subject,
      score: Number(rubric?.[s.key] ?? 7.5),
      benchmark,
      fullMark: 10,
    }));
  }

  const chartHeight = size === "small" ? 220 : size === "large" ? 340 : 280;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius={size === "small" ? "65%" : "72%"} data={data}>
            <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#94a3b8", fontSize: size === "small" ? 10 : 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 10]}
              tick={{ fill: "#64748b", fontSize: 9 }}
              stroke="rgba(255, 255, 255, 0.05)"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#f8fafc",
              }}
              formatter={(value, name) => {
                if (name === "benchmark") return [`${value} / 10`, "Industry Baseline"];
                if (isMulti && name.startsWith("cand_")) {
                  const idx = parseInt(name.replace("cand_", ""), 10);
                  const candName = candidates[idx]?.name || `Candidate ${idx + 1}`;
                  return [`${value} / 10`, candName];
                }
                return [`${value} / 10`, "Candidate Score"];
              }}
            />
            {/* Benchmark outline */}
            <Radar
              name="benchmark"
              dataKey="benchmark"
              stroke="#64748b"
              strokeDasharray="3 3"
              fill="#64748b"
              fillOpacity={0.08}
            />
            {/* Multi or Single Candidate Radars */}
            {isMulti ? (
              candidates.map((cand, idx) => {
                const color = cand.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
                return (
                  <Radar
                    key={idx}
                    name={`cand_${idx}`}
                    dataKey={`cand_${idx}`}
                    stroke={color}
                    strokeWidth={2}
                    fill={color}
                    fillOpacity={0.25}
                  />
                );
              })
            ) : (
              <Radar
                name="score"
                dataKey="score"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.4}
              />
            )}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 mt-2 font-medium">
        {isMulti ? (
          candidates.map((cand, idx) => {
            const color = cand.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
            return (
              <div key={idx} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
                />
                <span className="text-slate-200 font-semibold">{cand.name}</span>
              </div>
            );
          })
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            <span className="text-slate-200 font-semibold">Candidate Assessment</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 border-b-2 border-dashed border-slate-400 inline-block" />
          <span>Industry Baseline ({benchmark}/10)</span>
        </div>
      </div>
    </div>
  );
}
