'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface Business {
  name: string;
  description: string;
  products: Product[];
  faqs: FAQ[];
  privateInfo?: string;
  isPrivate?: boolean;
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

const emptyBusiness: Business = {
  name: '',
  description: '',
  products: [],
  faqs: [],
  privateInfo: '',
  isPrivate: false,
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business>(emptyBusiness);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Product>({ id: '', name: '', description: '', price: 0 });
  const [newFaq, setNewFaq] = useState<FAQ>({ id: '', question: '', answer: '' });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, 'businesses', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBusiness({ ...emptyBusiness, ...(docSnap.data() as Business) });
        } else {
          setBusiness(emptyBusiness);
        }
      } else {
        router.push('/auth/login');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [router]);

  const saveBusiness = async () => {
    if (!user) return;

    try {
      setSaving(true);
      await setDoc(doc(db, 'businesses', user.uid), business, { merge: true });
      alert('Guardado correctamente');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Completa los campos del producto');
      return;
    }

    const product = { ...newProduct, id: Date.now().toString() };
    setBusiness((prev) => ({ ...prev, products: [...prev.products, product] }));
    setNewProduct({ id: '', name: '', description: '', price: 0 });
    setShowProductForm(false);
  };

  const deleteProduct = (id: string) => {
    setBusiness((prev) => ({ ...prev, products: prev.products.filter((product) => product.id !== id) }));
  };

  const addFaq = () => {
    if (!newFaq.question || !newFaq.answer) {
      alert('Completa los campos de la pregunta y respuesta');
      return;
    }

    const faq = { ...newFaq, id: Date.now().toString() };
    setBusiness((prev) => ({ ...prev, faqs: [...prev.faqs, faq] }));
    setNewFaq({ id: '', question: '', answer: '' });
    setShowFaqForm(false);
  };

  const deleteFaq = (id: string) => {
    setBusiness((prev) => ({ ...prev, faqs: prev.faqs.filter((faq) => faq.id !== id) }));
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/feed"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Ver Feed
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Información del Negocio</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del negocio</label>
              <input
                type="text"
                value={business.name}
                onChange={(e) => setBusiness((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                value={business.description}
                onChange={(e) => setBusiness((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                rows={4}
              />
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
              <input
                type="checkbox"
                checked={Boolean(business.isPrivate)}
                onChange={(e) => setBusiness((prev) => ({ ...prev, isPrivate: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">Chatbot privado</span>
                <span className="block text-sm text-gray-600">
                  Si activás esto, tu chatbot no aparece en el feed público.
                </span>
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notas privadas para el chatbot</label>
              <textarea
                value={business.privateInfo || ''}
                onChange={(e) => setBusiness((prev) => ({ ...prev, privateInfo: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                rows={3}
                placeholder="Información que solo usa el chatbot internamente para responder mejor"
              />
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Productos</h2>

          {business.products.length > 0 && (
            <div className="mb-4">
              <ul className="space-y-2">
                {business.products.map((product) => (
                  <li key={product.id} className="flex items-center justify-between rounded bg-gray-100 p-3">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.description}</p>
                      <p className="text-sm font-bold">Precio: ${product.price}</p>
                    </div>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showProductForm ? (
            <div className="mb-4 space-y-3 rounded bg-gray-50 p-4">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <textarea
                placeholder="Descripción"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <input
                type="number"
                placeholder="Precio"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <div className="flex gap-2">
                <button onClick={addProduct} className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                  Guardar Producto
                </button>
                <button
                  onClick={() => setShowProductForm(false)}
                  className="rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowProductForm(true)} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Agregar Producto
            </button>
          )}
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Preguntas Frecuentes</h2>

          {business.faqs.length > 0 && (
            <div className="mb-4">
              <ul className="space-y-2">
                {business.faqs.map((faq) => (
                  <li key={faq.id} className="flex items-start justify-between rounded bg-gray-100 p-3">
                    <div className="flex-1">
                      <p className="font-semibold">{faq.question}</p>
                      <p className="text-sm text-gray-600">{faq.answer}</p>
                    </div>
                    <button
                      onClick={() => deleteFaq(faq.id)}
                      className="ml-2 rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showFaqForm ? (
            <div className="mb-4 space-y-3 rounded bg-gray-50 p-4">
              <input
                type="text"
                placeholder="Pregunta"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <textarea
                placeholder="Respuesta"
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <div className="flex gap-2">
                <button onClick={addFaq} className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                  Guardar FAQ
                </button>
                <button
                  onClick={() => setShowFaqForm(false)}
                  className="rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowFaqForm(true)} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Agregar FAQ
            </button>
          )}
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Enlace del Chatbot</h2>
          <p className="text-gray-600">Comparte este enlace con tus clientes:</p>
          <code className="mt-2 block break-all rounded bg-gray-100 p-3 text-sm">
            {typeof window !== 'undefined' ? `${window.location.origin}/chat/${user?.uid}` : `https://tuapp.com/chat/${user?.uid}`}
          </code>
          <button
            onClick={() => {
              const url = typeof window !== 'undefined' ? `${window.location.origin}/chat/${user?.uid}` : '';
              navigator.clipboard.writeText(url);
              alert('Enlace copiado al portapapeles');
            }}
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Copiar Enlace
          </button>
        </div>

        <button
          onClick={saveBusiness}
          disabled={saving}
          className="w-full rounded bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
