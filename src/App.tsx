import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  FolderCheck, 
  Compass, 
  Award, 
  Send, 
  Bot, 
  User, 
  Home, 
  Menu, 
  X, 
  GraduationCap, 
  Brain,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ChatMessage, CurriculumTopic, PortfolioItem, Scripture } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'hollow' | 'curriculum' | 'portfolio' | 'graduation' | 'memory'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I am Adeline, your AI Mentor. Welcome to our learning space. How are you feeling about your goals today?",
      isFromUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scripture, setScripture] = useState<Scripture>({
    reference: "Proverbs 3:5-6",
    text: "Trust in the LORD with all your heart and lean not on your own understanding..."
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/scripture/daily')
      .then(res => res.json())
      .then(data => setScripture(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isFromUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          history: messages
        })
      });

      const data = await response.json();
      const botReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.reply || "I'm listening and right here with you!",
        isFromUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botReply]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "I am ready to help you on your journey! Let's work through your next topic.",
          isFromUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Mentor', icon: Home },
    { id: 'hollow', label: "Adeline's Hollow", icon: Compass },
    { id: 'curriculum', label: 'Project Library', icon: BookOpen },
    { id: 'portfolio', label: 'Portfolio & Logs', icon: FolderCheck },
    { id: 'graduation', label: 'Graduation Tracker', icon: GraduationCap },
    { id: 'memory', label: 'Memory Brain', icon: Brain },
  ];

  return (
    <div className="flex h-screen bg-amber-50/30 overflow-hidden">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-amber-100 flex flex-col 
        transition-transform duration-200 ease-in-out shadow-lg md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md font-serif font-bold text-xl">
              A
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-slate-800">Dear Adeline</h1>
              <p className="text-xs text-amber-700 font-medium">AI Learning Companion</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-amber-100/70 text-amber-900 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:bg-amber-50 hover:text-slate-900'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-amber-100">
          <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100/60">
            <p className="text-xs text-amber-800 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Daily Inspiration
            </p>
            <p className="text-xs text-slate-600 italic mt-1 line-clamp-2">
              "{scripture.text}"
            </p>
            <p className="text-[10px] text-amber-700 font-semibold mt-1">
              — {scripture.reference}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-amber-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-amber-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 capitalize">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active Session
            </span>
          </div>
        </header>

        {/* Dynamic View Content */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'dashboard' && (
            <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-amber-100">
              {/* Chat Interface */}
              <div className="flex-1 flex flex-col h-full bg-slate-50/50">
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {messages.map(msg => (
                    <div 
                      key={msg.id}
                      className={`flex gap-3 max-w-2xl ${msg.isFromUser ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs text-white text-xs font-bold
                        ${msg.isFromUser ? 'bg-slate-700' : 'bg-amber-600'}
                      `}>
                        {msg.isFromUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className={`
                          p-4 rounded-2xl text-sm leading-relaxed shadow-xs
                          ${msg.isFromUser 
                            ? 'bg-amber-600 text-white rounded-tr-xs' 
                            : 'bg-white text-slate-800 border border-amber-100/80 rounded-tl-xs'}
                        `}>
                          {msg.text}
                        </div>
                        <p className={`text-[10px] text-slate-400 mt-1 px-1 ${msg.isFromUser ? 'text-right' : ''}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-amber-100 flex gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    placeholder="Message Adeline about your projects or goals..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-sm bg-slate-50/50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-xs"
                  >
                    <span>Send</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Side Dashboard Widget */}
              <div className="w-full md:w-80 bg-white p-6 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Daily Verse</h3>
                  <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4">
                    <p className="text-sm text-slate-700 font-serif leading-relaxed italic">
                      "{scripture.text}"
                    </p>
                    <p className="text-xs text-amber-700 font-semibold mt-2 text-right">
                      — {scripture.reference}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Learning Roadmap</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">Software Portfolio</span>
                        <span className="text-amber-700">75%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[75%]" />
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">Graduation Requirements</span>
                        <span className="text-amber-700">60%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[60%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hollow' && (
            <div className="h-full p-8 overflow-y-auto bg-amber-900/5 text-slate-800">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-amber-200 shadow-sm text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 mx-auto mb-4">
                    <Compass className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-slate-800">Adeline's Hollow</h2>
                  <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
                    Welcome to the interactive quest hub! Complete learning modules and track your inventory, quests, and character progress.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-left">
                      <p className="text-xs text-amber-700 font-bold uppercase">Active Quest</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">Build Memory Engine</p>
                      <p className="text-xs text-slate-500 mt-0.5">Reward: 150 EXP</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-left">
                      <p className="text-xs text-amber-700 font-bold uppercase">Character Level</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">Level 4 Scholar</p>
                      <p className="text-xs text-slate-500 mt-0.5">Adeline Guide Active</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-left">
                      <p className="text-xs text-amber-700 font-bold uppercase">Inventory</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">3 Artifacts Collected</p>
                      <p className="text-xs text-slate-500 mt-0.5">Workbook Badge</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="h-full p-8 overflow-y-auto bg-slate-50/50">
              <div className="max-w-5xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-800">Project Library & Curriculum</h2>
                  <p className="text-sm text-slate-600">Explore core projects and interactive workbooks guided by Adeline.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: "Android Kotlin Architecture", category: "Mobile Dev", progress: 85, desc: "Master Jetpack Compose, ViewModels, and Room Database." },
                    { title: "Scripture & Wisdom Engine", category: "Core Studies", progress: 100, desc: "Explore daily reflections and structured learning." },
                    { title: "AI Mentor Integration", category: "Artificial Intelligence", progress: 60, desc: "Connect Gemini APIs and conversational agents." },
                    { title: "Career Discovery Portfolio", category: "Graduation Prep", progress: 40, desc: "Build artifacts for real-world application." }
                  ].map((topic, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-amber-100 shadow-xs hover:shadow-md transition-all">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">
                        {topic.category}
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 mt-3">{topic.title}</h3>
                      <p className="text-xs text-slate-600 mt-1">{topic.desc}</p>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Progress: {topic.progress}%</span>
                        <button className="text-xs font-semibold text-amber-700 flex items-center gap-1 hover:text-amber-800">
                          Open Workbook <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="h-full p-8 overflow-y-auto bg-slate-50/50">
              <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold font-serif text-slate-800">Student Portfolio & Activity Logs</h2>
                <div className="space-y-4">
                  {[
                    { title: "Completed Room Database Schema", date: "Today, 11:30 AM", tag: "Code" },
                    { title: "Adeline AI Mentor Dialogue Log", date: "Yesterday, 4:15 PM", tag: "AI Session" },
                    { title: "Graduation Requirement Checklist Review", date: "Jul 27, 2026", tag: "Academic" }
                  ].map((item, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-amber-100 flex items-center justify-between shadow-xs">
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{item.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> {item.date}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                        {item.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'graduation' && (
            <div className="h-full p-8 overflow-y-auto bg-slate-50/50">
              <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold font-serif text-slate-800">Graduation Tracker</h2>
                <div className="bg-white p-6 rounded-2xl border border-amber-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-800">Complete Core Curriculum Modules</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-800">Build & Publish Portfolio Artifacts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    <span className="text-sm font-medium text-slate-600">Final Capstone Presentation</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="h-full p-8 overflow-y-auto bg-slate-50/50">
              <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold font-serif text-slate-800">Memory Brain Notes</h2>
                <div className="bg-white p-6 rounded-2xl border border-amber-100">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Adeline remembers key goals, preferences, and learning milestones discussed during your mentor sessions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
