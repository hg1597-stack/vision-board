import React from 'react';

export default function Hero({ totalCount, visionCount, aiCount, onAddCard }) {
  return (
    <section className="relative py-14 px-4 text-center overflow-hidden">
      {/* Decorative lines */}
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-[rgba(201,168,76,0.3)]" />
      </div>

      {/* Crown / diamond ornament */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.4)]" />
        <span
          className="text-xs tracking-[0.35em] uppercase font-medium"
          style={{ color: 'rgba(201,168,76,0.7)' }}
        >
          ✦ 2025 · 1기 ✦
        </span>
        <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.4)]" />
      </div>

      <h2
        className="font-serif text-4xl sm:text-5xl font-bold bg-clip-text text-transparent mb-3"
        style={{ backgroundImage: 'linear-gradient(135deg, #f5f0e8 0%, #e8c97a 40%, #c9a84c 70%, #f0d060 100%)' }}
      >
        우리의 비전
      </h2>
      <p className="text-[rgba(138,138,138,0.9)] text-sm sm:text-base mb-8 max-w-md mx-auto">
        각자의 꿈과 계획을 하나의 보드에 담아,
        <br />함께 성장하는 여정을 시작합니다
      </p>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6 sm:gap-10">
        <Stat value={totalCount} label="총 비전" />
        <div className="w-px h-8 bg-[rgba(201,168,76,0.2)]" />
        <Stat value={visionCount} label="1년 뒤 목표" color="#c9a84c" icon="✦" />
        <div className="w-px h-8 bg-[rgba(201,168,76,0.2)]" />
        <Stat value={aiCount} label="AI 업무 전환" color="#60b8e0" icon="⚡" />
      </div>

      {/* Bottom ornament */}
      <div className="flex items-center justify-center gap-3 mt-8">
        <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.2)]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[rgba(201,168,76,0.3)]" />
        <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.2)]" />
      </div>
    </section>
  );
}

function Stat({ value, label, color = '#f5f0e8', icon }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-baseline gap-1">
        {icon && <span className="text-xs" style={{ color }}>{icon}</span>}
        <span
          className="font-serif text-3xl font-bold"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      <span className="text-xs text-[rgba(138,138,138,0.7)] tracking-wider">{label}</span>
    </div>
  );
}
