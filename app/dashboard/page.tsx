'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';

interface Business {
  name: string;
  description: string;
  products: Product[];
  faqs: FAQ[];
  iconUrl?: string;
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

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business>({ name: '', description: '', products: [], faqs: [] });
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Product>({ id: '', name: '', description: '', price: 0 });
  const [newFaq, setNewFaq] = useState<FAQ>({ id: '', question: '', answer: '' });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const docRef = doc(db, 'businesses', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBusiness(docSnap.data() as Business);
        } else {
          setBusiness({ name: '', description: '', products: [], faqs: [] });
        }
      } else {
        router.push('/auth/login');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [router]);

  const saveBusiness = async () => {
    if (user) {
      await setDoc(doc(db, 'businesses', user.uid), business, { merge: true });
      alert('Guardado correctamente');
    }
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Completa los campos del producto');
      return;
    }
    const product = { ...newProduct, id: Date.now().toString() };
    setBusiness({ ...business, products: [...business.products, product] });
    setNewProduct({ id: '', name: '', description: '', price: 0 });
    setShowProductForm(false);
  };

  const deleteProduct = (id: string) => {
    setBusiness({ ...business, products: business.products.filter(p => p.id !== id) });
  };

  const addFaq = () => {
    if (!newFaq.question || !newFaq.answer) {
      alert('Completa los campos de la pregunta y respuesta');
      return;
    }
    const faq = { ...newFaq, id: Date.now().toString() };
    setBusiness({ ...business, faqs: [...business.faqs, faq] });
    setNewFaq({ id: '', question: '', answer: '' });
    setShowFaqForm(false);
  };

  const deleteFaq = (id: string) => {
    setBusiness({ ...business, faqs: business.faqs.filter(f => f.id !== id) });
  };

  const uploadIcon = async () => {
    if (!user || !iconFile) {
      alert('Selecciona un archivo de imagen antes de subir.');
      return;
    }

    try {
      setUploadingIcon(true);
      const storageRef = ref(storage, `business-icons/${user.uid}/${iconFile.name}`);
      await uploadBytes(storageRef, iconFile);
      const url = await getDownloadURL(storageRef);
      setBusiness({ ...business, iconUrl: url });
      setIconFile(null);
      alert('Icono subido correctamente.');
    } catch (error) {
      console.error(error);
      alert('No se pudo subir el icono.');
    } finally {
      setUploadingIcon(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Panel de Control</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Información del Negocio</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Negocio</label>
              <input
                type="text"
                value={business.name}
                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                value={business.description}
                onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Icono del Chatbot</label>
              {business.iconUrl && (
                <img src={business.iconUrl} alt="Icono del chatbot" className="h-24 w-24 rounded-full object-cover mb-3" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={uploadIcon}
                disabled={uploadingIcon}
                className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {uploadingIcon ? 'Subiendo...' : 'Subir icono'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notas privadas para el chatbot</label>
              <textarea
                value={business.privateInfo || ''}
                onChange={(e) => setBusiness({ ...business, privateInfo: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Información que solo usa el chatbot internamente para responder mejor"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Productos</h2>
          
          {business.products.length > 0 && (
            <div className="mb-4">
              <ul className="space-y-2">
                {business.products.map(product => (
                  <li key={product.id} className="flex justify-between items-center p-3 bg-gray-100 rounded">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.description}</p>
                      <p className="text-sm font-bold">Precio: ${product.price}</p>
                    </div>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showProductForm ? (
            <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <textarea
                placeholder="Descripción"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="number"
                placeholder="Precio"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="flex gap-2">
                <button
                  onClick={addProduct}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Guardar Producto
                </button>
                <button
                  onClick={() => setShowProductForm(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowProductForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Agregar Producto
            </button>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Preguntas Frecuentes</h2>
          
          {business.faqs.length > 0 && (
            <div className="mb-4">
              <ul className="space-y-2">
                {business.faqs.map(faq => (
                  <li key={faq.id} className="flex justify-between items-start p-3 bg-gray-100 rounded">
                    <div className="flex-1">
                      <p className="font-semibold">{faq.question}</p>
                      <p className="text-sm text-gray-600">{faq.answer}</p>
                    </div>
                    <button
                      onClick={() => deleteFaq(faq.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 ml-2"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showFaqForm ? (
            <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
              <input
                type="text"
                placeholder="Pregunta"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <textarea
                placeholder="Respuesta"
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="flex gap-2">
                <button
                  onClick={addFaq}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Guardar FAQ
                </button>
                <button
                  onClick={() => setShowFaqForm(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowFaqForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Agregar FAQ
            </button>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enlace del Chatbot</h2>
          <p className="text-gray-600">Comparte este enlace con tus clientes:</p>
          <code className="bg-gray-100 p-3 block mt-2 rounded text-sm break-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/chat/${user?.uid}` : `https://tuapp.com/chat/${user?.uid}`}
          </code>
          <button
            onClick={() => {
              const url = typeof window !== 'undefined' ? `${window.location.origin}/chat/${user?.uid}` : '';
              navigator.clipboard.writeText(url);
              alert('Enlace copiado al portapapeles');
            }}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Copiar Enlace
          </button>
        </div>

        <button
          onClick={saveBusiness}
          className="w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-semibold"
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}