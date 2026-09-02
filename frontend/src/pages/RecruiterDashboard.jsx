import { useState, useEffect } from "react";
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Copy,
  ExternalLink,
  Kanban,
  Table as TableIcon,
  Video,
  ChevronRight,
  Eye,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  Check,
  Briefcase,
  Calendar,
} from "lucide-react";
import { useRecruiter } from "../hooks/useAnalyze";
import CandidateReviewModal from "../components/CandidateReviewModal";

export default function RecruiterDashboard() {
  const {
    loading,
    error,
    candidates,
    stats,
    fetchCandidates,
    updateCandidateStatus,
    createInvitation,
  } = useRecruiter();

  // View mode: "table" | "kanban"
  const [viewMode, setViewMode] = useState("table");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all"); // "all" | "low" | "flagged"
  const [sortBy, setSortBy] = useState("hiring_score"); // "hiring_score" | "integrity_score" | "newest"

  // Selected Candidate for Deep Dive Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Invitation Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState("Senior Full Stack Software Engineer");
  const [inviteCompany, setInviteCompany] = useState("Debrief.ai Partner");
  const [inviteStrict, setInviteStrict] = useState(true);
  const [inviteCustomQ, setInviteCustomQ] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchCandidates({ sortBy });
  }, [sortBy]);

  // Extract unique roles for filter dropdown
  const uniqueRoles = Array.from(
    new Set(candidates.map((c) => c.targetRole).filter(Boolean))
  );

  // Client-side filtering
  const filteredCandidates = candidates.filter((candidate) => {
    if (selectedRole !== "all" && candidate.targetRole !== selectedRole) return false;
    if (selectedStatus !== "all" && candidate.status !== selectedStatus) return false;

    if (selectedRisk === "flagged") {
      const isFlagged =
        candidate.proctoring?.riskLevel === "high" ||
        (candidate.proctoring?.tabSwitches || 0) >= 1 ||
        candidate.proctoring?.multipleFacesDetected;
      if (!isFlagged) return false;
    } else if (selectedRisk === "low") {
      if (candidate.proctoring?.riskLevel !== "low") return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = candidate.candidateName?.toLowerCase().includes(q);
      const matchEmail = candidate.candidateEmail?.toLowerCase().includes(q);
      const matchRole = candidate.targetRole?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRole) return false;
    }

    return true;
  });

  // Handle invitation creation
  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await createInvitation({
        role: inviteRole,
        companyName: inviteCompany,
        strictMode: inviteStrict,
        questions: inviteCustomQ.trim()
          ? [inviteCustomQ.trim()]
          : [
              "Tell me about a time you solved a major technical bottleneck.",
              "Walk me through your most complex architectural decision.",
            ],
      });

      const fullUrl = `${window.location.origin}${res.inviteUrl}`;
      setGeneratedLink(fullUrl);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleUpdateCandidate = async (id, updatePayload) => {
    const updated = await updateCandidateStatus(id, updatePayload);
    if (selectedCandidate && selectedCandidate._id === id) {
      setSelectedCandidate({ ...selectedCandidate, ...updated });
    }
  };

  const kanbanColumns = [
    { id: "Screening", label: "Initial Screening", color: "border-brand-500/40 text-brand-400" },
    { id: "Shortlisted", label: "Shortlisted Candidates", color: "border-emerald-500/40 text-emerald-400" },
    { id: "Under Review", label: "Under Review / Hold", color: "border-amber-500/40 text-amber-400" },
    { id: "Rejected", label: "Archived / Rejected", color: "border-red-500/40 text-red-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
              Recruiter Screening Portal
            </span>
            <span className="text-xs text-slate-400">• Anti-Cheat & Proctoring Hub</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight">
            Candidate Pipeline & Screening
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Evaluate asynchronous video interviews, review anti-cheat audit logs, and rank applicants objectively.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => fetchCandidates({ sortBy })}
            title="Refresh candidate data"
            className="p-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => {
              setShowInviteModal(true);
              setGeneratedLink("");
            }}
            className="btn-primary inline-flex items-center gap-2 text-xs font-semibold py-2.5 px-4 shadow-lg shadow-brand-500/20 rounded-xl"
          >
            <Plus size={15} />
            <span>Generate Interview Link</span>
          </button>
        </div>
      </div>

      {/* Recruiter Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 bg-surface-800/70 border border-white/[0.08] rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white leading-tight">
              {stats?.totalCandidates ?? candidates.length}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Total Candidates Screened</div>
          </div>
        </div>

        <div className="card p-4 bg-surface-800/70 border border-white/[0.08] rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Award size={22} />
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white leading-tight">
              {stats?.avgHiringScore ?? 78}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Average AI Hiring Score</div>
          </div>
        </div>

        <div className="card p-4 bg-surface-800/70 border border-white/[0.08] rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white leading-tight">
              {stats?.shortlistedCount ?? candidates.filter((c) => c.status === "Shortlisted").length}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Shortlisted for Round 2</div>
          </div>
        </div>

        <div className="card p-4 bg-surface-800/70 border border-white/[0.08] rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white leading-tight">
              {stats?.flaggedCount ?? candidates.filter((c) => (c.proctoring?.tabSwitches || 0) > 0 || c.proctoring?.riskLevel === "high").length}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Proctoring Alerts / Flagged</div>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Controls Bar */}
      <div className="card p-4 bg-surface-800/80 border border-white/[0.08] rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate by name, email, or role..."
              className="w-full bg-surface-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-surface-900 p-1 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-brand-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TableIcon size={13} />
              <span>Leaderboard Table</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === "kanban"
                  ? "bg-brand-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Kanban size={13} />
              <span>Pipeline Kanban</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/[0.06] text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 mr-1">
            <Filter size={13} />
            <span>Filters:</span>
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-surface-900 border border-white/10 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
          >
            <option value="all">All Job Roles</option>
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-surface-900 border border-white/10 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
          >
            <option value="all">All Stages</option>
            <option value="Screening">Screening</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Under Review">Under Review</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Proctoring Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="bg-surface-900 border border-white/10 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
          >
            <option value="all">All Proctoring Statuses</option>
            <option value="low">Clean Sessions (Low Risk)</option>
            <option value="flagged">Flagged Violations Only</option>
          </select>

          {/* Sort By */}
          <div className="ml-auto flex items-center gap-1.5">
            <ArrowUpDown size={12} className="text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-900 border border-white/10 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
            >
              <option value="hiring_score">Sort: Highest AI Score</option>
              <option value="integrity_score">Sort: Highest Integrity</option>
              <option value="newest">Sort: Most Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content View: Table vs Kanban */}
      {viewMode === "table" ? (
        <div className="card bg-surface-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-surface-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4 text-center">AI Hire Score</th>
                  <th className="py-3.5 px-4 text-center">Proctoring Integrity</th>
                  <th className="py-3.5 px-4 text-center">Anti-Cheat Risk</th>
                  <th className="py-3.5 px-4 text-center">Stage</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No candidates found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const score = Math.round(candidate.hiring_score || 0);
                    const integrity = candidate.proctoring?.integrityScore ?? 100;
                    const tabSwitches = candidate.proctoring?.tabSwitches || 0;
                    const isFlagged =
                      candidate.proctoring?.riskLevel === "high" ||
                      tabSwitches >= 2 ||
                      candidate.proctoring?.multipleFacesDetected;

                    return (
                      <tr
                        key={candidate._id}
                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        {/* Candidate Info */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-surface-700 border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0 group-hover:border-brand-500/40 transition-colors">
                              {candidate.candidateName
                                ? candidate.candidateName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase()
                                : "CA"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white text-sm truncate">
                                {candidate.candidateName || "Candidate"}
                              </p>
                              <p className="text-slate-400 text-xs truncate">
                                {candidate.candidateEmail || "applicant@example.com"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          <span className="text-slate-300 font-medium truncate block max-w-xs">
                            {candidate.targetRole || "Software Engineer"}
                          </span>
                        </td>

                        {/* AI Hiring Score */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`font-display font-bold text-sm px-2.5 py-0.5 rounded-md ${
                                score >= 80
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : score >= 65
                                  ? "bg-brand-500/15 text-brand-400"
                                  : score >= 50
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-red-500/15 text-red-400"
                              }`}
                            >
                              {score}%
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              {candidate.recommendation || "Evaluated"}
                            </span>
                          </div>
                        </td>

                        {/* Integrity Score */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`font-mono font-semibold ${
                              integrity >= 85
                                ? "text-emerald-400"
                                : integrity >= 70
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {integrity}%
                          </span>
                        </td>

                        {/* Anti-Cheat Risk Badge */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                              isFlagged
                                ? "bg-red-500/15 text-red-400 border-red-500/30"
                                : tabSwitches > 0
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {isFlagged ? (
                              <ShieldAlert size={12} />
                            ) : (
                              <ShieldCheck size={12} />
                            )}
                            <span>
                              {isFlagged
                                ? `Flagged (${tabSwitches} tabs)`
                                : tabSwitches > 0
                                ? `Warning (${tabSwitches} tabs)`
                                : "Clean"}
                            </span>
                          </span>
                        </td>

                        {/* Status Stage */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              candidate.status === "Shortlisted"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                : candidate.status === "Rejected"
                                ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                : candidate.status === "Under Review"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                : "bg-surface-700 text-slate-300"
                            }`}
                          >
                            {candidate.status || "Screening"}
                          </span>
                        </td>

                        {/* Action Button */}
                        <td className="py-4 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidate(candidate);
                            }}
                            className="btn-ghost text-xs py-1.5 px-3 border border-white/10 hover:border-brand-500/40 inline-flex items-center gap-1"
                          >
                            <span>Review</span>
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Pipeline View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colCandidates = filteredCandidates.filter(
              (c) => (c.status || "Screening") === col.id
            );

            return (
              <div
                key={col.id}
                className="bg-surface-900 border border-white/[0.08] rounded-2xl p-4 space-y-3 min-h-[420px] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full border-2 ${col.color}`} />
                    <h3 className="font-semibold text-white text-xs">{col.label}</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-surface-800 px-2 py-0.5 rounded-md">
                    {colCandidates.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[620px] pr-1">
                  {colCandidates.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-slate-600 text-xs border border-dashed border-white/5 rounded-xl">
                      No candidates in this stage
                    </div>
                  ) : (
                    colCandidates.map((candidate) => {
                      const score = Math.round(candidate.hiring_score || 0);
                      const isFlagged =
                        candidate.proctoring?.riskLevel === "high" ||
                        (candidate.proctoring?.tabSwitches || 0) >= 1;

                      return (
                        <div
                          key={candidate._id}
                          onClick={() => setSelectedCandidate(candidate)}
                          className="p-3.5 rounded-xl bg-surface-800/80 hover:bg-surface-700/80 border border-white/5 hover:border-brand-500/40 transition-all cursor-pointer space-y-2.5 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-white text-xs group-hover:text-brand-400 transition-colors">
                                {candidate.candidateName || "Candidate"}
                              </h4>
                              <p className="text-slate-400 text-[11px] truncate mt-0.5">
                                {candidate.targetRole || "Software Engineer"}
                              </p>
                            </div>
                            <span
                              className={`text-xs font-display font-bold px-2 py-0.5 rounded ${
                                score >= 80
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : score >= 65
                                  ? "bg-brand-500/15 text-brand-400"
                                  : "bg-amber-500/15 text-amber-400"
                              }`}
                            >
                              {score}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span
                              className={`inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded ${
                                isFlagged
                                  ? "bg-red-500/15 text-red-400"
                                  : "bg-emerald-500/10 text-emerald-400"
                              }`}
                            >
                              {isFlagged ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
                              <span>{isFlagged ? "Alerts" : "Clean"}</span>
                            </span>

                            <span className="text-slate-500 font-mono text-[10px]">
                              Integrity: {candidate.proctoring?.integrityScore ?? 100}%
                            </span>
                          </div>

                          {/* Quick stage transition button */}
                          <div
                            className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>Move to:</span>
                            <div className="flex items-center gap-1">
                              {col.id !== "Shortlisted" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateCandidate(candidate._id, {
                                      status: "Shortlisted",
                                    })
                                  }
                                  className="px-1.5 py-0.5 rounded bg-surface-700 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition-colors"
                                >
                                  Shortlist
                                </button>
                              )}
                              {col.id !== "Rejected" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateCandidate(candidate._id, {
                                      status: "Rejected",
                                    })
                                  }
                                  className="px-1.5 py-0.5 rounded bg-surface-700 hover:bg-red-500 hover:text-white text-slate-300 transition-colors"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Deep-Dive Screening Modal */}
      {selectedCandidate && (
        <CandidateReviewModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onUpdateStatus={handleUpdateCandidate}
        />
      )}

      {/* Generate Interview Link Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-surface-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <LinkIcon size={18} className="text-brand-400" />
                <h3 className="font-display font-bold text-lg text-white">
                  Create Screening Interview Link
                </h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-7 h-7 rounded-lg bg-surface-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Job Position / Role
                </label>
                <input
                  type="text"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  required
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Hiring Organization / Company Name
                </label>
                <input
                  type="text"
                  value={inviteCompany}
                  onChange={(e) => setInviteCompany(e.target.value)}
                  placeholder="e.g. Acme Labs"
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Interview Question (Optional)
                </label>
                <textarea
                  value={inviteCustomQ}
                  onChange={(e) => setInviteCustomQ(e.target.value)}
                  rows={2}
                  placeholder="Leave empty to use standardized behavioral & technical questions..."
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="strictMode"
                  checked={inviteStrict}
                  onChange={(e) => setInviteStrict(e.target.checked)}
                  className="rounded border-white/10 bg-surface-800 text-brand-500 focus:ring-0"
                />
                <label htmlFor="strictMode" className="text-xs text-slate-300 select-none">
                  Enable Strict Anti-Cheat Proctoring (Tab switch tracking & face audit)
                </label>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="btn-primary w-full py-2.5 text-xs font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles size={14} />
                <span>{isGenerating ? "Generating Unique Token..." : "Generate Candidate Link"}</span>
              </button>
            </form>

            {/* Display Generated Link */}
            {generatedLink && (
              <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 space-y-2 animate-fade-in">
                <span className="text-xs font-semibold text-brand-300 uppercase tracking-wider block">
                  Sharable Candidate Link:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="w-full bg-surface-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{isCopied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Send this link to candidates. When they complete the interview, their recording, rubric score, and anti-cheat audit log will automatically appear on this dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
