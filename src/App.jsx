import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import Header from './components/Header';
import Hero from './components/Hero';
import Board from './components/Board';
import CardForm from './components/CardForm';

export const CATEGORIES = [
  {
    id: 'vision',
    label: '1년 뒤 이루고 싶은 것',
    icon: '✦',
    color: '#c9a84c',
    gradient: 'from-[#c9a84c] to-[#8a6f2e]',
    bgMuted: 'rgba(201,168,76,0.08)',
    borderMuted: 'rgba(201,168,76,0.25)',
  },
  {
    id: 'ai',
    label: 'AI로 바꿀 내 업무',
    icon: '⚡',
    color: '#60b8e0',
    gradient: 'from-[#60b8e0] to-[#2a7aab]',
    bgMuted: 'rgba(96,184,224,0.08)',
    borderMuted: 'rgba(96,184,224,0.25)',
  },
];

export default function App() {
  const [cards, setCards] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'cards'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newCards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCards(newCards);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddCard = async (cardData) => {
    await addDoc(collection(db, 'cards'), {
      ...cardData,
      createdAt: serverTimestamp(),
    });
    setIsFormOpen(false);
  };

  const filteredCards = activeFilter === 'all'
    ? cards
    : cards.filter(c => c.category === activeFilter);

  const visionCount = cards.filter(c => c.category === 'vision').length;
  const aiCount = cards.filter(c => c.category === 'ai').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header
        onAddCard={() => setIsFormOpen(true)}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        categories={CATEGORIES}
      />
      <Hero
        totalCount={cards.length}
        visionCount={visionCount}
        aiCount={aiCount}
        onAddCard={() => setIsFormOpen(true)}
      />
      <Board cards={filteredCards} loading={loading} categories={CATEGORIES} />

      {isFormOpen && (
        <CardForm
          onSubmit={handleAddCard}
          onClose={() => setIsFormOpen(false)}
          categories={CATEGORIES}
        />
      )}
    </div>
  );
}
