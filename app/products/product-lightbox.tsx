'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import type { Product } from '@/products/product';
import ProductCard from '@/products/product-card';

// 560ms 偏长，感知上会「等动画」而非「跟着动」；340ms 配合快出的缓动更跟手
const DURATION = 340;
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
// 下滑超过该距离（px）即关闭弹窗
const DRAG_CLOSE_THRESHOLD = 100;
// 焦点陷阱：弹窗内可被 Tab 命中的元素
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

interface TouchDragState {
  startY: number;
  lastY: number;
  dragging: boolean;
}

export default function ProductLightbox({ product, today, fromRect, sourceEl, onClose }: Readonly<ProductLightboxProps>) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  // 系统开启“减少动态效果”时动画时长降为 1ms
  const durationRef = useRef(DURATION);
  const touchRef = useRef<TouchDragState | null>(null);
  // 同步关闭标志，供事件回调读取（避免 state 闭包过期）
  const closingRef = useRef(false);
  // 收尾只执行一次：transitionend 与兜底 setTimeout 都会走到这里
  const finishedRef = useRef(false);
  // 关闭落位前的「玻璃层↔原卡片」交叉淡化定时器
  const swapTimer = useRef<number | undefined>(undefined);
  const [closing, setClosing] = useState(false);
  const titleId = useId();

  const isDiscontinued = product.discontinuedDate <= today;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(swapTimer.current);
    onClose();
  }, [onClose]);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const duration = durationRef.current;
    const bg = bgRef.current;
    const content = contentRef.current;
    if (bg && content) {
      bg.classList.add('is-animating');
      bg.style.willChange = 'transform';
      content.style.willChange = 'transform';
      // 缩回到原卡片的当前位置（背景可能已滚动）
      const targetRect = sourceEl.getBoundingClientRect();
      const bgRect = bg.getBoundingClientRect();
      const scaleX = targetRect.width / bgRect.width;
      const scaleY = targetRect.height / bgRect.height;
      const transition = duration > 1 ? `transform ${duration}ms ${EASING}` : 'none';
      bg.style.transition = transition;
      bg.style.transform = `translate(${targetRect.left - bgRect.left}px, ${targetRect.top - bgRect.top}px) scale(${scaleX}, ${scaleY})`;
      // 内容层不做等比缩小（整篇文字被压进小卡片会显得滑稽且不可读）：
      // 朝原卡片方向平移一小段并快速淡出，像「内容融回卡片」，
      // 玻璃背景层独自完成缩回落位，落位后无缝换回原卡片
      const contentRect = content.getBoundingClientRect();
      const dx = targetRect.left + targetRect.width / 2 - (contentRect.left + contentRect.width / 2);
      const dy = targetRect.top + targetRect.height / 2 - (contentRect.top + contentRect.height / 2);
      content.style.transformOrigin = 'center center';
      content.style.willChange = 'transform, opacity';
      content.style.transition =
        duration > 1
          ? `transform ${duration}ms ${EASING}, opacity ${Math.round(duration * 0.45)}ms ease`
          : 'none';
      content.style.transform = `translate(${dx * 0.35}px, ${dy * 0.35}px) scale(0.96)`;
      content.style.opacity = '0';
      if (duration > 1) {
        // 落位前 ~140ms 开始交叉淡化：显露下方原卡片、玻璃层同步淡出。
        // 否则玻璃层落位后会先呈现为一张「空卡片」，等内容硬切回来，
        // 出现二段式的割裂感；交叉淡化让内容还原变成无缝过渡。
        swapTimer.current = window.setTimeout(() => {
          sourceEl.style.visibility = 'visible';
          bg.style.transition = `${transition}, opacity 140ms ease`;
          bg.style.opacity = '0';
        }, Math.max(duration - 140, 0));
        const onEnd = (event: TransitionEvent) => {
          if (event.propertyName === 'transform') {
            bg.removeEventListener('transitionend', onEnd);
            finish();
          }
        };
        bg.addEventListener('transitionend', onEnd);
      }
      closeTimer.current = window.setTimeout(finish, duration + 120);
    } else {
      closeTimer.current = window.setTimeout(finish, duration);
    }
  }, [sourceEl, finish]);

  // 打开时把焦点移入弹窗，卸载后归还给原卡片
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    contentRef.current?.focus();
    return () => {
      previous?.focus?.();
    };
  }, []);

  // 读取系统“减少动态效果”偏好；Escape 键关闭；Tab 焦点锁定在弹窗内
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    durationRef.current = mq.matches ? 1 : DURATION;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const content = contentRef.current;
      if (!content) return;

      const focusables = Array.from(content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        event.preventDefault();
        content.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === content)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  useLayoutEffect(() => {
    const bg = bgRef.current;
    const content = contentRef.current;
    const overlay = overlayRef.current;
    if (!bg || !content || !overlay) return;

    const duration = durationRef.current;

    // 隐藏被点击的原卡片，避免弹窗缩放时与原卡片重叠
    const previousVisibility = sourceEl.style.visibility;
    sourceEl.style.visibility = 'hidden';

    // 弹窗期间统一锁定背景滚动（内容区自行滚动）；
    // 用 padding 补偿滚动条宽度，避免滚动条消失导致页面横向跳动
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;

    // 下滑关闭手势：内容区位于顶部且向下拉时接管手势，其余情况交给原生滚动
    const onTouchStart = (e: TouchEvent) => {
      touchRef.current = { startY: e.touches[0].clientY, lastY: e.touches[0].clientY, dragging: false };
    };
    const onTouchMove = (e: TouchEvent) => {
      const state = touchRef.current;
      if (!state || closingRef.current) return;
      const dy = e.touches[0].clientY - state.startY;
      state.lastY = e.touches[0].clientY;
      if (content.scrollTop <= 0 && dy > 0) {
        if (!state.dragging) state.dragging = true;
        e.preventDefault();
        const progress = Math.min(dy / 250, 1);
        bg.classList.add('is-animating');
        const drag = `translateY(${dy * 0.5}px) scale(${1 - progress * 0.08})`;
        bg.style.transition = 'none';
        bg.style.transform = drag;
        content.style.transition = 'none';
        content.style.transform = drag;
      }
    };
    const onTouchEnd = () => {
      const state = touchRef.current;
      touchRef.current = null;
      if (!state) return;
      const dy = state.lastY - state.startY;
      if (state.dragging && dy > DRAG_CLOSE_THRESHOLD) {
        close();
        return;
      }
      if (state.dragging) {
        // 未达阈值：回弹到居中位置
        const rebound = `transform 300ms ${EASING}`;
        const identity = 'translate(0px, 0px) scale(1, 1)';
        bg.style.transition = rebound;
        bg.style.transform = identity;
        content.style.transition = rebound;
        content.style.transform = identity;
      }
    };
    content.addEventListener('touchstart', onTouchStart, { passive: true });
    content.addEventListener('touchmove', onTouchMove, { passive: false });
    content.addEventListener('touchend', onTouchEnd);
    content.addEventListener('touchcancel', onTouchEnd);

    // 按当前视口同步内容层与背景层尺寸位置。
    // 内容层不再用 CSS translateX(-50%) 居中，而是直接算出 left 写入内联样式，
    // 使其与背景层处于同一坐标系，从而可以共用同一条 transform 做共享元素过渡。
    const applyExpandedSize = (): DOMRect => {
      // 测量前必须清掉内容层上可能残留的 transform：
      // StrictMode 下 effect 会跑两遍，第二遍测量若带着第一遍设置的起始缩放，
      // 量到的是被缩小后的视觉矩形，背景层会被同步成错误尺寸、缩放比也趋近 1，
      // 导致背景与文字两层彻底脱同步。
      content.style.transition = 'none';
      content.style.transform = 'none';
      const width = getExpandedWidth();
      const left = Math.max(16, (window.innerWidth - width) / 2);
      content.style.width = `${width}px`;
      content.style.left = `${left}px`;
      // getBoundingClientRect 自身就会强制同步布局，无需再用 offsetHeight 多触发一次重排
      const rect = content.getBoundingClientRect();
      bg.style.width = `${rect.width}px`;
      bg.style.height = `${rect.height}px`;
      bg.style.left = `${rect.left}px`;
      bg.style.top = `${rect.top}px`;
      return rect;
    };

    // 背景层与内容层同尺寸、同位置
    const finalRect = applyExpandedSize();

    bg.style.transformOrigin = 'top left';
    content.style.transformOrigin = 'top left';
    bg.style.willChange = 'transform';
    content.style.willChange = 'transform';
    bg.classList.add('is-animating');

    // 两层先瞬移到原卡片位置并缩小（起始状态一致，文字随卡片一起起跳）
    const scaleX = fromRect.width / finalRect.width;
    const scaleY = fromRect.height / finalRect.height;
    const initial = `translate(${fromRect.left - finalRect.left}px, ${fromRect.top - finalRect.top}px) scale(${scaleX}, ${scaleY})`;
    bg.style.transition = 'none';
    bg.style.transform = initial;
    content.style.transition = 'none';
    content.style.transform = initial;

    // 双 rAF：等起始状态真正提交到合成层后再切换目标值。
    // 单次 rAF 在部分浏览器（尤其首帧）会被合并掉，导致过渡被跳过、弹窗直接闪现。
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const transition = duration > 1 ? `transform ${duration}ms ${EASING}` : 'none';
        bg.style.transition = transition;
        bg.style.transform = 'translate(0px, 0px) scale(1, 1)';
        content.style.transition = transition;
        content.style.transform = 'translate(0px, 0px) scale(1, 1)';
      });
    });

    const settleTimer = window.setTimeout(() => {
      bg.classList.remove('is-animating');
      bg.style.willChange = '';
      content.style.willChange = '';
    }, duration + 400);

    // 旋转屏幕 / 调整窗口：重算尺寸（拖拽过程中不干预）
    const onViewportChange = () => {
      if (closingRef.current || touchRef.current?.dragging) return;
      applyExpandedSize();
    };
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', onViewportChange);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(settleTimer);
      window.clearTimeout(closeTimer.current);
      window.clearTimeout(swapTimer.current);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('orientationchange', onViewportChange);
      content.removeEventListener('touchstart', onTouchStart);
      content.removeEventListener('touchmove', onTouchMove);
      content.removeEventListener('touchend', onTouchEnd);
      content.removeEventListener('touchcancel', onTouchEnd);
      sourceEl.style.visibility = previousVisibility;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.paddingRight = prevBodyPaddingRight;
    };
    // close 内部全部读取 ref，首次闭包在整个弹窗生命周期内安全
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* 内容层：与背景层共用同一条 transform，文字随卡片平移缩放；支持内部滚动与下滑关闭 */}
      <div
        ref={contentRef}
        className="lightbox-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <ProductCard product={product} today={today} expanded transparent headingId={titleId} />
      </div>
    </>
  );
}
