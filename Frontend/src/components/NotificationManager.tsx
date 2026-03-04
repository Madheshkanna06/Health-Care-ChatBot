import { useEffect, useState } from 'react';
import { Bell, Volume2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  time: string;
  language: string;
}

export default function NotificationManager() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    sound: true,
    time: '09:00',
    language: i18n.language
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Request notification permission if not set
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Set up notification timer
    const checkNotifications = () => {
      if (settings.enabled && 'Notification' in window && Notification.permission === 'granted') {
        const now = new Date();
        const [hours, minutes] = settings.time.split(':');
        const scheduledTime = new Date();
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0);

        if (now.getHours() === scheduledTime.getHours() &&
          now.getMinutes() === scheduledTime.getMinutes()) {
          new Notification(t('medicationReminder'), {
            body: t('timeToTakeMedicine'),
            icon: '/medicine-icon.png',
            silent: !settings.sound
          });
        }
      }
    };

    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings, t]);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  const toggleNotifications = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
      } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setSettings(prev => ({ ...prev, enabled: true }));
        }
      }
    }
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(t('testNotification'), {
        body: t('notificationTest'),
        icon: '/medicine-icon.png',
        silent: !settings.sound
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-900/80 rounded-2xl p-6 space-y-6 shadow-2xl shadow-black/30 border border-indigo-900/20"
    >
      <div className="flex items-center justify-between border-b border-rose-900/20 pb-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center">
          <div className="bg-rose-950/50 p-2.5 rounded-xl mr-3 text-rose-400">
            <Bell size={20} />
          </div>
          {t('notificationSettings')}
        </h3>
        <button
          onClick={testNotification}
          className="text-sm font-medium text-rose-400 hover:text-rose-300 bg-rose-950/30 px-3 py-1.5 rounded-lg transition-colors border border-rose-900/30"
        >
          {t('testNotification')}
        </button>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
          <span className="text-slate-300 font-medium group-hover:text-rose-400 transition-colors">{t('enableNotifications')}</span>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={toggleNotifications}
            className="w-5 h-5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-950"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
          <div className="flex items-center space-x-3">
            <Volume2 className="text-slate-500 group-hover:text-rose-500 transition-colors" size={20} />
            <span className="text-slate-300 font-medium group-hover:text-rose-400 transition-colors">{t('notificationSound')}</span>
          </div>
          <input
            type="checkbox"
            checked={settings.sound}
            onChange={(e) => setSettings(prev => ({ ...prev, sound: e.target.checked }))}
            className="w-5 h-5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-950"
          />
        </label>

        <div className="flex items-center justify-between p-3 border-t border-rose-900/10 pt-4">
          <span className="text-slate-300 font-medium">{t('notificationTime')}</span>
          <input
            type="time"
            value={settings.time}
            onChange={(e) => setSettings(prev => ({ ...prev, time: e.target.value }))}
            className="bg-slate-950 text-slate-100 rounded-lg px-3 py-1.5 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {!('Notification' in window) && (
        <div className="bg-amber-950/20 text-amber-500 text-sm p-4 rounded-xl flex items-center border border-amber-900/30">
          <AlertTriangle size={18} className="mr-2 text-amber-500 flex-shrink-0" />
          {t('notificationNotSupported')}
        </div>
      )}
    </motion.div>
  );
}