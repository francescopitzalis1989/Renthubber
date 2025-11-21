
import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Package, Shield, Settings, FileText, 
  TrendingUp, AlertTriangle, Search, Ban, DollarSign, CheckCircle, XCircle, 
  Activity, Lock, Save, Landmark, X, Edit, Globe, Image as ImageIcon,
  MessageSquare, LogOut, Download, KeyRound, Trash2, FileCheck, Eye
} from 'lucide-react';
import { User, Listing, SystemConfig, AuditLog, BankDetails, PayoutRequest, PageContent, Dispute, Review, Invoice } from '../types';
import { MOCK_AUDIT_LOGS, MOCK_REQUESTS } from '../constants';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';

interface AdminDashboardProps {
  systemConfig: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  allUsers: User[]; 
  allListings: Listing[];
  payoutRequests?: PayoutRequest[];
  onProcessPayout?: (requestId: string, approved: boolean) => void;
  onLogout?: () => void;
  disputes?: Dispute[];
  onDisputeAction?: (id: string, action: 'resolve' | 'dismiss', note?: string) => void;
  reviews?: Review[];
  invoices?: Invoice[];
  onCreateInvoice?: (invoice: Invoice) => void;
  onUpdateUser?: (user: User) => void; // Prop for updating user details
}

// --- SUB-COMPONENTS ---

