'use client';

import { useLayoutEffect, useRef } from 'react';

import { type FlowchartEvent } from '@/products/product';

interface ProductFlowchartProps {
  events: FlowchartEvent[];
}

export default function ProductFlowchart({ events }: Readonly<ProductFlowchartProps>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rows = container.querySelectorAll<HTMLElement>('.flowchart-row');
    if (rows.length === 0) return;

    const firstRow = rows[0];
    const lastRow = rows[rows.length - 1];

    // 标记首尾行
    firstRow.dataset.first = 'true';
    lastRow.dataset.last = 'true';

    // 计算首尾节点相对于行顶的偏移，让轴线精准止于节点中心
    const containerRect = container.getBoundingClientRect();

    const firstNode = firstRow.querySelector<HTMLElement>('.flowchart-node');
    const lastNode = lastRow.querySelector<HTMLElement>('.flowchart-node');

    if (firstNode) {
      const rect = firstNode.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2 - firstRow.getBoundingClientRect().top;
      firstRow.style.setProperty('--axis-start', `${centerY}px`);
    }

    if (lastNode) {
      const rect = lastNode.getBoundingClientRect();
      const centerY = lastRow.getBoundingClientRect().bottom - (rect.top + rect.height / 2 - lastRow.getBoundingClientRect().top);
      lastRow.style.setProperty('--axis-end', `${centerY}px`);
    }

    // 清理避免 TS 警告
    void containerRect;
  }, [events]);

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div ref={containerRef} className="flowchart-vertical">
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
