import { useState } from "react";
import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/Sidebar";
import { Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0B] relative">
      {/* Ambient BG */}
      <div className="app-bg" />

      {/* Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0A0A0B]/80 border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <button
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-zinc-400" />
          </button>
          <h2
            className="text-lg font-bold text-white cursor-pointer"
            style={{ fontFamily: 'Heebo, sans-serif' }}
            onClick={() => navigate("/")}
            data-testid="header-logo"
          >
            Orbit360
          </h2>
          <button
            onClick={() => navigate("/history")}
            data-testid="header-search-btn"
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Search className="w-5 h-5 text-zinc-400" />
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
          <Route path="/calendar" element={<HebrewCalendar />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
