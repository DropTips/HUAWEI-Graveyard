'use client';

import { useMemo } from 'react';

import { type FlowchartEvent, type Product } from '@/products/product';
import productsDocument from '@/products/products.json';

interface ProductRecord {
  name: string;
  subtitle?: string;
  launchDate?: string;
  discontinuedDate: string;
  description: string;
  link: string;
  events?: FlowchartEvent[];
}

// 加载 JSON 数据：存活产品排前，按剩余寿命升序；已停产产品按 launchDate 升序
export default function useProducts(): Product[] {
  return useMemo(() => {
    const today = new Date();
    return (productsDocument as { products: ProductRecord[] }).products
      .map(
        (record: ProductRecord): Product => ({
          name: record.name,
          subtitle: record.subtitle,
          launchDate: record.launchDate ? new Date(record.launchDate) : undefined,
          discontinuedDate: new Date(record.discontinuedDate),
          description: record.description,
          link: record.link,
          events: record.events,
        }),
      )
      .sort((a, b) => {
        const aActive = a.discontinuedDate.getTime() > today.getTime();
        const bActive = b.discontinuedDate.getTime() > today.getTime();

        // 存活产品排前
        if (aActive !== bActive) return aActive ? -1 : 1;

        // 存活产品：剩余寿命由小到大
        if (aActive) return a.discontinuedDate.getTime() - b.discontinuedDate.getTime();

        // 已停产产品：按 launchDate 升序
        if (!a.launchDate) return 1;
        if (!b.launchDate) return -1;
        return a.launchDate.getTime() - b.launchDate.getTime();
      });
  }, []);
}
