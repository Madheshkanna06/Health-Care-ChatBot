import React, { useState } from 'react';
import { Upload, FileText, X, AlertTriangle, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorker } from 'tesseract.js';
import { useTranslation } from 'react-i18next';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyDnjBMvtXh3FzJnLdb7VO83ZHJQNe3HzQ0');

const TESSERACT_LANG_MAPPING = {
  en: 'eng',
  es: 'spa',
  hi: 'hin',
  ta: 'tam',
  bn: 'ben',
  mr: 'mar',
  gu: 'guj',
  kn: 'kan',
  ml: 'mal',
  te: 'tel',
  pa: 'pan',
  fr: 'fra',
  de: 'deu',
  it: 'ita',
  pt: 'por',
  ru: 'rus',
  ja: 'jpn',
  ko: 'kor',
  zh: 'chi_sim',
  ar: 'ara'
};

interface AnalysisResult {
  type: 'lab_report' | 'prescription';
  summary: string;
  status: 'normal' | 'attention' | 'critical';
  abnormalValues?: {
    parameter: string;
    value: string;
    normalRange: string;
    status: 'high' | 'low' | 'normal';
    percentage: number;
    recommendation: string;
    urgency: 'low' | 'medium' | 'high';
  }[];
  recommendations?: {
    immediate: string[];
    lifestyle: string[];
    followUp: string;
  };
}

