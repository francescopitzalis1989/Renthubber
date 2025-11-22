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

// --- HELPER: MAPPING ROW SUPABASE -> LISTING APP ---
const mapRowToListing = (row: any): Listing => {
  // Owner minimale (non facciamo join, usiamo solo host_id)
  const owner: User = {
    id: row.host_id,
    email: '', // opzionale: potrai spararlo dentro con una join futura
    name: row.host_name || 'Host Renthubber',
    avatar: row.host_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.host_name || 'Host')}`,
    role: 'hubber',
    roles: ['hubber'],
    rating: row.host_rating || 0,
    isSuperHubber: false,
    status: 'active',
    isSuspended: false,
    renterBalance: 0,
    hubberBalance: 0,
    referralCode: '',
    hubberSince: undefined,
    emailVerified: true,
    phoneVerified: false,
    idDocumentVerified: false,
    verificationStatus: 'unverified',
    address: undefined,
    phoneNumber: undefined,
    bio: undefined,
    bankDetails: undefined,
    idDocumentUrl: undefined
  };

  return {
    id: row.id,
    hostId: row.host_id,
    title: row.title,
    category: row.category,
    subCategory: row.sub_category,
    description: row.description || '',
    price: row.price ?? 0,
    priceUnit: row.price_unit || 'giorno',
    images: row.images || [],
    location: row.location || '',
    coordinates: {
      lat: row.lat ?? 0,
      lng: row.lng ?? 0
    },
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    reviews: row.reviews || [],
    owner,
    features: row.features || [],
    rules: row.rules || [],
    deposit: row.deposit ?? 0,
    status: row.status || 'published',
    cancellationPolicy: row.cancellation_policy || 'flexible',
    techSpecs: row.tech_specs || undefined,
    spaceSpecs: row.space_specs || undefined
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

  // --- LISTINGS: ORA SU SUPABASE (NON PIÙ LOCALSTORAGE) ---
  listings: {
    getAll: async (): Promise<Listing[]> => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching listings from Supabase:', error);
          return MOCK_LISTINGS;
        }

        if (!data || data.length === 0) {
          // Nessun annuncio ancora: usiamo i mock come riempitivo
          return MOCK_LISTINGS;
        }

        return data.map(mapRowToListing);
      } catch (e) {
        console.error('Unexpected error fetching listings:', e);
        return MOCK_LISTINGS;
      }
    },

    create: async (listing: Listing): Promise<Listing> => {
      const payload = {
        id: listing.id,
        host_id: listing.hostId,
        title: listing.title,
        category: listing.category,
        sub_category: listing.subCategory,
        description: listing.description,
        price: listing.price,
        price_unit: listing.priceUnit,
        images: listing.images,
        location: listing.location,
        lat: listing.coordinates?.lat ?? null,
        lng: listing.coordinates?.lng ?? null,
        rating: listing.rating ?? 0,
        review_count: listing.reviewCount ?? 0,
        reviews: listing.reviews ?? [],
        features: listing.features ?? [],
        rules: listing.rules ?? [],
        deposit: listing.deposit ?? 0,
        status: listing.status ?? 'published',
        cancellation_policy: listing.cancellationPolicy ?? 'flexible',
        tech_specs: listing.techSpecs ?? null,
        space_specs: listing.spaceSpecs ?? null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('listings')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating listing in Supabase:', error);
        throw error;
      }

      return mapRowToListing(data);
    },

    update: async (listing: Listing): Promise<Listing> => {
      const payload = {
        host_id: listing.hostId,
        title: listing.title,
        category: listing.category,
        sub_category: listing.subCategory,
        description: listing.description,
        price: listing.price,
        price_unit: listing.priceUnit,
        images: listing.images,
        location: listing.location,
        lat: listing.coordinates?.lat ?? null,
        lng: listing.coordinates?.lng ?? null,
        rating: listing.rating ?? 0,
        review_count: listing.reviewCount ?? 0,
        reviews: listing.reviews ?? [],
        features: listing.features ?? [],
        rules: listing.rules ?? [],
        deposit: listing.deposit ?? 0,
        status: listing.status ?? 'published',
        cancellation_policy: listing.cancellationPolicy ?? 'flexible',
        tech_specs: listing.techSpecs ?? null,
        space_specs: listing.spaceSpecs ?? null
      };

      const { data, error } = await supabase
        .from('listings')
        .update(payload)
        .eq('id', listing.id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating listing in Supabase:', error);
        throw error;
      }

      return mapRowToListing(data);
    }
  },

  // --- BOOKINGS (ancora mock/localStorage, per ora) ---
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

  // NIENTE PIÙ SEED DI MOCK_LISTINGS IN LOCALSTORAGE
  init: async () => {
    // lasciato intenzionalmente vuoto: gli annunci ora vivono su Supabase
  }
};
