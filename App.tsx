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

const buildFallbackUser = (authUser: any): User => ({
  id: authUser.id,
  email: authUser.email || '',
  name: authUser.email?.split('@')[0] || 'Utente',
  role: 'hubber',                        // lo trattiamo come hubber così puoi pubblicare
  roles: ['renter', 'hubber'],
  status: 'active',
  renterBalance: 0,
  hubberBalance: 0,
  referralCode: '',
  avatar: `https://ui-avatars.com/api/?name=${authUser.email || 'User'}&background=random`,
  isSuperHubber: false,
  rating: 0,
  isSuspended: false,
  emailVerified: !!authUser.email_confirmed_at,
  phoneVerified: false,
  idDocumentVerified: false,
  verificationStatus: 'unverified',
  address: undefined,
  phoneNumber: undefined,
  bio: undefined,
  bankDetails: undefined,
  hubberSince: undefined,
  idDocumentUrl: undefined
});

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedHost, setSelectedHost] = useState<User | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [listings, setListings] = useState<Listing[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [activeMode, setActiveMode] = useState<ActiveMode>('renter');

  useEffect(() => {
    const initApp = async () => {
      console.log('🔄 Boot Renthubber…');

      // 1) Controllo sessione auth
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (session?.user) {
        console.log('🔑 Sessione trovata al boot:', session.user.id);

        // 👉 NON uso più api.users.get qui, vado diretto con auth user
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user || session.user;

        if (authUser) {
          const fallbackUser = buildFallbackUser(authUser);
          setCurrentUser(fallbackUser);
          setActiveMode('hubber');       // così hai modalità hubber attiva
          setCurrentView('dashboard');
        } else {
          console.warn('⚠️ Nessun authUser nonostante la sessione, logout forzato.');
          await supabase.auth.signOut();
          setCurrentUser(null);
          setCurrentView('home');
        }
      } else {
        console.log('🏠 Nessuna sessione -> home');
        setCurrentUser(null);
        setCurrentView('home');
      }

      // 2) Carico i dati mock/local
      await api.init();
      setListings(await api.listings.getAll());
      setTransactions(await api.wallet.getTransactions());
      setBookings(await api.bookings.getAll());
      setPayoutRequests(await api.payouts.getAll());
      setDisputes(await api.admin.getDisputes());
      setReviews(await api.admin.getReviews());
      setInvoices(await api.admin.getInvoices());
    };

    initApp();

    // 3) Listener Supabase molto semplice, SEMPRE con fallback user
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('⚡ Auth State Change:', event);

        if (session?.user) {
          const { data: authData } = await supabase.auth.getUser();
          const authUser = authData.user || session.user;
          if (authUser) {
            const fallbackUser = buildFallbackUser(authUser);
            setCurrentUser(fallbackUser);
            setActiveMode('hubber');
            if (event === 'SIGNED_IN') {
              setCurrentView('dashboard');
            }
          }
        } else {
          setCurrentUser(null);
          setActiveMode('renter');
          setCurrentView('home');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleAddListing = async (newListing: Listing) => {
    try {
      console.log('DEBUG handleAddListing –', newListing);
      const saved = await api.listings.create(newListing);
      setListings(prev => [saved, ...prev]);
      setCurrentView('my-listings');
    } catch (error) {
      console.error("Errore salvataggio annuncio:", error);
      setListings(prev => [newListing, ...prev]);
      setCurrentView('my-listings');
    }
  };

  const handleUpdateListing = async (updatedListing: Listing) => {
    const saved = await api.listings.update(updatedListing);
    setListings(prev => prev.map(l => l.id === saved.id ? saved : l));
    if (selectedListing?.id === saved.id) setSelectedListing(saved);
    setCurrentView('my-listings');
  };

  const handleUpdateConfig = (newConfig: SystemConfig) => setSystemConfig(newConfig);

  const handlePayment = async (amount: number, useWallet: number) => {
    if (!currentUser) return;
    const newBalance = currentUser.renterBalance - useWallet;
    const updatedUser = { ...currentUser, renterBalance: newBalance };
    setCurrentUser(updatedUser);
    await api.users.update(updatedUser);

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toLocaleDateString('it-IT'),
      amount,
      description: 'Pagamento Noleggio',
      type: 'debit',
      walletType: 'renter'
    };

    await api.wallet.addTransaction(tx);
    setTransactions([tx, ...transactions]);
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
    if (['dashboard', 'wallet', 'my-listings'].includes(currentView)) {
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
    if (!currentUser?.bankDetails) return;

    const newRequest: PayoutRequest = {
      id: `payout-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount,
      iban: currentUser.bankDetails.iban,
      status: 'pending',
      date: new Date().toLocaleDateString('it-IT')
    };

    await api.payouts.request(newRequest);
    setPayoutRequests([newRequest, ...payoutRequests]);
  };

  const handleProcessPayout = (requestId: string, approved: boolean) => {
    setPayoutRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: approved ? 'approved' : 'rejected' } : req
      )
    );

    if (approved) {
      const req = payoutRequests.find(r => r.id === requestId);
      if (req && currentUser?.id === req.userId) {
        const updatedUser = {
          ...currentUser,
          hubberBalance: currentUser.hubberBalance - req.amount
        };
        handleUserUpdate(updatedUser);
      }
    }
  };

  const handleCreateDispute = (newDispute: Dispute) => {
    setDisputes([newDispute, ...disputes]);
  };

  const handleDisputeAction = (id: string, action: 'resolve' | 'dismiss', note?: string) => {
    setDisputes(prev =>
      prev.map(d =>
        d.id === id ? { ...d, status: action === 'resolve' ? 'resolved' : 'dismissed', resolutionNote: note } : d
      )
    );
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
