'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import type { Product } from '@/products/product';
import ProductCard from '@/products/product-card';

const DURATION = 560;
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

function getExpandedWidth(): number {
  const viewportWidth = window.innerWidth;
  let columns = 1;
  if (viewportWidth >= 1948) columns = 4;
  else if (viewportWidth >= 1482) columns = 3;
  else if (viewportWidth >= 1016) columns = 2;
  return Math.min(450 * columns + 16 * (columns - 1), viewportWidth - 32);
}

interface ProductLightboxProps {
  product: Product;
  today: Date;
  fromRect: DOMRect;
  sourceEl: HTMLElement;
  onClose: () => void;
}

export default function ProductLightbox({ product, today, fromRect, sourceEl, onClose }: Readonly<ProductLightboxProps>) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const [closing, setClosing] = useState(false);

  const isDiscontinued = product.discontinuedDate <= today;

  const close = useCallback(() => {
    setClosing(true);
    const bg = bgRef.current;
    const content = contentRef.current;
    if (bg && content) {
      bg.classList.add('is-animating');
      bg.style.willChange = 'transform';
      // 缩回到原卡片的当前位置（背景可能已滚动）
      const targetRect = sourceEl.getBoundingClientRect();
      const bgRect = bg.getBoundingClientRect();
      const scaleX = targetRect.width / bgRect.width;
      const scaleY = targetRect.height / bgRect.height;
      bg.style.transition = `transform ${DURATION}ms ${EASING}`;
      bg.style.transform = `translate(${targetRect.left - bgRect.left}px, ${targetRect.top - bgRect.top}px) scale(${scaleX}, ${scaleY})`;
      // 文字原地淡出
      content.style.transition = `opacity ${DURATION * 0.7}ms ease`;
      content.style.opacity = '0';
      const onEnd = (event: TransitionEvent) => {
        if (event.propertyName === 'transform') {
          bg.removeEventListener('transitionend', onEnd);
          onClose();
        }
      };
      bg.addEventListener('transitionend', onEnd);
      closeTimer.current = window.setTimeout(onClose, DURATION + 120);
    } else {
      closeTimer.current = window.setTimeout(onClose, DURATION);
    }
  }, [sourceEl, onClose]);

  useLayoutEffect(() => {
    const bg = bgRef.current;
    const content = contentRef.current;
    const overlay = overlayRef.current;
    if (!bg || !content || !overlay) return;

    // 不锁定滚动，背景可自由滚动
    // 隐藏被点击的原卡片，避免弹窗缩放时与原卡片重叠
    const previousVisibility = sourceEl.style.visibility;
    sourceEl.style.visibility = 'hidden';

    // overlay 拦截了滚轮事件，转发给 window 让背景滚动
    const onWheel = (e: WheelEvent) => {
      window.scrollBy({ top: e.deltaY, left: 0 });
    };
    overlay.addEventListener('wheel', onWheel, { passive: true });

    // 内容层居中显示，宽度为放大后的卡片宽度
    const expandedWidth = getExpandedWidth();
    content.style.width = `${expandedWidth}px`;
    content.style.opacity = '0';
    void content.offsetHeight;
    const finalRect = content.getBoundingClientRect();

    // 背景层与内容层同尺寸、同位置
    bg.style.width = `${finalRect.width}px`;
    bg.style.height = `${finalRect.height}px`;
    bg.style.left = `${finalRect.left}px`;
    bg.style.top = `${finalRect.top}px`;
    bg.style.transformOrigin = 'top left';
    bg.style.willChange = 'transform';
    bg.classList.add('is-animating');

    // 背景先瞬移到原卡片位置并缩小
    const scaleX = fromRect.width / finalRect.width;
    const scaleY = fromRect.height / finalRect.height;
    bg.style.transition = 'none';
    bg.style.transform = `translate(${fromRect.left - finalRect.left}px, ${fromRect.top - finalRect.top}px) scale(${scaleX}, ${scaleY})`;
    void bg.offsetHeight;

    // 背景先放大到居中位置；放大完成后文字再淡入
    const raf = requestAnimationFrame(() => {
      bg.style.transition = `transform ${DURATION}ms ${EASING}`;
      bg.style.transform = 'translate(0px, 0px) scale(1, 1)';
      // 延迟到背景放大结束后再淡入文字
      content.style.transition = `opacity ${DURATION * 0.5}ms ease`;
      content.style.transitionDelay = `${DURATION}ms`;
      content.style.opacity = '1';
    });

    const settleTimer = window.setTimeout(() => {
      bg.classList.remove('is-animating');
      bg.style.willChange = '';
    }, DURATION * 2 + 300);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
      window.clearTimeout(closeTimer.current);
      overlay.removeEventListener('wheel', onWheel);
      sourceEl.style.visibility = previousVisibility;
    };
  }, [fromRect, sourceEl]);

  return (
    <>
      <div ref={overlayRef} className="lightbox-overlay" style={{ opacity: closing ? 0 : 1 }} onClick={close} />
      {/* 背景层：玻璃+边框，做缩放动画 */}
      <div
        ref={bgRef}
        className={`lightbox-bg glass rounded-3xl ${
          isDiscontinued ? 'border border-[var(--glass-border)]' : 'border border-[var(--warn-border)]'
        }`}
      />
      {/* 内容层：始终居中，只做透明度淡入淡出 */}
      <div ref={contentRef} className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <ProductCard product={product} today={today} expanded transparent />
      </div>
    </>
  );
}
