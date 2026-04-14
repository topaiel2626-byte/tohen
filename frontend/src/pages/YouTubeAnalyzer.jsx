import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeYouTube } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Youtube, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const folders = [
  { id: "torah", label: "תורה" },
  { id: "business", label: "עסקים ושיווק" },
  { id: "mental_snacks", label: "חטיפי מוטיבציה" },
  { id: "general", label: "רעיונות כלליים" },
];

export default function YouTubeAnalyzer() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [folderId, setFolderId] = useState("general");
  const [loading, setLoading] = useState(false);
  const [needManual, setNeedManual] = useState(false);
  const [manualText, setManualText] = useState("");
  const [videoId, setVideoId] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error("יש להדביק קישור YouTube");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        url: url.trim(),
        folder_id: folderId,
      };
      if (needManual && manualText.trim()) {
        payload.manual_transcript = manualText.trim();
      }
      const res = await analyzeYouTube(payload);
      if (res.data.status === "need_manual_transcript") {
        setNeedManual(true);
        setVideoId(res.data.video_id);
        toast.info("לא הצלחנו לשלוף תמלול אוטומטית. הדבק את הטקסט ידנית.");
      } else {
        toast.success("הניתוח הושלם בהצלחה!");
        navigate(`/content/${res.data.item.id}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "שגיאה בניתוח");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter space-y-6" data-testid="youtube-page">
      <div className="text-right">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Heebo, sans-serif' }}>
          ניתוח YouTube
        </h1>
        <p className="text-zinc-400 mt-2">הדבק קישור לסרטון וקבל אסטרטגיית יישום</p>
      </div>

      <div className="glass-card p-6 space-y-5">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">קישור YouTube</label>
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              dir="ltr"
              data-testid="youtube-url-input"
              className="w-full bg-black/40 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl text-white py-4 px-4 pe-12 min-h-[56px] text-left placeholder:text-zinc-600 transition-all duration-200 outline-none"
            />
            <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          </div>
        </div>

        {/* Folder Select */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">שמור בתיקייה</label>
          <div className="grid grid-cols-2 gap-2">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setFolderId(f.id)}
                data-testid={`folder-select-${f.id}`}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  folderId === f.id
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Transcript Fallback */}
        {needManual && (
          <div className="page-enter">
            <div className="flex items-center gap-2 mb-2 justify-end">
              <span className="text-sm font-medium text-amber-400">הדבק תמלול ידני</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <Textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="הדבק כאן את טקסט התמלול..."
              data-testid="manual-transcript-input"
              className="bg-black/40 border-white/10 focus:border-blue-500 text-white rounded-2xl min-h-[120px] resize-none"
              dir="rtl"
            />
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || (!url.trim())}
          data-testid="youtube-analyze-btn"
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-2xl transition-all duration-300 min-h-[56px] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>מנתח...</span>
            </>
          ) : (
            <>
              <span>{needManual ? "נתח עם תמלול ידני" : "נתח סרטון"}</span>
              <Youtube className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