export default function DocumentAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const { t, i18n } = useTranslation();

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setProgress(0);
    try {
      const worker = await createWorker(
        TESSERACT_LANG_MAPPING[i18n.language as keyof typeof TESSERACT_LANG_MAPPING] || 'eng',
        1,
        {
          logger: m => {
            if ((m as any).status === 'recognizing text') {
              setProgress((m as any).progress * 100);
            }
          },
          langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        }
      );

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const detectLanguage = (text: string) => {
        if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
        if (/[\u0900-\u097F]/.test(text)) return "hi";
        return "en";
      };

      const detectedLang = detectLanguage(text);

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Analyze this medical document text in ${detectedLang} language and provide detailed insights in the SAME language:
        ${text}
        
        Format the response as a JSON object with:
        1. Document type (lab_report or prescription)
        2. Overall status (normal, attention, critical)
        3. Brief summary of findings in ${detectedLang}
        4. For lab reports:
           - List each abnormal value with:
             * Parameter name
             * Current value
             * Normal range
             * Status (high/low)
             * Percentage deviation
             * Specific recommendations in ${detectedLang}
             * Urgency level
        5. For prescriptions:
           - List each medicine with:
             * Name
             * Dosage
             * Frequency
             * Duration
             * Special instructions in ${detectedLang}
        6. Recommendations in ${detectedLang}:
           - Immediate actions needed
           - Lifestyle changes
           - When to follow up
        
        Focus on accuracy and actionable medical insights.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        if (detectedLang !== i18n.language) {
          await i18n.changeLanguage(detectedLang);
        }
        setResult(analysis);
      }

    } catch (error) {
      console.error('Document analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analyzeDocument(file);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high': return 'text-rose-500 font-bold';
      case 'low': return 'text-amber-500 font-bold';
      case 'normal': return 'text-teal-400 font-bold';
      default: return 'text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high': return <ArrowUp className="text-rose-500" size={16} />;
      case 'low': return <ArrowDown className="text-amber-500" size={16} />;
      case 'normal': return <CheckCircle className="text-teal-400" size={16} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="file"
          onChange={handleFileUpload}
          accept="image/*,.pdf"
          className="hidden"
          id="document-upload"
          disabled={isAnalyzing}
        />
        <label
          htmlFor="document-upload"
          className="flex flex-col items-center justify-center space-y-4 bg-slate-900/80 text-slate-300 p-10 rounded-3xl cursor-pointer hover:bg-slate-800/80 hover:border-rose-500/50 transition-all duration-300 border-2 border-dashed border-rose-900/30 group shadow-2xl shadow-black/30"
        >
          {isAnalyzing ? (
            <motion.div
              className="flex flex-col items-center w-full max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-slate-800 p-5 rounded-full shadow-lg mb-6 animate-bounce border border-rose-500/30">
                <FileText size={32} className="text-rose-500" />
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-500 to-fuchsia-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-4 text-sm font-semibold text-rose-400">
                {t('analyzing')} ({Math.round(progress)}%)
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="bg-slate-800 p-5 rounded-full shadow-xl shadow-black/20 mb-5 group-hover:scale-110 transition-transform duration-500 border border-rose-900/20">
                <Upload size={32} className="text-rose-500" />
              </div>
              <p className="font-bold text-xl text-slate-100">{t('uploadDocument')}</p>
              <p className="text-sm text-slate-400 mt-2">
                {t('supportedFormats')}
              </p>
            </div>
          )}
        </label>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-8 border border-rose-900/20 shadow-2xl shadow-black/50"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
                  <span>{result.type === 'lab_report' ? t('labReport') : t('prescription')}</span>
                  {result.status === 'normal' && (
                    <span className="bg-teal-950/30 text-teal-400 p-1.5 rounded-full border border-teal-900/30"><CheckCircle size={20} /></span>
                  )}
                  {result.status === 'attention' && (
                    <span className="bg-amber-950/30 text-amber-400 p-1.5 rounded-full border border-amber-900/30"><AlertTriangle size={20} /></span>
                  )}
                  {result.status === 'critical' && (
                    <span className="bg-red-950/30 text-red-500 p-1.5 rounded-full border border-red-900/30"><AlertTriangle size={20} /></span>
                  )}
                </h3>
                <p className="text-slate-300 mt-4 leading-relaxed bg-slate-950/50 p-5 rounded-2xl border border-rose-900/10">
                  {result.summary}
                </p>
              </div>
              <button
                onClick={() => setResult(null)}
                className="text-slate-500 hover:text-slate-100 p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {result.type === 'lab_report' && result.abnormalValues && (
              <div className="space-y-6">
                <h4 className="font-bold text-slate-100 border-b border-rose-900/20 pb-2 flex items-center">
                  <span className="w-1.5 h-6 bg-rose-500 rounded-full mr-3" />
                  {t('abnormalValues')}
                </h4>
                <div className="grid gap-4">
                  {result.abnormalValues.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 hover:border-rose-900/30 hover:shadow-black transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(item.status)}
                            <span className="font-bold text-slate-200">
                              {item.parameter}
                            </span>
                          </div>
                          <div className="flex items-baseline space-x-2">
                            <span className={`text-2xl ${getStatusColor(item.status)}`}>
                              {item.value}
                            </span>
                            <span className="text-sm text-slate-500 font-medium">
                              ({item.percentage > 0 ? '+' : ''}{item.percentage}% from normal)
                            </span>
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                          {t('normalRange')}: {item.normalRange}
                        </div>
                      </div>
                      <div className="mt-4 text-sm bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <p className={`font-medium ${item.urgency === 'high'
                          ? 'text-rose-400'
                          : item.urgency === 'medium'
                            ? 'text-amber-400'
                            : 'text-teal-400'
                          }`}>
                          Recommendation: {item.recommendation}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {result.recommendations && (
              <div className="space-y-6 mt-10">
                <h4 className="font-bold text-slate-100 border-b border-rose-900/20 pb-2 flex items-center">
                  <span className="w-1.5 h-6 bg-fuchsia-500 rounded-full mr-3" />
                  {t('recommendations')}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.recommendations.immediate.length > 0 && (
                    <div className="bg-red-950/20 p-6 rounded-2xl border border-red-900/30">
                      <h5 className="text-sm font-bold text-red-400 mb-4 flex items-center uppercase tracking-wider">
                        <AlertTriangle size={16} className="mr-2" />
                        {t('immediateActions')}
                      </h5>
                      <ul className="space-y-3">
                        {result.recommendations.immediate.map((action, index) => (
                          <li key={index} className="flex items-start space-x-3 text-sm text-red-300/80">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.recommendations.lifestyle.length > 0 && (
                    <div className="bg-teal-950/20 p-6 rounded-2xl border border-teal-900/30">
                      <h5 className="text-sm font-bold text-teal-400 mb-4 flex items-center uppercase tracking-wider">
                        <CheckCircle size={16} className="mr-2" />
                        {t('lifestyleChanges')}
                      </h5>
                      <ul className="space-y-3">
                        {result.recommendations.lifestyle.map((change, index) => (
                          <li key={index} className="flex items-start space-x-3 text-sm text-teal-300/80">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0" />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-rose-900/10 flex items-center justify-center">
                  <p className="text-sm font-medium text-slate-400 bg-slate-900 px-6 py-2.5 rounded-full border border-rose-900/20">
                    {t('followUp')}: <span className="text-rose-400 font-bold ml-1">{result.recommendations.followUp}</span>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}