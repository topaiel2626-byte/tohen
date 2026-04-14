import { useState, useEffect } from "react";
import { getMarketingDNA, updateMarketingDNA } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Dna } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [dna, setDna] = useState({
    writing_style: "",
    tone: "",
    target_audience: "",
    brand_values: "",
    custom_instructions: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMarketingDNA()
      .then((r) => setDna(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMarketingDNA(dna);
      toast.success("ה-DNA השיווקי עודכן!");
    } catch (e) {
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "writing_style", label: "סגנון כתיבה", placeholder: "מקצועי, חד, מעצים...", lines: 2 },
    { key: "tone", label: "טון", placeholder: "מבוסס מקורות יהודיים, אישי, ישיר...", lines: 2 },
    { key: "target_audience", label: "קהל יעד", placeholder: "יזמים, בעלי עסקים, קהילה דתית...", lines: 2 },
    { key: "brand_values", label: "ערכי מותג", placeholder: "אמינות, מקצועיות, חדשנות...", lines: 2 },
    { key: "custom_instructions", label: "הנחיות נוספות ל-AI", placeholder: "הנחיות מיוחדות לייצור התוכן...", lines: 4 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6" data-testid="settings-page">
      <div className="text-right">
        <div className="flex items-center gap-3 justify-end">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Heebo, sans-serif' }}>
            DNA שיווקי
          </h1>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <Dna className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <p className="text-zinc-400 mt-2">הגדר את הסגנון האישי שלך. ה-AI ייצמד להגדרות אלה בכל יצירת תוכן.</p>
      </div>

      <div className="glass-card p-6 space-y-5">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">{field.label}</label>
            <Textarea
              value={dna[field.key] || ""}
              onChange={(e) => setDna({ ...dna, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              data-testid={`dna-${field.key}`}
              rows={field.lines}
              className="bg-black/40 border-white/10 focus:border-blue-500 text-white rounded-2xl resize-none"
              dir="rtl"
            />
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          data-testid="save-dna-btn"
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-4 px-6 rounded-2xl transition-all duration-300 min-h-[56px] flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>שומר...</span>
            </>
          ) : (
            <>
              <span>שמור הגדרות</span>
              <Save className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
