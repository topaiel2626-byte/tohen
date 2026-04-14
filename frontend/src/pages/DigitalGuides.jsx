import { useState, useEffect } from "react";
import { generateGuide, listGuides, deleteGuide } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Loader2, Trash2, ChevronDown, ChevronUp, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function DigitalGuides() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [chapters, setChapters] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [guides, setGuides] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = () => {
    listGuides()
      .then((r) => setGuides(r.data.guides || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error("הכנס נושא למדריך"); return; }
    setGenerating(true);
    try {
      const res = await generateGuide({ topic, target_audience: audience, num_chapters: chapters });
      setGuides([res.data, ...guides]);
      setExpanded(res.data.id);
      setTopic("");
      setAudience("");
      toast.success("המדריך נוצר בהצלחה!");
    } catch (e) {
      toast.error("שגיאה ביצירת המדריך");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteGuide(id);
      setGuides(guides.filter((g) => g.id !== id));
      toast.success("מדריך נמחק");
    } catch (e) {
      toast.error("שגיאה במחיקה");
    }
  };

  const copySection = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("הועתק!");
  };

  const sections = [
    { key: "guide_structure", label: "מבנה המדריך" },
    { key: "landing_page", label: "דף נחיתה" },
    { key: "email_sequence", label: "רצף מיילים" },
    { key: "affiliate_posts", label: "פוסטים לשיווק שותפים" },
    { key: "bio_cta", label: "Bio + CTA" },
  ];

  return (
    <div className="page-enter space-y-6" data-testid="digital-guides-page">
      <div className="text-right">
        <div className="flex items-center gap-3 justify-end">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Heebo, sans-serif' }}>
            סוכן מדריכים דיגיטליים
          </h1>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-amber-400" />
          </div>
        </div>
        <p className="text-zinc-400 mt-2">הכנס נושא וקבל מדריך מלא + חומרי שיווק מוכנים</p>
      </div>

      {/* Generator Form */}
      <div className="glass-card p-6 space-y-4">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="נושא המדריך... (לדוגמה: איך להתחיל עסק באמזון)"
          data-testid="guide-topic-input"
          className="bg-black/40 border-white/10 text-white rounded-xl"
          dir="rtl"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="קהל יעד (אופציונלי)"
            data-testid="guide-audience-input"
            className="bg-black/40 border-white/10 text-white rounded-xl"
            dir="rtl"
          />
          <Input
            type="number"
            value={chapters}
            onChange={(e) => setChapters(parseInt(e.target.value) || 5)}
            min={3}
            max={15}
            data-testid="guide-chapters-input"
            className="bg-black/40 border-white/10 text-white rounded-xl text-center"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          data-testid="generate-guide-btn"
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>יוצר מדריך... (עד דקה)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>צור מדריך דיגיטלי</span>
            </>
          )}
        </button>
      </div>

      {/* Guides List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      ) : guides.length === 0 ? (
        <p className="text-center text-zinc-500 py-8">עדיין לא נוצרו מדריכים</p>
      ) : (
        <div className="space-y-3">
          {guides.map((guide) => (
            <div key={guide.id} className="glass-card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === guide.id ? null : guide.id)}
                data-testid={`guide-item-${guide.id}`}
                className="w-full flex items-center justify-between p-4 text-right"
              >
                <div className="flex items-center gap-2">
                  {expanded === guide.id ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(guide.id); }} className="text-red-400/50 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <p className="text-white font-medium">{guide.topic}</p>
                  <p className="text-zinc-500 text-xs">{new Date(guide.created_at).toLocaleDateString("he-IL")}</p>
                </div>
              </button>
              {expanded === guide.id && (
                <div className="px-4 pb-4 space-y-4">
                  {sections.map((sec) => (
                    <div key={sec.key} className="bg-black/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <button onClick={() => copySection(guide[sec.key])} className="text-zinc-500 hover:text-white">
                          <Copy className="w-4 h-4" />
                        </button>
                        <h3 className="text-sm font-bold text-amber-400">{sec.label}</h3>
                      </div>
                      <div className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto" dir="rtl">
                        {guide[sec.key]}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
