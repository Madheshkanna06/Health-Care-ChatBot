import { useState } from 'react';
import { MessageCircle, Calendar, Heart, AlertTriangle, Code, Building2, Mic } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import Reminders from './components/Reminders';
import Hospitals from './components/Hospitals';
import EmergencyNumbers from './components/EmergencyNumbers';
import LanguageSelector from './components/LanguageSelector';
import BackgroundAnimation from './components/BackgroundAnimation';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [voiceTriggerCount, setVoiceTriggerCount] = useState(0);
  const { t } = useTranslation();

  const handleGlobalMic = () => {
    setActiveTab('chat');
    setVoiceTriggerCount(prev => prev + 1);
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 relative text-slate-200 font-sans selection:bg-rose-500/30">
      <BackgroundAnimation />

      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 bg-slate-900/80 border-b border-rose-900/30 p-4 backdrop-blur-md shadow-lg shadow-black/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3 group">
            <div className="bg-rose-500 p-2 rounded-2xl shadow-lg shadow-rose-900/40 group-hover:scale-110 transition-transform duration-300">
              <Heart className="text-white" size={24} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent tracking-tight">
              MediFriend
            </h1>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <motion.button
              onClick={handleGlobalMic}
              className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white p-2.5 rounded-2xl border border-rose-500/20 transition-all shadow-lg hover:shadow-rose-500/40 group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Voice Assistant"
            >
              <Mic size={20} className="group-hover:animate-pulse" />
            </motion.button>
            <LanguageSelector />
            <nav className="flex flex-wrap justify-center gap-2 bg-slate-800/50 p-1.5 rounded-2xl border border-rose-900/20">
              {[
                { id: 'chat', icon: MessageCircle, label: 'Chat' },
                { id: 'reminders', icon: Calendar, label: 'Reminders' },
                { id: 'hospitals', icon: Building2, label: 'Hospitals' }
              ].map(tab => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-medium ${activeTab === tab.id
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-rose-400'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <tab.icon size={18} strokeWidth={2.5} />
                  <span>{t(tab.id)}</span>
                </motion.button>
              ))}
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Emergency Numbers Banner */}
      <motion.div
        className="bg-red-950/20 py-3 border-b border-red-900/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="container mx-auto overflow-x-auto">
          <EmergencyNumbers />
        </div>
      </motion.div>

      {/* Medical Disclaimer */}
      <motion.div
        className="bg-slate-900/50 border-b border-rose-900/20 p-4"
        {...fadeIn}
        transition={{ delay: 0.3 }}
      >
        <div className="container mx-auto flex items-center justify-center space-x-3 text-slate-300">
          <div className="bg-amber-950/30 p-1.5 rounded-full">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <p className="text-sm font-medium">
            {t('medicalDisclaimer')}
          </p>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="container mx-auto p-6 md:p-6 relative z-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 max-w-6xl mx-auto"
        >
          {activeTab === 'chat' && (
            <ChatInterface
              onNavigate={setActiveTab}
              voiceTriggerCount={voiceTriggerCount}
            />
          )}
          {activeTab === 'reminders' && <Reminders />}
          {activeTab === 'hospitals' && <Hospitals />}
        </motion.div>
      </main>

     
    </div>
  );
}

export default App;