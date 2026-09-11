'use client';

import { ExternalLink } from 'lucide-react';

import { type Product, getProductView } from '@/products/product';
import ProductFlowchart from '@/products/product-flowchart';

interface ProductCardProps {
  product: Product;
  today: Date;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  expanded?: boolean;
  transparent?: boolean;
}

export default function ProductCard({ product, today, onClick, expanded, transparent }: Readonly<ProductCardProps>) {
  const { name, subtitle, dateRange, summary, isDiscontinued } = getProductView(product, today);

  return (
    <div
      onClick={onClick}
      style={expanded ? { paddingTop: 45, paddingBottom: 45 } : undefined}
      className={`flex cursor-pointer flex-col rounded-xl p-5 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)] ${
        transparent ? '' : 'glass'
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
          src={isDiscontinued ? '/assets/headstone.svg' : '/assets/coffin.svg'}
          alt={isDiscontinued ? '墓碑' : '棺材'}
          width={64}
          height={64}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-[var(--heading)]" style={{ fontSize: expanded ? 32 : 20 }}>{name}</h2>
          {subtitle && <p className="text-[var(--muted)]" style={{ fontSize: expanded ? 25 : 16 }}>{subtitle}</p>}
          <p className="mt-1 text-[var(--muted)]" style={{ fontSize: expanded ? 24 : 14 }}>{dateRange}</p>
        </div>
      </div>

      <p className="mb-4 flex-1 leading-relaxed text-[var(--body)]" style={{ fontSize: expanded ? 18 : 14 }}>{summary}</p>

      <a
        href={product.link}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex w-fit items-center gap-1.5 rounded border border-[var(--glass-border)] px-3 py-1.5 text-xs text-[var(--body)] transition-colors hover:border-[var(--muted)] hover:text-[var(--heading)]"
      >
        <ExternalLink size={14} />
        了解更多
      </a>

      {expanded && product.events && product.events.length > 0 && (
        <ProductFlowchart events={product.events} />
      )}
    </div>
  );
}
