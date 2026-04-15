import { useState } from "react";
import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/Sidebar";
import { Menu, Search, Crown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import Dashboard from "@/pages/Dashboard";
import YouTubeAnalyzer from "@/pages/YouTubeAnalyzer";
import VoiceRecorder from "@/pages/VoiceRecorder";
import Library from "@/pages/Library";
import ContentItem from "@/pages/ContentItem";
import Settings from "@/pages/Settings";
import History from "@/pages/History";
import AISettings from "@/pages/AISettings";
import DigitalGuides from "@/pages/DigitalGuides";
import AffiliateFinder from "@/pages/AffiliateFinder";
import HebrewCalendar from "@/pages/HebrewCalendar";
import TrendFinder from "@/pages/TrendFinder";
import Strategist from "@/pages/Strategist";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isStrategist = location.pathname === "/strategist";

  return (
    <div className="min-h-screen bg-[#FAFBFC] relative">
      {/* Ambient BG */}
      <div className="app-bg" />

      {/* Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-black/5">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <button
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
            className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <h2
              className="text-lg font-bold text-slate-800 cursor-pointer"
              style={{ fontFamily: 'Heebo, sans-serif' }}
              onClick={() => navigate("/")}
              data-testid="header-logo"
            >
              מערך AI — אליאב צוף
            </h2>
          </div>
          <button
            onClick={() => navigate("/history")}
            data-testid="header-search-btn"
            className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
          >
            <Search className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      <Toaster position="top-center" dir="rtl" richColors />

      {/* Floating Strategist Button */}
      {!isStrategist && (
        <button
          onClick={() => navigate("/strategist")}
          data-testid="floating-strategist-btn"
          className="fixed bottom-20 left-4 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          style={{ boxShadow: '0 4px 20px rgba(245, 158, 11, 0.35)' }}
        >
          <Crown className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/youtube" element={<YouTubeAnalyzer />} />
          <Route path="/voice" element={<VoiceRecorder />} />
          <Route path="/library" element={<Library />} />
          <Route path="/content/:id" element={<ContentItem />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/history" element={<History />} />
          <Route path="/ai-settings" element={<AISettings />} />
          <Route path="/guides" element={<DigitalGuides />} />
          <Route path="/affiliates" element={<AffiliateFinder />} />
          <Route path="/trends" element={<TrendFinder />} />
          <Route path="/strategist" element={<Strategist />} />
          <Route path="/calendar" element={<HebrewCalendar />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
