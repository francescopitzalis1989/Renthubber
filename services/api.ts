import { User, Listing, BookingRequest, Transaction, PayoutRequest, Invoice, Review, Dispute } from '../types';
import { MOCK_LISTINGS, MOCK_REQUESTS, MOCK_TRANSACTIONS, MOCK_INVOICES, MOCK_REVIEWS, MOCK_DISPUTES } from '../constants';
import { supabase } from '../lib/supabase';

// --- HELPER PER MAPPING DATI SUPABASE (USERS) -> APP TYPE (USER) ---
const mapSupabaseUserToAppUser = (sbUser: any, authUser: any): User => {
  return {
    id: authUser.id,
    email: authUser.email,
    name: sbUser.name || authUser.email?.split('@')[0] || 'Utente',
    avatar: sbUser.avatar_url || `https://ui-avatars.com/api/?name=${sbUser.name || 'User'}&background=random`,

    role: sbUser.role || 'renter',
    roles: sbUser.roles || [sbUser.role || 'renter'],

    rating: sbUser.rating || 0,
    isSuperHubber: sbUser.is_super_hubber || false,
    status: sbUser.status || 'active',
    isSuspended: sbUser.is_suspended || false,
    renterBalance: sbUser.renter_balance || 0,
    hubberBalance: sbUser.hubber_balance || 0,
    referralCode: sbUser.referral_code || '',

    hubberSince: sbUser.hubber_since,

    // Verifiche
    emailVerified: !!authUser.email_confirmed_at || sbUser.email_verified,
    phoneVerified: sbUser.phone_verified || false,
    idDocumentVerified: sbUser.id_document_verified || false,
    verificationStatus: sbUser.verification_status || 'unverified',

    // Dati Personali
    address: sbUser.address,
    phoneNumber: sbUser.phone_number,
    bio: sbUser.bio,
    bankDetails: sbUser.bank_details, // JSONB column

    // Documenti
    idDocumentUrl: sbUser.document_front_url
  };
};

