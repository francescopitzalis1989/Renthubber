
import React from 'react';
import { Listing, User } from '../types';
import { Plus, Edit, Trash2, Eye, Star, Package, AlertCircle } from 'lucide-react';

interface MyListingsProps {
  currentUser: User;
  listings: Listing[];
  onCreateNew: () => void;
  onEditListing?: (listing: Listing) => void; // New Prop
}

export const MyListings: React.FC<MyListingsProps> = ({ currentUser, listings, onCreateNew, onEditListing }) => {
  const myListings = listings.filter(l => l.owner.id === currentUser.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
             <h1 className="text-2xl font-bold text-gray-900">I miei Annunci</h1>
             <p className="text-gray-500">Gestisci i tuoi oggetti e spazi pubblicati.</p>
          </div>
          <button 
            onClick={onCreateNew}
            className="bg-brand hover:bg-brand-dark text-white font-bold py-2.5 px-6 rounded-xl flex items-center shadow-md transition-all"
          >
            <Plus className="w-5 h-5 mr-2" /> Crea Nuovo
          </button>
        </div>

        {myListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                <div className="relative h-48 bg-gray-200">
                   <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                   <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                        listing.status === 'draft' ? 'bg-yellow-500 text-white' : 
                        listing.status === 'suspended' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {listing.status === 'draft' ? 'Bozza' : listing.status === 'suspended' ? 'Sospeso' : 'Pubblicato'}
                      </span>
                   </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                   <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 line-clamp-1">{listing.title}</h3>
                      <span className="font-bold text-brand">€{listing.price}<span className="text-gray-400 text-xs font-normal">/{listing.priceUnit}</span></span>
                   </div>
                   
                   <p className="text-xs text-gray-500 mb-4 line-clamp-2">{listing.description}</p>
                   
                   <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-500">
                         <Eye className="w-4 h-4 mr-1" /> {Math.floor(Math.random() * 300)}
                         <span className="mx-2">•</span>
                         <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" /> {listing.rating || 0}
                      </div>
                      <div className="flex space-x-2">
                         <button 
                            onClick={() => onEditListing && onEditListing(listing)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors flex items-center" 
                            title="Modifica"
                         >
                            <Edit className="w-4 h-4" />
                         </button>
                         <button className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Elimina">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2">Nessun annuncio presente</h3>
             <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Non hai ancora pubblicato nulla. Inizia a guadagnare noleggiando i tuoi oggetti o spazi inutilizzati.
             </p>
             <button 
               onClick={onCreateNew}
               className="text-brand font-bold hover:underline"
             >
               Pubblica il tuo primo annuncio
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
