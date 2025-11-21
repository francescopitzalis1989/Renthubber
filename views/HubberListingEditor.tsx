
import React, { useState } from 'react';
import { Listing, CancellationPolicyType, ListingCategory } from '../types';
import { 
  Save, ArrowLeft, Camera, Upload, MapPin, DollarSign, 
  FileText, Shield, Plus, X, LayoutGrid, Clock, Users
} from 'lucide-react';

interface HubberListingEditorProps {
  listing: Listing;
  onSave: (updatedListing: Listing) => void;
  onCancel: () => void;
}

type Tab = 'general' | 'media' | 'rules' | 'location';

export const HubberListingEditor: React.FC<HubberListingEditorProps> = ({ listing, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [formData, setFormData] = useState<Listing>({ ...listing });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      onSave(formData);
      setIsSaving(false);
    }, 1000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: string[] = [];
      Array.from(e.target.files).forEach(file => {
        const imageUrl = URL.createObjectURL(file as Blob);
        newImages.push(imageUrl);
      });
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ""] }));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const addRule = () => {
    setFormData(prev => ({ ...prev, rules: [...prev.rules, ""] }));
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...formData.rules];
    newRules[index] = value;
    setFormData(prev => ({ ...prev, rules: newRules }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onCancel} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Modifica Annuncio</h1>
              <p className="text-xs text-gray-500">{formData.title}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg text-sm">
              Annulla
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-lg shadow-md flex items-center text-sm"
            >
              {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
              {!isSaving && <Save className="w-4 h-4 ml-2" />}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto">
          {[
            { id: 'general', label: 'Info & Prezzi', icon: FileText },
            { id: 'media', label: 'Galleria Foto', icon: Camera },
            { id: 'rules', label: 'Regole & Policy', icon: Shield },
            { id: 'location', label: 'Posizione & Dettagli', icon: MapPin },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-brand text-brand' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informazioni Principali</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as ListingCategory})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                  >
                    <option value="oggetto">Oggetto</option>
                    <option value="spazio">Spazio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sottocategoria</label>
                  <input 
                    type="text" 
                    value={formData.subCategory}
                    onChange={e => setFormData({...formData, subCategory: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                  <textarea 
                    rows={5}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Prezzi</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="number" 
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                      className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Per unità</label>
                  <select 
                    value={formData.priceUnit}
                    onChange={e => setFormData({...formData, priceUnit: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                  >
                    <option value="ora">Ora</option>
                    <option value="giorno">Giorno</option>
                    <option value="settimana">Settimana</option>
                    <option value="mese">Mese</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Galleria Fotografica</h3>
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                   <Upload className="w-4 h-4 mr-2" /> Carica Foto
                   <input type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*" />
                </label>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((img, idx) => (
                   <div key={idx} className="relative aspect-square group rounded-xl overflow-hidden border border-gray-200">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">Copertina</div>}
                   </div>
                ))}
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 cursor-pointer transition-all">
                   <Plus className="w-8 h-8 mb-2" />
                   <span className="text-xs font-bold">Aggiungi</span>
                   <input type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*" />
                </label>
             </div>
             <p className="text-xs text-gray-500">Trascina le foto per riordinarle (funzione in arrivo).</p>
          </div>
        )}

        {/* RULES TAB */}
        {activeTab === 'rules' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
               <h3 className="text-lg font-bold text-gray-900">Cosa troverai (Dotazioni)</h3>
               <div className="space-y-3">
                  {formData.features.map((feat, i) => (
                     <div key={i} className="flex gap-2">
                        <input 
                          type="text" 
                          value={feat}
                          onChange={(e) => updateFeature(i, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                          placeholder="Es. WiFi, Parcheggio..."
                        />
                        <button onClick={() => removeFeature(i)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                           <X className="w-5 h-5" />
                        </button>
                     </div>
                  ))}
                  <button onClick={addFeature} className="text-brand font-bold text-sm flex items-center mt-2">
                     <Plus className="w-4 h-4 mr-1" /> Aggiungi dotazione
                  </button>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
               <h3 className="text-lg font-bold text-gray-900">Regole dell'Host</h3>
               <div className="space-y-3">
                  {formData.rules.map((rule, i) => (
                     <div key={i} className="flex gap-2">
                        <input 
                          type="text" 
                          value={rule}
                          onChange={(e) => updateRule(i, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                          placeholder="Es. Vietato fumare..."
                        />
                        <button onClick={() => removeRule(i)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                           <X className="w-5 h-5" />
                        </button>
                     </div>
                  ))}
                  <button onClick={addRule} className="text-brand font-bold text-sm flex items-center mt-2">
                     <Plus className="w-4 h-4 mr-1" /> Aggiungi regola
                  </button>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
               <h3 className="text-lg font-bold text-gray-900">Politiche</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Cancellazione</label>
                     <select 
                       value={formData.cancellationPolicy}
                       onChange={(e) => setFormData({...formData, cancellationPolicy: e.target.value as CancellationPolicyType})}
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                     >
                        <option value="flexible">Flessibile (24h)</option>
                        <option value="moderate">Moderata (5gg)</option>
                        <option value="strict">Rigida (7gg)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Cauzione (€)</label>
                     <input 
                       type="number" 
                       value={formData.deposit || ''}
                       onChange={(e) => setFormData({...formData, deposit: parseFloat(e.target.value)})}
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                       placeholder="0"
                     />
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* LOCATION & DETAILS TAB */}
        {activeTab === 'location' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                 <h3 className="text-lg font-bold text-gray-900">Posizione</h3>
                 <div className="grid grid-cols-1 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo Completo</label>
                       <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" 
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                            className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione Zona / Quartiere</label>
                       <textarea 
                          rows={3}
                          value={formData.zoneDescription || ''}
                          onChange={(e) => setFormData({...formData, zoneDescription: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                          placeholder="Descrivi i dintorni, i parcheggi, i mezzi pubblici..."
                       />
                    </div>
                 </div>
              </div>

              {/* Extra Details based on Category */}
              {formData.category === 'spazio' && (
                 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Dettagli Spazio</h3>
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ospiti Massimi</label>
                          <div className="relative">
                             <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                             <input 
                               type="number" 
                               value={formData.maxGuests || ''}
                               onChange={(e) => setFormData({...formData, maxGuests: parseInt(e.target.value)})}
                               className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                             />
                          </div>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Orari Apertura</label>
                          <div className="relative">
                             <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                             <input 
                               type="text" 
                               value={formData.openingHours || ''}
                               onChange={(e) => setFormData({...formData, openingHours: e.target.value})}
                               className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                               placeholder="Es. 09:00 - 18:00"
                             />
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                 <h3 className="text-lg font-bold text-gray-900">Badge Manuali</h3>
                 <p className="text-xs text-gray-500 mb-2">Seleziona badge speciali per evidenziare il tuo annuncio.</p>
                 <div className="flex gap-3">
                    {['Offerta', 'Last Minute', 'Premium', 'Novità'].map(badge => (
                       <button
                          key={badge}
                          onClick={() => {
                             const badges = formData.manualBadges || [];
                             if (badges.includes(badge)) {
                                setFormData({...formData, manualBadges: badges.filter(b => b !== badge)});
                             } else {
                                setFormData({...formData, manualBadges: [...badges, badge]});
                             }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                             formData.manualBadges?.includes(badge) 
                                ? 'bg-brand text-white border-brand' 
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                       >
                          {badge}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};
