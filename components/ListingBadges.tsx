
import React from 'react';
import { Listing } from '../types';
import { Award, Sparkles, Flame } from 'lucide-react';

interface ListingBadgesProps {
  listing: Listing;
}

export const ListingBadges: React.FC<ListingBadgesProps> = ({ listing }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {listing.owner.isSuperHubber && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
          <Award className="w-3.5 h-3.5 mr-1.5 text-brand" />
          SuperHubber
        </span>
      )}
      {listing.reviewCount === 0 && (
         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Novità
         </span>
      )}
      {listing.reviewCount > 50 && (
         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
            <Flame className="w-3.5 h-3.5 mr-1.5" />
            Amato dagli ospiti
         </span>
      )}
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
        {listing.category}
      </span>
    </div>
  );
};
