'use client';

import { useState } from 'react';

import { type Product, ProductCard, ProductLightbox, useProducts } from '@/products';

interface ProductSectionProps {
  title: string;
  products: Product[];
  today: Date;
  onSelect: (product: Product, el: HTMLElement) => void;
}

function ProductSection({ title, products, today, onSelect }: Readonly<ProductSectionProps>) {
  return (
    <section className="pb-10">
      <div className="content-wrap">
        <h2 className="mb-4 text-left text-lg font-bold text-[var(--heading)]">{title}</h2>
        <div className="grid-products">
          {products.map((product: Product) => (
            <ProductCard
              key={product.name + product.subtitle}
              product={product}
              today={today}
              onClick={(e) => onSelect(product, e.currentTarget)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const products = useProducts();
  const today = new Date();
  const [expanded, setExpanded] = useState<{ product: Product; rect: DOMRect; el: HTMLElement } | null>(null);

  const alive = products.filter((product) => product.discontinuedDate > today);
  const dead = products.filter((product) => product.discontinuedDate <= today);

  const select = (product: Product, el: HTMLElement) =>
    setExpanded({ product, rect: el.getBoundingClientRect(), el });

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/headstone.svg" alt="华为坟场墓碑图标" width={72} height={72} />
        <h1 className="text-4xl font-bold text-[var(--heading)]">华为坟场</h1>
        <p className="text-sm text-[var(--muted)]">缅怀那些被华为抹杀的产品</p>
      </header>

      {alive.length > 0 && <ProductSection title="存活中" products={alive} today={today} onSelect={select} />}

      {dead.length > 0 && <ProductSection title="已被抹杀" products={dead} today={today} onSelect={select} />}

      <section className="mx-auto w-full max-w-7xl px-4 pb-16">
        <div className="glass rounded-xl border border-[var(--glass-border)] p-4 text-xs leading-relaxed text-[var(--muted)]">
          <h2 className="mb-2 text-lg font-bold text-[var(--heading)]">备注</h2>
          <p className="mb-1">
            1. 若存在后续迭代产品的系列，产品抹杀日期为下一代产品发布日期；
          </p>
          <p>
            2. 若不存在后续迭代产品的系列，产品抹杀日期为官方商城下架日期或停止维护前最后一次更新日期。
          </p>
        </div>
      </section>

      {expanded && (
        <ProductLightbox
          product={expanded.product}
          today={today}
          fromRect={expanded.rect}
          sourceEl={expanded.el}
          onClose={() => setExpanded(null)}
        />
      )}

      <footer className="border-t border-[var(--divider)] px-4 py-8 text-center text-xs text-[var(--muted)]">
        <p>华为坟场 · 数据仅供参考，欢迎补充与指正</p>
      </footer>
    </main>
  );
}
