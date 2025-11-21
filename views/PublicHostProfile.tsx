
import React from 'react';
import { User, Listing } from '../types';
import { 
  Star, ShieldCheck, Award, MessageCircle, Check, MapPin, 
  Calendar, Globe, ChevronLeft, CheckCircle2 
} from 'lucide-react';
import { ListingCard } from '../components/ListingCard';

interface PublicHostProfileProps {
  host: User;
  listings: Listing[]; // All listings in the system, we'll filter them
  onBack: () => void;
  onListingClick: (listing: Listing) => void;
}

export const PublicHostProfile: React.FC<PublicHostProfileProps> = ({ host, listings, onBack, onListingClick }) => {
  // Filter listings for this host
  const hostListings = listings.filter(l => l.owner.id === host.id && l.status === 'published');
  
  // Mock gathering reviews (in a real app this would be an API call)
  // Here we aggregate reviews from the filtered listings
  const hostReviews = hostListings.flatMap(l => l.reviews);
  
  // Fallback for reviews if mock data is empty, just to show UI
  const displayReviews = hostReviews.length > 0 ? hostReviews : [
     { id: 'mock1', userId: 'u99', userName: 'Marco P.', date: '2023-09-15', rating: 5, comment: 'Host fantastico, super disponibile e gentile.' },
     { id: 'mock2', userId: 'u98', userName: 'Elena S.', date: '2023-08-20', rating: 5, comment: 'Tutto perfetto, consigliatissimo!' }
  ];

  const joinYear = host.hubberSince ? new Date(host.hubberSince).getFullYear() : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Nav Placeholder */}
      <div className="max-w-7xl mx-auto px-4 py-6">
         <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 font-medium">
            <ChevronLeft className="w-5 h-5 mr-1" /> Indietro
         </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         {/* LEFT COLUMN: PROFILE CARD */}
         <div className="lg:col-span-4">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm sticky top-24">
               
               <div className="flex flex-col items-center text-center mb-6">
                  <div className="relative mb-4">
                     <img src={host.avatar} alt={host.name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md" />
                     {host.isSuperHubber && (
                        <div className="absolute bottom-0 right-0 bg-brand text-white p-2 rounded-full border-4 border-white shadow-sm" title="SuperHubber">
                           <Award className="w-6 h-6" />
                        </div>
                     )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{host.name}</h1>
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                     {host.isSuperHubber && <span className="font-bold text-gray-900 mr-2">SuperHubber</span>}
                  </div>
               </div>

               {/* Stats Grid */}
               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 p-3 rounded-xl text-center">
                     <p className="text-lg font-bold text-gray-900 flex items-center justify-center">
                        {host.reviewCount || 24} <Star className="w-3 h-3 ml-1" />
                     </p>
                     <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Recensioni</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl text-center">
                     <p className="text-lg font-bold text-gray-900">{host.rating}</p>
                     <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Rating</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl text-center">
                     <p className="text-lg font-bold text-gray-900">{joinYear}</p>
                     <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Anni su Renthubber</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl text-center">
                     <p className="text-lg font-bold text-gray-900">{hostListings.length}</p>
                     <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Annunci</p>
                  </div>
               </div>

               {/* Verifications */}
               <div className="border-t border-gray-100 pt-6 space-y-4">
                  <h3 className="font-bold text-gray-900 mb-2">Informazioni verificate</h3>
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-gray-600">Identità</span>
                     {host.verifications?.identity ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <span className="text-gray-300 text-xs">Non verificata</span>}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-gray-600">Indirizzo Email</span>
                     {host.verifications?.email ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <span className="text-gray-300 text-xs">Non verificata</span>}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-gray-600">Numero di telefono</span>
                     {host.verifications?.phone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <span className="text-gray-300 text-xs">Non verificata</span>}
                  </div>
               </div>

            </div>
         </div>

         {/* RIGHT COLUMN: DETAILS */}
         <div className="lg:col-span-8 space-y-12 py-4">
            
            {/* About */}
            <section className="space-y-6">
               <h2 className="text-2xl font-bold text-gray-900">Informazioni su {host.name.split(' ')[0]}</h2>
               <div className="prose text-gray-600 leading-relaxed">
                  <p>{host.bio || `Ciao! Sono un membro della community Renthubber dal ${joinYear}.`}</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {host.languages && (
                     <div className="flex items-start">
                        <Globe className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                           <p className="font-bold text-gray-900 text-sm">Lingue parlate</p>
                           <p className="text-sm text-gray-600">{host.languages.join(', ')}</p>
                        </div>
                     </div>
                  )}
                  {host.responseTime && (
                     <div className="flex items-start">
                        <MessageCircle className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                           <p className="font-bold text-gray-900 text-sm">Tempo di risposta</p>
                           <p className="text-sm text-gray-600">{host.responseTime}</p>
                        </div>
                     </div>
                  )}
                  <div className="flex items-start">
                     <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                     <div>
                        <p className="font-bold text-gray-900 text-sm">Vive a</p>
                        <p className="text-sm text-gray-600">{host.address ? host.address.split(',')[1] : 'Italia'}</p>
                     </div>
                  </div>
               </div>
            </section>

            {/* Listings */}
            <section className="border-t border-gray-100 pt-10">
               <h2 className="text-2xl font-bold text-gray-900 mb-6">Gli annunci di {host.name.split(' ')[0]}</h2>
               {hostListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {hostListings.map(listing => (
                        <ListingCard key={listing.id} listing={listing} onClick={onListingClick} />
                     ))}
                  </div>
               ) : (
                  <p className="text-gray-500">Nessun annuncio attivo al momento.</p>
               )}
            </section>

            {/* Reviews */}
            <section className="border-t border-gray-100 pt-10">
               <div className="flex items-center mb-6">
                  <Star className="w-6 h-6 text-gray-900 fill-current mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                     {displayReviews.length} recensioni
                  </h2>
               </div>
               
               {displayReviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {displayReviews.map((review, idx) => (
                        <div key={idx} className="bg-gray-50 p-5 rounded-2xl">
                           <div className="flex items-center mb-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 mr-3">
                                 {review.userName.charAt(0)}
                              </div>
                              <div>
                                 <p className="font-bold text-gray-900 text-sm">{review.userName}</p>
                                 <p className="text-xs text-gray-500">{review.date}</p>
                              </div>
                           </div>
                           <p className="text-gray-600 text-sm leading-relaxed">
                              {review.comment}
                           </p>
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="text-gray-500 italic">Questo host non ha ancora ricevuto recensioni.</p>
               )}
            </section>
         </div>

      </div>
    </div>
  );
};
