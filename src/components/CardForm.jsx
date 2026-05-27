import React, { useState, useEffect, useRef } from 'react';

export default function CardForm({ onSubmit, onClose, categories }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0].id);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const canSubmit = name.trim().length > 0 && content.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), category, content: content.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: 'linear-gradient(145deg, #161410 0%, #111111 100%)',
          border: '1px solid rgba(201,168,76,0.2)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.05)',
        }}
      >
        {/* Top gold accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, #f0d060, #c9a84c, #8a6f2e)' }}
        />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#f5f0e8]">
              비전 카드 작성
            </h2>
            <p className="text-xs text-[rgba(138,138,138,0.7)] mt-1">
              여러분의 이야기를 공유해주세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[rgba(138,138,138,0.6)] transition-all hover:text-[#f5f0e8] hover:bg-[rgba(255,255,255,0.06)]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[rgba(138,138,138,0.8)] mb-2 uppercase tracking-widest">
              이름
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="홍길동"
              maxLength={20}
              className="w-full rounded-xl px-4 py-3 text-[#f5f0e8] text-sm outline-none transition-all placeholder-[rgba(80,80,80,0.8)]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={e => {
                e.currentTarget.style.border = '1px solid rgba(201,168,76,0.4)';
                e.currentTarget.style.background = 'rgba(201,168,76,0.04)';
              }}
              onBlur={e => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[rgba(138,138,138,0.8)] mb-2 uppercase tracking-widest">
              카테고리
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-200"
                    style={{
                      background: isSelected ? cat.bgMuted : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? cat.borderMuted : 'rgba(255,255,255,0.07)'}`,
                      color: isSelected ? cat.color : 'rgba(100,100,100,0.9)',
                    }}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-xs font-medium leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-[rgba(138,138,138,0.8)] mb-2 uppercase tracking-widest">
              내용
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                category === 'vision'
                  ? '1년 뒤 이루고 싶은 것을 구체적으로 적어주세요...'
                  : 'AI를 활용해 바꾸고 싶은 업무나 루틴을 적어주세요...'
              }
              rows={4}
              maxLength={300}
              className="w-full rounded-xl px-4 py-3 text-[#f5f0e8] text-sm outline-none transition-all resize-none placeholder-[rgba(80,80,80,0.8)]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={e => {
                e.currentTarget.style.border = `1px solid ${selectedCategory?.color}60`;
                e.currentTarget.style.background = `${selectedCategory?.bgMuted}`;
              }}
              onBlur={e => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
            <p className="text-right text-[10px] text-[rgba(80,80,80,0.7)] mt-1">
              {content.length}/300
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-98"
            style={
              canSubmit
                ? {
                    background: 'linear-gradient(135deg, #f0d060 0%, #c9a84c 50%, #8a6f2e 100%)',
                    color: '#0a0a0a',
                    boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
                  }
                : {
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(80,80,80,0.8)',
                    cursor: 'not-allowed',
                  }
            }
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border-2 inline-block"
                  style={{
                    borderColor: 'rgba(10,10,10,0.3)',
                    borderTopColor: '#0a0a0a',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                올리는 중...
              </span>
            ) : (
              `비전 올리기 ${selectedCategory?.icon || '✦'}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
