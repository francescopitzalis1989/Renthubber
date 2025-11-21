
import React, { useState } from 'react';
import { User, BookingRequest, ActiveMode, Invoice } from '../types';
import { 
  TrendingUp, Calendar, DollarSign, Clock, Package, MapPin, FileText, Download, CheckCircle2, ShieldCheck, Upload, Lock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { MOCK_REQUESTS } from '../constants';

// Mock Data for Charts
const dataEarnings = [
  { name: 'Set 1', value: 400 },
  { name: 'Set 2', value: 300 },
  { name: 'Set 3', value: 600 },
  { name: 'Set 4', value: 850 },
];

interface DashboardProps {
  user: User;
  activeMode: ActiveMode; 
  onManageListings: () => void;
  invoices?: Invoice[]; 
}

export const Dashboard: React.FC<DashboardProps> = ({ user, activeMode, onManageListings, invoices = [] }) => {
  // Hubber State
  const [requests, setRequests] = useState<BookingRequest[]>(MOCK_REQUESTS);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'security'>('overview'); // Tab navigation
  
  // Filter requests for Hubber
  const hubberBookings = requests.filter(req => req.hostId === user.id);
  // Filter invoices for Hubber
  const myInvoices = invoices.filter(inv => inv.hubberId === user.id);

  const handleRequestAction = (id: string, action: 'accepted' | 'rejected') => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status: action } : req));
  };

  // --- RENDER SECURITY SECTION (Shared) ---
  const renderSecurity = () => (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl">
       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center">
             <ShieldCheck className="w-6 h-6 text-brand mr-2" /> Stato Verifiche Account
          </h3>
          <p className="text-gray-500 text-sm mb-6">Per garantire la sicurezza della piattaforma, completiamo diverse verifiche.</p>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${user.emailVerified ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      {user.emailVerified ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                   </div>
                   <div>
                      <p className="font-bold text-gray-900">Indirizzo Email</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                   </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${user.emailVerified ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                   {user.emailVerified ? 'Verificato' : 'Non Verificato'}
                </span>
             </div>

             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${user.phoneVerified ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      {user.phoneVerified ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                   </div>
                   <div>
                      <p className="font-bold text-gray-900">Numero di Telefono</p>
                      <p className="text-xs text-gray-500">{user.phoneNumber || 'Non inserito'}</p>
                   </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${user.phoneVerified ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                   {user.phoneVerified ? 'Verificato' : 'Non Verificato'}
                </span>
             </div>

             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${user.idDocumentVerified ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      {user.idDocumentVerified ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                   </div>
                   <div>
                      <p className="font-bold text-gray-900">Documento d'Identità</p>
                      <p className="text-xs text-gray-500">Richiesto per noleggiare e ospitare</p>
                   </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${user.idDocumentVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                   {user.idDocumentVerified ? 'Verificato' : 'In Attesa / Mancante'}
                </span>
             </div>
          </div>

          {!user.idDocumentVerified && (
             <div className="mt-6 border-t border-gray-100 pt-6">
                <h4 className="font-bold text-gray-900 mb-4">Carica Documento</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 cursor-pointer transition-colors">
                   <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                   <p className="text-gray-600 font-medium">Trascina qui il tuo documento o clicca per caricare</p>
                   <p className="text-xs text-gray-400 mt-1">PDF, JPG o PNG (Max 5MB)</p>
                   <button className="mt-4 px-4 py-2 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors">
                      Seleziona File
                   </button>
                </div>
             </div>
          )}
       </div>
    </div>
  );

  // --- RENDER HUBBER OVERVIEW ---
  const renderHubberOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-sm text-gray-500">Guadagni Ottobre</p>
          <h3 className="text-2xl font-bold text-gray-900">€ {user.hubberBalance.toFixed(2)}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Prenotazioni Attive</p>
          <h3 className="text-2xl font-bold text-gray-900">4</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Visualizzazioni Annunci</p>
          <h3 className="text-2xl font-bold text-gray-900">892</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Tempo di Risposta</p>
          <h3 className="text-2xl font-bold text-gray-900">1.2 ore</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Andamento Guadagni</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataEarnings}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D414B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0D414B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                />
                <Area type="monotone" dataKey="value" stroke="#0D414B" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Requests */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Richieste ({requests.filter(r => r.status === 'pending').length})</h3>
            <button className="text-sm text-brand font-medium hover:underline">Vedi tutte</button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {requests.map(req => (
              <div key={req.id} className={`border rounded-xl p-4 transition-all ${req.status !== 'pending' ? 'opacity-50 bg-gray-50' : 'border-gray-200'}`}>
                <div className="flex gap-3 mb-3">
                  <img src={req.listingImage} alt="listing" className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{req.listingTitle}</h4>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                      <Clock className="w-3 h-3 mr-1" /> Scade in {req.timeLeft}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-3">
                   <div className="flex items-center">
                      <img src={req.renterAvatar} alt="user" className="w-6 h-6 rounded-full mr-2" />
                      <span className="text-sm font-medium text-gray-700">{req.renterName}</span>
                   </div>
                   <span className="text-sm font-bold text-gray-900">€{req.totalPrice}</span>
                </div>

                {req.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleRequestAction(req.id, 'rejected')}
                      className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50"
                    >
                      Rifiuta
                    </button>
                    <button 
                      onClick={() => handleRequestAction(req.id, 'accepted')}
                      className="flex-1 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-dark"
                    >
                      Accetta
                    </button>
                  </div>
                ) : (
                  <div className={`text-center py-1 text-sm font-bold rounded-lg ${req.status === 'accepted' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {req.status === 'accepted' ? 'Accettata' : 'Rifiutata'}
                  </div>
                )}
              </div>
            ))}
            {requests.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Nessuna richiesta al momento.</p>}
          </div>
        </div>
      </div>
    </div>
  );

  // --- RENDER HUBBER PAYMENTS ---
  const renderHubberPayments = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
             <h3 className="font-bold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-brand" /> Dettaglio Prenotazioni & Guadagni
             </h3>
             <p className="text-gray-500 text-sm mt-1">Lista delle prenotazioni completate o accettate con dettaglio commissioni.</p>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                   <tr>
                      <th className="p-4">Data</th>
                      <th className="p-4">Annuncio</th>
                      <th className="p-4">Renter</th>
                      <th className="p-4">Stato</th>
                      <th className="p-4">Totale</th>
                      <th className="p-4 text-red-500">Commissione</th>
                      <th className="p-4 text-green-600 text-right">Netto Hubber</th>
                   </tr>
                </thead>
                <tbody>
                   {hubberBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50">
                         <td className="p-4 text-xs whitespace-nowrap">{booking.dates}</td>
                         <td className="p-4 font-medium text-gray-900">{booking.listingTitle}</td>
                         <td className="p-4">{booking.renterName}</td>
                         <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                               booking.status === 'completed' ? 'bg-green-100 text-green-700' : 
                               booking.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                               {booking.status}
                            </span>
                         </td>
                         <td className="p-4 font-bold">€{booking.totalPrice.toFixed(2)}</td>
                         <td className="p-4 text-red-500">- €{booking.commission?.toFixed(2) || '0.00'}</td>
                         <td className="p-4 font-bold text-green-600 text-right">€{booking.netEarnings?.toFixed(2) || booking.totalPrice.toFixed(2)}</td>
                      </tr>
                   ))}
                   {hubberBookings.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nessuna prenotazione registrata.</td></tr>}
                </tbody>
             </table>
          </div>
       </div>

       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
             <h3 className="font-bold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-brand" /> Fatture da Renthubber
             </h3>
             <p className="text-gray-500 text-sm mt-1">Le fatture per le commissioni del servizio trattenute dalla piattaforma.</p>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                   <tr>
                      <th className="p-4">Data</th>
                      <th className="p-4">Numero Fattura</th>
                      <th className="p-4">Periodo di Riferimento</th>
                      <th className="p-4">Totale Servizio</th>
                      <th className="p-4">Stato</th>
                      <th className="p-4 text-right">Download</th>
                   </tr>
                </thead>
                <tbody>
                   {myInvoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                         <td className="p-4 text-xs">{inv.date}</td>
                         <td className="p-4 font-mono font-medium text-gray-900">{inv.number}</td>
                         <td className="p-4">{inv.period}</td>
                         <td className="p-4 font-bold">€{inv.amount.toFixed(2)}</td>
                         <td className="p-4">
                            <span className="flex items-center text-green-600 text-xs font-bold uppercase">
                               <CheckCircle2 className="w-3 h-3 mr-1" /> Pagato
                            </span>
                         </td>
                         <td className="p-4 text-right">
                            <button className="text-brand hover:bg-brand/10 p-2 rounded-lg transition-colors" title="Scarica PDF">
                               <Download className="w-4 h-4" />
                            </button>
                         </td>
                      </tr>
                   ))}
                   {myInvoices.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nessuna fattura disponibile.</td></tr>}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  // --- MAIN DASHBOARD ---
  const renderHubberDashboard = () => (
    <div className="animate-in fade-in duration-500">
      {/* Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Hubber</h1>
          <p className="text-gray-500">Monitora i tuoi guadagni e le richieste.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
           <button 
             onClick={() => onManageListings()}
             className="bg-brand text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-dark transition-colors shadow-md"
           >
             Gestisci Annunci
           </button>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 mb-8 w-fit">
         <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
         >
            Panoramica
         </button>
         <button 
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'payments' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
         >
            Pagamenti & Fatture
         </button>
         <button 
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
         >
            Sicurezza & Verifiche
         </button>
      </div>

      {activeTab === 'overview' && renderHubberOverview()}
      {activeTab === 'payments' && renderHubberPayments()}
      {activeTab === 'security' && renderSecurity()}
    </div>
  );

  // --- RENTER DASHBOARD ---
  const renderRenterDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       {/* Welcome & Status */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Renter</h1>
        <p className="text-gray-500">Pronto per il tuo prossimo noleggio?</p>
      </div>

      {/* Custom Tabs for Renter */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 mb-8 w-fit">
         <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
         >
            Panoramica
         </button>
         <button 
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
         >
            Profilo & Verifiche
         </button>
      </div>

      {activeTab === 'security' && renderSecurity()}

      {activeTab === 'overview' && (
        <>
          {/* Active Rentals Highlight */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                   <Package className="w-5 h-5 mr-2 text-brand" /> Noleggi Attivi & In Arrivo
                </h3>
                
                {/* Upcoming Rental Card */}
                <div className="bg-gradient-to-br from-brand to-brand-light rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                      <Package className="w-64 h-64" />
                   </div>
                   
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                         <div>
                            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                               Ritiro Domani
                            </span>
                            <h2 className="text-2xl font-bold mt-3">Sony Alpha 7 III Kit</h2>
                            <p className="text-brand-light/80 text-sm">Da Alessandro V.</p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs text-brand-light/80 uppercase">Codice Ritiro</p>
                            <p className="text-2xl font-mono font-bold tracking-widest">#8X29A</p>
                         </div>
                      </div>
                      
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm flex justify-between items-center">
                         <div className="flex items-center">
                            <MapPin className="w-5 h-5 mr-3 text-brand-accent" />
                            <div>
                               <p className="font-bold text-sm">Via Roma 24, Milano</p>
                               <p className="text-xs text-brand-light/80">Domani, 10:00 AM</p>
                            </div>
                         </div>
                         <button 
                            onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Via+Roma+24,+Milano', '_blank')}
                            className="bg-white text-brand font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                         >
                            Indicazioni
                         </button>
                      </div>
                   </div>
                </div>

                {/* Other Rentals List */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                   <div className="p-4 border-b border-gray-50 flex justify-between">
                      <span className="font-bold text-gray-700">Storico Recente</span>
                      <span className="text-sm text-brand cursor-pointer">Vedi tutti</span>
                   </div>
                   {[1, 2].map((i) => (
                      <div key={i} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                         <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                         <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-sm">Trapano Bosch 18V</h4>
                            <p className="text-xs text-gray-500">Terminato il 12 Ott</p>
                         </div>
                         <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">Restituito</span>
                      </div>
                   ))}
                </div>
             </div>

             {/* Quick Actions & Stats */}
             <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold text-gray-900 mb-4">Spese questo mese</h3>
                   <div className="flex items-end mb-2">
                      <span className="text-3xl font-bold text-brand-dark">€ 85,00</span>
                      <span className="text-sm text-gray-500 mb-1 ml-2">/ € {user.renterBalance.toFixed(2)} Credito</span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-brand h-2 rounded-full" style={{ width: '70%' }}></div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold text-gray-900 mb-4">Ultimi Visti</h3>
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 cursor-pointer group">
                         <div className="w-16 h-12 bg-gray-200 rounded-md overflow-hidden">
                            <img src="https://picsum.photos/200/200?random=7" className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                         </div>
                         <div>
                            <h4 className="font-bold text-sm text-gray-900 group-hover:text-brand">Garage Centro</h4>
                            <p className="text-xs text-gray-500">€20 / giorno</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          
          {/* Become Hubber Promo - VISIBLE FOR RENTERS */}
          <div className="bg-gray-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">Hai oggetti che non usi?</h3>
                <p className="text-gray-400 mb-6 max-w-md">
                   Diventa Hubber e inizia a guadagnare noleggiando le tue attrezzature o i tuoi spazi inutilizzati. È facile e sicuro.
                </p>
                <button 
                   onClick={onManageListings}
                   className="bg-brand-accent text-brand-dark font-bold py-3 px-6 rounded-xl hover:bg-amber-400 transition-colors shadow-lg"
                >
                   Inizia a guadagnare
                </button>
             </div>
             <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <Package className="w-64 h-64 transform translate-x-10 translate-y-10" />
             </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeMode === 'hubber' ? renderHubberDashboard() : renderRenterDashboard()}
      </div>
    </div>
  );
};
