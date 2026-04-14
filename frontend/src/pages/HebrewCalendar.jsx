import { useState } from "react";
import { HDate, HebrewCalendar, months } from "@hebcal/core";
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from "lucide-react";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const GREG_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  const startDow = firstDay.getDay();
  for (let i = 0; i < startDow; i++) {
    days.push(null);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const hd = new HDate(date);
    const events = HebrewCalendar.getHolidaysOnDate(hd) || [];
    days.push({
      greg: d,
      hebrew: hd.renderGematriya(),
      hebrewDay: hd.getDate(),
      isShabbat: date.getDay() === 6,
      holiday: events.length > 0 ? events[0].render("he") : null,
      isToday:
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear(),
    });
  }

  return days;
}

export default function HebrewCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthDays(year, month);

  const hd = new HDate(new Date(year, month, 15));
  const hebrewMonthYear = hd.renderGematriya().split(" ").slice(1).join(" ");

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const todayHd = new HDate(new Date());
  const todayEvents = HebrewCalendar.getHolidaysOnDate(todayHd) || [];

  return (
    <div className="page-enter space-y-6" data-testid="hebrew-calendar-page">
      <div className="text-right">
        <div className="flex items-center gap-3 justify-end">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "Heebo, sans-serif" }}>
            לוח שנה
          </h1>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-sky-400" />
          </div>
        </div>
        <p className="text-zinc-400 mt-2">
          היום: {todayHd.renderGematriya()} | {new Date().toLocaleDateString("he-IL")}
          {todayEvents.length > 0 && <span className="text-amber-400 mr-2">{todayEvents[0].render("he")}</span>}
        </p>
      </div>

      {/* Month Navigation */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="text-center">
            <button onClick={goToday} data-testid="calendar-today-btn" className="text-sky-400 text-xs hover:text-sky-300 transition-colors mb-1 block mx-auto">
              היום
            </button>
            <p className="text-white font-bold text-lg">{GREG_MONTHS[month]} {year}</p>
            <p className="text-zinc-400 text-sm">{hebrewMonthYear}</p>
          </div>
          <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {HEBREW_DAYS.map((day) => (
            <div key={day} className={`text-center text-xs font-medium py-1 ${day === "שבת" ? "text-amber-400" : "text-zinc-500"}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) =>
            day === null ? (
              <div key={`empty-${i}`} className="aspect-square" />
            ) : (
              <div
                key={`day-${day.greg}`}
                data-testid={`calendar-day-${day.greg}`}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-0.5 transition-all duration-200 cursor-default
                  ${day.isToday ? "bg-sky-500/20 border border-sky-500/40 ring-1 ring-sky-500/20" : ""}
                  ${day.isShabbat && !day.isToday ? "bg-amber-500/5" : ""}
                  ${day.holiday ? "bg-amber-500/10" : ""}
                  ${!day.isToday && !day.isShabbat && !day.holiday ? "hover:bg-white/5" : ""}
                `}
              >
                <span className={`text-xs font-medium ${day.isToday ? "text-sky-400" : day.isShabbat ? "text-amber-400" : "text-white"}`}>
                  {day.greg}
                </span>
                <span className={`text-[10px] ${day.isToday ? "text-sky-300" : "text-zinc-500"}`}>
                  {day.hebrew.split(" ")[0]}
                </span>
                {day.holiday && (
                  <span className="text-[8px] text-amber-400 leading-tight truncate w-full">{day.holiday}</span>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
