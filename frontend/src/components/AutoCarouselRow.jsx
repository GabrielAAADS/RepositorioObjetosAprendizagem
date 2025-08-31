import { useEffect, useMemo, useRef, useState } from 'react';

export default function AutoCarouselRow({
  items = [],
  renderItem,
  speed = 24,
  gap = 16,
  dir = 'ltr',
  minItemWidth = 300,
}) {
  const wrapRef = useRef(null);
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const calc = () => {
      const W = el.clientWidth || 0;
      const perLoop = items.length * (minItemWidth + gap);
      const needed = perLoop === 0 ? 1 : Math.max(1, Math.ceil((W * 1.4) / perLoop)); // 1.4 pra sobrar
      setCopies(needed);
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length, minItemWidth, gap]);

  const track = useMemo(() => {
    const loops = [];
    for (let i = 0; i < copies; i++) {
      loops.push(
        <div
          key={`loop-${i}`}
          style={{ display: 'flex', gap, paddingRight: gap }}
          aria-hidden={i > 0}
        >
          {items.map((it, idx) => (
            <div key={`it-${i}-${idx}`} style={{ minWidth: minItemWidth }}>
              {renderItem(it)}
            </div>
          ))}
        </div>
      );
    }
    return loops;
  }, [copies, items, renderItem, gap, minItemWidth]);

  const totalWidth = (items.length * (minItemWidth + gap)) * copies;
  const duration = totalWidth > 0 ? Math.max(12, Math.round(totalWidth / speed)) : 16;

  const keyframes = `
    @keyframes acr-marquee-ltr {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
    @keyframes acr-marquee-rtl {
      from { transform: translateX(-50%); }
      to   { transform: translateX(0); }
    }
  `;

  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        padding: '8px 0',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
        maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
      }}
    >
      <style>{keyframes}</style>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'stretch',
          gap,
          width: 'max-content',
          animation: `${dir === 'rtl' ? 'acr-marquee-rtl' : 'acr-marquee-ltr'} ${duration}s linear infinite`,
        }}
      >
        <div style={{ display: 'flex' }}>{track}</div>
        <div style={{ display: 'flex' }}>{track}</div>
      </div>
    </div>
  );
}
