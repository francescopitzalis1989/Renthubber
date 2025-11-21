
import React, { useState } from 'react';
import { MOCK_TRANSACTIONS } from '../constants';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Wallet as WalletIcon, Share2, Copy, CheckCircle, X, Landmark, Save, Send } from 'lucide-react';
import { User, ActiveMode, SystemConfig, BankDetails } from '../types';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface WalletProps {
  currentUser: User;
  activeMode: ActiveMode;
  systemConfig: SystemConfig;
  onUpdateUser: (user: User) => void;
  onRequestPayout?: (amount: number) => void;
}

// Mock chart data
const data = [
  { name: 'Lun', importo: 20 },
  { name: 'Mar', importo: 45 },
  { name: 'Mer', importo: 10 },
  { name: 'Gio', importo: 80 },
  { name: 'Ven', importo: 50 },
  { name: 'Sab', importo: 120 },
  { name: 'Dom', importo: 90 },
];

export const Wallet: React.FC<WalletProps> = ({ currentUser, activeMode, systemConfig, onUpdateUser, onRequestPayout }) => {
  const [copied, setCopied] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  
  const [bankForm, setBankForm] = useState<BankDetails>({
    accountHolderName: currentUser.bankDetails?.accountHolderName || '',
    accountHolderSurname: currentUser.bankDetails?.accountHolderSurname || '',
    iban: currentUser.bankDetails?.iban || '',
    bankName: currentUser.bankDetails?.bankName || '',
    bicSwift: currentUser.bankDetails?.bicSwift || '',
  });

  // Filter transactions based on active mode
  const transactions = MOCK_TRANSACTIONS.filter(t => t.walletType === activeMode);

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://renthubber.com/invito/${currentUser.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if(!bankForm.iban || !bankForm.accountHolderName) {
      alert("Compila tutti i campi obbligatori");
      return;
    }
    onUpdateUser({
      ...currentUser,
      bankDetails: bankForm
    });
    setShowBankModal(false);
    alert("Dati bancari aggiornati con successo!");
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    
    if (!amount || amount <= 0) {
       alert("Inserisci un importo valido.");
       return;
    }
    if (amount > currentUser.hubberBalance) {
       alert("L'importo non può superare il saldo disponibile.");
       return;
    }
    if (!currentUser.bankDetails?.iban) {
       alert("Devi prima salvare i dati bancari (Impostazioni Fiscali).");
       setShowPayoutModal(false);
       setShowBankModal(true);
       return;
    }

    if (onRequestPayout) {
       onRequestPayout(amount);
       setShowPayoutModal(false);
       setPayoutAmount('');
       alert("Richiesta inviata all'amministrazione!");
    }
  };

  // --- RENTER VIEW ---
  if (activeMode === 'renter') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
           <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-blue-100 text-blue-700 p-2 rounded-lg mr-3"><WalletIcon className="w-6 h-6" /></span>
              Wallet Renter
           </h1>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Renter Balance */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg md:col-span-2 relative overflow-hidden">
                 <div className="relative z-10">
                    <p className="text-blue-200 text-sm font-medium mb-1">Credito Renthubber</p>
                    <h2 className="text-4xl font-bold mb-6">€ {currentUser.renterBalance.toFixed(2)}</h2>
                    <div className="flex gap-3">
                       <button className="bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" /> Ricarica (Demo)
                       </button>
                    </div>
                    <p className="text-xs text-blue-200 mt-4">* Credito utilizzabile solo per prenotazioni su Renthubber.</p>
                 </div>
                 <div className="absolute -right-10 -bottom-10 text-white/10">
                    <WalletIcon className="w-48 h-48" />
                 </div>
              </div>

              {/* Referral Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                 <div className="mb-4">
                    <div className="bg-yellow-100 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                       <Share2 className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">Guadagna €{systemConfig.referral.bonusAmount}</h3>
                    <p className="text-xs text-gray-500 mt-1">Invita un amico su Renthubber e ricevi credito gratis.</p>
                 </div>
                 
                 <div className="mt-auto">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Il tuo codice</p>
                    <div 
                      onClick={handleCopyReferral}
                      className="bg-gray-100 border border-gray-200 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                       <span className="font-mono font-bold text-gray-800">{currentUser.referralCode}</span>
                       {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </div>
                 </div>
              </div>
           </div>

           {/* Transaction History */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                 <h3 className="font-bold text-gray-900">Movimenti Credito</h3>
              </div>
              <div className="divide-y divide-gray-50">
                 {transactions.length > 0 ? transactions.map((t) => (
                    <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                       <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${t.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                             {t.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                             <p className="font-medium text-gray-900">{t.description}</p>
                             <p className="text-xs text-gray-500">{t.date}</p>
                          </div>
                       </div>
                       <span className={`font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                          {t.type === 'credit' ? '+' : '-'}€{t.amount.toFixed(2)}
                       </span>
                    </div>
                 )) : (
                    <div className="p-8 text-center text-gray-500 text-sm">Nessun movimento recente.</div>
                 )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- HUBBER VIEW ---
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
           <span className="bg-orange-100 text-orange-700 p-2 rounded-lg mr-3"><WalletIcon className="w-6 h-6" /></span>
           Wallet Hubber
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-6 text-white shadow-lg md:col-span-2">
            <div className="flex items-center justify-between mb-8">
               <div className="bg-white/10 p-2 rounded-lg">
                 <WalletIcon className="w-6 h-6 text-white" />
               </div>
               <span className="text-xs bg-brand-accent text-brand-dark font-bold px-2 py-1 rounded-md">PRELEVABILE</span>
            </div>
            <div>
              <p className="text-brand-light text-sm mb-1">Guadagni Totali</p>
              <h2 className="text-4xl font-bold">€ {currentUser.hubberBalance.toFixed(2)}</h2>
            </div>
            <div className="mt-8 flex space-x-4">
              <button 
                onClick={() => setShowPayoutModal(true)}
                className="flex-1 bg-white text-brand font-bold py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm shadow-sm"
              >
                Richiedi Bonifico
              </button>
              <button 
                onClick={() => setShowBankModal(true)}
                className="flex-1 bg-brand-light/30 text-white border border-white/20 font-bold py-2.5 rounded-lg hover:bg-brand-light/40 transition-colors text-sm flex items-center justify-center"
              >
                <Landmark className="w-4 h-4 mr-2" /> Impostazioni Fiscali
              </button>
            </div>
          </div>

          {/* Earnings Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <h3 className="font-semibold text-gray-900 mb-4">Andamento</h3>
             <div className="h-40">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                   <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                   <Bar dataKey="importo" fill="#0D414B" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Storico Incassi</h3>
            <button className="text-sm text-brand hover:underline">Esporta CSV</button>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.length > 0 ? transactions.map((t) => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${t.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                     {t.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t.description}</p>
                    <p className="text-xs text-gray-500">{t.date}</p>
                  </div>
                </div>
                <span className={`font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                  {t.type === 'credit' ? '+' : '-'}€{t.amount.toFixed(2)}
                </span>
              </div>
            )) : (
               <div className="p-8 text-center text-gray-500 text-sm">Nessun movimento recente.</div>
            )}
          </div>
        </div>
      </div>

      {/* FISCAL SETTINGS MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-bold text-gray-900 flex items-center">
                    <Landmark className="w-5 h-5 mr-2 text-brand" /> Dati Bancari per Bonifici
                 </h3>
                 <button onClick={() => setShowBankModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleSaveBankDetails} className="p-6 space-y-4">
                 <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs mb-2">
                    Questi dati verranno utilizzati per inviarti i guadagni (Payout) direttamente sul tuo conto corrente.
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Nome Intestatario</label>
                       <input 
                         type="text" 
                         value={bankForm.accountHolderName}
                         onChange={(e) => setBankForm({...bankForm, accountHolderName: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                         placeholder="Mario"
                         required
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Cognome Intestatario</label>
                       <input 
                         type="text" 
                         value={bankForm.accountHolderSurname}
                         onChange={(e) => setBankForm({...bankForm, accountHolderSurname: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                         placeholder="Rossi"
                         required
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                    <input 
                      type="text" 
                      value={bankForm.iban}
                      onChange={(e) => setBankForm({...bankForm, iban: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono uppercase"
                      placeholder="IT60X..."
                      required
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Nome Banca</label>
                       <input 
                         type="text" 
                         value={bankForm.bankName}
                         onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                         placeholder="Es. Intesa Sanpaolo"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">BIC / SWIFT</label>
                       <input 
                         type="text" 
                         value={bankForm.bicSwift}
                         onChange={(e) => setBankForm({...bankForm, bicSwift: e.target.value.toUpperCase()})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono uppercase"
                         placeholder="XXXXXXXX"
                       />
                    </div>
                 </div>

                 <div className="pt-4 flex justify-end space-x-3">
                    <button 
                      type="button" 
                      onClick={() => setShowBankModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                    >
                       Annulla
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-brand text-white rounded-lg font-bold hover:bg-brand-dark shadow-md flex items-center"
                    >
                       <Save className="w-4 h-4 mr-2" /> Salva Dati
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* PAYOUT REQUEST MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-brand text-white">
                 <h3 className="font-bold flex items-center">
                    <Send className="w-5 h-5 mr-2" /> Richiedi Bonifico
                 </h3>
                 <button onClick={() => setShowPayoutModal(false)} className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handlePayoutSubmit} className="p-6 space-y-6">
                 <div className="text-center">
                    <p className="text-gray-500 text-sm mb-2">Saldo Disponibile</p>
                    <p className="text-3xl font-bold text-brand">€ {currentUser.hubberBalance.toFixed(2)}</p>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Importo da prelevare (€)</label>
                    <div className="relative">
                       <input 
                         type="number" 
                         step="0.01"
                         min="1"
                         max={currentUser.hubberBalance}
                         value={payoutAmount}
                         onChange={(e) => setPayoutAmount(e.target.value)}
                         className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand focus:ring-0 outline-none text-xl font-bold text-gray-900"
                         placeholder="0.00"
                         autoFocus
                       />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                       Verrà inviato all'IBAN: <span className="font-mono font-medium text-gray-600">{currentUser.bankDetails?.iban || 'N/A'}</span>
                    </p>
                 </div>

                 <div className="pt-2">
                    <button 
                      type="submit"
                      className="w-full py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-dark shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                    >
                       Invia Richiesta
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowPayoutModal(false)}
                      className="w-full mt-3 py-3 text-gray-500 font-medium hover:text-gray-800 transition-colors"
                    >
                       Annulla
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};