const KpiCard: React.FC<{title: string, value: string, subtext?: string, icon: React.ElementType, color: string}> = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        {subtext && <p className={`text-xs mt-2 font-semibold ${subtext.startsWith('+') ? 'text-green-600' : 'text-gray-400'}`}>{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// --- MAIN DASHBOARD ---

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  systemConfig, onUpdateConfig, allUsers, allListings, payoutRequests = [], onProcessPayout, onLogout,
  disputes = [], onDisputeAction, reviews = [], invoices = [], onCreateInvoice, onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'listings' | 'finance' | 'invoices' | 'cms' | 'disputes' | 'config'>('overview');
  
  // FEES State
  const [renterFee, setRenterFee] = useState(systemConfig.fees.renterPercentage || 10);
  const [hubberFee, setHubberFee] = useState(systemConfig.fees.hubberPercentage || 10);
  const [superHubberFee, setSuperHubberFee] = useState(systemConfig.fees.superHubberPercentage || 5);
  const [fixedFee, setFixedFee] = useState(systemConfig.fees.fixedFeeEur);

  // SUPERHUBBER CONFIG State
  const [shConfig, setShConfig] = useState(systemConfig.superHubber || {
    minRating: 4.7,
    minResponseRate: 90,
    maxCancellationRate: 1,
    minHostingDays: 90,
    requiredCriteriaCount: 3
  });

  // COMPLETENESS State
  const [completenessThresh, setCompletenessThresh] = useState(systemConfig.completenessThreshold);

  // CMS State
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  const [brandingForm, setBrandingForm] = useState(systemConfig.cms.branding);

  // Listings State
  const [localListings, setLocalListings] = useState<Listing[]>(allListings);

  // Invoice Generation State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ hubberId: '', month: '', year: new Date().getFullYear().toString() });

  // User Management States
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'renter' | 'hubber' | 'admin'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  
  // Mock data for charts
  const chartData = [
    { name: 'Lun', users: 12, revenue: 150 },
    { name: 'Mar', users: 19, revenue: 230 },
    { name: 'Mer', users: 3, revenue: 45 },
    { name: 'Gio', users: 25, revenue: 320 },
    { name: 'Ven', users: 40, revenue: 500 },
    { name: 'Sab', users: 55, revenue: 650 },
    { name: 'Dom', users: 48, revenue: 580 },
  ];

  const handleSaveConfig = () => {
    const newConfig: SystemConfig = {
      ...systemConfig,
      fees: {
        ...systemConfig.fees,
        renterPercentage: parseFloat(renterFee.toString()),
        hubberPercentage: parseFloat(hubberFee.toString()),
        superHubberPercentage: parseFloat(superHubberFee.toString()),
        fixedFeeEur: parseFloat(fixedFee.toString())
      },
      completenessThreshold: parseFloat(completenessThresh.toString()),
      superHubber: shConfig
    };
    onUpdateConfig(newConfig);
    alert("Configurazione aggiornata! Le modifiche sono ora attive su tutta la piattaforma.");
  };

  const handleSaveBranding = () => {
    const newConfig: SystemConfig = {
      ...systemConfig,
      cms: {
        ...systemConfig.cms,
        branding: brandingForm
      }
    };
    onUpdateConfig(newConfig);
    alert("Branding aggiornato.");
  };

  const handleSavePage = () => {
    if (!editingPage) return;
    const updatedPages = systemConfig.cms.pages.map(p => p.id === editingPage.id ? editingPage : p);
    const newConfig: SystemConfig = {
      ...systemConfig,
      cms: {
        ...systemConfig.cms,
        pages: updatedPages
      }
    };
    onUpdateConfig(newConfig);
    setEditingPage(null);
    alert("Pagina aggiornata.");
  };

  const handleListingAction = (id: string, action: 'suspend' | 'activate') => {
    setLocalListings(prev => prev.map(l => l.id === id ? { ...l, status: action === 'suspend' ? 'suspended' : 'published' } : l));
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateInvoice) return;

    const hubber = allUsers.find(u => u.id === invoiceForm.hubberId);
    if (!hubber) return;

    const bookings = MOCK_REQUESTS.filter(req => req.hostId === hubber.id && req.status === 'completed');
    const totalFees = bookings.reduce((acc, curr) => acc + (curr.commission || 0), 0);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: `INV-${invoiceForm.year}-${Math.floor(Math.random() * 1000)}`,
      hubberId: hubber.id,
      hubberName: hubber.name,
      period: `${invoiceForm.month} ${invoiceForm.year}`,
      date: new Date().toLocaleDateString('it-IT'),
      amount: totalFees > 0 ? totalFees : 25.00, 
      status: 'paid',
      downloadUrl: '#'
    };

    onCreateInvoice(newInvoice);
    setShowInvoiceModal(false);
    alert("Fattura generata con successo!");
  };

  // --- USER MANAGEMENT ACTIONS ---

  const handleUserAction = (action: 'save' | 'suspend' | 'activate' | 'reset_password' | 'delete_bank') => {
    if (!selectedUserForEdit || !onUpdateUser) return;

    let updatedUser = { ...selectedUserForEdit };

    switch (action) {
      case 'save':
        // Save handled by passing updatedUser directly if form fields bound to state
        break;
      case 'suspend':
        updatedUser.isSuspended = true;
        updatedUser.status = 'suspended';
        break;
      case 'activate':
        updatedUser.isSuspended = false;
        updatedUser.status = 'active';
        break;
      case 'reset_password':
        alert(`Link di reset inviato a ${updatedUser.email}. (Simulazione)`);
        return; // No state change needed for demo
      case 'delete_bank':
        updatedUser.bankDetails = undefined;
        break;
    }

    // Recalculate verification status if needed (simplified)
    if (updatedUser.emailVerified && updatedUser.phoneVerified && updatedUser.idDocumentVerified) {
      updatedUser.verificationStatus = 'verified';
    } else if (updatedUser.emailVerified || updatedUser.phoneVerified || updatedUser.idDocumentVerified) {
      updatedUser.verificationStatus = 'partially_verified';
    } else {
      updatedUser.verificationStatus = 'unverified';
    }

    onUpdateUser(updatedUser);
    setSelectedUserForEdit(updatedUser); // Update local modal state
    
    if (action !== 'save' && action !== 'delete_bank') {
        // Optional: close modal on specific actions or show success
    }
  };

  const handleVerificationToggle = (field: 'emailVerified' | 'phoneVerified' | 'idDocumentVerified') => {
    if (!selectedUserForEdit || !onUpdateUser) return;
    const updatedUser = { ...selectedUserForEdit, [field]: !selectedUserForEdit[field] };
    
    // Auto-update aggregate status
    if (updatedUser.emailVerified && updatedUser.phoneVerified && updatedUser.idDocumentVerified) {
      updatedUser.verificationStatus = 'verified';
    } else if (updatedUser.emailVerified || updatedUser.phoneVerified || updatedUser.idDocumentVerified) {
      updatedUser.verificationStatus = 'partially_verified';
    } else {
      updatedUser.verificationStatus = 'unverified';
    }

    setSelectedUserForEdit(updatedUser);
    onUpdateUser(updatedUser);
  };

  const exportUsersCSV = () => {
    const headers = ["ID", "Name", "Email", "Role", "Status", "Rating", "Joined Date", "Verified"];
    const rows = allUsers.map(u => [
      u.id, 
      u.name, 
      u.email, 
      u.role, 
      u.isSuspended ? 'Suspended' : 'Active', 
      u.rating, 
      u.hubberSince || 'N/A',
      u.verificationStatus
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
  };

  // --- VIEWS RENDERERS ---

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Utenti Totali" value={allUsers.length > 2 ? allUsers.length.toString() : "1,240"} subtext="+12% questo mese" icon={Users} color="bg-blue-500" />
        <KpiCard title="Annunci Attivi" value={allListings.length.toString()} subtext="+5 questa settimana" icon={Package} color="bg-orange-500" />
        <KpiCard title="Fatturato (Fee)" value="€ 3,450" subtext="+8% vs mese scorso" icon={TrendingUp} color="bg-green-500" />
        <KpiCard title="Controversie" value={disputes.filter(d => d.status === 'open').length.toString()} subtext="Aperte" icon={AlertTriangle} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Revenue Trend</h3>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                   <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} />
                   <YAxis axisLine={false} tickLine={false} />
                   <Tooltip />
                   <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <h3 className="font-bold text-gray-900 mb-4">Audit Log Recenti</h3>
           <div className="space-y-4 overflow-y-auto max-h-80">
              {MOCK_AUDIT_LOGS.map(log => (
                 <div key={log.id} className="flex items-start text-sm border-b border-gray-50 pb-3 last:border-0">
                    <div className="bg-gray-100 p-1.5 rounded-full mr-3 mt-0.5">
                       <Activity className="w-3 h-3 text-gray-500" />
                    </div>
                    <div>
                       <p className="font-semibold text-gray-900">{log.action}</p>
                       <p className="text-xs text-gray-500">{log.details}</p>
                       <p className="text-[10px] text-gray-400 mt-1">{log.timestamp} da <span className="font-medium">{log.adminName}</span></p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    const filteredUsers = allUsers.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter || u.roles.includes(userRoleFilter);
      const matchesStatus = userStatusFilter === 'all' || 
                            (userStatusFilter === 'suspended' && u.isSuspended) || 
                            (userStatusFilter === 'active' && !u.isSuspended);
      return matchesSearch && matchesRole && matchesStatus;
    });

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
        <div className="p-6 border-b border-gray-100 space-y-4">
           <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">Gestione Utenti</h3>
              <button onClick={exportUsersCSV} className="px-4 py-2 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors flex items-center">
                 <Download className="w-4 h-4 mr-2" /> Esporta CSV
              </button>
           </div>
           
           <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                 <input 
                   type="text" 
                   placeholder="Cerca per nome o email..." 
                   className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none"
                   value={userSearch}
                   onChange={(e) => setUserSearch(e.target.value)}
                 />
              </div>
              <select 
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none bg-white"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
              >
                 <option value="all">Tutti i Ruoli</option>
                 <option value="renter">Renter</option>
                 <option value="hubber">Hubber</option>
                 <option value="admin">Admin</option>
              </select>
              <select 
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none bg-white"
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value as any)}
              >
                 <option value="all">Tutti gli Stati</option>
                 <option value="active">Attivi</option>
                 <option value="suspended">Sospesi</option>
              </select>
           </div>
        </div>

        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
            <tr>
               <th className="p-4">Utente</th>
               <th className="p-4">Ruolo</th>
               <th className="p-4">Stato</th>
               <th className="p-4">Verifica</th>
               <th className="p-4">Rating</th>
               <th className="p-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
             {filteredUsers.map((user) => (
               <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 flex items-center">
                     <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full mr-3" />
                     <div>
                        <div className="flex items-center">
                           <p className="font-bold text-gray-900 mr-1">{user.name}</p>
                           {user.verificationStatus === 'verified' && <CheckCircle className="w-3 h-3 text-green-500" title="Utente Verificato" />}
                        </div>
                        <p className="text-xs text-gray-400">{user.email || 'No email'}</p>
                     </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${user.role === 'hubber' ? 'bg-orange-50 text-orange-700' : user.role === 'admin' ? 'bg-gray-800 text-white' : 'bg-blue-50 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.isSuspended ? (
                       <span className="text-red-600 text-xs font-bold flex items-center"><Ban className="w-3 h-3 mr-1" /> Sospeso</span>
                    ) : (
                       <span className="text-green-600 text-xs font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Attivo</span>
                    )}
                  </td>
                  <td className="p-4">
                     <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        user.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 
                        user.verificationStatus === 'partially_verified' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'
                     }`}>
                        {user.verificationStatus === 'verified' ? 'Verificato' : user.verificationStatus === 'partially_verified' ? 'Parziale' : 'Non Verificato'}
                     </span>
                  </td>
                  <td className="p-4">{user.rating || 'N/A'}</td>
                  <td className="p-4 text-right">
                     <button 
                        onClick={() => setSelectedUserForEdit(user)}
                        className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors" 
                        title="Dettagli & Modifica"
                     >
                        <Settings className="w-4 h-4" />
                     </button>
                  </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderListings = () => (
     <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
         <h3 className="font-bold text-gray-900">Gestione Annunci</h3>
         <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cerca annuncio..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none" />
         </div>
      </div>
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
          <tr>
             <th className="p-4">Annuncio</th>
             <th className="p-4">Host</th>
             <th className="p-4">Stato</th>
             <th className="p-4">Prezzo</th>
             <th className="p-4 text-right">Azioni</th>
          </tr>
        </thead>
        <tbody>
           {localListings.map((listing) => (
             <tr key={listing.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4 flex items-center">
                   <img src={listing.images[0]} alt={listing.title} className="w-10 h-10 rounded-lg object-cover mr-3" />
                   <div>
                      <p className="font-bold text-gray-900 line-clamp-1">{listing.title}</p>
                      <p className="text-xs text-gray-400">{listing.location}</p>
                   </div>
                </td>
                <td className="p-4">
                   <div className="flex items-center">
                      <img src={listing.owner.avatar} className="w-6 h-6 rounded-full mr-2" alt="" />
                      <span>{listing.owner.name}</span>
                   </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                     listing.status === 'published' ? 'bg-green-50 text-green-700' : 
                     listing.status === 'suspended' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {listing.status}
                  </span>
                </td>
                <td className="p-4">€{listing.price} <span className="text-gray-400 text-xs">/{listing.priceUnit}</span></td>
                <td className="p-4 text-right">
                   {listing.status === 'published' ? (
                      <button 
                         onClick={() => handleListingAction(listing.id, 'suspend')}
                         className="text-red-600 hover:bg-red-50 p-2 rounded-lg flex items-center justify-end w-full"
                      >
                         <Ban className="w-4 h-4 mr-1" /> Sospendi
                      </button>
                   ) : (
                      <button 
                         onClick={() => handleListingAction(listing.id, 'activate')}
                         className="text-green-600 hover:bg-green-50 p-2 rounded-lg flex items-center justify-end w-full"
                      >
                         <CheckCircle className="w-4 h-4 mr-1" /> Attiva
                      </button>
                   )}
                </td>
             </tr>
           ))}
        </tbody>
      </table>
    </div>
  );

  const renderFinance = () => (
     <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <h3 className="text-lg font-bold text-gray-900 mb-4">Richieste di Bonifico (Payout)</h3>
           <p className="text-sm text-gray-500 mb-6">Approva i pagamenti verso gli Hubber. Una volta approvato, l'importo verrà scalato dal saldo.</p>
           
           {payoutRequests.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                 <p className="text-gray-500">Nessuna richiesta di payout in attesa.</p>
              </div>
           ) : (
              <table className="w-full text-left text-sm text-gray-600">
                 <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                    <tr>
                       <th className="p-4">Hubber</th>
                       <th className="p-4">Importo</th>
                       <th className="p-4">IBAN</th>
                       <th className="p-4">Data Richiesta</th>
                       <th className="p-4">Stato</th>
                       <th className="p-4 text-right">Azioni</th>
                    </tr>
                 </thead>
                 <tbody>
                    {payoutRequests.map((req) => (
                       <tr key={req.id} className="border-b border-gray-50">
                          <td className="p-4 font-medium text-gray-900">{req.userName}</td>
                          <td className="p-4 font-bold text-gray-900">€ {req.amount.toFixed(2)}</td>
                          <td className="p-4 font-mono text-xs">{req.iban}</td>
                          <td className="p-4">{req.date}</td>
                          <td className="p-4">
                             <span className={`px-2 py-1 rounded text-xs font-bold capitalize 
                                ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {req.status === 'pending' ? 'In Attesa' : req.status === 'approved' ? 'Approvato' : 'Rifiutato'}
                             </span>
                          </td>
                          <td className="p-4 text-right">
                             {req.status === 'pending' && (
                                <div className="flex justify-end gap-2">
                                   <button 
                                      onClick={() => onProcessPayout && onProcessPayout(req.id, true)}
                                      className="bg-green-50 text-green-600 hover:bg-green-100 p-2 rounded-lg flex items-center font-bold text-xs"
                                      title="Approva e Invia"
                                   >
                                      <CheckCircle className="w-4 h-4 mr-1" /> Approva
                                   </button>
                                   <button 
                                      onClick={() => onProcessPayout && onProcessPayout(req.id, false)}
                                      className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg flex items-center font-bold text-xs"
                                      title="Rifiuta"
                                   >
                                      <XCircle className="w-4 h-4 mr-1" /> Rifiuta
                                   </button>
                                </div>
                             )}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           )}
        </div>
     </div>
  );

  // NEW: INVOICE MANAGEMENT RENDERER
  const renderInvoices = () => (
    <div className="space-y-6 animate-in fade-in">
       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
             <div>
                <h3 className="text-lg font-bold text-gray-900">Fatture Hubber</h3>
                <p className="text-sm text-gray-500">Gestisci le fatture per le commissioni trattenute dalla piattaforma.</p>
             </div>
             <button 
               onClick={() => setShowInvoiceModal(true)}
               className="bg-brand text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center shadow-md hover:bg-brand-dark transition-colors"
             >
                <FileText className="w-4 h-4 mr-2" /> Genera Fattura
             </button>
          </div>
          <table className="w-full text-left text-sm text-gray-600">
             <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                <tr>
                   <th className="p-4">Numero</th>
                   <th className="p-4">Hubber</th>
                   <th className="p-4">Periodo</th>
                   <th className="p-4">Data Emissione</th>
                   <th className="p-4">Importo (Fee)</th>
                   <th className="p-4">Stato</th>
                   <th className="p-4 text-right">Download</th>
                </tr>
             </thead>
             <tbody>
                {invoices.map((inv) => (
                   <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4 font-mono font-bold">{inv.number}</td>
                      <td className="p-4">{inv.hubberName}</td>
                      <td className="p-4">{inv.period}</td>
                      <td className="p-4 text-xs">{inv.date}</td>
                      <td className="p-4 font-bold">€{inv.amount.toFixed(2)}</td>
                      <td className="p-4">
                         <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-green-100 text-green-700">
                            Pagato
                         </span>
                      </td>
                      <td className="p-4 text-right">
                         <button className="text-brand hover:bg-brand/10 p-2 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                         </button>
                      </td>
                   </tr>
                ))}
                {invoices.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nessuna fattura generata.</td></tr>}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderCMS = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      {/* Branding Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
         <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-brand" /> Branding Sito
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Nome Sito</label>
               <input 
                  type="text" 
                  value={brandingForm.siteName}
                  onChange={(e) => setBrandingForm({...brandingForm, siteName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Colore Primario (HEX)</label>
               <div className="flex items-center">
                  <input 
                     type="color" 
                     value={brandingForm.primaryColor}
                     onChange={(e) => setBrandingForm({...brandingForm, primaryColor: e.target.value})}
                     className="w-10 h-10 border border-gray-300 rounded-lg mr-2 cursor-pointer"
                  />
                  <input 
                     type="text" 
                     value={brandingForm.primaryColor}
                     onChange={(e) => setBrandingForm({...brandingForm, primaryColor: e.target.value})}
                     className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none uppercase"
                  />
               </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
               <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                     <ImageIcon className="w-4 h-4" />
                  </span>
                  <input 
                     type="text" 
                     value={brandingForm.logoUrl}
                     onChange={(e) => setBrandingForm({...brandingForm, logoUrl: e.target.value})}
                     className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-brand outline-none"
                     placeholder="https://..."
                  />
               </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
               <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                     <ImageIcon className="w-4 h-4" />
                  </span>
                  <input 
                     type="text" 
                     value={brandingForm.faviconUrl}
                     onChange={(e) => setBrandingForm({...brandingForm, faviconUrl: e.target.value})}
                     className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-brand outline-none"
                     placeholder="https://..."
                  />
               </div>
            </div>
         </div>
         <div className="mt-6 flex justify-end">
            <button onClick={handleSaveBranding} className="bg-brand text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-dark transition-colors">
               Aggiorna Branding
            </button>
         </div>
      </div>

      {/* Pages Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
               <FileText className="w-5 h-5 mr-2 text-brand" /> Pagine & Contenuti
            </h3>
            <button className="text-sm text-brand hover:underline font-medium">Aggiungi Pagina</button>
         </div>

         <div className="space-y-4">
            {systemConfig.cms.pages.map(page => (
               <div key={page.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div>
                     <h4 className="font-bold text-gray-900">{page.title}</h4>
                     <p className="text-xs text-gray-500">/{page.slug} • Ultima modifica: {page.lastUpdated}</p>
                  </div>
                  <button 
                     onClick={() => setEditingPage(page)}
                     className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                  >
                     <Edit className="w-4 h-4" />
                  </button>
               </div>
            ))}
         </div>
      </div>
    </div>
  );

  const renderDisputes = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
       <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center">
             <AlertTriangle className="w-5 h-5 mr-2 text-red-500" /> Gestione Controversie
          </h3>
       </div>
       <table className="w-full text-left text-sm text-gray-600">
         <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
            <tr>
               <th className="p-4">Data</th>
               <th className="p-4">Segnalato da</th>
               <th className="p-4">Contro</th>
               <th className="p-4">Motivo</th>
               <th className="p-4">Stato</th>
               <th className="p-4 text-right">Azioni</th>
            </tr>
         </thead>
         <tbody>
            {disputes.map(d => (
               <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 text-xs">{d.date}</td>
                  <td className="p-4 font-medium">{d.reporterName}</td>
                  <td className="p-4">{d.targetName}</td>
                  <td className="p-4">
                     <span className="block text-xs uppercase font-bold text-gray-500 mb-1">{d.type}</span>
                     <p className="text-gray-900 line-clamp-1">{d.description}</p>
                  </td>
                  <td className="p-4">
                     <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        d.status === 'open' ? 'bg-red-100 text-red-700' : 
                        d.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                     }`}>
                        {d.status}
                     </span>
                  </td>
                  <td className="p-4 text-right">
                     {d.status === 'open' && (
                        <div className="flex justify-end gap-2">
                           <button onClick={() => onDisputeAction && onDisputeAction(d.id, 'dismiss')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Ignora">
                              <XCircle className="w-4 h-4" />
                           </button>
                           <button onClick={() => onDisputeAction && onDisputeAction(d.id, 'resolve')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Risolvi">
                              <CheckCircle className="w-4 h-4" />
                           </button>
                        </div>
                     )}
                  </td>
               </tr>
            ))}
            {disputes.length === 0 && (
               <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nessuna controversia aperta.</td></tr>
            )}
         </tbody>
       </table>
    </div>
  );

  const renderConfig = () => (
     <div className="max-w-5xl animate-in fade-in slide-in-from-right-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
           <div className="mb-8 border-b border-gray-100 pb-6">
              <h2 className="text-2xl font-bold text-gray-900">Configurazioni Globali</h2>
              <p className="text-gray-500 mt-1">Le modifiche qui si riflettono istantaneamente su tutta la piattaforma.</p>
           </div>

           <div className="grid grid-cols-1 gap-12">
              {/* FEES */}
              <div>
                 <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-brand" /> Commissioni Piattaforma
                 </h3>
                 <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="grid grid-cols-3 gap-6 mb-4">
                       <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Fee Renter (%)</label>
                          <input type="number" value={renterFee} onChange={(e) => setRenterFee(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none" />
                       </div>
                       <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Fee Hubber (%)</label>
                          <input type="number" value={hubberFee} onChange={(e) => setHubberFee(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none" />
                       </div>
                       <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Fee SuperHubber (%)</label>
                          <input type="number" value={superHubberFee} onChange={(e) => setSuperHubberFee(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none" />
                       </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                       <label className="block text-sm font-semibold text-gray-700 mb-2">Costo Fisso Transazione (€)</label>
                       <input type="number" value={fixedFee} onChange={(e) => setFixedFee(Number(e.target.value))} className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none" />
                    </div>
                 </div>
              </div>

              {/* RULES & QUALITY */}
              <div>
                 <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-brand" /> Regole & Qualità
                 </h3>
                 <div className="space-y-6">
                    {/* Soglia Pubblicazione */}
                    <div className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm">
                       <div className="flex justify-between items-center">
                          <div>
                             <p className="font-bold text-gray-900">Soglia Pubblicazione</p>
                             <p className="text-xs text-gray-500">Punteggio qualità minimo per pubblicare un annuncio.</p>
                          </div>
                          <div className="flex items-center">
                             <input type="number" value={completenessThresh} onChange={(e) => setCompletenessThresh(Number(e.target.value))} className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center font-bold" />
                             <span className="ml-2 font-bold text-gray-500">%</span>
                          </div>
                       </div>
                    </div>

                    {/* SuperHubber Logic */}
                    <div className="p-6 border border-gray-200 rounded-xl bg-gray-50">
                       <h4 className="font-bold text-gray-900 mb-4">Requisiti SuperHubber</h4>
                       <div className="grid grid-cols-2 gap-6 mb-6">
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rating Minimo</label>
                             <input type="number" step="0.1" value={shConfig.minRating} onChange={(e) => setShConfig({...shConfig, minRating: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Risposta (%)</label>
                             <input type="number" value={shConfig.minResponseRate} onChange={(e) => setShConfig({...shConfig, minResponseRate: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cancellazioni Max (%)</label>
                             <input type="number" step="0.1" value={shConfig.maxCancellationRate} onChange={(e) => setShConfig({...shConfig, maxCancellationRate: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Anzianità (giorni)</label>
                             <input type="number" value={shConfig.minHostingDays} onChange={(e) => setShConfig({...shConfig, minHostingDays: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                          </div>
                       </div>
                       
                       <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <span className="text-sm font-bold text-gray-800">Criteri minimi da soddisfare:</span>
                          <div className="flex items-center space-x-3">
                             <span className="text-sm font-bold text-brand">{shConfig.requiredCriteriaCount} su 4</span>
                             <input 
                               type="range" min="1" max="4" 
                               value={shConfig.requiredCriteriaCount} 
                               onChange={(e) => setShConfig({...shConfig, requiredCriteriaCount: Number(e.target.value)})}
                               className="w-32 accent-brand cursor-pointer" 
                             />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSaveConfig}
                className="bg-brand text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-brand-dark transition-all flex items-center"
              >
                 <Save className="w-5 h-5 mr-2" /> Salva Configurazioni
              </button>
           </div>
        </div>
     </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F172A] text-white flex flex-col fixed h-full z-20">
         <div className="h-16 flex items-center px-6 border-b border-gray-800">
            <span className="font-bold text-xl tracking-tight text-white">Renthubber <span className="text-brand-light text-xs align-top">ADMIN</span></span>
         </div>
         
         <nav className="flex-1 py-6 space-y-1 px-3">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
               <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
               <Users className="w-5 h-5 mr-3" /> Utenti
            </button>
            <button onClick={() => setActiveTab('listings')} className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === 'listings' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
               <Package className="w-5 h-5 mr-3" /> Annunci
            </button>
            <button onClick={() => setActiveTab('disputes')} className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === 'disputes' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
               <AlertTriangle className="w-5 h-5 mr-3" /> Controversie
            </button>
            <div className="pt-4 pb-2 px-3 text-xs font-bold text-gray-600 uppercase">Sistema</div>
            <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === 'finance' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
               <DollarSign className="w-5 h-5 mr-3" /> Finanza & Wallet
            </button>
            {/* NEW INVOICES TAB */}
            <button onClick={() => setActiveTab('invoices')} className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === 'invoices' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
               <FileText className="w-5 h-5 mr-3" /> Fatture Hubber
            </button>
            <button onClick={() => setActiveTab('cms')} className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === 'cms' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
               <Globe className="w-5 h-5 mr-3" /> CMS & Branding
            </button>
            <button onClick={() => setActiveTab('config')} className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === 'config' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
               <Settings className="w-5 h-5 mr-3" /> Configurazioni
            </button>
         </nav>

         <div className="p-4 border-t border-gray-800">
            <button 
               onClick={onLogout}
               className="w-full flex items-center px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors mb-4"
            >
               <LogOut className="w-5 h-5 mr-3" /> Logout
            </button>
            <div className="flex items-center">
               <div className="w-8 h-8 rounded-full bg-gray-600 mr-3"></div>
               <div>
                  <p className="text-sm font-bold text-white">Admin System</p>
                  <p className="text-xs text-gray-400">Super Admin</p>
               </div>
            </div>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
         {activeTab === 'overview' && renderOverview()}
         {activeTab === 'users' && renderUsers()}
         {activeTab === 'listings' && renderListings()}
         {activeTab === 'finance' && renderFinance()}
         {activeTab === 'invoices' && renderInvoices()}
         {activeTab === 'cms' && renderCMS()}
         {activeTab === 'disputes' && renderDisputes()}
         {activeTab === 'config' && renderConfig()}
      </main>

      {/* INVOICE GENERATION MODAL */}
      {showInvoiceModal && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
               <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-brand text-white">
                  <h3 className="font-bold flex items-center">
                     <FileText className="w-5 h-5 mr-2" /> Genera Fattura Hubber
                  </h3>
                  <button onClick={() => setShowInvoiceModal(false)} className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
               </div>
               
               <form onSubmit={handleGenerateInvoice} className="p-6 space-y-6">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Seleziona Hubber</label>
                     <select 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                        value={invoiceForm.hubberId}
                        onChange={(e) => setInvoiceForm({...invoiceForm, hubberId: e.target.value})}
                        required
                     >
                        <option value="">-- Seleziona --</option>
                        {allUsers.filter(u => u.roles.includes('hubber')).map(u => (
                           <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                     </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mese</label>
                        <select 
                           className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                           value={invoiceForm.month}
                           onChange={(e) => setInvoiceForm({...invoiceForm, month: e.target.value})}
                           required
                        >
                           <option value="">--</option>
                           {['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'].map(m => (
                              <option key={m} value={m}>{m}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Anno</label>
                        <input 
                           type="number"
                           className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                           value={invoiceForm.year}
                           onChange={(e) => setInvoiceForm({...invoiceForm, year: e.target.value})}
                           required
                        />
                     </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-xs text-yellow-800">
                     Il sistema calcolerà automaticamente il totale delle commissioni per le prenotazioni completate nel periodo selezionato.
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                     <button 
                        type="button"
                        onClick={() => setShowInvoiceModal(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                     >
                        Annulla
                     </button>
                     <button 
                        type="submit"
                        className="px-6 py-2 bg-brand text-white rounded-lg font-bold shadow-md hover:bg-brand-dark"
                     >
                        Genera e Salva
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* PAGE EDITOR MODAL (CMS) */}
      {editingPage && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
               <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Modifica Pagina: {editingPage.title}</h3>
                  <button onClick={() => setEditingPage(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
               </div>
               <div className="p-6 flex-1 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Pagina</label>
                        <input 
                           type="text" 
                           value={editingPage.title}
                           onChange={(e) => setEditingPage({...editingPage, title: e.target.value})}
                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Posizione</label>
                        <select 
                           value={editingPage.position || 'footer_col1'}
                           onChange={(e) => setEditingPage({...editingPage, position: e.target.value as any})}
                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                        >
                           <option value="header">Header Menu</option>
                           <option value="footer_col1">Footer (Renthubber)</option>
                           <option value="footer_col2">Footer (Supporto)</option>
                           <option value="legal">Footer (Legale)</option>
                        </select>
                     </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 py-2">
                     <input 
                        type="checkbox" 
                        id="isHtml" 
                        checked={editingPage.isHtml} 
                        onChange={(e) => setEditingPage({...editingPage, isHtml: e.target.checked})}
                        className="rounded border-gray-300 text-brand focus:ring-brand"
                     />
                     <label htmlFor="isHtml" className="text-sm text-gray-700 font-medium">Abilita HTML Editor</label>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Contenuto</label>
                     <textarea 
                        value={editingPage.content}
                        onChange={(e) => setEditingPage({...editingPage, content: e.target.value})}
                        className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono text-sm leading-relaxed"
                        placeholder={editingPage.isHtml ? "<div>Inserisci codice HTML qui...</div>" : "Scrivi il testo semplice..."}
                     />
                  </div>
               </div>
               <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => setEditingPage(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Annulla</button>
                  <button onClick={handleSavePage} className="px-6 py-2 bg-brand text-white rounded-lg font-bold shadow-md hover:bg-brand-dark">Salva Modifiche</button>
               </div>
            </div>
         </div>
      )}

      {/* ADVANCED USER DETAIL MODAL */}
      {selectedUserForEdit && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                  <div className="flex items-center">
                     <img src={selectedUserForEdit.avatar} alt={selectedUserForEdit.name} className="w-12 h-12 rounded-full border-2 border-white shadow mr-4" />
                     <div>
                        <h3 className="font-bold text-xl text-gray-900">{selectedUserForEdit.name}</h3>
                        <p className="text-sm text-gray-500">{selectedUserForEdit.email}</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedUserForEdit(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full"><X className="w-6 h-6" /></button>
               </div>
               
               <div className="p-6 flex-1 overflow-y-auto">
                  
                  {/* Status & Info */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ruolo Attuale</label>
                        <select 
                           className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                           value={selectedUserForEdit.role}
                           onChange={(e) => handleUserAction('save') /* In real app, specific handler */}
                        >
                           <option value="renter">Renter</option>
                           <option value="hubber">Hubber</option>
                           <option value="admin">Admin</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stato Account</label>
                        <div className={`flex items-center p-2 rounded-lg border ${selectedUserForEdit.isSuspended ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                           {selectedUserForEdit.isSuspended ? <Ban className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                           <span className="font-bold text-sm">{selectedUserForEdit.isSuspended ? 'SOSPESO' : 'ATTIVO'}</span>
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rating</label>
                        <p className="font-bold text-gray-900">{selectedUserForEdit.rating || 'N/A'}</p>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Registrazione</label>
                        <p className="font-medium text-gray-900">{selectedUserForEdit.hubberSince ? new Date(selectedUserForEdit.hubberSince).toLocaleDateString() : '2023'}</p>
                     </div>
                  </div>

                  {/* VERIFICATION SECTION */}
                  <div className="mb-8 border-t border-gray-100 pt-6">
                     <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-brand" /> Verifiche & KYC
                     </h4>
                     <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                           <span className="text-sm text-gray-700">Email Verificata</span>
                           <input 
                              type="checkbox" 
                              checked={selectedUserForEdit.emailVerified} 
                              onChange={() => handleVerificationToggle('emailVerified')}
                              className="toggle toggle-brand" 
                           />
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-sm text-gray-700">Telefono Verificato</span>
                           <input 
                              type="checkbox" 
                              checked={selectedUserForEdit.phoneVerified} 
                              onChange={() => handleVerificationToggle('phoneVerified')}
                              className="toggle toggle-brand" 
                           />
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-sm text-gray-700">Identità Verificata</span>
                           <input 
                              type="checkbox" 
                              checked={selectedUserForEdit.idDocumentVerified} 
                              onChange={() => handleVerificationToggle('idDocumentVerified')}
                              className="toggle toggle-brand" 
                           />
                        </div>
                        {selectedUserForEdit.idDocumentUrl && (
                           <div className="mt-3 pt-3 border-t border-gray-200">
                              <a href={selectedUserForEdit.idDocumentUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
                                 <FileCheck className="w-4 h-4 mr-1" /> Visualizza Documento Caricato
                              </a>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* BANK DATA */}
                  {selectedUserForEdit.bankDetails && (
                     <div className="mb-8 border-t border-gray-100 pt-6">
                        <div className="flex justify-between items-center mb-4">
                           <h4 className="font-bold text-gray-900 flex items-center">
                              <Landmark className="w-5 h-5 mr-2 text-brand" /> Dati Bancari
                           </h4>
                           <button onClick={() => handleUserAction('delete_bank')} className="text-red-500 hover:bg-red-50 p-1.5 rounded text-xs font-bold flex items-center">
                              <Trash2 className="w-3 h-3 mr-1" /> Rimuovi
                           </button>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 border border-gray-200">
                           <p><span className="font-bold">Intestatario:</span> {selectedUserForEdit.bankDetails.accountHolderName} {selectedUserForEdit.bankDetails.accountHolderSurname}</p>
                           <p className="mt-1"><span className="font-bold">IBAN:</span> <span className="font-mono">{selectedUserForEdit.bankDetails.iban}</span></p>
                           <p className="mt-1"><span className="font-bold">Banca:</span> {selectedUserForEdit.bankDetails.bankName}</p>
                        </div>
                     </div>
                  )}

                  {/* DANGER ZONE */}
                  <div className="border-t border-gray-100 pt-6">
                     <h4 className="font-bold text-red-600 mb-4 text-sm uppercase tracking-wide">Zona Pericolo</h4>
                     <div className="space-y-3">
                        <button 
                           onClick={() => handleUserAction('reset_password')}
                           className="w-full flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                        >
                           <span className="text-sm font-medium text-gray-700">Invia Reset Password</span>
                           <KeyRound className="w-4 h-4 text-gray-400" />
                        </button>
                        
                        {selectedUserForEdit.isSuspended ? (
                           <button 
                              onClick={() => handleUserAction('activate')}
                              className="w-full flex justify-between items-center p-3 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 text-left"
                           >
                              <span className="text-sm font-bold text-green-700">Riattiva Account</span>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                           </button>
                        ) : (
                           <button 
                              onClick={() => handleUserAction('suspend')}
                              className="w-full flex justify-between items-center p-3 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 text-left"
                           >
                              <span className="text-sm font-bold text-red-700">Sospendi Account</span>
                              <Ban className="w-4 h-4 text-red-600" />
                           </button>
                        )}
                     </div>
                  </div>

               </div>
               
               <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
                  <button onClick={() => setSelectedUserForEdit(null)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 shadow-sm">
                     Chiudi
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};
