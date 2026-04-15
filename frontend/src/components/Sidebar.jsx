import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard, Youtube, Mic, FolderOpen, Settings, Clock, Search, Zap, BookOpen, Briefcase, Lightbulb, X, Download, Cpu, DollarSign, Calendar, TrendingUp, Crown
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
  { path: "/strategist", label: "האסטרטג", icon: Crown, color: "text-amber-500" },
  { path: "/guides", label: "מדריכים דיגיטליים", icon: BookOpen, color: "text-amber-500" },
  { path: "/affiliates", label: "שיווק שותפים", icon: DollarSign, color: "text-green-500" },
  { path: "/trends", label: "טרנדים + כסף", icon: TrendingUp, color: "text-pink-500" },
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
        className="w-[300px] bg-white/95 backdrop-blur-2xl border-black/5 p-0"
        data-testid="sidebar-content"
      >
        <SheetHeader className="p-6 pb-2">
          <div className="flex items-center gap-3 justify-end">
            <div className="text-right">
              <SheetTitle className="text-slate-800 text-xl font-bold">מערך AI</SheetTitle>
              <SheetDescription className="text-slate-400 text-sm">אליאב צוף</SheetDescription>
            </div>
            <img src="/profile.jpg" alt="אליאב צוף" className="w-10 h-10 rounded-xl object-cover border border-black/5" />
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="px-4 py-2">
            <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase mb-3 px-3">ניווט ראשי</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 mb-1
                    ${isActive ? "bg-orange-50 text-orange-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="px-4 py-2 mt-2">
            <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase mb-3 px-3">תיקיות</p>
            {folderItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                data-testid={`nav-folder-${item.label}`}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 mb-1"
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="px-4 py-2 mt-2">
            <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase mb-3 px-3">סוכני AI</p>
            {agentItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                data-testid={`nav-agent-${item.path.replace("/", "")}`}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 mb-1"
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Install App Button */}
          {canInstall && !isInstalled && (
            <div className="px-4 py-4 mt-4 border-t border-black/5">
              <button
                onClick={handleInstall}
                data-testid="pwa-install-btn"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  bg-gradient-to-l from-blue-50 to-violet-50 border border-blue-200
                  text-blue-600 hover:from-blue-100 hover:to-violet-100 transition-all duration-300"
              >
                <Download className="w-5 h-5 flex-shrink-0" />
                <span>התקן אפליקציה</span>
              </button>
            </div>
          )}
          {isInstalled && (
            <div className="px-4 py-4 mt-4 border-t border-black/5">
              <div
                data-testid="pwa-installed-badge"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-emerald-500"
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
