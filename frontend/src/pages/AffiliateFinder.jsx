import { useState, useEffect } from "react";
import { findAffiliates, listAffiliateSearches, deleteAffiliateSearch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Trash2, ChevronDown, ChevronUp, Copy, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function AffiliateFinder() {
  const [niche, setNiche] = useState("");
  const [keywords, setKeywords] = useState("");
  const [searching, setSearching] = useState(false);
  const [searches, setSearches] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = () => {
    listAffiliateSearches()
      .then((r) => setSearches(r.data.searches || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSearch = async () => {
    if (!niche.trim()) { toast.error("הכנס נישה לחיפוש"); return; }
    setSearching(true);
    try {
      const res = await findAffiliates({ niche, keywords });
      setSearches([res.data, ...searches]);
      setExpanded(res.data.id);
      setNiche("");
      setKeywords("");
      toast.success("נמצאו תוכניות שותפים!");
    } catch (e) {
      toast.error("שגיאה בחיפוש");
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAffiliateSearch(id);
      setSearches(searches.filter((s) => s.id !== id));
      toast.success("חיפוש נמחק");
    } catch (e) {
      toast.error("שגיאה במחיקה");
    }
  };

  const copySection = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("הועתק!");
  };

  const sections = [
    { key: "programs", label: "תוכניות שותפים" },
    { key: "strategy", label: "אסטרטגיית קידום" },
    { key: "content_ideas", label: "רעיונות לתוכן" },
    { key: "sample_post", label: "פוסט לדוגמה" },
  ];

  return (
    <div className="page-enter space-y-6" data-testid="affiliate-finder-page">
      <div className="text-right">
        <div className="flex items-center gap-3 justify-end">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Heebo, sans-serif' }}>
            סוכן שיווק שותפים
          </h1>
          <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
        </div>
        <p className="text-zinc-400 mt-2">הכנס נישה ומצא תוכניות שיווק שותפים + אסטרטגיה</p>
      </div>

      {/* Search Form */}
      <div className="glass-card p-6 space-y-4">
        <Input
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="נישה... (לדוגמה: בריאות ותזונה, טכנולוגיה, פיננסים)"
          data-testid="affiliate-niche-input"
          className="bg-black/40 border-white/10 text-white rounded-xl"
          dir="rtl"
        />
        <Input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="מילות מפתח נוספות (אופציונלי)"
          data-testid="affiliate-keywords-input"
          className="bg-black/40 border-white/10 text-white rounded-xl"
          dir="rtl"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          data-testid="find-affiliates-btn"
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
        >
          {searching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>מחפש עסקאות... (עד דקה)</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>חפש תוכניות שותפים</span>
            </>
          )}
        </button>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
        </div>
      ) : searches.length === 0 ? (
        <p className="text-center text-zinc-500 py-8">עדיין לא בוצעו חיפושים</p>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <div key={search.id} className="glass-card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === search.id ? null : search.id)}
                data-testid={`affiliate-item-${search.id}`}
                className="w-full flex items-center justify-between p-4 text-right"
              >
                <div className="flex items-center gap-2">
                  {expanded === search.id ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(search.id); }} className="text-red-400/50 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <p className="text-white font-medium">{search.niche}</p>
                  <p className="text-zinc-500 text-xs">{new Date(search.created_at).toLocaleDateString("he-IL")}</p>
                </div>
              </button>
              {expanded === search.id && (
                <div className="px-4 pb-4 space-y-4">
                  {sections.map((sec) => (
                    <div key={sec.key} className="bg-black/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <button onClick={() => copySection(search[sec.key])} className="text-zinc-500 hover:text-white">
                          <Copy className="w-4 h-4" />
                        </button>
                        <h3 className="text-sm font-bold text-green-400">{sec.label}</h3>
                      </div>
                      <div className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto" dir="rtl">
                        {search[sec.key]}
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
