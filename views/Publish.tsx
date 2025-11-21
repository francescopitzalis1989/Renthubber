
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, LayoutGrid, Sparkles, Upload, DollarSign, MapPin, 
  ChevronRight, ChevronLeft, Save, CheckCircle2, AlertCircle,
  Shield, Clock, Zap, FileText, X, Plus, Loader2
} from 'lucide-react';
import { generateListingDescription, suggestPrice } from '../services/geminiService';
import { ListingDraft, ListingCategory, Condition, CancellationPolicyType, Listing, User } from '../types';

// --- WIZARD STEPS CONSTANTS ---
const STEPS = [
  { id: 1, title: 'Categoria', icon: Box },
  { id: 2, title: 'Info Base', icon: FileText },
  { id: 3, title: 'Dettagli', icon: Zap },
  { id: 4, title: 'Prezzi & Regole', icon: DollarSign },
  { id: 5, title: 'Media', icon: Upload },
  { id: 6, title: 'Riepilogo', icon: CheckCircle2 },
];

interface PublishProps {
  onPublish: (listing: Listing) => void;
  currentUser: User;
}

export const Publish: React.FC<PublishProps> = ({ onPublish, currentUser }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DRAFT STATE ---
  const [draft, setDraft] = useState<ListingDraft>({
    step: 1,
    category: 'oggetto',
    title: '',
    subCategory: '',
    description: '',
    features: '',
    brand: '',
    model: '',
    condition: 'nuovo' as Condition,
    sqm: '',
    capacity: '',
    price: '',
    priceUnit: 'giorno',
    deposit: '',
    cancellationPolicy: 'flexible',
    location: '',
    images: []
  });

  // --- AUTOSAVE SIMULATION ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 5000);
    return () => clearTimeout(timer);
  }, [draft]);

  // --- COMPLETENESS CALCULATOR ---
  useEffect(() => {
    let score = 0;
    // Weights
    if (draft.title.length > 5) score += 10;
    if (draft.description.length > 50) score += 15;
    if (draft.price) score += 10;
    if (draft.location) score += 10; // Note: location input not explicitly in step 4 UI yet, assuming manual entry or future geo
    if (draft.images.length >= 1) score += 15;
    if (draft.images.length >= 3) score += 10;
    if (draft.cancellationPolicy) score += 10;
    
    if (draft.category === 'oggetto') {
       if (draft.brand) score += 10;
       if (draft.features.length > 5) score += 10;
    } else {
       if (draft.sqm) score += 10;
       if (draft.capacity) score += 10;
    }

    setCompleteness(Math.min(score, 100));
  }, [draft]);

  // --- HANDLERS ---
  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleAiGenerate = async () => {
    if (!draft.title) {
      alert("Inserisci almeno il titolo per generare la descrizione.");
      return;
    }
    setIsGenerating(true);
    
    // Context for AI
    const context = draft.category === 'oggetto' 
      ? `Marca: ${draft.brand}, Modello: ${draft.model}, Condizioni: ${draft.condition}`
      : `Mq: ${draft.sqm}, Capienza: ${draft.capacity}`;

    const descPromise = generateListingDescription(draft.title, `${draft.features}. ${context}`, draft.category);
    const pricePromise = suggestPrice(draft.title, draft.category);

    const [descResult, priceResult] = await Promise.all([descPromise, pricePromise]);

    setDraft(prev => ({
      ...prev,
      description: descResult,
      price: (!prev.price && priceResult) ? priceResult : prev.price
    }));
    setIsGenerating(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: string[] = [];
      Array.from(e.target.files).forEach(file => {
        // Fix: Cast file to Blob to resolve type error
        const imageUrl = URL.createObjectURL(file as Blob);
        newImages.push(imageUrl);
      });
      
      setDraft(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
  };

  const removeImage = (index: number) => {
     setDraft(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
     }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePublish = async () => {
    if (completeness < 70) return;
    
    setIsPublishing(true);
    // Simulate API Delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newListing: Listing = {
        id: `listing-${Date.now()}`,
        title: draft.title,
        category: draft.category,
        subCategory: draft.subCategory,
        description: draft.description,
        price: parseFloat(draft.price) || 0,
        priceUnit: draft.priceUnit as 'ora' | 'giorno' | 'settimana' | 'mese',
        images: draft.images,
        location: draft.location,
        coordinates: { lat: 45.4642, lng: 9.1900 }, // Default coords
        rating: 0,
        reviewCount: 0,
        reviews: [],
        owner: currentUser,
        features: draft.features.split(',').map(s => s.trim()).filter(s => s),
        rules: [],
        deposit: parseFloat(draft.deposit) || 0,
        status: 'published',
        cancellationPolicy: draft.cancellationPolicy,
        techSpecs: draft.category === 'oggetto' ? {
            brand: draft.brand,
            model: draft.model,
            condition: draft.condition
        } : undefined,
        spaceSpecs: draft.category === 'spazio' ? {
            sqm: parseFloat(draft.sqm) || 0,
            capacity: parseInt(draft.capacity) || 0
        } : undefined
    };

    setIsPublishing(false);
    
    // Call parent callback
    onPublish(newListing);
  };

  // --- RENDER STEPS ---

  // STEP 1: CATEGORY
  const renderStepCategory = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-2xl font-bold text-gray-900">Cosa vuoi noleggiare?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setDraft(d => ({ ...d, category: 'oggetto' }))}
          className={`p-8 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
            draft.category === 'oggetto' 
              ? 'border-brand bg-brand/5 ring-2 ring-brand/20' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${draft.category === 'oggetto' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>
            <Box className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Un Oggetto</h3>
          <p className="text-sm text-gray-500 mt-2">Trapani, droni, bici, elettronica, attrezzi...</p>
        </button>

        <button
          onClick={() => setDraft(d => ({ ...d, category: 'spazio' }))}
          className={`p-8 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
            draft.category === 'spazio' 
              ? 'border-brand bg-brand/5 ring-2 ring-brand/20' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${draft.category === 'spazio' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>
            <LayoutGrid className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Uno Spazio</h3>
          <p className="text-sm text-gray-500 mt-2">Garage, uffici, studi, magazzini, sale eventi...</p>
        </button>
      </div>
    </div>
  );

  // STEP 2: INFO BASE
  const renderStepInfo = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Annuncio *</label>
        <input 
          type="text" 
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent"
          placeholder={draft.category === 'oggetto' ? "Es. Sony Alpha 7 III + Obiettivo" : "Es. Loft Industriale per Eventi"}
          value={draft.title}
          onChange={(e) => setDraft({...draft, title: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sottocategoria</label>
        <select 
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent bg-white"
          value={draft.subCategory}
          onChange={(e) => setDraft({...draft, subCategory: e.target.value})}
        >
          <option value="">Seleziona...</option>
          {draft.category === 'oggetto' ? (
            <>
              <option value="elettronica">Elettronica & Foto</option>
              <option value="fai-da-te">Fai da te & Attrezzi</option>
              <option value="sport">Sport & Tempo Libero</option>
            </>
          ) : (
            <>
              <option value="eventi">Eventi & Feste</option>
              <option value="ufficio">Ufficio & Coworking</option>
              <option value="magazzino">Magazzino & Box</option>
            </>
          )}
        </select>
      </div>

      {/* AI SECTION */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 relative">
         <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-bold text-indigo-900">Descrizione</label>
            <button 
              onClick={handleAiGenerate}
              disabled={isGenerating || !draft.title}
              className="flex items-center bg-white text-indigo-600 text-xs font-bold py-2 px-4 rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 mr-2" />
              {isGenerating ? 'Scrivendo...' : 'Genera con AI'}
            </button>
         </div>
         <textarea 
           className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent min-h-[150px] text-sm"
           placeholder="Descrivi il tuo oggetto, i punti di forza e perché noleggiarlo..."
           value={draft.description}
           onChange={(e) => setDraft({...draft, description: e.target.value})}
         />
      </div>
    </div>
  );

  // STEP 3: DETTAGLI TECNICI
  const renderStepDetails = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-xl font-bold text-gray-900">Specifiche Tecniche</h2>
      
      {draft.category === 'oggetto' ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300"
                placeholder="Es. Bosch"
                value={draft.brand}
                onChange={(e) => setDraft({...draft, brand: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modello</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300"
                placeholder="Es. GSB 18V-55"
                value={draft.model}
                onChange={(e) => setDraft({...draft, model: e.target.value})}
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Condizioni Oggetto</label>
             <div className="grid grid-cols-3 gap-3">
                {(['nuovo', 'come_nuovo', 'buono', 'usato', 'molto_usato'] as Condition[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setDraft({...draft, condition: c})}
                    className={`py-2 px-3 rounded-lg border text-sm capitalize ${
                      draft.condition === c ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {c.replace('_', ' ')}
                  </button>
                ))}
             </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Superficie (m²)</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300"
                placeholder="50"
                value={draft.sqm}
                onChange={(e) => setDraft({...draft, sqm: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capienza max (persone)</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300"
                placeholder="20"
                value={draft.capacity}
                onChange={(e) => setDraft({...draft, capacity: e.target.value})}
              />
            </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Caratteristiche & Dotazioni</label>
        <input 
          type="text" 
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder={draft.category === 'oggetto' ? "Es. Batteria extra, Valigetta, Punte..." : "Es. WiFi, Bagno, Proiettore..."}
          value={draft.features}
          onChange={(e) => setDraft({...draft, features: e.target.value})}
        />
        <p className="text-xs text-gray-400 mt-1">Separa le caratteristiche con una virgola</p>
      </div>
    </div>
  );

  // STEP 4: PREZZI & POLICY
  const renderStepPricing = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      
      {/* Price Input */}
      <div className="grid grid-cols-2 gap-6">
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
            <div className="relative">
               <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold">€</span>
               <input 
                 type="number" 
                 className="w-full pl-8 px-4 py-3 rounded-xl border border-gray-300 font-bold text-lg"
                 placeholder="0.00"
                 value={draft.price}
                 onChange={(e) => setDraft({...draft, price: e.target.value})}
               />
            </div>
         </div>
         <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Unità</label>
             <select 
               className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white"
               value={draft.priceUnit}
               onChange={(e) => setDraft({...draft, priceUnit: e.target.value as any})}
             >
               <option value="giorno">Per Giorno</option>
               <option value="ora">Per Ora</option>
             </select>
         </div>
      </div>

      {/* Deposit */}
      <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">Cauzione Richiesta (€)</label>
         <input 
           type="number" 
           className="w-full px-4 py-3 rounded-xl border border-gray-300"
           placeholder="Opzionale (es. 100)"
           value={draft.deposit}
           onChange={(e) => setDraft({...draft, deposit: e.target.value})}
         />
         <p className="text-xs text-gray-400 mt-1">Verrà bloccata sulla carta del Renter e sbloccata a fine noleggio.</p>
      </div>
      
      {/* Location (Simplified for this step) */}
      <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">Città / Zona</label>
         <input 
           type="text" 
           className="w-full px-4 py-3 rounded-xl border border-gray-300"
           placeholder="Es. Milano, Zona Isola"
           value={draft.location}
           onChange={(e) => setDraft({...draft, location: e.target.value})}
         />
      </div>

      {/* Cancellation Policy */}
      <div>
         <label className="block text-sm font-bold text-gray-900 mb-3">Politica di Cancellazione</label>
         <div className="space-y-3">
            {[
              { 
                id: 'flexible', 
                label: 'Flessibile', 
                desc: 'Rimborso 100% fino a 24h prima.', 
                color: 'green' 
              },
              { 
                id: 'moderate', 
                label: 'Moderata', 
                desc: 'Rimborso 100% fino a 5gg prima.', 
                color: 'yellow' 
              },
              { 
                id: 'strict', 
                label: 'Rigida', 
                desc: 'Rimborso 50% fino a 7gg prima.', 
                color: 'red' 
              }
            ].map((policy) => (
              <div 
                key={policy.id}
                onClick={() => setDraft({...draft, cancellationPolicy: policy.id as CancellationPolicyType})}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  draft.cancellationPolicy === policy.id 
                    ? 'border-brand bg-brand/5' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div>
                   <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 bg-${policy.color}-500`}></span>
                      <h4 className="font-bold text-gray-900">{policy.label}</h4>
                   </div>
                   <p className="text-sm text-gray-500 mt-1 pl-4">{policy.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                   draft.cancellationPolicy === policy.id ? 'border-brand' : 'border-gray-300'
                }`}>
                   {draft.cancellationPolicy === policy.id && <div className="w-2.5 h-2.5 bg-brand rounded-full"></div>}
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );

  // STEP 5: MEDIA
  const renderStepMedia = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        multiple 
        accept="image/*"
        onChange={handleImageUpload} 
      />

      <div 
        onClick={triggerFileInput}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer"
      >
         <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
         <h3 className="text-lg font-bold text-gray-900">Trascina qui le tue foto</h3>
         <p className="text-gray-500 text-sm mb-4">o clicca per caricare dal dispositivo</p>
         <button type="button" className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm hover:bg-gray-50">
            Seleziona File
         </button>
      </div>

      {draft.images.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
           {draft.images.map((img, idx) => (
             <div key={idx} className="relative aspect-square bg-gray-100 rounded-xl border border-gray-200 overflow-hidden group">
                <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                <button 
                   onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                   className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                   <X className="w-4 h-4" />
                </button>
                {idx === 0 && (
                  <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-xs font-medium text-center py-1.5">
                    Copertina
                  </div>
                )}
             </div>
           ))}
           <div 
             onClick={triggerFileInput}
             className="aspect-square bg-gray-50 rounded-xl border border-gray-200 border-dashed flex items-center justify-center text-gray-300 cursor-pointer hover:bg-gray-100 hover:text-brand hover:border-brand/30 transition-all"
           >
              <Plus className="w-8 h-8" />
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 opacity-40 pointer-events-none grayscale">
           <div className="aspect-square bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
              Copertina
           </div>
           <div className="aspect-square bg-gray-50 rounded-xl border border-gray-200 border-dashed flex items-center justify-center text-gray-300">
              +
           </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-xl flex items-start">
         <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
         <div>
            <h4 className="text-sm font-bold text-blue-900">Foto di qualità = Più guadagni</h4>
            <p className="text-xs text-blue-700 mt-1">
               Gli annunci con almeno 3 foto chiare ricevono il 40% in più di prenotazioni.
            </p>
         </div>
      </div>
    </div>
  );

  // STEP 6: SUMMARY
  const renderStepSummary = () => (
     <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
        
        {/* Completeness Score */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white">
           <div className="flex justify-between items-end mb-2">
              <h3 className="font-bold text-lg">Qualità Annuncio</h3>
              <span className={`text-2xl font-bold ${completeness >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                 {completeness}%
              </span>
           </div>
           <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div 
                 className={`h-full transition-all duration-1000 ${completeness >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                 style={{ width: `${completeness}%` }}
              ></div>
           </div>
           {completeness < 70 && (
             <div className="flex items-start text-sm text-gray-300 bg-white/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 text-yellow-400" />
                <p>Aggiungi altre foto, una descrizione completa e la città per pubblicare.</p>
             </div>
           )}
        </div>

        {/* Preview Card (Mini) */}
        <div className="border border-gray-200 rounded-2xl p-4 flex bg-white shadow-sm">
           {draft.images.length > 0 ? (
              <img src={draft.images[0]} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" alt="cover" />
           ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
           )}
           <div className="ml-4 flex-1">
              <div className="flex justify-between">
                 <h4 className="font-bold text-gray-900">{draft.title || 'Titolo Annuncio'}</h4>
                 <span className="text-brand font-bold">€{draft.price || '--'}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{draft.description || 'Nessuna descrizione...'}</p>
              <div className="mt-3 flex gap-2">
                 <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 capitalize">{draft.category}</span>
                 <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{draft.cancellationPolicy}</span>
              </div>
           </div>
        </div>

     </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* TOP BAR (Wizard Nav) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
         <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="font-bold text-gray-900 flex items-center">
               <Box className="w-5 h-5 mr-2 text-brand" /> Nuova Inserzione
            </h1>
            <div className="flex items-center text-xs text-gray-400">
               {autoSaved && <span className="flex items-center mr-4 text-green-600"><Save className="w-3 h-3 mr-1" /> Salvato</span>}
               <span>Step {currentStep} di {STEPS.length}</span>
            </div>
         </div>
         {/* Progress Line */}
         <div className="h-1 bg-gray-100 w-full">
            <div className="h-full bg-brand transition-all duration-500" style={{ width: `${(currentStep / STEPS.length) * 100}%` }}></div>
         </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
         
         {/* SIDEBAR (Desktop Steps) */}
         <div className="hidden lg:block lg:col-span-3 space-y-2">
            {STEPS.map((step) => (
               <div 
                 key={step.id}
                 className={`flex items-center p-3 rounded-xl transition-colors ${
                    currentStep === step.id 
                      ? 'bg-brand text-white shadow-md' 
                      : currentStep > step.id 
                        ? 'text-brand font-medium' 
                        : 'text-gray-400'
                 }`}
               >
                  <step.icon className={`w-5 h-5 mr-3 ${currentStep === step.id ? 'text-brand-accent' : ''}`} />
                  <span className="text-sm font-medium">{step.title}</span>
                  {currentStep > step.id && <CheckCircle2 className="w-4 h-4 ml-auto" />}
               </div>
            ))}
         </div>

         {/* MAIN FORM CONTENT */}
         <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px] flex flex-col">
               
               <div className="flex-1">
                  {currentStep === 1 && renderStepCategory()}
                  {currentStep === 2 && renderStepInfo()}
                  {currentStep === 3 && renderStepDetails()}
                  {currentStep === 4 && renderStepPricing()}
                  {currentStep === 5 && renderStepMedia()}
                  {currentStep === 6 && renderStepSummary()}
               </div>

               {/* BOTTOM ACTIONS */}
               <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
                  <button 
                    onClick={handleBack}
                    disabled={currentStep === 1 || isPublishing}
                    className="px-6 py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-30 flex items-center"
                  >
                     <ChevronLeft className="w-5 h-5 mr-1" /> Indietro
                  </button>

                  {currentStep < STEPS.length ? (
                     <button 
                       onClick={handleNext}
                       className="px-8 py-3 rounded-xl bg-brand text-white font-bold hover:bg-brand-dark shadow-lg hover:shadow-xl transition-all flex items-center"
                     >
                        Continua <ChevronRight className="w-5 h-5 ml-1" />
                     </button>
                  ) : (
                     <button 
                        onClick={handlePublish}
                        className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center ${
                           completeness >= 70 && !isPublishing
                             ? 'bg-brand-accent text-brand-dark hover:bg-amber-400' 
                             : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={completeness < 70 || isPublishing}
                     >
                        {isPublishing ? (
                           <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Pubblicazione...
                           </>
                        ) : (
                           'Pubblica Annuncio'
                        )}
                     </button>
                  )}
               </div>

            </div>
         </div>

      </div>
    </div>
  );
};
