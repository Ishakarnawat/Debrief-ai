import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  FileText,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Check,
  Copy,
} from "lucide-react";

export default function ATSLeaderboardTable({
  candidates = [],
  jobTitle = "",
  onSelectCandidate,
  onOpenSideBySide,
  onOpenRedFlagDrawer,
  onPromoteCandidate,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRecommendation, setFilterRecommendation] = useState("all");
  const [sortBy, setSortBy] = useState("overall_score"); // "overall_score" | "hard_skills" | "experience" | "name"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"
  const [copiedToken, setCopiedToken] = useState(null);

  // Sorting handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Filtered & Sorted candidates list
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        // Search term filter
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          !q ||
          c.candidate_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.file_name?.toLowerCase().includes(q) ||
          (c.skills_matrix?.matched_skills &&
            c.skills_matrix.matched_skills.some((s) => s.toLowerCase().includes(q)));

        // Recommendation filter
        if (filterRecommendation === "qualified") {
          return matchesSearch && c.overall_match_score >= 75;
        }
        if (filterRecommendation !== "all") {
          return (
            matchesSearch &&
            c.hiring_recommendation?.toLowerCase() === filterRecommendation.toLowerCase()
          );
        }
        return matchesSearch;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        if (sortBy === "overall_score") {
          valA = a.overall_match_score || 0;
          valB = b.overall_match_score || 0;
        } else if (sortBy === "hard_skills") {
          valA = a.rubric_scores?.hard_skills || 0;
          valB = b.rubric_scores?.hard_skills || 0;
        } else if (sortBy === "experience") {
          valA = a.rubric_scores?.experience_relevance || 0;
          valB = b.rubric_scores?.experience_relevance || 0;
        } else if (sortBy === "name") {
          return sortOrder === "asc"
            ? (a.candidate_name || "").localeCompare(b.candidate_name || "")
            : (b.candidate_name || "").localeCompare(a.candidate_name || "");
        }

        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
  }, [candidates, searchTerm, filterRecommendation, sortBy, sortOrder]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredCandidates.length === 0) return;

    const headers = [
      "Rank",
      "Candidate Name",
      "Email",
      "File Name",
      "Overall ATS Score",
      "Hard Skills Score",
      "Experience Score",
      "Education Score",
      "Formatting Score",
      "Hiring Recommendation",
      "Matched Skills",
      "Missing Critical Skills",
      "Interview Token",
    ];

    const rows = filteredCandidates.map((c, index) => [
      index + 1,
      `"${c.candidate_name || "N/A"}"`,
      `"${c.email || "N/A"}"`,
      `"${c.file_name || "N/A"}"`,
      c.overall_match_score,
      c.rubric_scores?.hard_skills || 0,
      c.rubric_scores?.experience_relevance || 0,
      c.rubric_scores?.education_qualification || 0,
      c.rubric_scores?.formatting_clarity || 0,
      `"${c.hiring_recommendation || "N/A"}"`,
      `"${(c.skills_matrix?.matched_skills || []).join("; ")}"`,
      `"${(c.skills_matrix?.missing_critical_skills || []).join("; ")}"`,
      `"${c.interview_token || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ATS_Leaderboard_${jobTitle.replace(/\s+/g, "_") || "Screening"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (filteredCandidates.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredCandidates, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute(
      "download",
      `ATS_Leaderboard_${jobTitle.replace(/\s+/g, "_") || "Screening"}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copyInterviewLink = (token) => {
    const url = `${window.location.origin}/interview/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getRankBadge = (index) => {
    if (index === 0) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-slate-950 font-bold flex items-center justify-center text-xs shadow-md shadow-amber-500/20 ring-1 ring-amber-400">
          🥇 1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-bold flex items-center justify-center text-xs shadow-md shadow-slate-300/20 ring-1 ring-slate-200">
          🥈 2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-white font-bold flex items-center justify-center text-xs shadow-md ring-1 ring-amber-600">
          🥉 3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-surface-800 text-slate-400 font-mono flex items-center justify-center text-xs border border-white/[0.06]">
        #{index + 1}
      </span>
    );
  };

  const getRecommendationBadge = (rec) => {
    if (rec === "Strong Hire") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          Strong Hire
        </span>
      );
    }
    if (rec === "Hire") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
          Hire
        </span>
      );
    }
    if (rec === "Review") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          Review
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
        Reject
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter & Export Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-900/90 border border-white/[0.08]">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate name, email, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-800 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-surface-800 p-1 rounded-xl border border-white/[0.08] text-xs">
            <button
              onClick={() => setFilterRecommendation("all")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterRecommendation === "all"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({candidates.length})
            </button>
            <button
              onClick={() => setFilterRecommendation("qualified")}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                filterRecommendation === "qualified"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap size={12} />
              <span>Qualified (&ge;75%)</span>
            </button>
            <button
              onClick={() => setFilterRecommendation("Strong Hire")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterRecommendation === "Strong Hire"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Strong Hire
            </button>
            <button
              onClick={() => setFilterRecommendation("Review")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterRecommendation === "Review"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Review
            </button>
          </div>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCSV}
              disabled={filteredCandidates.length === 0}
              className="px-3 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Export ATS Leaderboard to CSV"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              disabled={filteredCandidates.length === 0}
              className="px-3 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Export Full JSON Telemetry"
            >
              <FileText size={13} />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="rounded-2xl bg-surface-900 border border-white/[0.08] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-surface-850 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Rank</th>
                <th
                  onClick={() => handleSort("name")}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Candidate</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("overall_score")}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ATS Match</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("hard_skills")}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors hidden md:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Hard Skills</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("experience")}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Experience</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4">Skill Matrix</th>
                <th className="py-3.5 px-4">Recommendation</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-surface-800 mx-auto flex items-center justify-center text-slate-400 mb-3">
                      <Search size={20} />
                    </div>
                    <p className="text-sm font-medium text-slate-400">No candidates match your filters.</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Try adjusting the search query or upload more resumes to screen.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate, index) => {
                  const score = candidate.overall_match_score || 0;
                  const isQualified = score >= 75;
                  const hasFlaggedAttack = candidate.sanitization_report?.is_suspicious;

                  return (
                    <tr
                      key={candidate.interview_token || index}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 font-mono">{getRankBadge(index)}</td>

                      {/* Candidate Name & Info */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white group-hover:text-brand-300 transition-colors">
                              {candidate.candidate_name || "Unknown Candidate"}
                            </span>
                            {hasFlaggedAttack && (
                              <span
                                title="Prompt Injection Attempt Neutralized"
                                className="text-rose-400 p-0.5 rounded bg-rose-500/10"
                              >
                                <ShieldAlert size={14} />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {candidate.email ? candidate.email : candidate.file_name}
                          </div>
                        </div>
                      </td>

                      {/* Overall ATS Score */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`px-3 py-1 rounded-xl font-display font-bold text-sm ${
                              score >= 80
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : score >= 70
                                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                : score >= 60
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {score}%
                          </div>
                          {isQualified && (
                            <span title="Autonomous Video Interview Qualified">
                              <Zap size={14} className="text-emerald-400" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hard Skills */}
                      <td className="py-4 px-4 hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="font-mono text-xs text-slate-200">
                            {candidate.rubric_scores?.hard_skills || 0}%
                          </div>
                          <div className="w-16 h-1 rounded-full bg-surface-800 overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${candidate.rubric_scores?.hard_skills || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Experience */}
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="font-mono text-xs text-slate-200">
                            {candidate.rubric_scores?.experience_relevance || 0}%
                          </div>
                          <div className="w-16 h-1 rounded-full bg-surface-800 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{
                                width: `${candidate.rubric_scores?.experience_relevance || 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Skills Matrix Summary */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            ✓ {candidate.skills_matrix?.matched_skills?.length || 0}
                          </span>
                          <span className="text-slate-500">/</span>
                          <span className="text-rose-400 flex items-center gap-0.5">
                            ✕ {candidate.skills_matrix?.missing_critical_skills?.length || 0}
                          </span>
                        </div>
                      </td>

                      {/* Recommendation */}
                      <td className="py-4 px-4">
                        {getRecommendationBadge(candidate.hiring_recommendation)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Scorecard */}
                          <button
                            onClick={() => onSelectCandidate && onSelectCandidate(candidate)}
                            className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border border-white/[0.06] transition-colors"
                            title="View Detailed ATS Scorecard"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Side-by-Side JD vs Resume */}
                          <button
                            onClick={() => onOpenSideBySide && onOpenSideBySide(candidate)}
                            className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-brand-300 border border-white/[0.06] transition-colors"
                            title="Side-by-Side JD vs Resume Verification"
                          >
                            <FileText size={14} />
                          </button>

                          {/* Red Flag Warning Drawer */}
                          <button
                            onClick={() => onOpenRedFlagDrawer && onOpenRedFlagDrawer(candidate)}
                            className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-amber-400 hover:text-amber-300 border border-white/[0.06] transition-colors"
                            title="Candidate Red Flag & Risk Audit"
                          >
                            <AlertTriangle size={14} />
                          </button>

                          {/* Promote / Token Copy */}
                          {isQualified && candidate.interview_token && (
                            <button
                              onClick={() => copyInterviewLink(candidate.interview_token)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                              title={
                                copiedToken === candidate.interview_token
                                  ? "Copied!"
                                  : "Copy Video Interview Link"
                              }
                            >
                              {copiedToken === candidate.interview_token ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          )}

                          {isQualified && onPromoteCandidate && (
                            <button
                              onClick={() => onPromoteCandidate(candidate)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                              title="Advance to Live AI Video Interview Room"
                            >
                              <span>Interview</span>
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Count */}
        <div className="px-6 py-3 border-t border-white/[0.06] bg-surface-850 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Showing {filteredCandidates.length} of {candidates.length} evaluated resumes</span>
          <span className="text-emerald-400">
            {candidates.filter((c) => c.overall_match_score >= 75).length} Auto-Qualified for Video Interview
          </span>
        </div>
      </div>
    </div>
  );
}
