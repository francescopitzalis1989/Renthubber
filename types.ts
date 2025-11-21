
export type ListingCategory = 'oggetto' | 'spazio';
export type ListingStatus = 'draft' | 'published' | 'hidden' | 'suspended';
export type Condition = 'nuovo' | 'come_nuovo' | 'buono' | 'usato' | 'molto_usato';
export type CancellationPolicyType = 'flexible' | 'moderate' | 'strict';
export type ActiveMode = 'renter' | 'hubber';

// --- SYSTEM CONFIGURATION ---
export interface FeeConfig {
  platformPercentage: number; // Percentuale Base (Fallback)
  renterPercentage: number;   // Nuova: % specifica Renter
  hubberPercentage: number;   // Nuova: % specifica Hubber
  superHubberPercentage: number; // Nuova: % specifica SuperHubber
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

// SUPERHUBBER CONFIG
export interface SuperHubberConfig {
  minRating: number;          // Es. 4.7
  minResponseRate: number;    // Es. 90%
  maxCancellationRate: number;// Es. 1.0%
  minHostingDays: number;     // Es. 90 giorni
  requiredCriteriaCount: number; // Es. 3 (su 4)
}

// CMS & BRANDING
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
  superHubber: SuperHubberConfig; // Updated from simple number to object
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
  isSuspended?: boolean; // Explicit suspension flag
  customCommissionRate?: number;
  address?: string;
  phoneNumber?: string;
  renterBalance: number;
  hubberBalance: number;
  referralCode: string;
  bankDetails?: BankDetails;
  
  // PROFILE FIELDS
  bio?: string;
  languages?: string[];
  responseTime?: string;
  responseRate?: number; // 0-100
  
  // LEGACY VERIFICATIONS (Keep for backward compatibility if needed, but sync with new ones)
  verifications?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
  };

  // NEW VERIFICATION SYSTEM
  emailVerified?: boolean;
  phoneVerified?: boolean;
  idDocumentVerified?: boolean;
  verificationStatus?: VerificationStatus;
  idDocumentUrl?: string;
}

export interface Review {
  id: string;
  authorId: string; // Chi scrive
  targetId: string; // Chi riceve (User ID o Listing ID in base al contesto)
  bookingId: string;
  userName: string; // Nome autore per display rapido
  rating: number;
  comment: string;
  date: string;
  status: 'published' | 'pending' | 'hidden'; // Blind review status
  type: 'renter_to_hubber' | 'hubber_to_renter';
}

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

// --- LISTING MODEL EXPANDED ---
export interface Listing {
  id: string;
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
  owner: User;
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

  // NEW FIELDS FOR FULL EDITOR
  zoneDescription?: string;      
  openingHours?: string;         
  maxGuests?: number;            
  manualBadges?: string[];       
  hostRules?: string[];          
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  walletType?: 'renter' | 'hubber';
}

export interface PayoutRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  iban: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

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

export interface BookingRequest {
  id: string;
  listingTitle: string;
  listingImage: string;
  renterName: string;
  renterAvatar: string;
  renterId?: string; // Added for linking
  hostId?: string;   // Added for linking
  dates: string;
  totalPrice: number; // Totale pagato dal renter
  commission?: number; // Fee trattenuta dalla piattaforma
  netEarnings?: number; // Netto all'hubber
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  timeLeft: string;
  renterHasReviewed?: boolean;
  hubberHasReviewed?: boolean;
}

// NEW: INVOICE MODEL
export interface Invoice {
  id: string;
  number: string; // e.g. INV-2023-001
  hubberId: string;
  hubberName: string;
  period: string; // e.g. "Ottobre 2023"
  date: string;
  amount: number; // Total fees collected
  status: 'paid' | 'pending'; // Paid = trattenuto alla fonte
  downloadUrl: string;
}

export interface DashboardStats {
  earningsMonth: number;
  activeBookings: number;
  views: number;
  responseRate: number;
}

export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
}

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

export interface Report {
  id: string;
  type: 'listing' | 'user' | 'review';
  targetId: string;
  reporterName: string;
  reason: string;
  status: 'open' | 'resolved';
  date: string;
}
