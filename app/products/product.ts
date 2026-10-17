export interface FlowchartEvent {
  date: string;        // YYYY-MM-DD 格式，用于排序
  title: string;
  description: string;
}

export interface Product {
  name: string;
  subtitle?: string;
  launchDate?: Date;
  discontinuedDate: Date;
  description: string;
  link: string;
  events?: FlowchartEvent[];
}

export interface ProductView {
  name: string;
  subtitle?: string;
  dateRange: string;
  summary: string;
  isDiscontinued: boolean;
}

interface Duration {
  value: number;
  unit: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

// 时长单位：优先年，其次月，最后天。
// 统一按天换算，避免旧实现里月份未做周年修正、天数跨月相减带来的误差。
function getDuration(start: Date, end: Date): Duration {
  const days = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
  if (days >= DAYS_PER_YEAR) return { value: Math.floor(days / DAYS_PER_YEAR), unit: '年' };
  if (days >= DAYS_PER_MONTH) return { value: Math.floor(days / DAYS_PER_MONTH), unit: '个月' };
  return { value: days, unit: '天' };
}

// 计算卡片展示的日期范围与摘要文案
export function getProductView(product: Product, today: Date): ProductView {
  const isDiscontinued = product.discontinuedDate <= today;

  // 已停产显示年份区间，存活中显示预期停产月份
  const dateRange = isDiscontinued
    ? product.launchDate
      ? `${product.launchDate.getFullYear()} - ${product.discontinuedDate.getFullYear()}`
      : `${product.discontinuedDate.getFullYear()}`
    : product.discontinuedDate.toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' });

  const elapsed = isDiscontinued
    ? getDuration(product.discontinuedDate, today)
    : getDuration(today, product.discontinuedDate);

  let summary: string;
  if (elapsed.value <= 0) {
    // 不满一天：两种情况都按「今天」表述，避免出现「0 天前」
    summary = isDiscontinued ? '今天被抹杀。' : '今天将被抹杀。';
  } else if (isDiscontinued) {
    summary = `被抹杀于 ${elapsed.value} ${elapsed.unit}前。`;
  } else {
    summary = `将在 ${elapsed.value} ${elapsed.unit}后被抹杀。`;
  }

  summary += `${product.description}。`;

  if (isDiscontinued && product.launchDate) {
    const lifespan = getDuration(product.launchDate, product.discontinuedDate);
    summary += ` 存活时间 ${lifespan.value} ${lifespan.unit}。`;
  }

  return { name: product.name, subtitle: product.subtitle, dateRange, summary, isDiscontinued };
}
