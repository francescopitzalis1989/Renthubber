
import { User, Listing, BookingRequest, Transaction, PayoutRequest, Invoice, Review, Dispute } from '../types';
import { MOCK_LISTINGS, MOCK_REQUESTS, MOCK_TRANSACTIONS, MOCK_INVOICES, MOCK_REVIEWS, MOCK_DISPUTES } from '../constants';
import { supabase } from '../lib/supabase';

// --- HELPER PER MAPPING DATI SUPABASE -> APP TYPE ---
const mapSupabaseUserToAppUser = (sbUser: any, authUser: any): User => {
  return {
    id: authUser.id,
    email: authUser.email,
    name: sbUser.name || authUser.email?.split('@')[0] || 'Utente',
    avatar: sbUser.avatar || `https://ui-avatars.com/api/?name=${sbUser.name || 'User'}&background=random`,
    role: sbUser.role || 'renter',
    roles: sbUser.roles || ['renter'],
    rating: sbUser.rating || 0,
    isSuperHubber: sbUser.is_super_hubber || false,
    status: sbUser.status || 'active',
    isSuspended: sbUser.is_suspended || false,
    renterBalance: sbUser.renter_balance || 0,
    hubberBalance: sbUser.hubber_balance || 0,
    referralCode: sbUser.referral_code || '',
    // Campi opzionali e verifiche
    hubberSince: sbUser.hubber_since,
    emailVerified: !!authUser.email_confirmed_at,
    phoneVerified: sbUser.phone_verified || false,
    idDocumentVerified: sbUser.id_document_verified || false,
    verificationStatus: sbUser.verification_status || 'unverified',
    address: sbUser.address,
    phoneNumber: sbUser.phone_number,
    bio: sbUser.bio,
    bankDetails: sbUser.bank_details,
    idDocumentUrl: sbUser.document_front_url
  };
};

