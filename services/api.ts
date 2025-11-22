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

    emailVerified: !!authUser.email_confirmed_at || sbUser.email_verified,
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

// --- HELPER: mapping LISTING DB -> APP ---
const mapDbListingToAppListing = (row: any): Listing => {
  // NB: qui NON abbiamo ancora i dati completi dell’owner; li useremo solo dove servono
  return {
    id: row.id,
    hostId: row.host_id || row.owner_id,
    title: row.title,
    category: row.category,
    subCategory: row.sub_category || '',
    description: row.description || '',
    price: Number(row.price) || 0,
    priceUnit: (row.price_unit as any) || 'giorno',
    images: [], // TODO: colonna/Storage in futuro
    location: row.location || '',
    coordinates: (row.lat !== null && row.lng !== null)
      ? { lat: Number(row.lat), lng: Number(row.lng) }
      : undefined,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    reviews: [],
    owner: {
      id: row.host_id || row.owner_id,
      name: 'Host',
      email: '',
      avatar: '',
      role: 'hubber',
      roles: ['hubber'],
      rating: row.rating ?? 0,
      isSuperHubber: false,
      status: 'active',
      isSuspended: false,
      renterBalance: 0,
      hubberBalance: 0,
      referralCode: ''
    } as any,
    features: [],
    rules: [],
    deposit: Number(row.deposit) || 0,
    status: row.status || 'published',
    cancellationPolicy: row.cancellation_p || 'flexible',
    techSpecs: undefined,
    spaceSpecs: undefined
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

  // AUTH & USERS
  auth: {
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message || "Login fallito");

      return api.users.get(data.session.user.id);
    },

    register: async (email, password, userData: Partial<User>) => {
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

  // --- LISTINGS: USA SUPABASE COME SORGENTE PRINCIPALE ---
  listings: {
    getAll: async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const rows = data || [];
        const mapped = rows.map(mapDbListingToAppListing);

        // opzionale: sincronizza anche localStorage
        localStorage.setItem('listings', JSON.stringify(mapped));
        return mapped;
      } catch (err) {
        console.error('Errore nel leggere le listings da Supabase, uso i mock/local:', err);
        const stored = localStorage.getItem('listings');
        return stored ? JSON.parse(stored) : MOCK_LISTINGS;
      }
    },

    create: async (listing: Listing) => {
      // Paga Supabase: inseriamo SOLO le colonne esistenti nella tabella
      const payload = {
        owner_id: listing.hostId,
        host_id: listing.hostId,
        title: listing.title,
        category: listing.category,
        sub_category: listing.subCategory || null,
        description: listing.description || '',
        price: listing.price ?? 0,
        price_unit: listing.priceUnit || 'giorno',
        location: listing.location || '',
        lat: listing.coordinates?.lat ?? null,
        lng: listing.coordinates?.lng ?? null,
        rating: listing.rating ?? 0,
        review_count: listing.reviewCount ?? 0,
        deposit: listing.deposit ?? 0,
        status: listing.status || 'published',
        cancellation_p: listing.cancellationPolicy || 'flexible',
        completeness_: (listing as any).completeness || null
      };

      const { data, error } = await supabase
        .from('listings')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase insert listing failed:', error);
        throw new Error('Errore durante il salvataggio dell’annuncio sul server.');
      }

      const savedFromDb = mapDbListingToAppListing(data);

      // manteniamo nel listing i dati extra del front (images, owner, ecc.)
      const merged: Listing = {
        ...savedFromDb,
        images: listing.images || [],
        owner: listing.owner || savedFromDb.owner,
        features: listing.features || [],
        rules: listing.rules || []
      };

      // aggiorna anche localStorage
      const stored = localStorage.getItem('listings');
      const current: Listing[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem('listings', JSON.stringify([merged, ...current]));

      return merged;
    },

    update: async (listing: Listing) => {
      const payload = {
        title: listing.title,
        category: listing.category,
        sub_category: listing.subCategory || null,
        description: listing.description || '',
        price: listing.price ?? 0,
        price_unit: listing.priceUnit || 'giorno',
        location: listing.location || '',
        lat: listing.coordinates?.lat ?? null,
        lng: listing.coordinates?.lng ?? null,
        rating: listing.rating ?? 0,
        review_count: listing.reviewCount ?? 0,
        deposit: listing.deposit ?? 0,
        status: listing.status || 'published',
        cancellation_p: listing.cancellationPolicy || 'flexible',
        completeness_: (listing as any).completeness || null
      };

      const { data, error } = await supabase
        .from('listings')
        .update(payload)
        .eq('id', listing.id)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase update listing failed:', error);
        throw new Error('Errore durante l’aggiornamento dell’annuncio sul server.');
      }

      const updatedFromDb = mapDbListingToAppListing(data);
      const merged: Listing = {
        ...updatedFromDb,
        images: listing.images || [],
        owner: listing.owner || updatedFromDb.owner,
        features: listing.features || [],
        rules: listing.rules || []
      };

      // sync localStorage
      const stored = localStorage.getItem('listings');
      const current: Listing[] = stored ? JSON.parse(stored) : [];
      const newList = current.map(l => (l.id === merged.id ? merged : l));
      localStorage.setItem('listings', JSON.stringify(newList));

      return merged;
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
    // Se Supabase funziona non tocchiamo localStorage, altrimenti mettiamo i mock
    try {
      const { error } = await supabase.from('listings').select('id').limit(1);
      if (error) throw error;
    } catch {
      if (!localStorage.getItem('listings')) {
        localStorage.setItem('listings', JSON.stringify(MOCK_LISTINGS));
      }
    }
  }
};
