import React, { useEffect, useRef } from 'react';
import CourseCard from './CourseCard';

export default function CarouselRow({ items = [], onCard }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf;
    let pos = 0;
    const speed = 0.4;

    const step = () => {
      pos += speed;
      el.scrollLeft = pos;
      if (pos >= el.scrollWidth - el.clientWidth) pos = 0;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [items]);

  return (
    <div className="relative">
      <div ref={wrapRef} className="overflow-x-auto no-scrollbar">
        <div className="flex gap-4 pr-4">
          {items.map(it => (
            <div key={it.id} className="w-72 shrink-0">
              <CourseCard item={it} onClick={() => onCard?.(it)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
