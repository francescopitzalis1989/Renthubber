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
  role: 'hubber',
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
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (session?.user) {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user || session.user;
        const fallbackUser = buildFallbackUser(authUser);
        setCurrentUser(fallbackUser);
        setActiveMode('hubber');
        setCurrentView('dashboard');
      } else {
        setCurrentUser(null);
        setCurrentView('home');
      }

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const fallbackUser = buildFallbackUser(session.user);
          setCurrentUser(fallbackUser);
          setActiveMode('hubber');
          setCurrentView('dashboard');
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
      const saved = await api.listings.create(newListing);
      setListings(prev => [saved, ...prev]);
      setCurrentView('my-listings');
    } catch (error) {
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

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-gray-50">
      
      {currentView !== 'admin' && currentView !== 'become-hubber' && currentView !== 'hubber-edit' && (
        <Header 
          setView={setCurrentView} 
          currentView={currentView}
          currentUser={currentUser}
          activeMode={activeMode}
          onSwitchMode={setActiveMode}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-grow">

        {/* 🔥 TEST DI DEBUG — DEVE ESSERE SEMPRE VISIBILE 🔥 */}
        <div style={{ fontSize: 40, padding: 20, color: 'red', textAlign: 'center' }}>
          TEST VISIBILE
        </div>

        {currentView === 'home' && (
          <Home 
            onListingClick={setSelectedListing} 
            listings={listings}
          />
        )}

        {currentView === 'detail' && selectedListing && (
          <ListingDetail 
            listing={selectedListing} 
            currentUser={currentUser}
            onBack={() => setCurrentView('home')}
            systemConfig={systemConfig}
            onPaymentSuccess={() => {}}
            onHostClick={setSelectedHost}
          />
        )}

        {currentView === 'publish' && currentUser && (
          <Publish 
            onPublish={handleAddListing} 
            currentUser={currentUser}
          />
        )}

        {currentView === 'my-listings' && currentUser && (
          <MyListings 
            currentUser={currentUser} 
            listings={listings}
            onCreateNew={() => setCurrentView('publish')}
            onEditListing={setEditingListing}
          />
        )}

      </main>

      {currentView !== 'admin' && currentView !== 'become-hubber' && currentView !== 'hubber-edit' && (
        <Footer />
      )}
    </div>
  );
};

export default App;
