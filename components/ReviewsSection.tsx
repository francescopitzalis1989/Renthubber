
import React from 'react';
import { Review } from '../types';
import { Star } from 'lucide-react';

interface ReviewsSectionProps {
  rating: number;
  reviewCount: number;
  reviews: Review[];
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ rating, reviewCount, reviews }) => {
  return (
    <div className="py-8">
      <div className="flex items-center mb-8">
         <Star className="w-6 h-6 text-gray-900 fill-current mr-2" />
         <h2 className="text-2xl font-bold text-gray-900">
            {rating > 0 ? `${rating} · ${reviewCount} recensioni` : 'Nessuna recensione'}
         </h2>
      </div>

      {reviews.length > 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {reviews.slice(0, 6).map((review) => (
               <div key={review.id}>
                  <div className="flex items-center mb-3">
                     <img 
                       src={`https://ui-avatars.com/api/?name=${review.userName}&background=random`} 
                       alt={review.userName} 
                       className="w-10 h-10 rounded-full mr-3 bg-gray-200"
                     />
                     <div>
                        <h4 className="font-bold text-gray-900 text-sm">{review.userName}</h4>
                        <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString('it-IT', {month: 'long', year: 'numeric'})}</p>
                     </div>
                  </div>
                  <div className="flex items-center mb-2 text-xs">
                     {Array.from({length: 5}).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-gray-900 fill-current' : 'text-gray-300'}`} />
                     ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                     {review.comment}
                  </p>
               </div>
            ))}
         </div>
      ) : (
         <p className="text-gray-500 italic">Questo annuncio non ha ancora ricevuto recensioni. Sii il primo!</p>
      )}
      
      {reviewCount > 6 && (
         <button className="mt-8 border border-black text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
            Mostra tutte le {reviewCount} recensioni
         </button>
      )}
    </div>
  );
};
