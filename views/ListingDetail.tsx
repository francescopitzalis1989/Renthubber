
import React, { useState, useEffect, useRef } from 'react';
import { Listing, SystemConfig, User } from '../types';
import { Star, MapPin, Check, ChevronLeft, Wallet as WalletIcon, X, CreditCard, Minus, Plus } from 'lucide-react';
import { AirbnbCalendar } from '../components/AirbnbCalendar';
import { PhotoGallery } from '../components/PhotoGallery';
import { HostInfo } from '../components/HostInfo';
import { ListingBadges } from '../components/ListingBadges';
import { RulesAndPolicies } from '../components/RulesAndPolicies';
import { MapSection } from '../components/MapSection';
import { ReviewsSection } from '../components/ReviewsSection';
import { RelatedListingsSection } from '../components/RelatedListingsSection';

interface ListingDetailProps {
  listing: Listing;
  currentUser: User | null;
  onBack: () => void;
  systemConfig?: SystemConfig;
  onPaymentSuccess: (amount: number, useWallet: number) => void;
  onHostClick?: (host: User) => void; // NEW PROP
}

export const ListingDetail: React.FC<ListingDetailProps> = ({ listing, currentUser, onBack, systemConfig, onPaymentSuccess, onHostClick }) => {
  // State for custom Airbnb-style Calendar
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Time selection state for Spaces
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("10:00");

  // Legacy hours state (kept for objects if needed)
  const [hours, setHours] = useState(1);
  
  const [guests, setGuests] = useState(1);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Booking calculation state
  const [duration, setDuration] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [total, setTotal] = useState(0);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [useWallet, setUseWallet] = useState(true);

  // Get Fee Rates
  const feePercentage = systemConfig?.fees?.platformPercentage || 10;
  const fixedFee = systemConfig?.fees?.fixedFeeEur || 2;

  // Generate time options
  const timeOptions = Array.from({ length: 16 }, (_, i) => {
    const h = i + 8;
    return `${h < 10 ? '0' + h : h}:00`;
  });

  // Format date helper
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Aggiungi data';
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Close calendar on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock disabled dates
  const getDisabledDates = () => {
    const dates = [];
    const today = new Date();
    // Disable 5 days from now
    const blocked = new Date(today);
    blocked.setDate(today.getDate() + 5);
    dates.push(blocked);
    return dates;
  };
  
  const disabledDates = getDisabledDates();

  // Calculate totals
  useEffect(() => {
    let calculatedDuration = 0;
    let calculatedSubtotal = 0;

    if (listing.priceUnit === 'ora') {
      if (listing.category === 'spazio') {
         const startHour = parseInt(checkInTime.split(':')[0]);
         const endHour = parseInt(checkOutTime.split(':')[0]);
         let diff = endHour - startHour;
         if (diff <= 0) diff = 1; 
         calculatedDuration = diff;
      } else {
         calculatedDuration = hours;
      }
      
      if (startDate) {
        calculatedSubtotal = calculatedDuration * listing.price;
      }
    } else {
      if (startDate && endDate) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        calculatedDuration = diffDays || 1;
        calculatedSubtotal = calculatedDuration * listing.price;
      } else if (startDate) {
        calculatedDuration = 1;
        calculatedSubtotal = listing.price;
      }
    }

    const calculatedFee = Math.round((calculatedSubtotal * feePercentage) / 100) + fixedFee;
    
    setDuration(calculatedDuration);
    setSubtotal(calculatedSubtotal);
    setServiceFee(calculatedFee);
    setTotal(calculatedSubtotal + calculatedFee + (listing.deposit || 0));

  }, [startDate, endDate, hours, checkInTime, checkOutTime, guests, listing.price, listing.priceUnit, listing.deposit, listing.category, feePercentage, fixedFee]);

  const handleBookingClick = () => {
    if (!currentUser) {
       alert("Devi accedere per prenotare.");
       return;
    }
    if (!startDate) {
      setIsCalendarOpen(true);
      return;
    }
    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    const walletAmount = (useWallet && currentUser) ? Math.min(total, currentUser.renterBalance) : 0;
    onPaymentSuccess(total, walletAmount);
    setShowPaymentModal(false);
    alert("Prenotazione confermata con successo!");
    onBack();
  };

  const handleCalendarChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
  };

  const walletCovered = (useWallet && currentUser) ? Math.min(total, currentUser.renterBalance) : 0;
  const remainingToPay = total - walletCovered;

  return (
    <div className="bg-white min-h-screen pb-12 relative font-sans">
      
      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-bold text-gray-900 text-lg">Conferma e Paga</h3>
                 <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-6">
                 <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                       <span>Noleggio ({duration} {listing.priceUnit === 'ora' ? 'ore' : 'notte/i'})</span>
                       <span>€{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                       <span>Commissioni</span>
                       <span>€{serviceFee}</span>
                    </div>
                    {listing.deposit && listing.deposit > 0 && (
                       <div className="flex justify-between text-sm text-gray-600">
                          <span>Cauzione</span>
                          <span>€{listing.deposit}</span>
                       </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-lg">
                       <span>Totale</span>
                       <span>€{total}</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="font-bold text-sm text-gray-700 uppercase">Metodo di Pagamento</h4>
                    <div 
                       onClick={() => setUseWallet(!useWallet)}
                       className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${useWallet ? 'border-brand bg-brand/5 ring-1 ring-brand' : 'border-gray-200'}`}
                    >
                       <div className="flex items-center">
                          <div className={`p-2 rounded-full mr-3 ${useWallet ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>
                             <WalletIcon className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="font-semibold text-sm text-gray-900">Usa Credito Wallet</p>
                             <p className="text-xs text-gray-500">Saldo: €{currentUser?.renterBalance.toFixed(2)}</p>
                          </div>
                       </div>
                       {useWallet && <Check className="w-5 h-5 text-brand" />}
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between opacity-80">
                       <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-full mr-3">
                             <CreditCard className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                             <p className="font-semibold text-sm text-gray-900">Carta •••• 4242</p>
                          </div>
                       </div>
                       <span className="text-xs font-bold text-gray-500">Stripe</span>
                    </div>
                 </div>

                 <button 
                   onClick={confirmPayment}
                   className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
                 >
                    Paga €{remainingToPay.toFixed(2)}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Navbar Placeholder */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-brand font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Torna alla ricerca
        </button>
      </div>

      {/* Main Detail Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         
         {/* 1. PHOTO GALLERY */}
         <PhotoGallery images={listing.images} />

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
            {/* LEFT CONTENT */}
            <div className="lg:col-span-2 space-y-8">
               
               <div className="border-b border-gray-100 pb-6">
                  {/* 2. LISTING BADGES */}
                  <ListingBadges listing={listing} />
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                  <div className="flex items-center text-gray-600 text-sm">
                     <span className="font-semibold flex items-center text-gray-900 mr-1"><Star className="w-4 h-4 fill-current mr-1" /> {listing.rating || 'New'}</span>
                     <span className="mx-2">·</span>
                     <span className="underline">{listing.reviewCount} recensioni</span>
                     <span className="mx-2">·</span>
                     <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {listing.location}</span>
                  </div>
               </div>
               
               {/* 3. HOST INFO - CLICKABLE */}
               <HostInfo owner={listing.owner} onHostClick={onHostClick} />

               {/* Description & Features */}
               <div className="py-4 space-y-6 border-b border-gray-100 pb-8">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
                  
                  <div>
                     <h3 className="font-bold text-gray-900 mb-4">Cosa troverai</h3>
                     <div className="grid grid-cols-2 gap-4">
                        {listing.features.map((f, i) => (
                           <div key={i} className="flex items-center text-gray-600">
                              <Check className="w-5 h-5 mr-3 text-gray-400" /> {f}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* 4. RULES & POLICIES */}
               <RulesAndPolicies rules={listing.rules} cancellationPolicy={listing.cancellationPolicy} deposit={listing.deposit} />

               {/* 5. MAP SECTION */}
               <MapSection location={listing.location} coordinates={listing.coordinates} />
               
               {/* 6. REVIEWS SECTION */}
               <ReviewsSection rating={listing.rating} reviewCount={listing.reviewCount} reviews={listing.reviews} />

            </div>

            {/* RIGHT WIDGET (Booking) */}
            <div className="lg:col-span-1 relative">
               <div className="sticky top-28 border border-gray-200 rounded-2xl shadow-xl p-6 bg-white z-30">
                  
                  {/* Price Header */}
                  <div className="flex justify-between items-end mb-6">
                     <div>
                        <span className="text-2xl font-bold text-gray-900">€{listing.price}</span>
                        <span className="text-gray-500"> / {listing.priceUnit}</span>
                     </div>
                     <div className="text-sm text-gray-500 underline cursor-pointer">
                        {listing.reviewCount} recensioni
                     </div>
                  </div>

                  {/* WIDGET INPUTS */}
                  <div className="border border-gray-400 rounded-xl overflow-visible mb-4 relative bg-white">
                     
                     {/* Date Section */}
                     <div className="grid grid-cols-2 border-b border-gray-400" onClick={() => setIsCalendarOpen(!isCalendarOpen)}>
                        <div className="p-3 border-r border-gray-400 cursor-pointer hover:bg-gray-50 transition-colors relative rounded-tl-xl">
                           <p className="text-[10px] font-bold uppercase text-gray-800">Check-in</p>
                           <p className={`text-sm truncate ${startDate ? 'text-gray-900' : 'text-gray-400'}`}>
                              {formatDate(startDate)}
                           </p>
                        </div>
                        <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors relative rounded-tr-xl">
                           <p className="text-[10px] font-bold uppercase text-gray-800">Check-out</p>
                           <p className={`text-sm truncate ${endDate ? 'text-gray-900' : 'text-gray-400'}`}>
                              {formatDate(endDate)}
                           </p>
                        </div>
                     </div>

                     {/* CALENDAR POPOVER (Airbnb Style) */}
                     {isCalendarOpen && (
                        <div 
                           ref={calendarRef}
                           className="absolute top-0 right-0 z-50 origin-top-right -mt-2"
                        >
                           {/* Larghezza aumentata per layout doppio stile Airbnb */}
                           <div className="w-[340px] md:w-[850px]">
                              <AirbnbCalendar
                                 selectedStart={startDate}
                                 selectedEnd={endDate}
                                 onChange={handleCalendarChange}
                                 disabledDates={disabledDates}
                                 location={listing.location}
                                 onClose={() => setIsCalendarOpen(false)}
                              />
                           </div>
                        </div>
                     )}

                     {/* Guests Section - ONLY FOR SPACES */}
                     {listing.category === 'spazio' && (
                        <>
                           <div className="p-3 border-b border-gray-400 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center">
                              <div>
                                 <p className="text-[10px] font-bold uppercase text-gray-800">Ospiti</p>
                                 <p className="text-sm text-gray-900">{guests}</p>
                              </div>
                              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                 <button 
                                    onClick={() => setGuests(Math.max(1, guests - 1))}
                                    className={`p-1 rounded-full border ${guests === 1 ? 'border-gray-200 text-gray-300' : 'border-gray-400 text-gray-600 hover:border-black'}`}
                                    disabled={guests <= 1}
                                 >
                                    <Minus className="w-4 h-4" />
                                 </button>
                                 <button 
                                    onClick={() => setGuests(guests + 1)}
                                    className="p-1 rounded-full border border-gray-400 text-gray-600 hover:border-black"
                                 >
                                    <Plus className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>

                           <div className="p-3 flex justify-between items-center hover:bg-gray-50 rounded-b-xl">
                              <div className="w-full">
                                 <p className="text-[10px] font-bold uppercase text-gray-800 mb-1">Orario</p>
                                 <div className="flex items-center space-x-2 text-sm">
                                    <div className="flex-1">
                                       <select 
                                          value={checkInTime}
                                          onChange={(e) => {
                                             setCheckInTime(e.target.value);
                                             if (parseInt(e.target.value) >= parseInt(checkOutTime)) {
                                                const nextHour = parseInt(e.target.value.split(':')[0]) + 1;
                                                if (nextHour <= 23) setCheckOutTime(`${nextHour < 10 ? '0' + nextHour : nextHour}:00`);
                                             }
                                          }}
                                          className="w-full bg-transparent border-none p-0 text-gray-900 font-medium focus:ring-0 cursor-pointer"
                                       >
                                          {timeOptions.slice(0, -1).map(t => (
                                             <option key={t} value={t}>Dalle {t}</option>
                                          ))}
                                       </select>
                                    </div>
                                    <span className="text-gray-400">-</span>
                                    <div className="flex-1">
                                       <select 
                                          value={checkOutTime}
                                          onChange={(e) => setCheckOutTime(e.target.value)}
                                          className="w-full bg-transparent border-none p-0 text-gray-900 font-medium focus:ring-0 cursor-pointer"
                                       >
                                          {timeOptions.map(t => (
                                             <option key={t} value={t} disabled={parseInt(t) <= parseInt(checkInTime)}>Alle {t}</option>
                                          ))}
                                       </select>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </>
                     )}

                     {/* Hours Section - ONLY FOR HOURLY OBJECTS */}
                     {listing.priceUnit === 'ora' && listing.category === 'oggetto' && (
                        <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center rounded-b-xl">
                           <div>
                              <p className="text-[10px] font-bold uppercase text-gray-800">Ore</p>
                              <p className="text-sm text-gray-900">{hours} ore</p>
                           </div>
                           <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button 
                                 onClick={() => setHours(Math.max(1, hours - 1))}
                                 className="p-1 rounded-full border border-gray-400 text-gray-600 hover:border-black"
                              >
                                 <Minus className="w-4 h-4" />
                              </button>
                              <button 
                                 onClick={() => setHours(hours + 1)}
                                 className="p-1 rounded-full border border-gray-400 text-gray-600 hover:border-black"
                              >
                                 <Plus className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Main Action Button */}
                  <button 
                    onClick={handleBookingClick}
                    className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl text-lg shadow-md transition-all mb-4"
                  >
                     {duration ? 'Prenota' : 'Verifica disponibilità'}
                  </button>

                  {duration > 0 && (
                     <>
                        <p className="text-center text-sm text-gray-500 mb-6">Non riceverai alcun addebito in questa fase</p>
                        
                        <div className="space-y-3 text-gray-600">
                           <div className="flex justify-between underline decoration-gray-300">
                              <span>€{listing.price} x {duration} {listing.priceUnit === 'ora' ? 'ore' : 'notti'}</span>
                              <span>€{subtotal}</span>
                           </div>
                           <div className="flex justify-between underline decoration-gray-300">
                              <span>Costi del servizio Renthubber</span>
                              <span>€{serviceFee}</span>
                           </div>
                           {listing.deposit && listing.deposit > 0 && (
                              <div className="flex justify-between underline decoration-gray-300">
                                 <span>Cauzione (rimborsabile)</span>
                                 <span>€{listing.deposit}</span>
                              </div>
                           )}
                        </div>
                        
                        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-bold text-gray-900 text-lg">
                           <span>Totale</span>
                           <span>€{total}</span>
                        </div>
                     </>
                  )}
               </div>
            </div>
         </div>
         
         {/* 7. RELATED LISTINGS (Bottom) */}
         <div className="mt-16 pt-12 border-t border-gray-200">
            <RelatedListingsSection category={listing.category} />
         </div>
      </div>
    </div>
  );
};
