import { useState, useEffect, useCallback } from "react";
import { HDate, HebrewCalendar } from "@hebcal/core";
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Plus, X, Bell, BellOff, Trash2, Check, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createScheduledPost, listScheduledPosts, deleteScheduledPost, markScheduledDone, getContentItems, getVapidKey, pushSubscribe, sendTestPush } from "@/lib/api";
import { toast } from "sonner";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const GREG_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  const startDow = firstDay.getDay();
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const hd = new HDate(date);
    const events = HebrewCalendar.getHolidaysOnDate(hd) || [];
    days.push({
      greg: d,
      hebrew: hd.renderGematriya(),
      isShabbat: date.getDay() === 6,
      holiday: events.length > 0 ? events[0].render("he") : null,
      isToday: date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear(),
      dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }
  return days;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function HebrewCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduled, setScheduled] = useState([]);
  const [showAddModal, setShowAddModal] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newNote, setNewNote] = useState("");
  const [contentItems, setContentItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthDays(year, month);
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const hd = new HDate(new Date(year, month, 15));
  const hebrewMonthYear = hd.renderGematriya().split(" ").slice(1).join(" ");

  const loadScheduled = useCallback(() => {
    listScheduledPosts(monthStr).then((r) => setScheduled(r.data.posts || [])).catch(console.error);
  }, [monthStr]);

  useEffect(() => { loadScheduled(); }, [loadScheduled]);
  useEffect(() => {
    getContentItems({ limit: 50 }).then((r) => setContentItems(r.data.items || [])).catch(console.error);
    if ("Notification" in window && Notification.permission === "granted") setPushEnabled(true);
  }, []);

  const handleAdd = async () => {
    if (!newTitle.trim() && !selectedItem) { toast.error("הכנס כותרת או בחר תוכן"); return; }
    const title = newTitle || contentItems.find((i) => i.id === selectedItem)?.title || "";
    await createScheduledPost({ title, note: newNote, scheduled_date: showAddModal, content_item_id: selectedItem || null });
    setShowAddModal(null);
    setNewTitle("");
    setNewNote("");
    setSelectedItem("");
    loadScheduled();
    toast.success("פרסום תוזמן!");
  };

  const handleDelete = async (id) => {
    await deleteScheduledPost(id);
    loadScheduled();
    toast.success("פרסום הוסר");
  };

  const handleDone = async (id) => {
    await markScheduledDone(id);
    loadScheduled();
    toast.success("סומן כפורסם!");
  };

  const enablePush = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { toast.error("ההתראות לא אושרו"); return; }
      const reg = await navigator.serviceWorker.ready;
      const keyRes = await getVapidKey();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyRes.data.publicKey) });
      await pushSubscribe({ endpoint: sub.endpoint, keys: { p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")))), auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")))) } });
      setPushEnabled(true);
      toast.success("התראות הופעלו!");
    } catch (e) {
      toast.error("שגיאה בהפעלת התראות");
    }
  };

  const testPush = async () => {
    try {
      await sendTestPush();
      toast.success("התראת טסט נשלחה!");
    } catch (e) {
      toast.error("שגיאה בשליחה");
    }
  };

  const getGoogleCalUrl = (post) => {
    const d = post.scheduled_date.replace(/-/g, "");
    const title = encodeURIComponent(post.title || post.note || "פרסום");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${d}/${d}&details=${encodeURIComponent(post.note || "")}`;
  };

  const getScheduledForDate = (dateStr) => scheduled.filter((p) => p.scheduled_date === dateStr);

  const todayHd = new HDate(new Date());
  const todayEvents = HebrewCalendar.getHolidaysOnDate(todayHd) || [];
  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
  const todayPosts = scheduled.filter((p) => p.scheduled_date === todayStr);

  return (
    <div className="page-enter space-y-6" data-testid="hebrew-calendar-page">
      <div className="text-right">
        <div className="flex items-center gap-3 justify-end">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "Heebo, sans-serif" }}>
            לוח שנה
          </h1>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-sky-400" />
          </div>
        </div>
        <p className="text-zinc-400 mt-2">
          היום: {todayHd.renderGematriya()} | {new Date().toLocaleDateString("he-IL")}
          {todayEvents.length > 0 && <span className="text-amber-400 mr-2">{todayEvents[0].render("he")}</span>}
        </p>
      </div>

      {/* Push Notification Toggle */}
      <div className="flex items-center gap-3 justify-end">
        {pushEnabled ? (
          <button onClick={testPush} data-testid="test-push-btn" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <Bell className="w-4 h-4" />
            <span>שלח התראת טסט</span>
          </button>
        ) : (
          <button onClick={enablePush} data-testid="enable-push-btn" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm hover:bg-sky-500/20 transition-colors">
            <BellOff className="w-4 h-4" />
            <span>הפעל התראות לטלפון</span>
          </button>
        )}
      </div>

      {/* Today's scheduled posts */}
      {todayPosts.length > 0 && (
        <div className="glass-card glow-cyan p-4 space-y-2">
          <p className="text-cyan-400 text-sm font-bold text-right">לפרסם היום:</p>
          {todayPosts.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-black/30 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <button onClick={() => handleDone(p.id)} className="text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
                <a href={getGoogleCalUrl(p)} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300"><ExternalLink className="w-4 h-4" /></a>
                <button onClick={() => handleDelete(p.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
              <span className={`text-sm ${p.status === "done" ? "text-zinc-500 line-through" : "text-white"}`}>{p.title || p.note}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="text-center">
            <button onClick={() => setCurrentDate(new Date())} data-testid="calendar-today-btn" className="text-sky-400 text-xs hover:text-sky-300 transition-colors mb-1 block mx-auto">היום</button>
            <p className="text-white font-bold text-lg">{GREG_MONTHS[month]} {year}</p>
            <p className="text-zinc-400 text-sm">{hebrewMonthYear}</p>
          </div>
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {HEBREW_DAYS.map((day) => (
            <div key={day} className={`text-center text-xs font-medium py-1 ${day === "שבת" ? "text-amber-400" : "text-zinc-500"}`}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) =>
            day === null ? (
              <div key={`e-${i}`} className="aspect-square" />
            ) : (
              <div
                key={`d-${day.greg}`}
                data-testid={`calendar-day-${day.greg}`}
                onClick={() => setShowAddModal(day.dateStr)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-0.5 transition-all duration-200 cursor-pointer relative
                  ${day.isToday ? "bg-sky-500/20 border border-sky-500/40 ring-1 ring-sky-500/20" : ""}
                  ${day.isShabbat && !day.isToday ? "bg-amber-500/5" : ""}
                  ${day.holiday ? "bg-amber-500/10" : ""}
                  ${!day.isToday && !day.isShabbat && !day.holiday ? "hover:bg-white/5" : "hover:bg-white/8"}
                `}
              >
                <span className={`text-xs font-medium ${day.isToday ? "text-sky-400" : day.isShabbat ? "text-amber-400" : "text-white"}`}>{day.greg}</span>
                <span className={`text-[10px] ${day.isToday ? "text-sky-300" : "text-zinc-500"}`}>{day.hebrew.split(" ")[0]}</span>
                {day.holiday && <span className="text-[7px] text-amber-400 leading-tight truncate w-full">{day.holiday}</span>}
                {getScheduledForDate(day.dateStr).length > 0 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {getScheduledForDate(day.dateStr).map((p) => (
                      <div key={p.id} className={`w-1.5 h-1.5 rounded-full ${p.status === "done" ? "bg-emerald-400" : "bg-pink-400"}`} />
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* All scheduled for current month */}
      {scheduled.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-400 text-right">פרסומים מתוזמנים בחודש:</h3>
          {scheduled.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-white/3 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <button onClick={() => handleDone(p.id)} className="text-emerald-400 hover:text-emerald-300" data-testid={`done-${p.id}`}><Check className="w-4 h-4" /></button>
                <a href={getGoogleCalUrl(p)} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300" data-testid={`gcal-${p.id}`}><ExternalLink className="w-4 h-4" /></a>
                <button onClick={() => handleDelete(p.id)} className="text-red-400/50 hover:text-red-400" data-testid={`del-${p.id}`}><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="text-right">
                <span className={`text-sm ${p.status === "done" ? "text-zinc-500 line-through" : "text-white"}`}>{p.title || p.note}</span>
                <span className="text-xs text-zinc-500 mr-2">{p.scheduled_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowAddModal(null)}>
          <div className="glass-card w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()} data-testid="schedule-modal">
            <div className="flex items-center justify-between">
              <button onClick={() => setShowAddModal(null)}><X className="w-5 h-5 text-zinc-400" /></button>
              <h3 className="text-lg font-bold text-white">תזמן פרסום — {showAddModal}</h3>
            </div>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="כותרת הפרסום" data-testid="schedule-title" className="bg-black/40 border-white/10 text-white rounded-xl" dir="rtl" />
            <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="הערה (אופציונלי)" data-testid="schedule-note" className="bg-black/40 border-white/10 text-white rounded-xl" dir="rtl" />
            {contentItems.length > 0 && (
              <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} data-testid="schedule-content-select"
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2 text-sm" dir="rtl">
                <option value="">בחר תוכן מהספריה (אופציונלי)</option>
                {contentItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            )}
            <button onClick={handleAdd} data-testid="schedule-save-btn"
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              <span>תזמן</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
