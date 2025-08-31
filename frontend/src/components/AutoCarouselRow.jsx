import { useEffect, useRef, useState, useMemo } from "react";
import styles from "./AutoCarouselRow.module.css";


export default function AutoCarouselRow({
  items = [],
  renderItem,
  speed = 30,
  gap = 16,
  dir = "ltr",
  pauseOnHover = true,
  minItemWidth = 280,
}) {
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const [running, setRunning] = useState(true);

  const loopItems = useMemo(() => [...items, ...items], [items]);

  useEffect(() => {
    if (!wrapRef.current || !trackRef.current || loopItems.length === 0) return;

    const wrap = wrapRef.current;
    const track = trackRef.current;
    let rafId;
    let last = performance.now();
    let x = 0;

    const totalWidth = track.scrollWidth / 2; 

    function frame(now) {
      const dt = (now - last) / 1000;
      last = now;
      if (running) {
        const delta = speed * dt * (dir === "rtl" ? -1 : 1);
        x -= delta;
        if (dir === "rtl") {
          if (x <= -totalWidth) x += totalWidth;
        } else {
          if (x >= totalWidth) x -= totalWidth;
        }
        track.style.transform = `translateX(${x}px)`;
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [loopItems, speed, dir, running]);

  const hoverProps = pauseOnHover
    ? {
        onMouseEnter: () => setRunning(false),
        onMouseLeave: () => setRunning(true),
        onFocus: () => setRunning(false),
        onBlur: () => setRunning(true),
      }
    : {};

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.deltaX;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      {...hoverProps}
      aria-roledescription="carrossel automático"
    >
      <div
        ref={trackRef}
        className={styles.track}
        style={{ gap: `${gap}px` }}
      >
        {loopItems.map((it, i) => (
          <div
            key={`it-${i}`}
            className={styles.item}
            style={{ minWidth: `${minItemWidth}px` }}
          >
            {renderItem(it, i % (items.length || 1))}
          </div>
        ))}
      </div>
    </div>
  );
}
