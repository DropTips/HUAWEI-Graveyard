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

// 时长单位：优先年，其次月，最后天
function getDuration(start: Date, end: Date): Duration {
  let years = end.getFullYear() - start.getFullYear();
  if (end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())) {
    years--;
  }
  if (years >= 1) return { value: years, unit: '年' };

  const months = end.getMonth() - start.getMonth() + 12 * (end.getFullYear() - start.getFullYear());
  if (months >= 1) return { value: months, unit: '个月' };

  return { value: end.getDate() - start.getDate(), unit: '天' };
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

  let summary: string;
  if (isDiscontinued) {
    const { value, unit } = getDuration(product.discontinuedDate, today);
    summary = `被抹杀于 ${value === 0 ? '今天' : `${value} ${unit}前`}。`;
  } else {
    const { value, unit } = getDuration(today, product.discontinuedDate);
    summary = `将在 ${value} ${unit}后被抹杀。`;
  }
  summary += `${product.description}。`;
  if (isDiscontinued && product.launchDate) {
    const { value, unit } = getDuration(product.launchDate, product.discontinuedDate);
    summary += ` 存活时间 ${value} ${unit}。`;
  }

  return { name: product.name, subtitle: product.subtitle, dateRange, summary, isDiscontinued };
}
