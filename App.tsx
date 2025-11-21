import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './views/Home';
import { Publish } from './views/Publish';
import { Wallet } from './views/Wallet';
import { Messages } from './views/Messages';
import { ListingDetail } from './views/ListingDetail';
import { Signup } from './views/Signup';
import { Dashboard } from './views/Dashboard';
import { MyListings } from './views/MyListings';
import { HubberListingEditor } from './views/HubberListingEditor';
import { AdminDashboard } from './views/AdminDashboard';
import { BecomeHubberWizard } from './views/BecomeHubberWizard';
import { PublicHostProfile } from './views/PublicHostProfile'; 
import { Listing, User, SystemConfig, ActiveMode, PayoutRequest, Dispute, Review, Invoice, Transaction, BookingRequest } from './types';
import { DEFAULT_SYSTEM_CONFIG, DEMO_ADMIN } from './constants';
import { api } from './services/api';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedHost, setSelectedHost] = useState<User | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data States
  const [listings, setListings] = useState<Listing[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  
  // GLOBAL CONFIG & MODE STATE
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [activeMode, setActiveMode] = useState<ActiveMode>('renter');

  // --- INITIALIZATION & AUTH LISTENER ---
  useEffect(() => {
    const initApp = async () => {
      await api.init(); // Init local storage mocks
      
      const l = await api.listings.getAll();
      setListings(l);
      const t = await api.wallet.getTransactions();
      setTransactions(t);
      const b = await api.bookings.getAll();
      setBookings(b);
      const p = await api.payouts.getAll();
      setPayoutRequests(p);
      const d = await api.admin.getDisputes();
      setDisputes(d);
      const r = await api.admin.getReviews();
      setReviews(r);
      const i = await api.admin.getInvoices();
      setInvoices(i);
    };

    initApp();

    // SUPABASE AUTH LISTENER
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth State Change:", event);
      
      if (session?.user) {
        try {
          // Fetch from PUBLIC.USERS table via API Service
          const userProfile = await api.users.get(session.user.id);
          
          if (userProfile) {
            setCurrentUser(userProfile);
            
            if (event === 'SIGNED_IN') {
               if (userProfile.roles.includes('admin')) {
                 setCurrentView('admin');
               } else if (userProfile.role === 'hubber' || userProfile.roles.includes('hubber')) {
                 setActiveMode('hubber');
                 setCurrentView('dashboard');
               } else {
                 setActiveMode('renter');
                 setCurrentView('dashboard');
               }
            }
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      } else {
        setCurrentUser(null);
        setCurrentView('home');
        setActiveMode('renter');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
  };

  // --- APP ACTIONS ---

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.roles.includes('admin')) {
      setCurrentView('admin');
    } else {
      setCurrentView('dashboard');
    }
  };

  // ✅ gestisce sia il salvataggio via API sia il fallback locale
  const handleAddListing = async (newListing: Listing) => {
    try {
      console.log('DEBUG handleAddListing – ricevuto dal wizard:', newListing);

      const saved = await api.listings.create(newListing);

      console.log('DEBUG handleAddListing – salvato da api.listings.create:', saved);

      setListings(prev => [saved, ...prev]);
      setCurrentView('my-listings');
    } catch (error) {
      console.error('Errore durante la creazione dell’annuncio:', error);
      
      // Fallback: aggiunge comunque l’annuncio alla lista locale
      setListings(prev => [newListing, ...prev]);
      setCurrentView('my-listings');
      alert('L’annuncio è stato creato solo in locale. Il salvataggio sul server non è riuscito.');
    }
  };

  const handleUpdateListing = async (updatedListing: Listing) => {
    const saved = await api.listings.update(updatedListing);
    setListings(prevListings => 
      prevListings.map(l => l.id === saved.id ? saved : l)
    );
    if (selectedListing?.id === saved.id) {
      setSelectedListing(saved);
    }
    setCurrentView('my-listings');
  };

  const handleUpdateConfig = (newConfig: SystemConfig) => {
    setSystemConfig(newConfig);
  };

  const handlePayment = async (amount: number, useWallet: number) => {
    if (currentUser) {
      const newBalance = currentUser.renterBalance - useWallet;
      const updatedUser = { ...currentUser, renterBalance: newBalance };
      setCurrentUser(updatedUser);
      await api.users.update(updatedUser);
      
      const tx: Transaction = {
         id: `tx-${Date.now()}`,
         date: new Date().toLocaleDateString('it-IT'),
         amount: amount,
         description: 'Pagamento Noleggio',
         type: 'debit',
         walletType: 'renter'
      };
      await api.wallet.addTransaction(tx);
      setTransactions([tx, ...transactions]);
    }
  };

  const handleListingClick = (listing: Listing) => {
    setSelectedListing(listing);
    setCurrentView('detail');
  };

  const handleHostClick = (host: User) => {
    setSelectedHost(host);
    setCurrentView('host-profile');
  };

  const handleEditListingClick = (listing: Listing) => {
    setEditingListing(listing);
    setCurrentView('hubber-edit');
  };

  const handleSwitchMode = (mode: ActiveMode) => {
    if (!currentUser) return;
    if (mode === 'hubber' && !currentUser.roles.includes('hubber')) {
       setCurrentView('become-hubber');
       return;
    }
    setActiveMode(mode);
    if (currentView === 'dashboard' || currentView === 'wallet' || currentView === 'my-listings') {
        setCurrentView('dashboard');
    }
  };

  const handleHubberActivation = async (updatedUser: User) => {
    const saved = await api.users.upgradeToHubber(updatedUser);
    setCurrentUser(saved);
    setActiveMode('hubber');
    setCurrentView('dashboard');
  };

  const handleUserUpdate = async (updatedUser: User) => {
    const saved = await api.users.update(updatedUser);
    setCurrentUser(saved);
  };

  const handleRequestPayout = async (amount: number) => {
    if (!currentUser || !currentUser.bankDetails) return;
    
    const newRequest: PayoutRequest = {
      id: `payout-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount: amount,
      iban: currentUser.bankDetails.iban,
      status: 'pending',
      date: new Date().toLocaleDateString('it-IT')
    };
    
    await api.payouts.request(newRequest);
    setPayoutRequests([newRequest, ...payoutRequests]);
  };

  const handleProcessPayout = (requestId: string, approved: boolean) => {
    setPayoutRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: approved ? 'approved' : 'rejected' } : req
    ));

    if (approved) {
      const request = payoutRequests.find(r => r.id === requestId);
      if (request && currentUser && currentUser.id === request.userId) {
           const updatedUser = {
             ...currentUser,
             hubberBalance: currentUser.hubberBalance - request.amount
           };
           handleUserUpdate(updatedUser);
      }
    }
  };

  const handleCreateDispute = (newDispute: Dispute) => {
    setDisputes([newDispute, ...disputes]);
  };

  const handleDisputeAction = (id: string, action: 'resolve' | 'dismiss', note?: string) => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: action === 'resolve' ? 'resolved' : 'dismissed', resolutionNote: note } : d));
  };

  const handleCreateInvoice = (newInvoice: Invoice) => {
    setInvoices([newInvoice, ...invoices]);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-gray-50">
      
      {currentView !== 'admin' && currentView !== 'become-hubber' && currentView !== 'hubber-edit' && (
        <Header 
          setView={setCurrentView} 
          currentView={currentView}
          currentUser={currentUser}
          activeMode={activeMode}
          onSwitchMode={handleSwitchMode}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-grow">
        {currentView === 'home' && (
          <Home 
            onListingClick={handleListingClick} 
            listings={listings}
          />
        )}

        {currentView === 'detail' && selectedListing && (
          <ListingDetail 
            listing={selectedListing} 
            currentUser={currentUser}
            onBack={() => setCurrentView('home')}
            systemConfig={systemConfig}
            onPaymentSuccess={handlePayment}
            onHostClick={handleHostClick}
          />
        )}

        {currentView === 'host-profile' && selectedHost && (
          <PublicHostProfile 
             host={selectedHost}
             listings={listings}
             onBack={() => setCurrentView('detail')}
             onListingClick={handleListingClick}
          />
        )}

        {currentView === 'publish' && currentUser && (
          <Publish 
            onPublish={handleAddListing} 
            currentUser={currentUser}
          />
        )}

        {currentView === 'hubber-edit' && editingListing && (
          <HubberListingEditor
            listing={editingListing}
            onSave={handleUpdateListing}
            onCancel={() => setCurrentView('my-listings')}
          />
        )}
        
        {currentView === 'signup' && (
          <Signup 
            onComplete={handleLoginSuccess}
            onLoginRedirect={() => {}} 
          />
        )}

        {currentView === 'dashboard' && currentUser && (
          <Dashboard 
            user={currentUser} 
            activeMode={activeMode}
            onManageListings={activeMode === 'hubber' 
              ? () => setCurrentView('my-listings') 
              : () => setCurrentView('become-hubber')
            }
            invoices={invoices}
          />
        )}

        {currentView === 'wallet' && currentUser && (
          <Wallet 
            currentUser={currentUser} 
            activeMode={activeMode}
            systemConfig={systemConfig}
            onUpdateUser={handleUserUpdate}
            onRequestPayout={handleRequestPayout}
          />
        )}

        {currentView === 'messages' && (
          <Messages 
             currentUser={currentUser}
             onCreateDispute={handleCreateDispute}
          />
        )}

        {currentView === 'my-listings' && currentUser && (
          <MyListings 
            currentUser={currentUser} 
            listings={listings}
            onCreateNew={() => setCurrentView('publish')}
            onEditListing={handleEditListingClick}
          />
        )}

        {currentView === 'admin' && (
           <AdminDashboard 
              systemConfig={systemConfig}
              onUpdateConfig={handleUpdateConfig}
              allUsers={[currentUser || DEMO_ADMIN]} 
              allListings={listings}
              payoutRequests={payoutRequests}
              onProcessPayout={handleProcessPayout}
              disputes={disputes}
              onDisputeAction={handleDisputeAction}
              reviews={reviews}
              onLogout={handleLogout}
              invoices={invoices} 
              onCreateInvoice={handleCreateInvoice}
              onUpdateUser={handleUserUpdate}
           />
        )}

        {currentView === 'become-hubber' && currentUser && (
           <BecomeHubberWizard 
              currentUser={currentUser}
              onComplete={handleHubberActivation}
              onCancel={() => setCurrentView('dashboard')}
           />
        )}
      </main>

      {currentView !== 'admin' && currentView !== 'become-hubber' && currentView !== 'hubber-edit' && <Footer />}
    </div>
  );
};

export default App;
