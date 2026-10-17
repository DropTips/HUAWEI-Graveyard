'use client';

import { ExternalLink } from 'lucide-react';

import { type Product, getProductView } from '@/products/product';
import ProductFlowchart from '@/products/product-flowchart';
import { asset } from '@/site';

interface ProductCardProps {
  product: Product;
  today: Date;
  onActivate?: (el: HTMLElement) => void;
  expanded?: boolean;
  transparent?: boolean;
  headingId?: string;
}

export default function ProductCard({
  product,
  today,
  onActivate,
  expanded,
  transparent,
  headingId,
}: Readonly<ProductCardProps>) {
  const { name, subtitle, dateRange, summary, isDiscontinued } = getProductView(product, today);
  // 仅网格卡片可交互；弹窗内的展开态由弹窗自身接管焦点
  const interactive = Boolean(onActivate);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onActivate) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    // 焦点落在内部链接上时交给链接自己处理，避免一次按键触发两个动作
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    onActivate(event.currentTarget);
  };

  return (
    <div
      onClick={onActivate ? (event) => onActivate(event.currentTarget) : undefined}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `查看 ${name} 详情` : undefined}
      style={expanded ? { paddingTop: 45, paddingBottom: 45 } : undefined}
      className={`flex flex-col rounded-xl p-5 ${
        transparent ? '' : 'glass cursor-pointer hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)]'
      } ${expanded ? '' : 'h-full'} ${
        transparent
          ? ''
          : isDiscontinued
            ? 'border border-[var(--glass-border)]'
            : 'border border-[var(--warn-border)]'
      }`}
    >
      <div className="mb-4 flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(isDiscontinued ? '/assets/headstone.svg' : '/assets/coffin.svg')}
          alt={isDiscontinued ? '墓碑' : '棺材'}
          width={64}
          height={64}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h2
            id={headingId}
            className="font-bold text-[var(--heading)]"
            style={{ fontSize: expanded ? 'clamp(22px, 5vw, 32px)' : 20 }}
          >
            {name}
          </h2>
          {subtitle && (
            <p
              className="text-[var(--muted)]"
              style={{ fontSize: expanded ? 'clamp(16px, 3.6vw, 25px)' : 16 }}
            >
              {subtitle}
            </p>
          )}
          <p
            className="mt-1 text-[var(--muted)]"
            style={{ fontSize: expanded ? 'clamp(15px, 3.2vw, 24px)' : 14 }}
          >
            {dateRange}
          </p>
        </div>
      </div>

      <p
        className="mb-4 flex-1 leading-relaxed text-[var(--body)]"
        style={{ fontSize: expanded ? 'clamp(14px, 2.6vw, 18px)' : 14 }}
      >
        {summary}
      </p>

      {product.link && (
        <a
          href={product.link}
          target="_blank"
          rel="noreferrer noopener"
          // 阻止冒泡，否则点链接会同时打开新标签页并弹出详情
          onClick={(event) => event.stopPropagation()}
          className="inline-flex w-fit items-center gap-1.5 rounded border border-[var(--glass-border)] px-3 py-1.5 text-xs text-[var(--body)] transition-colors hover:border-[var(--muted)] hover:text-[var(--heading)]"
        >
          <ExternalLink size={14} />
          了解更多
        </a>
      )}

      {expanded && product.events && product.events.length > 0 && (
        <ProductFlowchart events={product.events} />
      )}
    </div>
  );
}
