import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

export default function TranscriptCard({ transcript }) {
  const [expanded, setExpanded] = useState(false);
  if (!transcript) return null;

  const preview = transcript.slice(0, 200);
  const hasMore = transcript.length > 200;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={15} className="text-slate-500" />
        <div className="label">Transcript</div>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed font-mono">
        {expanded ? transcript : preview}
        {hasMore && !expanded && <span className="text-slate-600">…</span>}
      </p>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-brand-400 text-xs font-semibold mt-3 hover:text-brand-300 transition-colors"
        >
          {expanded ? <><ChevronUp size={13}/> Show less</> : <><ChevronDown size={13}/> Read more</>}
        </button>
      )}
    </div>
  );
}
