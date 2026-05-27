import React from 'react';

export default function Header({ onAddCard, activeFilter, onFilterChange, categories }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(201,168,76,0.12)] bg-[rgba(10,10,10,0.85)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#0a0a0a] font-bold text-xs"
              style={{ background: 'linear-gradient(135deg, #f0d060 0%, #c9a84c 50%, #8a6f2e 100%)' }}
            >
              1기
            </div>
            <div>
              <h1
                className="font-serif text-base font-semibold bg-clip-text text-transparent leading-none"
                style={{ backgroundImage: 'linear-gradient(135deg, #f0d060 0%, #c9a84c 60%, #e8c060 100%)' }}
              >
                공동 비전보드
              </h1>
              <p className="text-[10px] text-[rgba(201,168,76,0.5)] mt-0.5 tracking-widest uppercase">
                Vision Board
              </p>
            </div>
          </div>

          {/* Desktop filter tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#111] rounded-full p-1 border border-[rgba(201,168,76,0.15)]">
            <FilterTab active={activeFilter === 'all'} onClick={() => onFilterChange('all')}>
              전체
            </FilterTab>
            {categories.map(cat => (
              <FilterTab
                key={cat.id}
                active={activeFilter === cat.id}
                onClick={() => onFilterChange(cat.id)}
                color={cat.color}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </FilterTab>
            ))}
          </nav>

          {/* Add button */}
          <button
            onClick={onAddCard}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[#0a0a0a] font-semibold text-sm transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f0d060 0%, #c9a84c 50%, #8a6f2e 100%)',
              boxShadow: '0 4px 20px rgba(201,168,76,0.25)',
            }}
          >
            <span className="text-base leading-none">+</span>
            <span>비전 올리기</span>
          </button>
        </div>

        {/* Mobile filter tabs */}
        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto no-scrollbar">
          <FilterTab active={activeFilter === 'all'} onClick={() => onFilterChange('all')} small>
            전체
          </FilterTab>
          {categories.map(cat => (
            <FilterTab
              key={cat.id}
              active={activeFilter === cat.id}
              onClick={() => onFilterChange(cat.id)}
              small
              color={cat.color}
            >
              {cat.icon} {cat.label}
            </FilterTab>
          ))}
        </div>
      </div>
    </header>
  );
}

function FilterTab({ active, onClick, children, small, color = '#c9a84c' }) {
  return (
    <button
      onClick={onClick}
      className={`
        whitespace-nowrap rounded-full font-medium transition-all duration-200
        ${small ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'}
      `}
      style={
        active
          ? {
              background: `linear-gradient(135deg, ${color}30, ${color}15)`,
              color: color,
              border: `1px solid ${color}50`,
            }
          : {
              color: 'rgba(138,138,138,1)',
              border: '1px solid transparent',
            }
      }
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.color = '#f5f0e8';
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.color = 'rgba(138,138,138,1)';
      }}
    >
      {children}
    </button>
  );
}
