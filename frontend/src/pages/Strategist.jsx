import { useState, useEffect, useRef } from "react";
import { strategistChat, listStrategistSessions, getStrategistChat, deleteStrategistSession } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Plus, Trash2, MessageSquare, Crown } from "lucide-react";
import { toast } from "sonner";

export default function Strategist() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    listStrategistSessions().then((r) => setSessions(r.data.sessions || [])).catch(console.error);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSession = async (sid) => {
    const res = await getStrategistChat(sid);
    setMessages(res.data.messages || []);
    setSessionId(sid);
    setShowSessions(false);
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    setShowSessions(false);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMsg = message;
    setMessage("");
    setMessages((prev) => [...prev, { user_message: userMsg, assistant_message: null }]);
    setSending(true);
    try {
      const res = await strategistChat(userMsg, sessionId);
      setSessionId(res.data.session_id);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].assistant_message = res.data.response;
        return updated;
      });
      listStrategistSessions().then((r) => setSessions(r.data.sessions || []));
    } catch (e) {
      toast.error("שגיאה בתקשורת עם האסטרטג");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDeleteSession = async (sid, e) => {
    e.stopPropagation();
    await deleteStrategistSession(sid);
    setSessions(sessions.filter((s) => s.session_id !== sid));
    if (sessionId === sid) newChat();
    toast.success("שיחה נמחקה");
  };

  return (
    <div className="page-enter flex flex-col h-[calc(100vh-120px)]" data-testid="strategist-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSessions(!showSessions)} data-testid="sessions-toggle"
            className="px-3 py-2 rounded-xl bg-white/60 border border-black/5 text-slate-500 text-xs hover:bg-white transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={newChat} data-testid="new-chat-btn"
            className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs hover:bg-amber-100 transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" />
            <span>שיחה חדשה</span>
          </button>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800" style={{ fontFamily: 'Heebo, sans-serif' }}>האסטרטג</h1>
            <p className="text-xs text-slate-400">היועץ העסקי האישי שלך</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <Crown className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Sessions Panel */}
      {showSessions && (
        <div className="glass-card p-3 mb-3 max-h-48 overflow-y-auto space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">אין שיחות קודמות</p>
          ) : sessions.map((s) => (
            <div key={s.session_id} onClick={() => loadSession(s.session_id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${sessionId === s.session_id ? "bg-amber-50 text-amber-700" : "hover:bg-slate-50 text-slate-600"}`}>
              <button onClick={(e) => handleDeleteSession(s.session_id, e)} className="text-red-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              <span className="truncate flex-1 text-right mr-2">{s.preview}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1" data-testid="chat-messages">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-lg">שלום, אני האסטרטג שלך</p>
              <p className="text-slate-400 text-sm mt-1">אני מכיר את כל התכנים שלך. שאל אותי כל שאלה עסקית.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {["איך אני מגדיל מכירות?", "תבנה לי תוכנית ל-30 יום", "מה החוזקות שלי לפי התכנים?"].map((q) => (
                <button key={q} onClick={() => { setMessage(q); }}
                  className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-amber-700 text-xs hover:bg-amber-50 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-gradient-to-l from-amber-500 to-orange-500 text-white px-4 py-3 rounded-2xl rounded-tr-md max-w-[85%] text-sm leading-relaxed shadow-sm" dir="rtl">
                {msg.user_message}
              </div>
            </div>
            {msg.assistant_message ? (
              <div className="flex justify-start">
                <div className="bg-white border border-black/5 px-4 py-3 rounded-2xl rounded-tl-md max-w-[85%] text-sm text-slate-700 leading-relaxed shadow-sm whitespace-pre-wrap" dir="rtl">
                  {msg.assistant_message}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="bg-white border border-black/5 px-4 py-3 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span className="text-xs text-slate-400">האסטרטג חושב...</span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="glass-card p-3 flex items-end gap-2" data-testid="chat-input-area">
        <button onClick={handleSend} disabled={sending || !message.trim()} data-testid="send-btn"
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white disabled:opacity-40 hover:from-amber-400 hover:to-orange-400 transition-all shadow-md flex-shrink-0">
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="שאל את האסטרטג..."
          data-testid="strategist-input"
          className="bg-transparent border-0 focus:ring-0 text-slate-800 resize-none text-sm min-h-[44px] max-h-32"
          dir="rtl"
          rows={1}
        />
      </div>
    </div>
  );
}
