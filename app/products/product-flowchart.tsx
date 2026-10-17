'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';

import { type FlowchartEvent } from '@/products/product';

interface ProductFlowchartProps {
  events: FlowchartEvent[];
}

export default function ProductFlowchart({ events }: Readonly<ProductFlowchartProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const axisRef = useRef<HTMLDivElement>(null);

  // 按日期升序渲染，不改动传入的原数组
  const sorted = useMemo(() => [...events].sort((a, b) => a.date.localeCompare(b.date)), [events]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const axis = axisRef.current;
    if (!container || !axis) return;

    let raf = 0;
    let cancelled = false;
    const timers: number[] = [];

    const recalc = () => {
      if (cancelled) return;
      // 合并同一帧内的多次触发：ResizeObserver / resize / 兜底计时器可能连着来，
      // 逐个处理会造成多次强制同步布局。
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (cancelled) return;
        const firstCol = container.querySelector<HTMLElement>('.flowchart-axis-col');
        if (!firstCol) return;
        const containerRect = container.getBoundingClientRect();
        const colRect = firstCol.getBoundingClientRect();
        axis.style.left = `${colRect.left + colRect.width / 2 - containerRect.left}px`;
      });
    };

    recalc();

    // 兜底校准：字体载入会改变行宽与行高，进而影响轴线位置
    timers.push(window.setTimeout(recalc, 120));
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(recalc).catch(() => undefined);
    }

    window.addEventListener('resize', recalc);

    const ro = new ResizeObserver(recalc);
    ro.observe(container);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('resize', recalc);
      ro.disconnect();
    };
  }, [events]);

  return (
    <div ref={containerRef} className="flowchart-vertical">
      <div
        ref={axisRef}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: 'var(--flow-red)',
          zIndex: 0,
          transform: 'translateX(-50%)',
        }}
      />
      {sorted.map((event) => (
        <div key={`${event.date}-${event.title}`} className="flowchart-row">
          <div className="flowchart-date-col">
            <span className="flowchart-date">{event.date}</span>
          </div>
          <div className="flowchart-axis-col">
            <span className="flowchart-node" />
          </div>
          <div className="flowchart-content">
            <h4 className="flowchart-title">{event.title}</h4>
            <p className="flowchart-desc">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
