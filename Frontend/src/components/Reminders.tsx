import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Clock, Plus, Trash2, Check, AlertCircle, Pill } from 'lucide-react';
import { format } from 'date-fns';
import { Howl } from 'howler';

const alarmSound = new Howl({
  src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'],
  volume: 0.7,
  loop: true
});

interface Reminder {
  _id: string; // MongoDB use _id
  medicine: string;
  time: string;
  notes: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  notificationEnabled: boolean;
  lastTaken?: string;
  alarmActive?: boolean;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medicine, setMedicine] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [notification, setNotification] = useState(true);
  const [upcomingReminder, setUpcomingReminder] = useState<Reminder | null>(null);

  const fetchReminders = async () => {
    try {
      const response = await fetch('http://localhost:3001/reminders');
      const data = await response.json();
      setReminders(data);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    // Check for upcoming reminders
    const checkUpcomingReminders = () => {
      const now = new Date();
      const upcoming = reminders.find(reminder => {
        const [hours, minutes] = reminder.time.split(':');
        const reminderTime = new Date();
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0);

        const diff = reminderTime.getTime() - now.getTime();
        const isUpcoming = diff > 0 && diff <= 300000; // 5 minutes

        if (diff <= 60000 && diff >= 0 && reminder.notificationEnabled && !reminder.alarmActive) {
          alarmSound.play();
          setReminders(prev => prev.map(r =>
            r._id === reminder._id ? { ...r, alarmActive: true } : r
          ));

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Medicine Reminder', {
              body: `Time to take ${reminder.medicine}`,
              icon: '/medicine-icon.png'
            });
          }
        }

        return isUpcoming;
      });

      setUpcomingReminder(upcoming || null);
    };

    const interval = setInterval(checkUpcomingReminders, 30000);
    checkUpcomingReminders();

    return () => {
      clearInterval(interval);
      alarmSound.stop();
    };
  }, [reminders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicine || !time) return;

    const newReminder = {
      medicine,
      time,
      notes,
      frequency,
      notificationEnabled: notification,
    };

    try {
      const response = await fetch('http://localhost:3001/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder),
      });
      const data = await response.json();
      setReminders([...reminders, data]);

      setMedicine('');
      setTime('');
      setNotes('');
      setFrequency('daily');
      setNotification(true);

      if (notification && 'Notification' in window) {
        Notification.requestPermission();
      }
    } catch (err) {
      console.error("Failed to add reminder:", err);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/reminders/${id}`, { method: 'DELETE' });
      setReminders(reminders.filter(reminder => reminder._id !== id));
    } catch (err) {
      console.error("Failed to delete reminder:", err);
    }
  };

  const toggleNotification = async (id: string) => {
    const reminder = reminders.find(r => r._id === id);
    if (!reminder) return;

    try {
      const response = await fetch(`http://localhost:3001/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationEnabled: !reminder.notificationEnabled }),
      });
      const updatedData = await response.json();
      setReminders(reminders.map(r => r._id === id ? updatedData : r));
    } catch (err) {
      console.error("Failed to toggle notification:", err);
    }
  };

  const markAsTaken = async (id: string) => {
    alarmSound.stop();
    try {
      const response = await fetch(`http://localhost:3001/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastTaken: new Date().toISOString(), alarmActive: false }),
      });
      const updatedData = await response.json();
      setReminders(reminders.map(r => r._id === id ? updatedData : r));
    } catch (err) {
      console.error("Failed to mark as taken:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {upcomingReminder && (
        <div className="lg:col-span-2 bg-gradient-to-r from-amber-950/20 to-orange-950/20 border border-amber-900/30 rounded-2xl p-6 flex items-center space-x-4 shadow-sm animate-pulse">
          <div className="bg-amber-950/30 p-2 rounded-full">
            <AlertCircle className="text-amber-500" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-amber-200 text-lg">Upcoming Medication</h3>
            <p className="text-amber-400">
              Remember to take <span className="font-bold">{upcomingReminder.medicine}</span> at {upcomingReminder.time}
            </p>
          </div>
        </div>
      )}

      <div className="bg-slate-900/80 p-8 rounded-3xl shadow-xl shadow-black border border-rose-900/20">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <div className="bg-rose-950/50 p-2.5 rounded-xl mr-3 text-rose-400">
            <Plus size={24} />
          </div>
          Add New Reminder
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Medicine Name</label>
            <input
              type="text"
              value={medicine}
              onChange={(e) => setMedicine(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50 border border-slate-800"
              placeholder="e.g. Aspirin"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50 border border-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full bg-slate-950 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50 border border-slate-800 accent-rose-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50 border border-slate-800"
              placeholder="Add any special instructions..."
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              id="notification"
              checked={notification}
              onChange={(e) => setNotification(e.target.checked)}
              className="w-5 h-5 rounded text-rose-600 focus:ring-indigo-500 border-gray-300"
            />
            <label htmlFor="notification" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
              Enable notifications
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-rose-500 text-white px-4 py-3.5 rounded-xl hover:bg-rose-600 transition-all duration-300 shadow-lg shadow-rose-900/40 flex items-center justify-center space-x-2 font-semibold text-lg"
          >
            <Plus size={20} />
            <span>Add Reminder</span>
          </button>
        </form>
      </div>

      <div className="bg-slate-900/80 p-8 rounded-3xl shadow-xl shadow-black border border-fuchsia-900/20">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <div className="bg-fuchsia-950/50 p-2.5 rounded-xl mr-3 text-fuchsia-500">
            <Bell size={24} />
          </div>
          Your Reminders
        </h2>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {reminders.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <Bell size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No reminders set yet.</p>
            </div>
          ) : (
            reminders.map(reminder => (
              <div
                key={reminder._id}
                className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 hover:border-rose-900/30 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-700">
                      <Pill className="text-rose-400" size={20} />
                    </div>
                    <h3 className="font-bold text-slate-100 text-lg">{reminder.medicine}</h3>
                  </div>
                  <div className="flex items-center space-x-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => markAsTaken(reminder._id)}
                      className="text-green-500 hover:bg-green-950/30 p-2 rounded-lg transition-colors"
                      title="Mark as taken"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => toggleNotification(reminder._id)}
                      className={`${reminder.notificationEnabled ? 'text-amber-500' : 'text-slate-300'
                        } hover:bg-amber-950/30 p-2 rounded-lg transition-colors`}
                      title="Toggle notifications"
                    >
                      <Bell size={18} />
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder._id)}
                      className="text-red-400 hover:bg-red-950/30 p-2 rounded-lg transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-slate-400 mb-2">
                  <div className="flex items-center bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                    <Clock size={14} className="mr-1.5 text-rose-400" />
                    {reminder.time}
                  </div>
                  <div className="flex items-center bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                    <Calendar size={14} className="mr-1.5 text-fuchsia-400" />
                    {reminder.frequency.charAt(0).toUpperCase() + reminder.frequency.slice(1)}
                  </div>
                </div>
                {reminder.notes && (
                  <div className="text-sm text-slate-400 bg-slate-800 p-3 rounded-xl border border-slate-700 italic mb-2">
                    "{reminder.notes}"
                  </div>
                )}
                {reminder.lastTaken && (
                  <p className="text-xs text-green-400 font-medium flex items-center mt-2">
                    <Check size={12} className="mr-1" />
                    Last taken: {format(new Date(reminder.lastTaken), 'MMM d, yyyy HH:mm')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}