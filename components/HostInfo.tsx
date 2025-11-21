
import React from 'react';
import { User } from '../types';
import { Star, ShieldCheck, Award } from 'lucide-react';

interface HostInfoProps {
  owner: User;
  onHostClick?: (host: User) => void;
}

export const HostInfo: React.FC<HostInfoProps> = ({ owner, onHostClick }) => {
  return (
    <div className="border-t border-b border-gray-100 py-8 flex items-start gap-4">
      <div 
        className={`relative ${onHostClick ? 'cursor-pointer' : ''}`}
        onClick={() => onHostClick && onHostClick(owner)}
      >
         <img src={owner.avatar} alt={owner.name} className="w-16 h-16 rounded-full object-cover border border-gray-200 hover:opacity-90 transition-opacity" />
         {owner.isSuperHubber && (
            <div className="absolute bottom-0 right-0 bg-brand text-white p-1 rounded-full border-2 border-white shadow-sm">
               <Award className="w-3 h-3" />
            </div>
         )}
      </div>
      
      <div className="flex-1">
         <h3 
           className={`text-lg font-bold text-gray-900 ${onHostClick ? 'cursor-pointer hover:underline decoration-2 underline-offset-2' : ''}`}
           onClick={() => onHostClick && onHostClick(owner)}
         >
           Host: {owner.name}
         </h3>
         <p className="text-sm text-gray-500 mb-3">Membro dal {owner.hubberSince ? new Date(owner.hubberSince).getFullYear() : '2023'}</p>
         
         <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center text-gray-700">
               <Star className="w-4 h-4 mr-1.5 text-gray-900 fill-current" />
               <span className="font-bold mr-1">{owner.rating}</span> valutazioni
            </div>
            <div className="flex items-center text-gray-700">
               <ShieldCheck className="w-4 h-4 mr-1.5 text-gray-900" />
               Identità verificata
            </div>
         </div>
         
         <p className="mt-4 text-gray-600 text-sm leading-relaxed max-w-lg">
            {owner.bio ? owner.bio : `Ciao, sono ${owner.name.split(' ')[0]}! Amo condividere le mie passioni e mettere a disposizione ciò che non uso.`}
         </p>
      </div>
    </div>
  );
};
