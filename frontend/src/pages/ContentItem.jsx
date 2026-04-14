import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getContentItem, generatePackage, getPackage, deleteContentItem, updateContentItem, exportSinglePackage } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight, Loader2, Trash2, Package, FileText, Share2, Film, Hash, Type, Copy, CheckCircle, Pencil, Save, X, Download
} from "lucide-react";
import { toast } from "sonner";

const folders = [
  { id: "torah", label: "תורה" },
  { id: "business", label: "עסקים ושיווק" },
  { id: "mental_snacks", label: "חטיפי מוטיבציה" },
  { id: "general", label: "רעיונות כלליים" },
];

export default function ContentItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "", folder_id: "", strategy: "" });

  useEffect(() => {
    loadItem();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadItem = async () => {
    try {
      const res = await getContentItem(id);
      setItem(res.data);
      if (res.data.has_package) {
        const pkgRes = await getPackage(id);
        setPkg(pkgRes.data);
      }
    } catch (e) {
      toast.error("שגיאה בטעינת הפריט");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setEditForm({
      title: item.title,
      content: item.content,
      folder_id: item.folder_id,
      strategy: item.strategy || "",
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const updateData = {};
      if (editForm.title !== item.title) updateData.title = editForm.title;
      if (editForm.content !== item.content) updateData.content = editForm.content;
      if (editForm.folder_id !== item.folder_id) updateData.folder_id = editForm.folder_id;
      if (editForm.strategy !== (item.strategy || "")) updateData.strategy = editForm.strategy || null;

      if (Object.keys(updateData).length === 0) {
        setEditing(false);
        return;
      }
      const res = await updateContentItem(id, updateData);
      setItem(res.data);
      setEditing(false);
      toast.success("הפריט עודכן!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "שגיאה בעדכון");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generatePackage(id);
      setPkg(res.data);
      setItem((prev) => ({ ...prev, has_package: true }));
      toast.success("חבילת התוכן נוצרה בהצלחה!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "שגיאה ביצירת חבילה");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("האם למחוק פריט זה?")) return;
    try {
      await deleteContentItem(id);
      toast.success("הפריט נמחק");
      navigate("/library");
    } catch (e) {
      toast.error("שגיאה במחיקה");
    }
  };

  const handleExportPackage = async () => {
    try {
      const res = await exportSinglePackage(id);
      const blob = new Blob([res.data.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${res.data.title || "package"}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("החבילה יוצאה בהצלחה!");
    } catch (e) {
      toast.error("שגיאה בייצוא");
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("הועתק ללוח!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">הפריט לא נמצא</p>
      </div>
    );
  }

  const packageSections = pkg
    ? [
        { key: "article", label: "מאמר מקצועי", icon: FileText, content: pkg.article },
        { key: "social_post", label: "פוסט לרשתות", icon: Share2, content: pkg.social_post },
        { key: "stories_scripts", label: "תסריטי סטוריז", icon: Film, content: pkg.stories_scripts },
        { key: "seo_keywords", label: "SEO ומילות מפתח", icon: Hash, content: pkg.seo_keywords },
        { key: "video_titles", label: "כותרות לסרטונים", icon: Type, content: pkg.video_titles },
      ]
    : [];

  return (
    <div className="page-enter space-y-6" data-testid="content-item-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            data-testid="delete-item-btn"
            className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
          {!editing ? (
            <button
              onClick={startEditing}
              data-testid="edit-item-btn"
              className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
            >
              <Pencil className="w-4 h-4 text-blue-400" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                data-testid="save-edit-btn"
                className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /> : <Save className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={cancelEditing}
                data-testid="cancel-edit-btn"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
        >
          <span className="text-sm">חזור</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Title & Meta - Edit or View */}
      {editing ? (
        <div className="glass-card p-6 space-y-4 page-enter">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">כותרת</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              data-testid="edit-title-input"
              className="w-full bg-black/40 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl text-white py-3 px-4 outline-none text-right"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">תיקייה</label>
            <div className="grid grid-cols-2 gap-2">
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setEditForm({ ...editForm, folder_id: f.id })}
                  data-testid={`edit-folder-${f.id}`}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    editForm.folder_id === f.id ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">תוכן</label>
            <Textarea
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              data-testid="edit-content-input"
              className="bg-black/40 border-white/10 focus:border-blue-500 text-white rounded-2xl min-h-[150px] resize-none"
              dir="rtl"
            />
          </div>
          {item.strategy && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 text-right">אסטרטגיה</label>
              <Textarea
                value={editForm.strategy}
                onChange={(e) => setEditForm({ ...editForm, strategy: e.target.value })}
                data-testid="edit-strategy-input"
                className="bg-black/40 border-white/10 focus:border-blue-500 text-white rounded-2xl min-h-[120px] resize-none"
                dir="rtl"
              />
            </div>
          )}
        </div>
      ) : (
        <>
          {/* View Mode */}
          <div className="text-right">
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Heebo, sans-serif' }}>
              {item.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 justify-end text-zinc-500 text-sm">
              <span>{new Date(item.created_at).toLocaleDateString("he-IL")}</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">
                {item.source_type === "youtube" ? "YouTube" : item.source_type === "voice" ? "הקלטה" : "ידני"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-3 text-right">תוכן מקור</h3>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap text-right">{item.content}</p>
          </div>

          {/* Strategy */}
          {item.strategy && (
            <div className="glass-card glow-blue p-6">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => copyToClipboard(item.strategy, "strategy")}
                  className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
                >
                  {copiedField === "strategy" ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <h3 className="text-white font-semibold text-right">אסטרטגיית יישום</h3>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap text-right">{item.strategy}</p>
            </div>
          )}
        </>
      )}

      {/* Generate Package Button */}
      {!pkg && !editing && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          data-testid="generate-package-btn"
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-4 px-6 rounded-2xl transition-all duration-300 min-h-[56px] flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>מייצר חבילת הפצה...</span>
            </>
          ) : (
            <>
              <span>צור חבילת הפצה</span>
              <Package className="w-5 h-5" />
            </>
          )}
        </button>
      )}

      {/* Content Package */}
      {pkg && !editing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleExportPackage}
              data-testid="export-package-btn"
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 py-2 px-4 rounded-xl hover:bg-blue-500/20"
            >
              <Download className="w-4 h-4" />
              <span>ייצוא חבילה</span>
            </button>
            <h2 className="text-xl font-bold text-white text-right" style={{ fontFamily: 'Heebo, sans-serif' }}>
              חבילת הפצה
            </h2>
          </div>
          <Tabs defaultValue="article" className="w-full" dir="rtl">
            <TabsList className="w-full bg-white/5 rounded-2xl p-1 grid grid-cols-5 gap-1 h-auto">
              {packageSections.map((sec) => (
                <TabsTrigger
                  key={sec.key}
                  value={sec.key}
                  data-testid={`package-tab-${sec.key}`}
                  className="rounded-xl py-2 px-1 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-500"
                >
                  <sec.icon className="w-4 h-4" />
                </TabsTrigger>
              ))}
            </TabsList>
            {packageSections.map((sec) => (
              <TabsContent key={sec.key} value={sec.key}>
                <div className="glass-card p-6 mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => copyToClipboard(sec.content, sec.key)}
                      data-testid={`copy-${sec.key}`}
                      className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors text-sm"
                    >
                      {copiedField === sec.key ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">הועתק</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>העתק</span>
                        </>
                      )}
                    </button>
                    <h3 className="text-white font-semibold">{sec.label}</h3>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap text-right">
                    {sec.content}
                  </p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
