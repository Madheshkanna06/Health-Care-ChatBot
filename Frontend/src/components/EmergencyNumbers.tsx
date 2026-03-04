import React, { useState } from 'react';
import { Phone, Ambulance, ChevronFirst as FirstAid, Heart } from 'lucide-react';

export default function EmergencyNumbers() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm">
      <div className="flex items-center text-red-500 font-bold bg-slate-900 px-3 py-1.5 rounded-full shadow-lg border border-red-900/30 animate-pulse">
        <Phone size={16} className="mr-2 fill-current" />
        Emergency Numbers:
      </div>
      <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1.5 rounded-full border border-red-900/20 text-red-400 font-medium">
        <Ambulance size={16} className="text-red-500" />
        <span className="text-slate-400">Ambulance:</span>
        <span className="font-bold text-red-500">102</span>
      </div>
      <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1.5 rounded-full border border-amber-900/20 text-amber-400 font-medium">
        <Heart size={16} className="text-amber-500 fill-current" />
        <span className="text-slate-400">Emergency:</span>
        <span className="font-bold text-amber-500">108</span>
      </div>
      <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1.5 rounded-full border border-red-900/20 text-red-400 font-medium">
        <Phone size={16} className="text-red-500 fill-current" />
        <span className="text-slate-400">Health Helpline:</span>
        <span className="font-bold text-red-500">1075</span>
      </div>
      <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1.5 rounded-full border border-amber-900/20 text-amber-400 font-medium">
        <FirstAid size={16} className="text-amber-500" />
        <span className="text-slate-400">Medical Advice:</span>
        <span className="font-bold text-amber-500">104</span>
      </div>
    </div>
  );
}