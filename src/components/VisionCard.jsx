import React from 'react';

function formatDate(timestamp) {
  if (!timestamp?.toDate) return '방금 전';
  const d = timestamp.toDate();
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function VisionCard({ card, categories }) {
  const category = categories.find(c => c.id === card.category) || categories[0];

  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 animate-fade-in"
      style={{
        background: 'linear-gradient(145deg, #161410 0%, #111111 100%)',
        border: `1px solid ${category.borderMuted}`,
        boxShadow: `0 2px 20px rgba(0,0,0,0.3)`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${category.color}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${category.color}, ${category.color}60, transparent)` }}
      />

      {/* Card inner glow */}
      <div
        className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top, ${category.color}20, transparent 70%)` }}
      />

      <div className="relative p-5">
        {/* Category badge */}
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-4"
          style={{
            background: category.bgMuted,
            border: `1px solid ${category.borderMuted}`,
            color: category.color,
          }}
        >
          <span>{category.icon}</span>
          <span>{category.label}</span>
        </div>

        {/* Name */}
        <h3 className="font-serif text-xl font-semibold text-[#f5f0e8] mb-3 leading-tight tracking-tight">
          {card.name}
        </h3>

        {/* Divider */}
        <div
          className="w-8 h-px mb-3"
          style={{ background: `linear-gradient(90deg, ${category.color}60, transparent)` }}
        />

        {/* Content */}
        <p className="text-[rgba(185,178,168,0.9)] text-sm leading-relaxed">
          {card.content}
        </p>
      </div>

      {/* Footer */}
      <div className="relative px-5 pb-4 pt-0">
        <p className="text-[rgba(80,80,80,0.8)] text-xs">
          {formatDate(card.createdAt)}
        </p>
      </div>
    </div>
  );
}
