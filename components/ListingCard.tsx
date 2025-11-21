import React from 'react';
import { Listing } from '../types';
import { Star, MapPin } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  onClick: (listing: Listing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  return (
    <div 
      className="group cursor-pointer bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full"
      onClick={() => onClick(listing)}
    >
      {/* Image Wrapper */}
      <div className="relative w-full pt-[66%] overflow-hidden bg-gray-200">
        <img 
          src={listing.images[0]} 
          alt={listing.title}
          className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-semibold text-brand uppercase tracking-wider shadow-sm">
          {listing.subCategory}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-brand transition-colors">
            {listing.title}
          </h3>
          <div className="flex items-center text-sm font-medium text-gray-900">
            <Star className="w-3.5 h-3.5 fill-current text-yellow-400 mr-1" />
            {listing.rating}
          </div>
        </div>

        <div className="flex items-center text-gray-500 text-xs mb-4">
          <MapPin className="w-3 h-3 mr-1" />
          {listing.location}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="font-bold text-lg text-brand">€{listing.price}</span>
            <span className="text-gray-500 text-sm">/{listing.priceUnit}</span>
          </div>
          {listing.owner.isSuperHubber && (
            <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
              Super Hubber
            </span>
          )}
        </div>
      </div>
    </div>
  );
};