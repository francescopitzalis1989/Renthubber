import React, { useState } from 'react';
import { Listing, ListingCategory } from '../types';
import { ListingCard } from '../components/ListingCard';
import { Search, SlidersHorizontal, Box, LayoutGrid } from 'lucide-react';

interface HomeProps {
  onListingClick: (listing: Listing) => void;
  listings: Listing[];
}

export const Home: React.FC<HomeProps> = ({ onListingClick, listings }) => {
  const [activeTab, setActiveTab] = useState<ListingCategory>('oggetto');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredListings = listings.filter(
    (l) => l.category === activeTab && l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Search Section */}
      <div className="bg-brand text-white pt-12 pb-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Noleggia qualsiasi cosa, <br/> ovunque tu sia.
          </h1>
          
          {/* Search Bar */}
          <div className="bg-white p-2 rounded-full shadow-2xl flex items-center max-w-2xl mx-auto">
            <div className="pl-4 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder={activeTab === 'oggetto' ? "Cerca trapano, fotocamera, bici..." : "Cerca ufficio, garage, sala pose..."}
              className="flex-grow px-4 py-3 text-gray-800 focus:outline-none rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="bg-brand-accent hover:bg-amber-500 text-brand-dark font-bold py-3 px-8 rounded-full transition-colors">
              Cerca
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Container - Overlapping Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 flex justify-center">
        <div className="bg-white rounded-xl shadow-lg p-2 inline-flex space-x-2">
          <button
            onClick={() => setActiveTab('oggetto')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'oggetto' 
                ? 'bg-brand text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Box className="w-4 h-4 mr-2" />
            Oggetti
          </button>
          <button
            onClick={() => setActiveTab('spazio')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'spazio' 
                ? 'bg-brand text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Spazi
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {activeTab === 'oggetto' ? 'Oggetti consigliati' : 'Spazi disponibili'}
        </h2>
        <button className="flex items-center text-gray-600 hover:text-brand border border-gray-300 px-4 py-2 rounded-lg hover:border-brand transition-colors text-sm font-medium">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtri avanzati
        </button>
      </div>

      {/* Listing Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredListings.map((listing) => (
              <ListingCard 
                key={listing.id} 
                listing={listing} 
                onClick={onListingClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Nessun annuncio trovato per questa categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
};