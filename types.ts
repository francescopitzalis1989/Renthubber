// TYPES - RENTHUBBER APP (VERSIONE COMPLETA 2025)

// CATEGORIE E STATI
export type ListingCategory = 'oggetto' | 'spazio';
export type ListingStatus = 'draft' | 'published' | 'hidden' | 'suspended';
export type Condition = 'nuovo' | 'come_nuovo' | 'buono' | 'usato' | 'molto_usato';
export type CancellationPolicyType = 'flexible' | 'moderate' | 'strict';
export type ActiveMode = 'renter' | 'hubber';

// --- SYSTEM CONFIGURATION ---
export interface FeeConfig {
  platformPercentage: number;
  renterPercentage: number;
  hubberPercentage: number;
  superHubberPercentage: number;
  fixedFeeEur: number;
}

export interface ReferralConfig {
  isActive: boolean;
  bonusAmount: number;
}

export interface PolicyRule {
  id: CancellationPolicyType;
  label: string;
  description: string;
  refundPercentage: number;
  cutoffHours: number;
  color: string;
}

export interface SuperHubberConfig {
  minRating: number;
  minResponseRate: number;
  maxCancellationRate: number;
  minHostingDays: number;
  requiredCriteriaCount: number;
}

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
  position?: 'header' | 'footer_col1' | 'footer_col2' | 'legal';
  isHtml?: boolean;
}

export interface SiteBranding {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  siteName: string;
}

export interface CmsConfig {
  branding: SiteBranding;
  pages: PageContent[];
}

export interface SystemConfig {
  fees: FeeConfig;
  referral: ReferralConfig;
  cancellationPolicies: PolicyRule[];
  completenessThreshold: number;
  superHubber: SuperHubberConfig;
  cms: CmsConfig;
}

// --- USER & BANK ---
export interface BankDetails {
  accountHolderName: string;
  accountHolderSurname: string;
  iban: string;
  bankName: string;
  bicSwift: string;
}

export type VerificationStatus = "unverified" | "partially_verified" | "verified";

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  rating: number;
  reviewCount?: number;
  isSuperHubber: boolean;
  role?: 'renter' | 'hubber' | 'admin';
  roles: string[];
  hubberSince?: string;
  status?: 'active' | 'suspended' | 'pending_verification';
  isSuspended?: boolean;
  customCommissionRate?: number;
  address?: string;
  phoneNumber?: string;
  renterBalance: number;
  hubberBalance: number;
  referralCode: string;
  bankDetails?: BankDetails;

  bio?: string;
  languages?: string[];
  responseTime?: string;
  responseRate?: number;

  verifications?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
  };

  emailVerified?: boolean;
  phoneVerified?: boolean;
  idDocumentVerified?: boolean;
  verificationStatus?: VerificationStatus;
  idDocumentUrl?: string;
}

// --- RECENSIONI ---
export interface Review {
  id: string;
  authorId: string;
  targetId: string;
  bookingId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'published' | 'pending' | 'hidden';
  type: 'renter_to_hubber' | 'hubber_to_renter';
}

// --- SPECIFICHE OGGETTI / SPAZI ---
export interface TechSpecs {
  brand?: string;
  model?: string;
  year?: string;
  condition?: Condition;
  wattage?: string;
  dimensions?: string;
  accessories?: string[];
  manualUrl?: string;
}

export interface SpaceSpecs {
  sqm?: number;
  floor?: number;
  capacity?: number;
  accessibility?: boolean;
  bathrooms?: number;
  layoutTypes?: string[];
}

// --- LISTING MODEL COMPLETO ---
export interface Listing {
  id: string;
  hostId: string;                  // 🔥 NECESSARIO per assegnare l’annuncio
  title: string;
  category: ListingCategory;
  subCategory: string;
  description: string;
  price: number;
  priceUnit: 'ora' | 'giorno' | 'settimana' | 'mese';
  images: string[];
  location: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  reviewCount: number;
  reviews: Review[];
  owner?: User;                    // 🔥 RESO OPZIONALE per compatibilità
  features: string[];
  rules: string[];
  deposit?: number;
  status?: ListingStatus;
  cancellationPolicy?: CancellationPolicyType;
  techSpecs?: TechSpecs;
  spaceSpecs?: SpaceSpecs;
  minDuration?: number;
  maxDuration?: number;
  completenessScore?: number;
  privateAddress?: string;

  zoneDescription?: string;
  openingHours?: string;
  maxGuests?: number;
  manualBadges?: string[];
  hostRules?: string[];

  createdAt?: string;              // 🔥 AGGIUNTO per ordinamento e compatibilità
}

// --- TRANSAZIONI ---
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  walletType?: 'renter' | 'hubber';
}

// --- PAGAMENTI HUBBER ---
export interface PayoutRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  iban: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

// --- MESSAGGI ---
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  unreadCount: number;
  lastMessageTime: string;
  isSupport?: boolean;
}

// --- BOZZA ANNUNCIO ---
export interface ListingDraft {
  step: number;
  category: ListingCategory;
  title: string;
  subCategory: string;
  description: string;
  features: string;
  brand: string;
  model: string;
  condition: Condition;
  sqm: string;
  capacity: string;
  price: string;
  priceUnit: 'ora' | 'giorno';
  deposit: string;
  cancellationPolicy: CancellationPolicyType;
  location: string;
  images: string[];
}

// --- BOOKING REQUEST ---
export interface BookingRequest {
  id: string;
  listingTitle: string;
  listingImage: string;
  renterName: string;
  renterAvatar: string;
  renterId?: string;
  hostId?: string;
  dates: string;
  totalPrice: number;
  commission?: number;
  netEarnings?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  timeLeft: string;
  renterHasReviewed?: boolean;
  hubberHasReviewed?: boolean;
}

// --- FATTURE ---
export interface Invoice {
  id: string;
  number: string;
  hubberId: string;
  hubberName: string;
  period: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending';
  downloadUrl: string;
}

// --- STATISTICHE ---
export interface DashboardStats {
  earningsMonth: number;
  activeBookings: number;
  views: number;
  responseRate: number;
}

// --- AUDIT LOG ---
export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
}

// --- DISPUTE ---
export interface Dispute {
  id: string;
  reporterName: string;
  targetName: string;
  type: 'damage' | 'scam' | 'rude_behavior';
  description: string;
  status: 'open' | 'resolved' | 'dismissed';
  date: string;
  messages?: Message[];
  resolutionNote?: string;
}

// --- REPORT ---
export interface Report {
  id: string;
  type: 'listing' | 'user' | 'review';
  targetId: string;
  reporterName: string;
  reason: string;
  status: 'open' | 'resolved';
  date: string;
}
