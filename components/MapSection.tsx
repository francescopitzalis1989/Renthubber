
import React from 'react';
import { MapPin } from 'lucide-react';

interface MapSectionProps {
  location: string;
  coordinates: { lat: number; lng: number };
}

export const MapSection: React.FC<MapSectionProps> = ({ location }) => {
  return (
    <div className="py-8 border-b border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Dove ti troverai</h3>
      <p className="text-gray-500 mb-6 text-sm">{location} (La posizione esatta verrà fornita dopo la prenotazione)</p>
      
      {/* Map Placeholder */}
      <div className="w-full h-80 bg-gray-100 rounded-2xl relative overflow-hidden border border-gray-200">
         {/* Simulated Map Background Pattern */}
         <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
         
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-brand/10 w-32 h-32 rounded-full flex items-center justify-center animate-pulse">
               <div className="bg-brand text-white p-3 rounded-full shadow-lg transform -translate-y-2">
                  <MapPin className="w-6 h-6 fill-current" />
               </div>
            </div>
         </div>

         <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded shadow text-xs font-bold text-gray-500">
            © Mapbox © OpenStreetMap
         </div>
      </div>
      
      <div className="mt-4">
         <p className="text-sm text-gray-600 leading-relaxed">
            La zona è ben collegata con i mezzi pubblici e offre numerosi parcheggi nelle vicinanze. 
            È un quartiere tranquillo e sicuro, ideale per il ritiro e la riconsegna.
         </p>
      </div>
    </div>
  );
};
