import { useState, useEffect } from 'react';
import { FileText, AlertCircle, Plus, Calendar, Pill, X, Edit2, Save, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface MedicalHistory {
  allergies: string[];
  chronicConditions: string[];
  pastMedications: {
    name: string;
    reaction: 'good' | 'bad' | 'neutral';
    sideEffects?: string;
    date: string;
  }[];
  currentMedications: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
  }[];
}

export default function PatientHistory() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<MedicalHistory>({
    allergies: [],
    chronicConditions: [],
    pastMedications: [],
    currentMedications: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  useEffect(() => {
    const savedHistory = localStorage.getItem('medicalHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveHistory = (updatedHistory: MedicalHistory) => {
    localStorage.setItem('medicalHistory', JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      const updatedHistory = {
        ...history,
        allergies: [...history.allergies, newAllergy.trim()]
      };
      saveHistory(updatedHistory);
      setNewAllergy('');
    }
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      const updatedHistory = {
        ...history,
        chronicConditions: [...history.chronicConditions, newCondition.trim()]
      };
      saveHistory(updatedHistory);
      setNewCondition('');
    }
  };

  const removeMedication = (index: number, type: 'past' | 'current') => {
    const updatedHistory = {
      ...history,
      [type === 'past' ? 'pastMedications' : 'currentMedications']: history[
        type === 'past' ? 'pastMedications' : 'currentMedications'
      ].filter((_, i) => i !== index)
    };
    saveHistory(updatedHistory);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 rounded-3xl p-8 border border-rose-900/20 shadow-2xl shadow-black/30">
        <div className="flex justify-between items-center mb-8 border-b border-rose-900/10 pb-6">
          <h2 className="text-2xl font-bold text-slate-100 flex items-center">
            <div className="bg-rose-950/50 p-2.5 rounded-xl mr-3 text-rose-400">
              <FileText size={24} />
            </div>
            {t('patientHistory')}
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-slate-400 hover:text-rose-400 transition-all p-2.5 hover:bg-slate-800 rounded-full border border-transparent hover:border-rose-900/30"
          >
            {isEditing ? <Save size={24} /> : <Edit2 size={24} />}
          </button>
        </div>

        <div className="space-y-8">
          {/* Allergies Section */}
          <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
            <h3 className="text-slate-200 font-semibold mb-5 flex items-center">
              <AlertCircle size={20} className="mr-2 text-rose-500" />
              {t('allergies')}
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {history.allergies.map((allergy, index) => (
                <motion.div
                  key={index}
                  className="bg-rose-950/30 text-rose-300 border border-rose-500/20 px-4 py-1.5 rounded-full flex items-center font-medium text-sm shadow-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {allergy}
                  {isEditing && (
                    <button
                      onClick={() => {
                        const updatedHistory = {
                          ...history,
                          allergies: history.allergies.filter((_, i) => i !== index)
                        };
                        saveHistory(updatedHistory);
                      }}
                      className="ml-2.5 text-rose-500 hover:text-rose-300"
                    >
                      <X size={14} />
                    </button>
                  )}
                </motion.div>
              ))}
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    className="bg-slate-900 text-slate-100 rounded-full px-5 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-sm"
                    placeholder={t('addAllergy')}
                  />
                  <button
                    onClick={addAllergy}
                    className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 hover:scale-110 transition-all shadow-lg shadow-rose-900/40"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chronic Conditions Section */}
          <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
            <h3 className="text-slate-200 font-semibold mb-5 flex items-center">
              <History size={20} className="mr-2 text-fuchsia-500" />
              {t('chronicConditions')}
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {history.chronicConditions.map((condition, index) => (
                <motion.div
                  key={index}
                  className="bg-fuchsia-950/30 text-fuchsia-300 border border-fuchsia-500/20 px-4 py-1.5 rounded-full flex items-center font-medium text-sm shadow-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {condition}
                  {isEditing && (
                    <button
                      onClick={() => {
                        const updatedHistory = {
                          ...history,
                          chronicConditions: history.chronicConditions.filter((_, i) => i !== index)
                        };
                        saveHistory(updatedHistory);
                      }}
                      className="ml-2.5 text-fuchsia-500 hover:text-fuchsia-300"
                    >
                      <X size={14} />
                    </button>
                  )}
                </motion.div>
              ))}
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className="bg-slate-900 text-slate-100 rounded-full px-5 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500 text-sm"
                    placeholder={t('addCondition')}
                  />
                  <button
                    onClick={addCondition}
                    className="bg-fuchsia-500 text-white p-2 rounded-full hover:bg-fuchsia-600 hover:scale-110 transition-all shadow-lg shadow-fuchsia-900/40"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Current Medications Section */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-5 flex items-center px-2">
              <Pill size={20} className="mr-2 text-teal-400" />
              {t('currentMedications')}
            </h3>
            <div className="space-y-4">
              {history.currentMedications.map((medication, index) => (
                <motion.div
                  key={index}
                  className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-sm flex justify-between items-center hover:border-teal-900/30 transition-all group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div>
                    <div className="font-bold text-slate-100 text-lg">{medication.name}</div>
                    <div className="text-sm text-slate-400 mt-1.5">
                      {medication.dosage} - {medication.frequency}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center">
                      <Calendar size={12} className="mr-1.5 text-teal-500/60" />
                      {t('startedOn')}: {medication.startDate}
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => removeMedication(index, 'current')}
                      className="text-slate-500 hover:text-rose-500 transition-colors bg-slate-950 p-2.5 rounded-full border border-slate-800 hover:border-rose-900/30"
                    >
                      <X size={16} />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Past Medications Section */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-5 flex items-center px-2">
              <Calendar size={20} className="mr-2 text-slate-500" />
              {t('pastMedications')}
            </h3>
            <div className="space-y-4">
              {history.pastMedications.map((medication, index) => (
                <motion.div
                  key={index}
                  className={`p-5 rounded-2xl border flex justify-between items-center transition-all ${medication.reaction === 'good'
                    ? 'bg-teal-950/20 border-teal-900/30 text-teal-100 shadow-teal-950/20'
                    : medication.reaction === 'bad'
                      ? 'bg-rose-950/20 border-rose-900/30 text-rose-100 shadow-rose-950/20'
                      : 'bg-slate-950/50 border-slate-800 text-slate-100 shadow-black/10'
                    }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div>
                    <div className="font-bold text-lg">{medication.name}</div>
                    {medication.sideEffects && (
                      <div className="text-sm opacity-80 mt-1.5 italic bg-black/20 p-2 rounded-lg">
                        {medication.sideEffects}
                      </div>
                    )}
                    <div className="text-xs opacity-50 mt-2 flex items-center">
                      <Calendar size={12} className="mr-1.5" />
                      {medication.date}
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => removeMedication(index, 'past')}
                      className="opacity-50 hover:opacity-100 bg-black/20 p-2.5 rounded-full hover:scale-110 transition-transform"
                    >
                      <X size={16} />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}