import React from 'react';
import VisionCard from './VisionCard';

export default function Board({ cards, loading, categories }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-5">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-[#c9a84c]"
          style={{
            borderColor: 'rgba(201,168,76,0.2)',
            borderTopColor: '#c9a84c',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p className="text-[rgba(138,138,138,0.7)] text-sm">비전보드 불러오는 중...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{
            background: 'rgba(201,168,76,0.05)',
            border: '1px solid rgba(201,168,76,0.15)',
          }}
        >
          <span className="text-3xl" style={{ color: 'rgba(201,168,76,0.4)' }}>✦</span>
        </div>
        <h2 className="font-serif text-2xl font-semibold text-[rgba(245,240,232,0.8)] mb-2">
          아직 비전이 없습니다
        </h2>
        <p className="text-[rgba(138,138,138,0.7)] text-sm text-center max-w-xs leading-relaxed">
          첫 번째 주인공이 되어보세요.<br />
          상단의 '비전 올리기' 버튼을 눌러 시작하세요.
        </p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      {/* Masonry grid using CSS columns */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {cards.map(card => (
          <div key={card.id} className="break-inside-avoid mb-4">
            <VisionCard card={card} categories={categories} />
          </div>
        ))}
      </div>
    </main>
  );
}
