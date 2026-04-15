'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Business {
  name: string;
  description: string;
  products: Product[];
  faqs: FAQ[];
  privateInfo?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

function getChatbotName(businessName?: string) {
  const cleanName = businessName?.trim();
  return cleanName ? `${cleanName} ChatBot` : 'Mi ChatBot';
}

export default function Chat() {
  const { id } = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (id) {
        const docRef = doc(db, 'businesses', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const businessData = docSnap.data() as Business;
          setBusiness(businessData);
          setMessages([]);
        }
      }
      setLoading(false);
    };
    fetchBusiness();
  }, [id]);

  const sendMessage = async () => {
    if (!input.trim() || !business) return;
    const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, business }),
      });

      const data = await response.json();
      const botResponse = typeof data?.text === 'string' ? data.text.trim() : '';

      if (botResponse) {
        const botMessage: Message = { id: (Date.now() + 1).toString(), text: botResponse, sender: 'bot' };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch {
      return;
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!business) return <div>Negocio no encontrado.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow p-4">
        <div>
          <h1 className="text-xl font-bold">{getChatbotName(business.name)}</h1>
          <p>{business.description}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 border-t">
        <div className="max-w-2xl mx-auto flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe tu mensaje..."
            className="flex-1 rounded-l border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={sendMessage} className="rounded-r bg-blue-500 px-6 py-2 text-white hover:bg-blue-600">
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
