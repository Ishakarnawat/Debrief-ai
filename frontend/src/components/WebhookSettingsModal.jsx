import { useState, useEffect } from "react";
import {
  X,
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Save,
  Clock,
  ExternalLink,
  Code2,
} from "lucide-react";
import { useWebhooks } from "../hooks/useAnalyze";

export default function WebhookSettingsModal({ isOpen, onClose }) {
  const { settings, loading, fetchSettings, saveSettings, testWebhookDispatch } = useWebhooks();

  const [platform, setPlatform] = useState("slack");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [emailAlertsTo, setEmailAlertsTo] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [events, setEvents] = useState({
    onAssessmentCompleted: true,
    onCheatingFlagged: true,
    onCandidateShortlisted: true,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    if (settings) {
      setPlatform(settings.platform || "slack");
      setWebhookUrl(settings.webhookUrl || "");
      setEmailAlertsTo(settings.emailAlertsTo || "");
      setEnabled(settings.enabled !== false);
      if (settings.events) setEvents(settings.events);
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResponse(null);
    try {
      const res = await testWebhookDispatch({ platform, webhookUrl });
      setTestResponse(res);
    } catch (e) {
      setTestResponse({ success: false, summary: e.message, statusCode: 500 });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");
    try {
      await saveSettings({
        platform,
        webhookUrl,
        emailAlertsTo,
        enabled,
        events,
      });
      setSaveMessage("Webhook settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-surface-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-surface-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Automated Recruiter Webhooks
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Dispatch instant candidate evaluation cards to your team's Slack or Discord
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Platform Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Notification Channel</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "slack", label: "Slack Webhook", icon: "💬" },
                { id: "discord", label: "Discord Channel", icon: "🎮" },
                { id: "custom", label: "Custom JSON API", icon: "⚡" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    platform === p.id
                      ? "bg-brand-500/20 border-brand-500/40 text-white shadow-md shadow-brand-500/10"
                      : "bg-surface-800 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  <span className="font-semibold text-xs">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Webhook URL input */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold">Incoming Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder={
                platform === "slack"
                  ? "https://hooks.slack.com/services/T000/B000/XXXX"
                  : platform === "discord"
                  ? "https://discord.com/api/webhooks/..."
                  : "https://api.yourcompany.com/webhooks/candidates"
              }
              className="w-full bg-surface-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500">
              Leave blank or test with sandbox mode to simulate webhook triggers without a real URL.
            </p>
          </div>

          {/* Email notifications backup */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold">
              Hiring Team Alert Email (Optional)
            </label>
            <input
              type="email"
              value={emailAlertsTo}
              onChange={(e) => setEmailAlertsTo(e.target.value)}
              placeholder="recruiting-team@company.com"
              className="w-full bg-surface-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          {/* Event Triggers */}
          <div className="space-y-2.5">
            <label className="block text-slate-300 font-semibold">Automated Trigger Events</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={events.onAssessmentCompleted}
                  onChange={(e) =>
                    setEvents({ ...events, onAssessmentCompleted: e.target.checked })
                  }
                  className="rounded bg-surface-800 border-white/20 text-brand-500 focus:ring-brand-500/20"
                />
                <span>When a candidate finishes a proctored video or live interview</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={events.onCheatingFlagged}
                  onChange={(e) => setEvents({ ...events, onCheatingFlagged: e.target.checked })}
                  className="rounded bg-surface-800 border-white/20 text-brand-500 focus:ring-brand-500/20"
                />
                <span>When anti-cheat detects tab-switching or multiple faces (Urgent Alert)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={events.onCandidateShortlisted}
                  onChange={(e) =>
                    setEvents({ ...events, onCandidateShortlisted: e.target.checked })
                  }
                  className="rounded bg-surface-800 border-white/20 text-brand-500 focus:ring-brand-500/20"
                />
                <span>When a candidate status transitions to "Shortlisted"</span>
              </label>
            </div>
          </div>

          {/* Test Dispatch Area */}
          <div className="p-4 rounded-xl bg-surface-800/60 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Live Notification Test</span>
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="btn-ghost text-xs inline-flex items-center gap-1.5 py-1.5 px-3 border border-brand-500/30 text-brand-300 hover:bg-brand-500/10 transition-colors"
              >
                {isTesting ? (
                  <div className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                <span>Send Test Notification</span>
              </button>
            </div>

            {testResponse && (
              <div
                className={`p-3 rounded-lg border text-[11px] font-mono space-y-1 ${
                  testResponse.success
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border-red-500/20 text-red-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Status: HTTP {testResponse.statusCode}</span>
                  <span>{testResponse.success ? "✓ Delivery Verified" : "✕ Delivery Failed"}</span>
                </div>
                <p className="text-slate-300 font-sans">{testResponse.summary}</p>
              </div>
            )}
          </div>

          {/* Delivery Audit Logs */}
          {settings?.logs && settings.logs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-white">Recent Webhook Dispatch Log</span>
                <span className="font-mono text-[10px]">{settings.logs.length} dispatches</span>
              </div>
              <div className="max-h-32 overflow-y-auto divide-y divide-white/5 rounded-xl border border-white/5 bg-surface-950 p-2 font-mono text-[11px]">
                {settings.logs.slice(0, 5).map((log, i) => (
                  <div key={i} className="py-1.5 flex items-center justify-between text-slate-400">
                    <span className="text-white">{log.event}</span>
                    <span
                      className={
                        log.status === "success" ? "text-emerald-400" : "text-amber-400"
                      }
                    >
                      {log.status} ({log.statusCode})
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
            {saveMessage ? (
              <span className="text-emerald-400 font-semibold">{saveMessage}</span>
            ) : (
              <span className="text-slate-500">Changes take effect immediately upon saving</span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost text-xs py-2 px-3 border border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary text-xs inline-flex items-center gap-1.5 py-2 px-4 rounded-xl shadow-lg shadow-brand-500/20"
              >
                <Save size={13} />
                <span>{isSaving ? "Saving..." : "Save Webhook Configuration"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
