'use client';

import { useEffect, useState } from 'react';

// 静态导出时 HTML 在构建时刻就已生成，此处仅作为首屏渲染基准。
// 挂载后立即切换到浏览器真实时间，避免「距今多久」被冻结在构建那天。
const BUILD_DATE = new Date();

export default function useToday(): Date {
  const [today, setToday] = useState<Date>(BUILD_DATE);

  useEffect(() => {
    setToday(new Date());
  }, []);

  return today;
}
