import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { speechLanguages } from '../i18n/config';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi', nativeName: 'મરાઠી' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' }
];

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  const handleLanguageChange = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    setIsOpen(false);

    // Update speech recognition language if available
    if (speechLanguages[langCode as keyof typeof speechLanguages]) {
      localStorage.setItem('speechLanguage', speechLanguages[langCode as keyof typeof speechLanguages]);
    }

    // Reload notifications with new language
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(t('languageChanged'), {
        body: t('notificationLanguageUpdated'),
        icon: '/logo.png'
      });
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-slate-900/80 text-rose-400 border border-rose-900/30 hover:bg-slate-800 shadow-xl shadow-black/20 transition-all duration-300 font-medium group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Globe className="w-5 h-5 text-rose-500 group-hover:rotate-12 transition-transform duration-500" />
        <span>{currentLanguage?.nativeName || 'Language'}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-rose-900/20 rounded-2xl shadow-2xl shadow-black/50 z-50 max-h-[70vh] overflow-y-auto custom-scrollbar"
          >
            <div className="p-2 grid gap-1">
              {languages.map(lang => (
                <motion.button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full px-4 py-3 text-left rounded-xl flex items-center justify-between transition-colors ${i18n.language === lang.code
                    ? 'bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-rose-400'
                    }`}
                  whileHover={{ x: 5 }}
                >
                  <div>
                    <div className="font-medium text-inherit">{lang.nativeName}</div>
                    <div className={`text-xs ${i18n.language === lang.code ? 'text-rose-300/60' : 'text-slate-500'}`}>{lang.name}</div>
                  </div>
                  {i18n.language === lang.code && (
                    <div className="bg-rose-500/20 p-1 rounded-full text-rose-400">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}