'use client';

import { useLayoutEffect, useRef } from 'react';

import { type FlowchartEvent } from '@/products/product';

interface ProductFlowchartProps {
  events: FlowchartEvent[];
}

export default function ProductFlowchart({ events }: Readonly<ProductFlowchartProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const axisRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const axis = axisRef.current;
    if (!container || !axis) return;

    let raf = 0;

    const recalc = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const firstCol = container.querySelector<HTMLElement>('.flowchart-axis-col');
        if (!firstCol) return;
        const containerRect = container.getBoundingClientRect();
        const colRect = firstCol.getBoundingClientRect();
        axis.style.left = `${colRect.left + colRect.width / 2 - containerRect.left}px`;
      });
    };

    recalc();

    // 多次兜底：字体加载、旋转、row 高度变化
    [50, 150, 350].forEach((d) => window.setTimeout(recalc, d));
    window.addEventListener('resize', recalc);

    const ro = new ResizeObserver(recalc);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', recalc);
      ro.disconnect();
    };
  }, [events]);

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

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
      {sorted.map((event, i) => (
        <div key={i} className="flowchart-row">
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
