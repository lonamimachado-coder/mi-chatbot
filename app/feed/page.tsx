'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc,
} from 'firebase/firestore';

interface Business {
  name: string;
  description: string;
  products: Product[];
  faqs: FAQ[];
  iconUrl?: string;
  likes?: number;
  saves?: number;
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

export default function Feed() {
  const [businesses, setBusinesses] = useState<Array<{ id: string; data: Business }>>([]);
  const [user, setUser] = useState<any>(null);
  const [savedBots, setSavedBots] = useState<string[]>([]);
  const [likedBots, setLikedBots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'businesses'));
        const items: Array<{ id: string; data: Business }> = [];
        querySnapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, data: docSnap.data() as Business });
        });
        setBusinesses(items);
      } catch (err) {
        setError('Error cargando el feed.');
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSavedBots(Array.isArray(data?.savedBots) ? data.savedBots : []);
          setLikedBots(Array.isArray(data?.likedBots) ? data.likedBots : []);
        } else {
          setSavedBots([]);
          setLikedBots([]);
        }
      } else {
        setSavedBots([]);
        setLikedBots([]);
      }
      setLoading(false);
    });

    fetchFeed();
    return unsubscribe;
  }, []);

  const toggleSave = async (businessId: string) => {
    if (!user) {
      setError('Inicia sesión para guardar chatbots.');
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const businessRef = doc(db, 'businesses', businessId);
    const isSaved = savedBots.includes(businessId);

    try {
      if (isSaved) {
        await updateDoc(userRef, { savedBots: arrayRemove(businessId) });
        await updateDoc(businessRef, { saves: increment(-1) });
        setSavedBots(savedBots.filter((id) => id !== businessId));
      } else {
        await setDoc(userRef, { savedBots: arrayUnion(businessId) }, { merge: true });
        await updateDoc(businessRef, { saves: increment(1) });
        setSavedBots([...savedBots, businessId]);
      }
    } catch (err) {
      setError('No se pudo actualizar el guardado.');
    }
  };

  const toggleLike = async (businessId: string) => {
    if (!user) {
      setError('Inicia sesión para dar like.');
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const businessRef = doc(db, 'businesses', businessId);
    const isLiked = likedBots.includes(businessId);

    try {
      if (isLiked) {
        await updateDoc(userRef, { likedBots: arrayRemove(businessId) });
        await updateDoc(businessRef, { likes: increment(-1) });
        setLikedBots(likedBots.filter((id) => id !== businessId));
      } else {
        await setDoc(userRef, { likedBots: arrayUnion(businessId) }, { merge: true });
        await updateDoc(businessRef, { likes: increment(1) });
        setLikedBots([...likedBots, businessId]);
      }
    } catch (err) {
      setError('No se pudo actualizar el like.');
    }
  };

  const getCount = (value: number | undefined) => (typeof value === 'number' ? value : 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feed de Chatbots</h1>
            <p className="mt-2 text-gray-600">Explora chatbots de negocios reales. Dale like o guarda tus favoritos.</p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-full border border-blue-600 bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            {user ? 'Ver tu cuenta' : 'Iniciar sesión'}
          </Link>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {businesses.map((business) => (
            <div key={business.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {business.data.iconUrl ? (
                    <img src={business.data.iconUrl} alt="Icono del chatbot" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">🤖</div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{business.data.name}</h2>
                    <p className="text-sm text-gray-500">{business.data.description}</p>
                  </div>
                </div>
                <div className="space-x-2 text-sm text-gray-500">
                  <span>{getCount(business.data.likes)} ❤️</span>
                  <span>{getCount(business.data.saves)} 📌</span>
                </div>
              </div>

              <div className="mb-4 text-sm text-gray-600">
                <p>{business.data.products?.length ?? 0} productos</p>
                <p>{business.data.faqs?.length ?? 0} preguntas frecuentes</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleLike(business.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${likedBots.includes(business.id) ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {likedBots.includes(business.id) ? 'Liked' : 'Like'}
                </button>
                <button
                  onClick={() => toggleSave(business.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${savedBots.includes(business.id) ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {savedBots.includes(business.id) ? 'Guardado' : 'Guardar'}
                </button>
                <Link
                  href={`/chat/${business.id}`}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Ver Chat
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
