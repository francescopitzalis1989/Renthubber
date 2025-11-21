import React, { useState } from 'react';
import { MOCK_CONTACTS } from '../constants';
import { Send, MoreVertical, Phone } from 'lucide-react';

export const Messages: React.FC = () => {
  const [activeChatId, setActiveChatId] = useState(MOCK_CONTACTS[0].id);
  const activeContact = MOCK_CONTACTS.find(c => c.id === activeChatId) || MOCK_CONTACTS[0];

  return (
    <div className="h-[calc(100vh-64px)] bg-white flex overflow-hidden">
      {/* Sidebar Contacts */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Messaggi</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {MOCK_CONTACTS.map((contact) => (
            <div 
              key={contact.id}
              onClick={() => setActiveChatId(contact.id)}
              className={`flex items-center p-4 cursor-pointer transition-colors hover:bg-gray-50 ${activeChatId === contact.id ? 'bg-brand/5 border-l-4 border-brand' : ''}`}
            >
              <div className="relative">
                <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
                {contact.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                    {contact.unreadCount}
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className="font-semibold text-gray-900 text-sm">{contact.name}</h4>
                  <span className="text-xs text-gray-400">{contact.lastMessageTime}</span>
                </div>
                <p className={`text-sm truncate ${contact.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                  {contact.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col bg-gray-50">
        {/* Chat Header */}
        <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
           <div className="flex items-center">
              <img src={activeContact.avatar} alt={activeContact.name} className="w-10 h-10 rounded-full mr-3" />
              <div>
                 <h3 className="font-bold text-gray-900">{activeContact.name}</h3>
                 <span className="text-xs text-green-500 flex items-center">● Online ora</span>
              </div>
           </div>
           <div className="flex space-x-4 text-gray-500">
              <Phone className="w-5 h-5 cursor-pointer hover:text-brand" />
              <MoreVertical className="w-5 h-5 cursor-pointer hover:text-brand" />
           </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
           {/* Mock Chat Bubble - Received */}
           <div className="flex items-end">
              <img src={activeContact.avatar} className="w-8 h-8 rounded-full mb-1 mr-2" alt="avatar" />
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm max-w-md">
                 <p className="text-sm text-gray-800">Ciao! Ho visto il tuo annuncio per il trapano Bosch. È disponibile per questo weekend?</p>
                 <span className="text-[10px] text-gray-400 block text-right mt-1">10:30</span>
              </div>
           </div>

           {/* Mock Chat Bubble - Sent */}
           <div className="flex items-end justify-end">
              <div className="bg-brand text-white rounded-2xl rounded-br-none px-4 py-2 shadow-md max-w-md">
                 <p className="text-sm">Ciao {activeContact.name}! Sì, è disponibile. Ti serve anche il set di punte extra?</p>
                 <span className="text-[10px] text-brand-light block text-right mt-1">10:32</span>
              </div>
           </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
           <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <input 
                type="text" 
                placeholder="Scrivi un messaggio..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
              />
              <button className="bg-brand text-white p-2 rounded-full hover:bg-brand-dark transition-colors">
                 <Send className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};