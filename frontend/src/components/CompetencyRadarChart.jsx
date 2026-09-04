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

/**
 * CompetencyRadarChart
 * Visualizes 5 core assessment dimensions:
 * Technical Accuracy, Communication Clarity, Problem Solving, STAR Compliance, Confidence
 */
export default function CompetencyRadarChart({ rubric, benchmark = 7.5, size = "normal" }) {
  const data = [
    {
      subject: "Tech Accuracy",
      score: Number(rubric?.technicalAccuracy ?? 7.5),
      benchmark,
      fullMark: 10,
    },
    {
      subject: "Communication",
      score: Number(rubric?.communicationClarity ?? 7.8),
      benchmark,
      fullMark: 10,
    },
    {
      subject: "Problem Solving",
      score: Number(rubric?.problemSolving ?? 7.2),
      benchmark,
      fullMark: 10,
    },
    {
      subject: "STAR Method",
      score: Number(rubric?.starCompliance ?? 8.0),
      benchmark,
      fullMark: 10,
    },
    {
      subject: "Confidence",
      score: Number(rubric?.confidenceBodyLanguage ?? 8.2),
      benchmark,
      fullMark: 10,
    },
  ];

  const chartHeight = size === "small" ? 220 : 280;

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
              formatter={(value, name) => [
                `${value} / 10`,
                name === "score" ? "Candidate Score" : "Industry Benchmark",
              ]}
            />
            {/* Benchmark outline */}
            <Radar
              name="benchmark"
              dataKey="benchmark"
              stroke="#64748b"
              strokeDasharray="3 3"
              fill="#64748b"
              fillOpacity={0.1}
            />
            {/* Candidate Radar */}
            <Radar
              name="score"
              dataKey="score"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-5 text-xs text-slate-400 mt-1 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          <span className="text-slate-200 font-semibold">Candidate Assessment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 border-b-2 border-dashed border-slate-400 inline-block" />
          <span>Industry Baseline ({benchmark}/10)</span>
        </div>
      </div>
    </div>
  );
}
