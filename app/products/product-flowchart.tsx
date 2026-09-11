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

    const rows = container.querySelectorAll<HTMLElement>('.flowchart-row');
    if (rows.length === 0) return;

    // 动态计算轴线 left：取第一个 axis-col 的中心位置
    const firstAxisCol = rows[0].querySelector<HTMLElement>('.flowchart-axis-col');
    if (firstAxisCol) {
      const containerRect = container.getBoundingClientRect();
      const colRect = firstAxisCol.getBoundingClientRect();
      const left = colRect.left + colRect.width / 2 - containerRect.left;
      axis.style.left = `${left}px`;
      axis.style.transform = 'translateX(-50%)';
    }

    // 计算首尾节点中心，轴线精准止于首尾
    const nodes = container.querySelectorAll<HTMLElement>('.flowchart-node');
    const containerRect = container.getBoundingClientRect();
    let minCenterY = Infinity;
    let maxCenterY = -Infinity;
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2 - containerRect.top;
      if (centerY < minCenterY) minCenterY = centerY;
      if (centerY > maxCenterY) maxCenterY = centerY;
    });

    axis.style.top = `${minCenterY}px`;
    axis.style.height = `${maxCenterY - minCenterY}px`;
  }, [events]);

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div ref={containerRef} className="flowchart-vertical">
      {/* 单条连续红线 */}
      <div
        ref={axisRef}
        style={{
          position: 'absolute',
          width: 3,
          backgroundColor: 'var(--flow-red)',
          zIndex: 0,
          top: 0,
          height: 0,
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
