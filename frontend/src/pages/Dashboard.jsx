import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFolders, getContentItems } from "@/lib/api";
import { DailySnack } from "@/components/DailySnack";
import { Youtube, Mic, BookOpen, Briefcase, Zap, Lightbulb, ArrowLeft, Plus, TrendingUp, Calendar, DollarSign } from "lucide-react";

const folderIcons = {
  torah: BookOpen,
  business: Briefcase,
  mental_snacks: Zap,
  general: Lightbulb,
};

const folderColors = {
  torah: "glow-amber",
  business: "glow-orange",
  mental_snacks: "glow-green",
  general: "glow-white",
};

const folderAccentText = {
  torah: "text-amber-600",
  business: "text-orange-500",
  mental_snacks: "text-emerald-600",
  general: "text-slate-500",
};

const folderAccentBg = {
  torah: "bg-amber-500/15",
  business: "bg-orange-500/15",
  mental_snacks: "bg-emerald-500/15",
  general: "bg-slate-200/50",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    getFolders().then((r) => setFolders(r.data)).catch(console.error);
    getContentItems({ limit: 5 }).then((r) => setRecentItems(r.data.items || [])).catch(console.error);
  }, []);

  return (
    <div className="page-enter space-y-6" data-testid="dashboard-page">
      {/* Hero with Profile */}
      <div className="flex items-center gap-5 justify-end">
        <div className="text-right flex-1">
          <p className="text-slate-500 text-sm mb-1">מערך הבינה המלאכותית של</p>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-orange-500 via-amber-600 to-yellow-500 tracking-tight leading-tight" style={{ fontFamily: 'Heebo, sans-serif' }}>
            אליאב צוף
          </h1>
          <p className="text-slate-400 text-sm mt-2">מנוע התוכן האישי שלך</p>
        </div>
        <img
          src="/profile.jpg"
          alt="אליאב צוף"
          className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shadow-lg border-2 border-orange-100"
          data-testid="profile-image"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/youtube")}
          data-testid="quick-youtube-btn"
          className="glass-card glow-orange p-5 flex flex-col items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <Youtube className="w-6 h-6 text-orange-600" />
          </div>
          <span className="text-slate-700 font-medium text-sm">ניתוח YouTube</span>
        </button>
        <button
          onClick={() => navigate("/voice")}
          data-testid="quick-voice-btn"
          className="glass-card glow-green p-5 flex flex-col items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Mic className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="text-slate-700 font-medium text-sm">הקלטה קולית</span>
        </button>
      </div>

      {/* Agent Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => navigate("/trends")}
          data-testid="quick-trends-btn"
          className="glass-card glow-amber p-4 flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <span className="text-slate-600 text-xs">טרנדים</span>
        </button>
        <button
          onClick={() => navigate("/calendar")}
          data-testid="quick-calendar-btn"
          className="glass-card glow-cyan p-4 flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          <Calendar className="w-5 h-5 text-cyan-500" />
          <span className="text-slate-600 text-xs">לוח שנה</span>
        </button>
        <button
          onClick={() => navigate("/affiliates")}
          data-testid="quick-affiliates-btn"
          className="glass-card glow-green p-4 flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          <DollarSign className="w-5 h-5 text-emerald-500" />
          <span className="text-slate-600 text-xs">שותפים</span>
        </button>
      </div>

      {/* Daily Snack */}
      <DailySnack />

      {/* Folders Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/library")}
            className="text-orange-500 text-sm flex items-center gap-1 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>הכל</span>
          </button>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Heebo, sans-serif' }}>
            התיקיות שלך
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {folders.map((folder) => {
            const Icon = folderIcons[folder.id] || Lightbulb;
            return (
              <button
                key={folder.id}
                onClick={() => navigate(`/library?folder=${folder.id}`)}
                data-testid={`folder-${folder.id}-card`}
                className={`glass-card ${folderColors[folder.id]} p-5 flex flex-col items-end gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300`}
              >
                <div className={`w-10 h-10 rounded-xl ${folderAccentBg[folder.id]} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${folderAccentText[folder.id]}`} />
                </div>
                <div className="text-right">
                  <p className="text-slate-800 font-semibold text-sm">{folder.name}</p>
                  <p className="text-slate-400 text-xs mt-1">{folder.count} פריטים</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/history")}
              className="text-orange-500 text-sm flex items-center gap-1 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>הכל</span>
            </button>
            <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Heebo, sans-serif' }}>
              אחרונים
            </h2>
          </div>
          <div className="space-y-2">
            {recentItems.map((item) => {
              const Icon = folderIcons[item.folder_id] || Lightbulb;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/content/${item.id}`)}
                  data-testid={`recent-item-${item.id}`}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-black/3 transition-all duration-200 text-right"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-medium truncate">{item.title}</p>
                    <p className="text-slate-400 text-xs truncate">{item.content?.substring(0, 60)}...</p>
                  </div>
                  <Icon className={`w-5 h-5 ${folderAccentText[item.folder_id]} flex-shrink-0`} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
