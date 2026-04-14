import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, smartSearch } from "@/lib/api";
import { Search, BookOpen, Briefcase, Zap, Lightbulb, Youtube, Mic, FileText, ArrowLeft, X } from "lucide-react";

const folderIcons = { torah: BookOpen, business: Briefcase, mental_snacks: Zap, general: Lightbulb };
const folderAccentText = { torah: "text-yellow-500", business: "text-blue-500", mental_snacks: "text-emerald-500", general: "text-zinc-400" };
const folderAccentBg = { torah: "bg-yellow-500/20", business: "bg-blue-500/20", mental_snacks: "bg-emerald-500/20", general: "bg-white/10" };
const sourceIcons = { youtube: Youtube, voice: Mic, manual: FileText };
const sourceLabels = { youtube: "YouTube", voice: "הקלטה", manual: "ידני" };

const filterOptions = [
  { id: null, label: "הכל" },
  { id: "youtube", label: "YouTube" },
  { id: "voice", label: "הקלטות" },
  { id: "manual", label: "ידני" },
];

export default function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (sourceFilter) params.source_type = sourceFilter;
      const res = await getHistory(params);
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [sourceFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="page-enter space-y-6" data-testid="history-page">
      <div className="text-right">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Heebo, sans-serif' }}>
          היסטוריה
        </h1>
        <p className="text-zinc-400 mt-2">חיפוש וסינון של כל התכנים</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חפש בכל התכנים..."
          data-testid="history-search-input"
          className="w-full bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl text-white py-4 px-4 pe-12 min-h-[56px] placeholder:text-zinc-600 transition-all duration-200 outline-none text-right"
          dir="rtl"
        />
        {searchQuery ? (
          <button onClick={() => setSearchQuery("")} className="absolute left-4 top-1/2 -translate-y-1/2">
            <X className="w-5 h-5 text-zinc-500 hover:text-white transition-colors" />
          </button>
        ) : (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        )}
      </div>

      {/* Source Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterOptions.map((opt) => (
          <button
            key={opt.id || "all"}
            onClick={() => setSourceFilter(opt.id)}
            data-testid={`filter-${opt.id || "all"}`}
            className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
              sourceFilter === opt.id ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-zinc-500 text-sm text-right">{total} תוצאות</p>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500">לא נמצאו תוצאות</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const FolderIcon = folderIcons[item.folder_id] || Lightbulb;
            const SourceIcon = sourceIcons[item.source_type] || FileText;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/content/${item.id}`)}
                data-testid={`history-item-${item.id}`}
                className="w-full flex items-center gap-3 py-4 px-3 rounded-2xl hover:bg-white/5 transition-all duration-200 border-b border-white/5 last:border-0 text-right"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1 justify-end">
                    <span className="text-zinc-600 text-xs">
                      {new Date(item.created_at).toLocaleDateString("he-IL")}
                    </span>
                    <span className="text-zinc-600 text-xs flex items-center gap-1">
                      <SourceIcon className="w-3 h-3" />
                      {sourceLabels[item.source_type]}
                    </span>
                    {item.has_package && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">חבילה</span>
                    )}
                  </div>
                </div>
                <div className={`w-9 h-9 rounded-lg ${folderAccentBg[item.folder_id]} flex items-center justify-center flex-shrink-0`}>
                  <FolderIcon className={`w-4 h-4 ${folderAccentText[item.folder_id]}`} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
