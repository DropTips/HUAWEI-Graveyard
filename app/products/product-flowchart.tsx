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

    const nodes = container.querySelectorAll<HTMLElement>('.flowchart-node');
    if (nodes.length === 0) return;

    // 找到最顶和最底节点的中心 Y（相对于容器）
    const containerRect = container.getBoundingClientRect();
    let minCenterY = Infinity;
    let maxCenterY = -Infinity;
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2 - containerRect.top;
      if (centerY < minCenterY) minCenterY = centerY;
      if (centerY > maxCenterY) maxCenterY = centerY;
    });

    // 轴线从首节点中心延伸到末节点中心
    axis.style.top = `${minCenterY}px`;
    axis.style.height = `${maxCenterY - minCenterY}px`;
  }, [events]);

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div ref={containerRef} className="flowchart-vertical">
      {/* 一条连续轴线，JS 精确定位到首尾节点中心 */}
      <div ref={axisRef} className="flowchart-axis" />
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
