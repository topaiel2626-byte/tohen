import { useState, useEffect } from "react";
import { getAISettings, updateAISettings } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Save, Loader2, Cpu, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS = [
  { id: "emergent", name: "Emergent (ברירת מחדל)", desc: "Claude + Whisper דרך Emergent" },
  { id: "openai", name: "OpenAI", desc: "GPT-4o, GPT-3.5 ועוד" },
  { id: "anthropic", name: "Anthropic", desc: "Claude Sonnet, Opus" },
  { id: "google", name: "Google Gemini", desc: "Gemini Flash/Pro (יש תוכנית חינמית!)" },
  { id: "openai_compatible", name: "OpenAI-Compatible", desc: "Groq, Together, Ollama, OpenRouter ועוד" },
];

const STT_PROVIDERS = [
  { id: "emergent", name: "Emergent (ברירת מחדל)" },
  { id: "openai", name: "OpenAI Whisper" },
  { id: "groq", name: "Groq Whisper (חינם!)" },
  { id: "openai_compatible", name: "אחר (OpenAI-Compatible)" },
];

export default function AISettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showSttKey, setShowSttKey] = useState(false);

  useEffect(() => {
    getAISettings()
      .then((r) => setSettings(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAISettings(settings);
      toast.success("הגדרות AI נשמרו!");
    } catch (e) {
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  const needsApiUrl = settings.provider === "openai_compatible";
  const needsApiKey = settings.provider !== "emergent";
  const needsSttApiKey = settings.stt_provider !== "emergent";
  const needsSttApiUrl = ["openai_compatible", "groq"].includes(settings.stt_provider);

  return (
    <div className="page-enter space-y-6" data-testid="ai-settings-page">
      <div className="text-right">
        <div className="flex items-center gap-3 justify-end">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Heebo, sans-serif' }}>
            הגדרות AI
          </h1>
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-violet-400" />
          </div>
        </div>
        <p className="text-zinc-400 mt-2">בחר את ספק ה-AI שלך — כולל מודלים חינמיים</p>
      </div>

      {/* Text Generation Provider */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white text-right">ספק ייצור טקסט</h2>

        <div className="grid grid-cols-1 gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSettings({ ...settings, provider: p.id })}
              data-testid={`provider-${p.id}`}
              className={`p-4 rounded-xl text-right transition-all duration-200 border ${
                settings.provider === p.id
                  ? "bg-violet-500/15 border-violet-500/40 text-white"
                  : "bg-white/3 border-white/5 text-zinc-400 hover:bg-white/5"
              }`}
            >
              <span className="font-medium text-sm">{p.name}</span>
              <span className="text-xs text-zinc-500 mr-2">{p.desc}</span>
            </button>
          ))}
        </div>

        {needsApiKey && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">API Key</label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={settings.api_key}
                onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                placeholder="הכנס את מפתח ה-API שלך..."
                data-testid="ai-api-key-input"
                className="bg-black/40 border-white/10 text-white rounded-xl pl-10"
                dir="ltr"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {needsApiUrl && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">API URL</label>
            <Input
              type="text"
              value={settings.api_url}
              onChange={(e) => setSettings({ ...settings, api_url: e.target.value })}
              placeholder="https://api.groq.com/openai/v1"
              data-testid="ai-api-url-input"
              className="bg-black/40 border-white/10 text-white rounded-xl"
              dir="ltr"
            />
            <p className="text-xs text-zinc-600 mt-1 text-right">
              Groq: https://api.groq.com/openai/v1 | Together: https://api.together.xyz/v1 | Ollama: http://localhost:11434/v1
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">שם המודל</label>
          <Input
            type="text"
            value={settings.model}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            placeholder={settings.provider === "google" ? "gemini-2.0-flash" : settings.provider === "anthropic" ? "claude-sonnet-4-5-20250929" : "gpt-4o"}
            data-testid="ai-model-input"
            className="bg-black/40 border-white/10 text-white rounded-xl"
            dir="ltr"
          />
        </div>
      </div>

      {/* STT Provider */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white text-right">ספק תמלול קול (STT)</h2>

        <div className="grid grid-cols-2 gap-2">
          {STT_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSettings({ ...settings, stt_provider: p.id })}
              data-testid={`stt-provider-${p.id}`}
              className={`p-3 rounded-xl text-right text-sm transition-all duration-200 border ${
                settings.stt_provider === p.id
                  ? "bg-cyan-500/15 border-cyan-500/40 text-white"
                  : "bg-white/3 border-white/5 text-zinc-400 hover:bg-white/5"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {needsSttApiKey && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">STT API Key</label>
            <div className="relative">
              <Input
                type={showSttKey ? "text" : "password"}
                value={settings.stt_api_key}
                onChange={(e) => setSettings({ ...settings, stt_api_key: e.target.value })}
                placeholder="מפתח API לתמלול..."
                data-testid="stt-api-key-input"
                className="bg-black/40 border-white/10 text-white rounded-xl pl-10"
                dir="ltr"
              />
              <button
                onClick={() => setShowSttKey(!showSttKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              >
                {showSttKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {needsSttApiUrl && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">STT API URL</label>
            <Input
              type="text"
              value={settings.stt_api_url}
              onChange={(e) => setSettings({ ...settings, stt_api_url: e.target.value })}
              placeholder="https://api.groq.com/openai/v1"
              data-testid="stt-api-url-input"
              className="bg-black/40 border-white/10 text-white rounded-xl"
              dir="ltr"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        data-testid="save-ai-settings-btn"
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-4 px-6 rounded-2xl transition-all duration-300 min-h-[56px] flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        <span>{saving ? "שומר..." : "שמור הגדרות AI"}</span>
      </button>
    </div>
  );
}
