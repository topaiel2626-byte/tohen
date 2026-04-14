import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFolders, getContentItems } from "@/lib/api";
import { BookOpen, Briefcase, Zap, Lightbulb, ArrowLeft, Plus, Youtube, Mic, FileText } from "lucide-react";

const folderIcons = { torah: BookOpen, business: Briefcase, mental_snacks: Zap, general: Lightbulb };
const folderAccentText = { torah: "text-yellow-500", business: "text-blue-500", mental_snacks: "text-emerald-500", general: "text-zinc-400" };
const folderAccentBg = { torah: "bg-yellow-500/20", business: "bg-blue-500/20", mental_snacks: "bg-emerald-500/20", general: "bg-white/10" };
const folderColors = { torah: "glow-gold", business: "glow-blue", mental_snacks: "glow-green", general: "glow-white" };
const sourceIcons = { youtube: Youtube, voice: Mic, manual: FileText };

export default function Library() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folderFilter = searchParams.get("folder");
  const [folders, setFolders] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(folderFilter || null);

  useEffect(() => {
    getFolders().then((r) => setFolders(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const params = selectedFolder ? { folder_id: selectedFolder } : {};
    getContentItems(params).then((r) => setItems(r.data.items || [])).catch(console.error);
  }, [selectedFolder]);

  useEffect(() => {
    setSelectedFolder(folderFilter || null);
  }, [folderFilter]);

  const selectedFolderData = folders.find((f) => f.id === selectedFolder);

  return (
    <div className="page-enter space-y-6" data-testid="library-page">
      <div className="text-right">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Heebo, sans-serif' }}>
          {selectedFolderData ? selectedFolderData.name : "הספריה"}
        </h1>
        <p className="text-zinc-400 mt-2">
          {selectedFolderData ? selectedFolderData.description : "כל התכנים שלך מאורגנים בתיקיות"}
        </p>
      </div>

      {/* Folder Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => {
            setSelectedFolder(null);
            navigate("/library");
          }}
          data-testid="folder-tab-all"
          className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
            !selectedFolder ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
          }`}
        >
          הכל
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setSelectedFolder(f.id);
              navigate(`/library?folder=${f.id}`);
            }}
            data-testid={`folder-tab-${f.id}`}
            className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
              selectedFolder === f.id ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
          >
            {f.name} ({f.count})
          </button>
        ))}
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-zinc-500 text-lg mb-4">אין עדיין תכנים בתיקייה זו</p>
          <button
            onClick={() => navigate("/youtube")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all"
          >
            הוסף תוכן ראשון
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const FolderIcon = folderIcons[item.folder_id] || Lightbulb;
            const SourceIcon = sourceIcons[item.source_type] || FileText;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/content/${item.id}`)}
                data-testid={`library-item-${item.id}`}
                className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all duration-200 text-right"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1 justify-end">
                    <span className="text-zinc-600 text-xs">
                      {new Date(item.created_at).toLocaleDateString("he-IL")}
                    </span>
                    <SourceIcon className="w-3 h-3 text-zinc-600" />
                    {item.has_package && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">חבילה</span>
                    )}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl ${folderAccentBg[item.folder_id]} flex items-center justify-center flex-shrink-0`}>
                  <FolderIcon className={`w-5 h-5 ${folderAccentText[item.folder_id]}`} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
