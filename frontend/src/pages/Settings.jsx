import { useState, useEffect, useRef } from "react";
import { getMarketingDNA, updateMarketingDNA, exportFullBackup, restoreFromBackup } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Dna, Download, Upload, Shield } from "lucide-react";
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
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleExportBackup = async () => {
    setExporting(true);
    try {
      const res = await exportFullBackup();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orbit360-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`גיבוי הורד! ${res.data.counts.content_items} תכנים, ${res.data.counts.content_packages} חבילות`);
    } catch (e) {
      toast.error("שגיאה בייצוא הגיבוי");
    } finally {
      setExporting(false);
    }
  };

  const handleRestoreBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.data) {
        toast.error("קובץ גיבוי לא תקין");
        return;
      }
      const res = await restoreFromBackup(backup.data);
      toast.success(`שוחזרו ${res.data.restored.content_items} תכנים ו-${res.data.restored.content_packages} חבילות`);
    } catch (e) {
      toast.error("שגיאה בשחזור הגיבוי");
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

      {/* Backup & Restore Section */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 justify-end">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Heebo, sans-serif' }}>
            גיבוי ושחזור
          </h2>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <p className="text-zinc-400 text-sm text-right">
          הורד את כל הנתונים שלך כקובץ JSON. תוכל לשחזר אותם בכל זמן — גם בשרת אחר.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportBackup}
            disabled={exporting}
            data-testid="backup-export-btn"
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-medium transition-all duration-300 min-h-[56px]
              bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>{exporting ? "מייצא..." : "הורד גיבוי מלא"}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
            data-testid="backup-restore-btn"
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-medium transition-all duration-300 min-h-[56px]
              bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 text-zinc-300"
          >
            {restoring ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span>{restoring ? "משחזר..." : "שחזר מגיבוי"}</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleRestoreBackup}
          data-testid="backup-file-input"
        />
      </div>
    </div>
  );
}