// --- API SERVICE ---
export const api = {

  // STORAGE MANAGEMENT
  storage: {
    uploadAvatar: async (userId: string, file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarBucket = buckets?.find(b => b.name === 'avatars');
      if (!avatarBucket) await supabase.storage.createBucket('avatars', { public: true });

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', userId);

      return data.publicUrl;
    },

    uploadDocument: async (userId: string, file: File, side: 'front' | 'back') => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${side}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);

      if (uploadError && (uploadError.message.includes('not found') || (uploadError as any).statusCode === '404')) {
        await supabase.storage.createBucket('documents', { public: false });
        const retry = await supabase.storage.from('documents').upload(filePath, file);
        uploadError = retry.error;
      }

      if (uploadError) {
        console.error("Upload failed:", uploadError);
        return undefined;
      }

      const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 31536000);
      if (!data?.signedUrl) return undefined;

      const column = side === 'front' ? 'document_front_url' : 'document_back_url';
      await supabase.from('users').update({ [column]: data.signedUrl }).eq('id', userId);

      return data.signedUrl;
    }
  },

  // AUTHENTICATION & USER MANAGEMENT
  auth: {
    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message || "Login fallito");

      return api.users.get(data.session.user.id);
    },

    register: async (email: string, password: string, userData: Partial<User>) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw new Error(authError.message || "Errore registrazione");

      const session = authData.session;
      const userId = session?.user?.id || authData.user?.id;

      if (!userId) throw new Error("ID utente non recuperabile.");

      const userRole = userData.role || 'renter';
      const userRoles = userData.roles || [userRole];

      const { error: userDbError } = await supabase
        .from("users")
        .upsert({
          id: userId,
          email: email,
          name: userData.name,
          role: userRole,
          roles: userRoles,
          referral_code: userData.referralCode,
          renter_balance: userData.renterBalance || 0,
          status: 'active',
          created_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select();

      if (userDbError) {
        console.error("User DB creation error:", userDbError);
        return {
          id: userId,
          email: email,
          name: userData.name || 'User',
          role: userRole,
          roles: userRoles,
          status: 'active',
          renterBalance: 0,
          hubberBalance: 0,
          referralCode: '',
          avatar: `https://ui-avatars.com/api/?name=${userData.name}&background=random`,
          isSuperHubber: false
        } as User;
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
      const { data: { user: authUser } } = await supabase.auth.getUser();

      const { data: userRow, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !userRow) {
        if (authUser && authUser.id === userId) {
          console.log("Auto-healing: Creating missing user row in public.users...");
          const { data: newUserRow } = await supabase
            .from("users")
            .insert({
              id: userId,
              email: authUser.email,
              name: authUser.email?.split('@')[0] || 'User',
              role: 'renter',
              roles: ['renter'],
              avatar_url: `https://ui-avatars.com/api/?name=${authUser.email}&background=random`,
              status: 'active'
            })
            .select()
            .single();

          if (newUserRow) return mapSupabaseUserToAppUser(newUserRow, authUser);
        }
        return null;
      }

      return mapSupabaseUserToAppUser(userRow, authUser || { id: userId, email: userRow.email });
    },

    update: async (user: User) => {
      const updateData = {
        name: user.name,
        role: user.role,
        roles: user.roles,
        avatar_url: user.avatar,
        bio: user.bio,
        phone_number: user.phoneNumber,
        address: user.address,
        bank_details: user.bankDetails,

        phone_verified: user.phoneVerified,
        id_document_verified: user.idDocumentVerified,
        verification_status: user.verificationStatus,
        is_suspended: user.isSuspended,

        renter_balance: user.renterBalance,
        hubber_balance: user.hubberBalance
      };

      const { error } = await supabase.from('users').update(updateData).eq('id', user.id);
      if (error) throw error;
      return user;
    },

    upgradeToHubber: async (user: User) => {
      const newRoles = Array.from(new Set([...(user.roles || []), 'hubber']));

      const { error } = await supabase
        .from('users')
        .update({
          role: 'hubber',
          roles: newRoles,
          hubber_since: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      return { ...user, roles: newRoles, role: 'hubber' };
    }
  },

  // =========================
  // LISTINGS (ANNUNCI)
  // =========================
  listings: {
    // Usa SEMPRE localStorage come sorgente principale
    getAll: async (): Promise<Listing[]> => {
      const stored = localStorage.getItem('listings');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.warn('Errore nel parse di localStorage.listings, resetto ai MOCK:', e);
          localStorage.removeItem('listings');
        }
      }
      return MOCK_LISTINGS;
    },

    // Crea sempre l’annuncio in locale. Poi prova a sincronizzarlo su Supabase SENZA mai lanciare errori.
    create: async (listing: Listing): Promise<Listing> => {
      // 1) Aggiorno subito il locale (così MyListings e Home lo vedono al volo)
      const current = await api.listings.getAll();
      const newList = [listing, ...current];
      localStorage.setItem('listings', JSON.stringify(newList));

      // 2) Provo a sincronizzare su Supabase ma NON blocco niente se fallisce
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const hostId = listing.hostId || user?.id || null;

        const payload: any = {
          owner_id: hostId,
          host_id: hostId,
          title: listing.title,
          category: listing.category,
          sub_category: listing.subCategory,
          description: listing.description,
          price: listing.price,
          price_unit: listing.priceUnit,
          location: listing.location,
          lat: listing.coordinates?.lat ?? null,
          lng: listing.coordinates?.lng ?? null,
          rating: listing.rating ?? 0,
          review_count: listing.reviewCount ?? 0,
          deposit: listing.deposit ?? 0,
          status: listing.status ?? 'published',
          cancellation_p: listing.cancellationPolicy ?? null,
          completeness_: (listing as any).completeness ?? null
        };

        const { error } = await supabase.from('listings').insert(payload);
        if (error) {
          console.warn('Sync listing -> Supabase fallita (annuncio comunque ok in locale):', error.message);
          alert("L'annuncio è stato creato, ma la sincronizzazione col server non è riuscita. Puoi comunque usarlo normalmente.");
        }
      } catch (err) {
        console.warn('Errore inatteso durante la sync listing -> Supabase (ma annuncio creato in locale):', err);
        alert("L'annuncio è stato creato, ma la sincronizzazione col server non è riuscita. Puoi comunque usarlo normalmente.");
      }

      // 3) Ritorno SEMPRE l’oggetto listing, senza eccezioni
      return listing;
    },

    // Aggiorna locale + prova sync su Supabase
    update: async (listing: Listing): Promise<Listing> => {
      const current = await api.listings.getAll();
      const newList = current.map(l => l.id === listing.id ? listing : l);
      localStorage.setItem('listings', JSON.stringify(newList));

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const hostId = listing.hostId || user?.id || null;

        const payload: any = {
          owner_id: hostId,
          host_id: hostId,
          title: listing.title,
          category: listing.category,
          sub_category: listing.subCategory,
          description: listing.description,
          price: listing.price,
          price_unit: listing.priceUnit,
          location: listing.location,
          lat: listing.coordinates?.lat ?? null,
          lng: listing.coordinates?.lng ?? null,
          rating: listing.rating ?? 0,
          review_count: listing.reviewCount ?? 0,
          deposit: listing.deposit ?? 0,
          status: listing.status ?? 'published',
          cancellation_p: listing.cancellationPolicy ?? null,
          completeness_: (listing as any).completeness ?? null
        };

        const { error } = await supabase
          .from('listings')
          .update(payload)
          .eq('id', listing.id);

        if (error) {
          console.warn('Sync update listing -> Supabase fallita (annuncio aggiornato comunque in locale):', error.message);
        }
      } catch (err) {
        console.warn('Errore inatteso durante update listing -> Supabase:', err);
      }

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
