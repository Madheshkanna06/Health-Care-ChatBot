import React, { useState } from 'react';
import { MapPin, Phone, Clock, Navigation, PhoneCall, Star, Search, Loader2, Building2 } from 'lucide-react';

interface Hospital {
  name: string;
  rating: number;
  address: string;
  phone: string;
  hours: string;
  emergency: boolean;
  services: string[];
  distance: string;
}

export default function Hospitals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchHospitals = async (location: string) => {
    if (!location.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/hospitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hospital data');
      }

      const hospitalData = await response.json();
      if (hospitalData && Array.isArray(hospitalData) && hospitalData.length > 0) {
        setHospitals(hospitalData);
      } else {
        setError("No hospitals found in this location");
      }
    } catch (_error) {
      setError("Failed to fetch hospital information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchHospitals(searchQuery);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-6 rounded-3xl shadow-lg shadow-black border border-teal-900/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-slate-100">
          <div className="bg-teal-950/50 p-2.5 rounded-xl mr-3 text-teal-400">
            <Building2 size={24} />
          </div>
          Find Nearby Hospitals
        </h2>
        <form onSubmit={handleSearch} className="relative flex items-center space-x-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter your location (e.g. New York, Downtown)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 border border-slate-800 shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="bg-teal-600 text-white px-8 py-3.5 rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-900/40 flex items-center space-x-2 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={20} />
                <span>Search</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/30 text-red-400 p-4 rounded-xl flex items-center">
          <div className="bg-red-950/30 p-1 rounded-full mr-3">
            <Loader2 className="animate-spin" size={16} />
          </div>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hospitals.map((hospital, index) => (
          <div key={index} className="bg-slate-900/80 p-6 rounded-3xl shadow-md border border-slate-800 hover:shadow-xl hover:border-teal-900/50 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-teal-400 transition-colors">{hospital.name}</h3>
                </div>
                <div className="flex items-center space-x-1 text-amber-500 mb-2">
                  <Star size={16} fill="currentColor" />
                  <span className="font-semibold">{hospital.rating}</span>
                  <span className="text-slate-400 text-sm ml-1">• {hospital.distance} away</span>
                </div>
                {hospital.emergency && (
                  <span className="inline-flex items-center bg-red-950/20 text-red-400 text-xs font-bold px-2.5 py-1 rounded-full border border-red-900/30">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></div>
                    24/7 Emergency
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 text-slate-400 mb-6">
              <div className="flex items-start space-x-3">
                <MapPin size={18} className="text-teal-400 mt-1 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{hospital.address}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-green-400 flex-shrink-0" />
                <span className="font-medium text-slate-300">{hospital.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock size={18} className="text-orange-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">{hospital.hours}</span>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Services</h4>
              <div className="flex flex-wrap gap-2">
                {hospital.services.slice(0, 4).map((service, serviceIndex) => (
                  <span
                    key={serviceIndex}
                    className="bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg"
                  >
                    {service}
                  </span>
                ))}
                {hospital.services.length > 4 && (
                  <span className="bg-slate-800 text-slate-500 text-xs px-2 py-1 rounded-lg border border-slate-700">
                    +{hospital.services.length - 4} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(hospital.name + ' ' + hospital.address)}`, '_blank')}
                className="flex-1 bg-slate-800 text-teal-400 border-2 border-teal-900/30 px-4 py-2.5 rounded-xl hover:bg-slate-700 hover:border-teal-900/50 transition-colors flex items-center justify-center space-x-2 font-semibold"
              >
                <Navigation size={18} />
                <span>Directions</span>
              </button>
              <a
                href={`tel:${hospital.phone ? hospital.phone.replace(/[^\d+]/g, '') : ''}`}
                className="flex-1 bg-rose-500 text-white px-4 py-2.5 rounded-xl hover:bg-rose-600 hover:shadow-lg shadow-rose-900/40 transition-all flex items-center justify-center space-x-2 font-semibold"
              >
                <PhoneCall size={18} />
                <span>Call</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}