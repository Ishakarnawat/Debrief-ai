import React, { useState } from "react";
import {
  X,
  FileText,
  Briefcase,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
} from "lucide-react";

export default function SideBySideViewerModal({
  isOpen,
  onClose,
  jobTitle,
  jobDescription,
  candidateName,
  resumeFileName,
  resumeText,
  matchedSkills = [],
  missingSkills = [],
  sanitizationReport = null,
}) {
  const [copiedSection, setCopiedSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 1800);
  };

  // Simple keyword highlighter helper
  const renderHighlightedText = (text) => {
    if (!text) return <span className="italic text-slate-500">No content available.</span>;

    if (!searchTerm.trim()) {
      return text;
    }

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={index} className="bg-amber-400 text-slate-950 font-bold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`bg-surface-900 border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 w-full ${
          isExpanded ? "h-[96vh] max-w-[96vw]" : "h-[88vh] max-w-6xl"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-surface-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-white">
                  Side-by-Side Verification: JD vs. Parsed Resume
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                  Semantic Alignment
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Candidate: <strong className="text-slate-200">{candidateName || "Candidate"}</strong> &bull; File: {resumeFileName || "Uploaded Resume"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Find keyword in texts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 pl-8 pr-3 py-1.5 rounded-lg bg-surface-800 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Skill Alignment Strip */}
        <div className="px-6 py-2.5 bg-surface-950/60 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
              Skill Alignment:
            </span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-mono font-medium">
                {matchedSkills.length} Matched
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle size={13} className="text-rose-400 shrink-0" />
              <span className="text-rose-300 font-mono font-medium">
                {missingSkills.length} Missing
              </span>
            </div>
          </div>

          {/* Sanitization Badge */}
          {sanitizationReport && (
            <div className="flex items-center gap-2">
              {sanitizationReport.is_suspicious ? (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono flex items-center gap-1">
                  <ShieldAlert size={12} />
                  Injection Neutralized ({sanitizationReport.flagged_injections?.length || 1} attacks blocked)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[11px] font-mono flex items-center gap-1">
                  <ShieldCheck size={12} />
                  Sanitized ({sanitizationReport.invisible_chars_removed || 0} zero-width tokens purged)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Split View Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] flex-1 overflow-hidden">
          {/* Left Pane: Job Description */}
          <div className="flex flex-col h-full overflow-hidden bg-surface-900/40">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-surface-850/50">
              <div className="flex items-center gap-2">
                <Briefcase size={14} className="text-brand-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Target Job: {jobTitle}
                </span>
              </div>
              <button
                onClick={() => handleCopy(jobDescription, "jd")}
                className="text-[11px] flex items-center gap-1 text-slate-400 hover:text-brand-300 transition-colors"
              >
                {copiedSection === "jd" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedSection === "jd" ? "Copied" : "Copy JD"}</span>
              </button>
            </div>

            {/* Matched skills pill rack for JD */}
            <div className="p-3 bg-surface-950/40 border-b border-white/[0.04] space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Skills In Requirement:
              </div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {matchedSkills.map((s, i) => (
                  <span
                    key={`jd-m-${i}`}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  >
                    ✓ {s}
                  </span>
                ))}
                {missingSkills.map((s, i) => (
                  <span
                    key={`jd-x-${i}`}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20"
                  >
                    ✕ {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Raw JD Text */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text">
              {renderHighlightedText(jobDescription)}
            </div>
          </div>

          {/* Right Pane: Parsed Candidate Resume */}
          <div className="flex flex-col h-full overflow-hidden bg-surface-900/40">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-surface-850/50">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Extracted Resume: {resumeFileName}
                </span>
              </div>
              <button
                onClick={() => handleCopy(resumeText, "resume")}
                className="text-[11px] flex items-center gap-1 text-slate-400 hover:text-emerald-300 transition-colors"
              >
                {copiedSection === "resume" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedSection === "resume" ? "Copied" : "Copy Text"}</span>
              </button>
            </div>

            {/* Detected Skill Pill Rack for Candidate */}
            <div className="p-3 bg-surface-950/40 border-b border-white/[0.04] space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Verified Candidate Competencies:
              </div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {matchedSkills.length > 0 ? (
                  matchedSkills.map((s, i) => (
                    <span
                      key={`res-m-${i}`}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500 italic">No direct matches identified.</span>
                )}
              </div>
            </div>

            {/* Parsed Resume Text */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text">
              {renderHighlightedText(resumeText)}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-surface-850 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Sparkles size={13} className="text-brand-400" />
            <span>Parsed via pdfplumber/python-docx with zero-width sanitizer</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
