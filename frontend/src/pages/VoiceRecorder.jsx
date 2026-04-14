import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { transcribeVoice, createContentItem } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

const folders = [
  { id: "torah", label: "תורה" },
  { id: "business", label: "עסקים ושיווק" },
  { id: "mental_snacks", label: "חטיפי מוטיבציה" },
  { id: "general", label: "רעיונות כלליים" },
];

export default function VoiceRecorder() {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [folderId, setFolderId] = useState("general");
  const [manualText, setManualText] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendAudio(blob);
      };

      mediaRecorder.start();
      setRecording(true);
      toast.info("מקליט...");
    } catch (e) {
      toast.error("לא ניתן לגשת למיקרופון. אנא אשר גישה.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendAudio = async (blob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("folder_id", folderId);
      const res = await transcribeVoice(formData);
      toast.success("התמלול הושלם!");
      navigate(`/content/${res.data.item.id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "שגיאה בתמלול");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) {
      toast.error("יש להזין טקסט");
      return;
    }
    setLoading(true);
    try {
      const res = await createContentItem({
        title: `רעיון - ${new Date().toLocaleDateString("he-IL")}`,
        content: manualText.trim(),
        folder_id: folderId,
        source_type: "voice",
      });
      toast.success("הרעיון נשמר!");
      navigate(`/content/${res.data.id}`);
    } catch (e) {
      toast.error("שגיאה בשמירה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter space-y-6" data-testid="voice-page">
      <div className="text-right">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Heebo, sans-serif' }}>
          הקלטה קולית
        </h1>
        <p className="text-zinc-400 mt-2">הקלט רעיון או הקלד ידנית</p>
      </div>

      {/* Mic Button */}
      <div className="flex flex-col items-center gap-6 py-8">
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={loading}
          data-testid="record-voice-btn"
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300
            ${recording 
              ? "bg-red-500/20 border-2 border-red-500 mic-recording" 
              : "bg-blue-600/20 border-2 border-blue-500 hover:bg-blue-600/30 hover:scale-105 active:scale-95"
            }`}
        >
          {loading ? (
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          ) : recording ? (
            <Square className="w-10 h-10 text-red-400" />
          ) : (
            <Mic className="w-10 h-10 text-blue-400" />
          )}
        </button>
        <p className="text-zinc-400 text-sm">
          {loading ? "מתמלל..." : recording ? "מקליט... לחץ לעצירה" : "לחץ להקלטה"}
        </p>
      </div>

      {/* Folder Select */}
      <div className="glass-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">שמור בתיקייה</label>
          <div className="grid grid-cols-2 gap-2">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setFolderId(f.id)}
                data-testid={`voice-folder-${f.id}`}
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

        {/* Manual Text Input */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">או הקלד ידנית</label>
          <Textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="הקלד את הרעיון שלך כאן..."
            data-testid="voice-manual-input"
            className="bg-black/40 border-white/10 focus:border-blue-500 text-white rounded-2xl min-h-[120px] resize-none"
            dir="rtl"
          />
        </div>

        <button
          onClick={handleManualSubmit}
          disabled={loading || !manualText.trim()}
          data-testid="voice-manual-submit"
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-2xl transition-all duration-300 min-h-[56px] flex items-center justify-center gap-2"
        >
          <span>שמור רעיון</span>
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
