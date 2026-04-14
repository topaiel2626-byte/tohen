import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard, Youtube, Mic, FolderOpen, Settings, Clock, Search, Zap, BookOpen, Briefcase, Lightbulb, X, Download, Cpu, DollarSign, Calendar
} from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const navItems = [
  { path: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { path: "/youtube", label: "ניתוח YouTube", icon: Youtube },
  { path: "/voice", label: "הקלטה קולית", icon: Mic },
  { path: "/library", label: "הספריה", icon: FolderOpen },
  { path: "/history", label: "היסטוריה", icon: Clock },
  { path: "/calendar", label: "לוח שנה", icon: Calendar },
  { path: "/settings", label: "DNA שיווקי", icon: Settings },
  { path: "/ai-settings", label: "הגדרות AI", icon: Cpu },
];

const agentItems = [
  { path: "/guides", label: "מדריכים דיגיטליים", icon: BookOpen, color: "text-amber-500" },
  { path: "/affiliates", label: "שיווק שותפים", icon: DollarSign, color: "text-green-500" },
];

const folderItems = [
  { path: "/library?folder=torah", label: "תורה", icon: BookOpen, color: "text-yellow-500" },
  { path: "/library?folder=business", label: "עסקים ושיווק", icon: Briefcase, color: "text-blue-500" },
  { path: "/library?folder=mental_snacks", label: "חטיפי מוטיבציה", icon: Zap, color: "text-emerald-500" },
  { path: "/library?folder=general", label: "רעיונות כלליים", icon: Lightbulb, color: "text-zinc-400" },
];

export function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { canInstall, isInstalled, install } = usePwaInstall();

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  const handleInstall = async () => {
    await install();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[300px] bg-[#0A0A0B]/95 backdrop-blur-2xl border-white/10 p-0"
        data-testid="sidebar-content"
      >
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-white text-xl font-bold text-right">Orbit360</SheetTitle>
          <SheetDescription className="text-zinc-500 text-sm text-right">מנוע התוכן שלך</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="px-4 py-2">
            <p className="text-[11px] font-semibold tracking-widest text-zinc-600 uppercase mb-3 px-3">ניווט ראשי</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 mb-1
                    ${isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="px-4 py-2 mt-2">
            <p className="text-[11px] font-semibold tracking-widest text-zinc-600 uppercase mb-3 px-3">תיקיות</p>
            {folderItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                data-testid={`nav-folder-${item.label}`}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-all duration-200 mb-1"
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="px-4 py-2 mt-2">
            <p className="text-[11px] font-semibold tracking-widest text-zinc-600 uppercase mb-3 px-3">סוכני AI</p>
            {agentItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                data-testid={`nav-agent-${item.path.replace("/", "")}`}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-all duration-200 mb-1"
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Install App Button */}
          {canInstall && !isInstalled && (
            <div className="px-4 py-4 mt-4 border-t border-white/5">
              <button
                onClick={handleInstall}
                data-testid="pwa-install-btn"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  bg-gradient-to-l from-cyan-500/20 to-violet-500/20 border border-cyan-500/30
                  text-cyan-400 hover:from-cyan-500/30 hover:to-violet-500/30 transition-all duration-300"
              >
                <Download className="w-5 h-5 flex-shrink-0" />
                <span>התקן אפליקציה</span>
              </button>
            </div>
          )}
          {isInstalled && (
            <div className="px-4 py-4 mt-4 border-t border-white/5">
              <div
                data-testid="pwa-installed-badge"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-emerald-400/70"
              >
                <Download className="w-5 h-5 flex-shrink-0" />
                <span>האפליקציה מותקנת</span>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