// --- API SERVICE ---
export const api = {
  
  // STORAGE MANAGEMENT
  storage: {
    uploadDocument: async (userId: string, file: File, side: 'front' | 'back') => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${side}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Signed URL (valid for 1 year, or handle rotation)
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 31536000); // 1 year

      if (!data?.signedUrl) throw new Error("Errore generazione URL file");

      // 3. Update User Profile with URL (Specific Column)
      const column = side === 'front' ? 'document_front_url' : 'document_back_url';
      const { error: updateError } = await supabase
        .from('users')
        .update({ [column]: data.signedUrl })
        .eq('id', userId);

      if (updateError) console.warn("Errore salvataggio URL nel DB:", updateError);

      return data.signedUrl;
    }
  },

  // AUTHENTICATION & USER MANAGEMENT (REAL SUPABASE)
  auth: {
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // Fetch full profile from public.users
      return api.users.get(data.session.user.id);
    },

    register: async (email, password, userData: Partial<User>) => {
      // 1. Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;

      // 2. Get Session immediately
      const { data: { session } } = await supabase.auth.getSession();
      
      // DEBUG LOG OBBLIGATORIO
      console.log("DEBUG – session user:", session?.user);

      // Fallback: se la sessione è null (es. email confirm required), usiamo authData.user
      const userId = session?.user?.id || authData.user?.id;
      const userEmail = session?.user?.email || authData.user?.email;

      if (!userId) {
        throw new Error("Registrazione riuscita ma impossibile recuperare ID utente.");
      }

      const fullName = userData.name || 'Nuovo Utente';
      const userRole = userData.role || 'renter';
      const userRoles = userData.roles || [userRole];

      // 3. UPSERT SU TABELLA USERS (Codice Esatto Richiesto)
      const { data, error: userError } = await supabase
        .from("users")
        .upsert({
          id: userId,
          email: userEmail,
          name: fullName,
          role: userRole,
          roles: userRoles,
          status: "active"
          // renter_balance: userData.renterBalance || 0, // Removed to prevent errors if column missing
          // referral_code: userData.referralCode || null // Removed to prevent errors if column missing
        })
        .select();

      // DEBUG LOG RISULTATO
      console.log("DEBUG – upsert result:", { data, userError });

      if (userError) {
        console.error("Supabase users upsert error", userError);
        throw new Error("Errore salvataggio profilo database: " + userError.message);
      }
      
      return api.users.get(userId);
    },

    logout: async () => {
      await supabase.auth.signOut();
    },

    getCurrentSession: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  },

  users: {
    get: async (userId: string): Promise<User | null> => {
      // 1. Get Auth Data (for email/verification status)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      // 2. Get Public Profile Data
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // AUTO-HEALING: Se l'utente è loggato ma non ha profilo in tabella users, crealo ora.
      if (error || !profile) {
         console.warn("Profilo DB mancante per utente autenticato. Tentativo di ripristino...", error);
         if (authUser && authUser.id === userId) {
            const { data: newProfile, error: createError } = await supabase
              .from("users")
              .upsert({
                id: userId,
                email: authUser.email,
                name: authUser.email?.split('@')[0] || 'Utente Ripristinato',
                role: "renter",
                roles: ["renter"],
                status: "active"
              })
              .select()
              .single();
            
            if (!createError && newProfile) {
               return mapSupabaseUserToAppUser(newProfile, authUser);
            }
         }
         return null;
      }

      // Merge Auth + DB
      return mapSupabaseUserToAppUser(profile, authUser || { id: userId, email: profile.email });
    },

    update: async (user: User) => {
      const { error } = await supabase
        .from('users')
        .update({
          name: user.name,
          roles: user.roles,
          role: user.role, // Primary role
          avatar: user.avatar,
          bio: user.bio,
          phone_number: user.phoneNumber,
          address: user.address,
          bank_details: user.bankDetails,
          // Verifiche
          phone_verified: user.phoneVerified,
          id_document_verified: user.idDocumentVerified,
          verification_status: user.verificationStatus,
          is_suspended: user.isSuspended
          // renter_balance, hubber_balance removed
        })
        .eq('id', user.id);

      if (error) throw error;
      return user;
    },

    upgradeToHubber: async (user: User) => {
      // 1. Fetch current roles to be safe
      const { data: currentProfile } = await supabase.from('users').select('roles').eq('id', user.id).single();
      const currentRoles = currentProfile?.roles || ['renter'];
      
      // 2. Append 'hubber' if not present
      const newRoles = Array.from(new Set([...currentRoles, 'hubber']));
      
      const { error } = await supabase
        .from('users')
        .update({
          roles: newRoles,
          role: 'hubber', // Set as primary role for immediate dashboard switch
          hubber_since: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      return { ...user, roles: newRoles, role: 'hubber' };
    }
  },

  // --- MOCK DATA SECTIONS (UNCHANGED) ---
  listings: {
    getAll: async () => {
      const stored = localStorage.getItem('listings');
      return stored ? JSON.parse(stored) : MOCK_LISTINGS;
    },
    create: async (listing: Listing) => {
      const listings = await api.listings.getAll();
      const newList = [listing, ...listings];
      localStorage.setItem('listings', JSON.stringify(newList));
      return listing;
    },
    update: async (listing: Listing) => {
      const listings = await api.listings.getAll();
      const newList = listings.map(l => l.id === listing.id ? listing : l);
      localStorage.setItem('listings', JSON.stringify(newList));
      return listing;
    }
  },

  bookings: {
    getAll: async () => {
      const stored = localStorage.getItem('bookings');
      return stored ? JSON.parse(stored) : MOCK_REQUESTS;
    },
    create: async (booking: BookingRequest) => {
      const bookings = await api.bookings.getAll();
      const newBookings = [booking, ...bookings];
      localStorage.setItem('bookings', JSON.stringify(newBookings));
      return booking;
    }
  },

  wallet: {
    getTransactions: async () => {
      const stored = localStorage.getItem('transactions');
      return stored ? JSON.parse(stored) : MOCK_TRANSACTIONS;
    },
    addTransaction: async (tx: Transaction) => {
      const txs = await api.wallet.getTransactions();
      localStorage.setItem('transactions', JSON.stringify([tx, ...txs]));
    }
  },

  payouts: {
    getAll: async () => {
      const stored = localStorage.getItem('payouts');
      return stored ? JSON.parse(stored) : [];
    },
    request: async (req: PayoutRequest) => {
      const payouts = await api.payouts.getAll();
      localStorage.setItem('payouts', JSON.stringify([req, ...payouts]));
    }
  },

  admin: {
    getDisputes: async () => MOCK_DISPUTES,
    getReviews: async () => MOCK_REVIEWS,
    getInvoices: async () => MOCK_INVOICES
  },

  init: async () => {
    if (!localStorage.getItem('listings')) {
      localStorage.setItem('listings', JSON.stringify(MOCK_LISTINGS));
    }
  }
};
