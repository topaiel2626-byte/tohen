import { useState, useEffect } from "react";
import { findTrends, listTrendSearches, deleteTrendSearch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { TrendingUp, Loader2, Trash2, ChevronDown, ChevronUp, Copy, Flame, DollarSign, Zap } from "lucide-react";
import { toast } from "sonner";

export default function TrendFinder() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("כללי");
  const [searching, setSearching] = useState(false);
  const [searches, setSearches] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTrendSearches()
      .then((r) => setSearches(r.data.searches || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    if (!niche.trim()) { toast.error("הכנס נישה לחיפוש"); return; }
    setSearching(true);
    try {
      const res = await findTrends({ niche, platform });
      setSearches([res.data, ...searches]);
      setExpanded(res.data.id);
      setNiche("");
      toast.success("נמצאו טרנדים חמים!");
    } catch (e) {
      toast.error("שגיאה בחיפוש");
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTrendSearch(id);
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

  const platforms = ["כללי", "YouTube", "TikTok", "Instagram", "LinkedIn", "Facebook"];

  const sections = [
    { key: "trends", label: "טרנדים חמים", icon: Flame, color: "text-orange-400" },
    { key: "monetization", label: "דרכים לעשות כסף", icon: DollarSign, color: "text-green-400" },
    { key: "viral_content", label: "רעיונות לתוכן ויראלי", icon: Zap, color: "text-yellow-400" },
    { key: "action_plan", label: "תוכנית 30 יום", icon: TrendingUp, color: "text-pink-400" },
  ];

  return (
    <div className="page-enter space-y-6" data-testid="trend-finder-page">
      <div className="text-right">
        <div className="flex items-center gap-3 justify-end">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Heebo, sans-serif' }}>
            סוכן טרנדים
          </h1>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/30 to-pink-500/30 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-orange-400" />
          </div>
        </div>
        <p className="text-zinc-400 mt-2">מצא טרנדים חמים + תוכנית מונטיזציה מלאה</p>
      </div>

      {/* Search Form */}
      <div className="glass-card glow-pink p-6 space-y-4">
        <Input
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="נישה... (לדוגמה: AI, קריפטו, בריאות, פיננסים אישיים)"
          data-testid="trend-niche-input"
          className="bg-black/40 border-white/10 text-white rounded-xl"
          dir="rtl"
        />
        <div className="flex flex-wrap gap-2">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              data-testid={`platform-${p}`}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                platform === p
                  ? "bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 text-orange-300"
                  : "bg-white/5 border border-white/5 text-zinc-500 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          data-testid="find-trends-btn"
          className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 disabled:opacity-50 text-white font-medium py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
        >
          {searching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>מחפש טרנדים... (עד דקה)</span>
            </>
          ) : (
            <>
              <Flame className="w-5 h-5" />
              <span>חפש טרנדים + תוכנית כסף</span>
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
        </div>
      ) : searches.length === 0 ? (
        <p className="text-center text-zinc-500 py-8">עדיין לא בוצעו חיפושים</p>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <div key={search.id} className="glass-card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === search.id ? null : search.id)}
                data-testid={`trend-item-${search.id}`}
                className="w-full flex items-center justify-between p-4 text-right"
              >
                <div className="flex items-center gap-2">
                  {expanded === search.id ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(search.id); }} className="text-red-400/50 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <p className="text-white font-medium">{search.niche} <span className="text-xs text-zinc-500">({search.platform})</span></p>
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
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-bold ${sec.color}`}>{sec.label}</h3>
                          <sec.icon className={`w-4 h-4 ${sec.color}`} />
                        </div>
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
