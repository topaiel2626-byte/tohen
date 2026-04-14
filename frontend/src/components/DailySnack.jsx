import { useState } from "react";
import { getDailySnack } from "@/lib/api";
import { Zap, RefreshCw } from "lucide-react";

export function DailySnack() {
  const [snack, setSnack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const fetchSnack = async () => {
    setLoading(true);
    try {
      const res = await getDailySnack();
      setSnack(res.data.snack);
      setVisible(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) {
    return (
      <button
        onClick={fetchSnack}
        disabled={loading}
        data-testid="daily-snack-btn"
        className="glass-card glow-green p-6 flex items-center gap-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full"
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <Zap className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="text-right">
          <p className="text-white font-semibold text-base">חטיף יומי</p>
          <p className="text-zinc-500 text-sm">לחץ לקבלת השראה אקראית</p>
        </div>
      </button>
    );
  }

  return (
    <div data-testid="daily-snack-card" className="glass-card glow-green p-6 page-enter">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={fetchSnack}
          disabled={loading}
          data-testid="daily-snack-refresh"
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-semibold">חטיף יומי</span>
          <Zap className="w-5 h-5 text-emerald-400" />
        </div>
      </div>
      {snack ? (
        <div>
          <h4 className="text-white font-bold text-lg mb-2 text-right">{snack.title}</h4>
          <p className="text-zinc-300 text-sm leading-relaxed text-right line-clamp-4">
            {snack.content}
          </p>
        </div>
      ) : (
        <p className="text-zinc-500 text-sm text-right">אין עדיין תכנים. התחל להוסיף רעיונות!</p>
      )}
    </div>
  );
}
