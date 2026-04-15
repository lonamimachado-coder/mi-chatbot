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
          setBusiness(docSnap.data() as Business);
          setMessages([{ id: '1', text: `¡Hola! Soy el chatbot de ${docSnap.data().name}. ¿En qué puedo ayudarte?`, sender: 'bot' }]);
        }
      }
      setLoading(false);
    };
    fetchBusiness();
  }, [id]);

  const sendMessage = async () => {
    if (!input.trim() || !business) return;
    const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, business }),
      });

      const data = await response.json();
      const botResponse = data?.text || 'Lo siento, hubo un error al procesar la respuesta.';
      const botMessage: Message = { id: (Date.now() + 1).toString(), text: botResponse, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, no pude conectar con el servicio de IA.',
        sender: 'bot',
      };
      setMessages(prev => [...prev, botMessage]);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!business) return <div>Negocio no encontrado.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-bold">{business.name}</h1>
        <p>{business.description}</p>
      </header>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
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
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe tu mensaje..."
            className="flex-1 border rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={sendMessage} className="bg-blue-500 text-white px-6 py-2 rounded-r hover:bg-blue-600">
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}