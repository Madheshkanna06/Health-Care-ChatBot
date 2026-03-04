import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Howl } from 'howler';

interface VoiceInputProps {
  onVoiceInput: (text: string) => void;
  onStateChange?: (isListening: boolean) => void;
  isActive?: boolean;
  compact?: boolean;
  autoStartTrigger?: number;
}

const startSound = new Howl({
  src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'],
  volume: 0.5,
  html5: true
});

const stopSound = new Howl({
  src: ['https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'],
  volume: 0.5,
  html5: true
});

// Language mapping for speech recognition
const speechLanguages: { [key: string]: string } = {
  en: 'en-US',
  es: 'es-ES',
  hi: 'hi-IN',
  ta: 'ta-IN',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  ar: 'ar-SA'
};

export default function VoiceInput({
  onVoiceInput,
  onStateChange,
  isActive = true,
  compact = false,
  autoStartTrigger = 0
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const { t, i18n } = useTranslation();

  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Watch for auto-start trigger
  useEffect(() => {
    if (autoStartTrigger > 0 && !isListening && isActive) {
      startListening();
    }
  }, [autoStartTrigger]);

  useEffect(() => {
    if (onStateChange) onStateChange(isListening);
  }, [isListening, onStateChange]);

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    let animationFrame: number;

    const updateAudioLevel = () => {
      if (analyser && dataArray) {
        (analyser as any).getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
      }
      animationFrame = requestAnimationFrame(updateAudioLevel);
    };

    if (isListening && isActive) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          audioContext = new AudioContext();
          analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 256;
          dataArray = new Uint8Array(analyser.frequencyBinCount);
          updateAudioLevel();
        })
        .catch(err => console.error('Error accessing microphone:', err));
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isListening, isActive]);

  const startListening = () => {
    const language = speechLanguages[i18n.language] || 'en-US';
    SpeechRecognition.startListening({
      continuous: true,
      language: language
    });
    setIsListening(true);
    startSound.play();
  };

  const stopListening = () => {
    if (transcript.trim()) {
      onVoiceInput(transcript);
    }
    SpeechRecognition.stopListening();
    setIsListening(false);
    resetTranscript();
    stopSound.play();
  };

  const toggleListening = () => {
    if (!isActive) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  if (!isMicrophoneAvailable) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-rose-500 text-sm font-medium bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20"
      >
        {t('microphoneNotAvailable')}
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={toggleListening}
        disabled={!isActive}
        className={`rounded-full transition-all duration-300 relative shadow-lg flex items-center justify-center ${compact ? 'p-2.5 bg-slate-800 text-rose-400 hover:bg-slate-700 border border-rose-900/30' : 'p-4'} ${!isActive
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
          : isListening
            ? compact ? 'bg-rose-500 text-white' : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-900/40'
            : compact ? '' : 'bg-slate-800 text-rose-400 hover:bg-slate-700 border border-rose-900/30'
          }`}
        whileHover={isActive ? { scale: 1.1, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)" } : {}}
        whileTap={isActive ? { scale: 0.95 } : {}}
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="listening"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="relative flex items-center justify-center"
            >
              <MicOff size={compact ? 18 : 24} className="relative z-10" />
            </motion.div>
          ) : (
            <motion.div
              key="not-listening"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Mic size={compact ? 18 : 24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isListening && isActive && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl pointer-events-auto"
              onClick={stopListening}
            />

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="relative w-48 h-48 mb-12">
                {/* Pulsing Orb */}
                <motion.div
                  className="absolute inset-0 bg-rose-500/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.2 + audioLevel * 1.5, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-4 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 rounded-full shadow-2xl shadow-rose-500/50 flex items-center justify-center"
                  animate={{
                    scale: [1, 1 + audioLevel * 0.5, 1]
                  }}
                  transition={{ duration: 0.1 }}
                >
                  <Mic size={64} className="text-white drop-shadow-lg" />
                </motion.div>

                {/* Audio Wave Circles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-rose-500/30"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{
                      scale: [1, 2 + i * 0.2],
                      opacity: [0.3, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.6,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-bold text-white mb-2 tracking-tight"
              >
                {t('speakNow')}
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 0.6 }}
                className="text-rose-200 text-lg font-medium"
              >
                MediFriend is listening...
              </motion.p>

              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  stopListening();
                }}
                className="mt-12 pointer-events-auto bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full border border-white/20 backdrop-blur-md flex items-center space-x-2 transition-all font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={20} />
                <span>Stop Listening</span>
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}