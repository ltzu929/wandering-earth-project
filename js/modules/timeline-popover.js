// timeline-popover.js —— 时间线悬停详情弹窗模块（中文注释）
// 职责：在年份节点悬停时显示弹窗，展示该事件的年份、标题与简述；
//       支持可选插图与两种显示模式：
//       1) 浮层弹窗（靠近节点，自动选择上/下/左/右）；
//       2) 右侧纵向面板（固定在时间线右侧，图文纵向排列，类似图片卡片）。

let popEl = null; // 单例弹窗元素（中文注释）
let hideTimer = null; // 隐藏定时器，避免闪烁（中文注释）
let currentKey = null; // 当前展示的事件 key（中文注释）
let fadingOut = false; // 是否处于淡出中（中文注释）
let fadeOutEndHandler = null; // 淡出结束回调引用，便于取消（中文注释）
let anchorEl = null; // 右侧纵向面板的锚点元素（通常为年份列表容器，中文注释）
let modeRef = 'hover'; // 当前显示模式：hover | portrait-right（中文注释）

function ensurePopover() {
  if (popEl) return popEl;
  popEl = document.createElement('div');
  popEl.className = 'timeline-popover';
  popEl.style.display = 'none';
  document.body.appendChild(popEl);
  // 鼠标移入弹窗时取消隐藏，移出后延迟隐藏（中文注释）
  popEl.addEventListener('mouseenter', () => {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  });
  popEl.addEventListener('mouseleave', () => {
    scheduleHide();
  });
  return popEl;
}

function scheduleHide() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (!popEl) return;
    // 使用动画淡出后再隐藏（中文注释）
    fadingOut = true;
    // 添加退出态类，获得更柔和的淡出（中文注释）
    popEl.classList.add('exiting');
    popEl.classList.remove('is-visible');
    const onEnd = () => {
      popEl.style.display = 'none';
      popEl.removeEventListener('transitionend', onEnd);
      popEl.classList.remove('exiting');
      fadingOut = false; fadeOutEndHandler = null; currentKey = null;
    };
    fadeOutEndHandler = onEnd;
    // 若浏览器不触发 transitionend，也回退到定时隐藏（中文注释）
    popEl.addEventListener('transitionend', onEnd);
    setTimeout(() => {
      if (popEl && popEl.style.display !== 'none') {
        popEl.style.display = 'none';
        popEl.classList.remove('exiting');
        fadingOut = false; fadeOutEndHandler = null; currentKey = null;
      }
    }, 260);
  }, 120);
}

function setPopoverContent(item) {
  if (!popEl || !item) return;
  const title = `${item.year} · ${item.title}`;
  const hasImg = !!item.image;
  popEl.innerHTML = '';
  const h3 = document.createElement('h3');
  h3.textContent = title;
  popEl.appendChild(h3);
  if (hasImg) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    img.addEventListener('error', () => img.remove());
    popEl.appendChild(img);
  }
  const p = document.createElement('p');
  p.textContent = item.content;
  popEl.appendChild(p);
}

function positionPopover(targetRect, opts = {}) {
  if (!popEl) return;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  // 根据模式选择不同的理想宽度（中文注释）
  const desiredWidth = (modeRef === 'portrait-right')
    ? Math.min(380, viewportWidth - 40)
    : Math.min(520, viewportWidth - 40);
  popEl.style.width = `${desiredWidth}px`;

  const margin = 16; // 与目标之间的间距（中文注释）
  const centerX = targetRect.left + (targetRect.width / 2);
  const centerY = targetRect.top + (targetRect.height / 2);
  const orientation = opts.orientation || 'auto';

  let left = 0; let top = 0; let placeBelow = false; let sideClass = null;

  // 右侧纵向面板：固定在锚点右侧，垂直跟随当前目标项居中（中文注释）
  if (modeRef === 'portrait-right') {
    const anchorRect = anchorEl ? anchorEl.getBoundingClientRect() : targetRect;
    left = Math.round(anchorRect.right + margin);
    // 弹窗高度可能为 0（首次显示前），此处在显示前已设置为 block，可读取到高度（中文注释）
    const popH = popEl.offsetHeight || 260;
    const targetCenterY = Math.round(centerY);
    top = Math.round(targetCenterY - popH / 2);
    sideClass = 'side-right';
    // 视窗边缘保护与居中回退（中文注释）
    const canFitRight = (left + desiredWidth) <= (viewportWidth - 20);
    if (!canFitRight) {
      // 居中回退（窄屏时），宽度仍保持 desiredWidth（中文注释）
      left = Math.round((viewportWidth - desiredWidth) / 2);
    }
  } else if (orientation === 'left' || orientation === 'right') {
    // 优先在目标的左右并列显示（中文注释）
    if (orientation === 'left') {
      left = Math.round(targetRect.left - desiredWidth - margin);
      top = Math.round(centerY - popEl.offsetHeight / 2);
      sideClass = 'side-left';
    } else {
      left = Math.round(targetRect.right + margin);
      top = Math.round(centerY - popEl.offsetHeight / 2);
      sideClass = 'side-right';
    }
    // 若水平空间不足，回退到上/下方居中显示（中文注释）
    const fitsHorizontally = left >= 20 && (left + desiredWidth) <= (viewportWidth - 20);
    if (!fitsHorizontally) {
      left = Math.round(centerX - desiredWidth / 2);
      top = Math.round(targetRect.top - margin - popEl.offsetHeight);
      if (top < 20) { top = Math.round(targetRect.bottom + margin); placeBelow = true; }
      sideClass = null;
    }
  } else {
    // 自动：默认在目标上方居中，空间不足则下方（中文注释）
    left = Math.round(centerX - desiredWidth / 2);
    top = Math.round(targetRect.top - margin - popEl.offsetHeight);
    if (top < 20) { top = Math.round(targetRect.bottom + margin); placeBelow = true; }
  }

  // 视窗边缘保护（中文注释）
  left = Math.max(20, Math.min(left, viewportWidth - desiredWidth - 20));
  top = Math.max(20, Math.min(top, viewportHeight - popEl.offsetHeight - 20));

  popEl.style.left = `${left}px`;
  popEl.style.top = `${top}px`;
  popEl.classList.toggle('below', !!placeBelow);
  popEl.classList.remove('side-left', 'side-right');
  if (sideClass) popEl.classList.add(sideClass);
}

export function initTimelinePopover({ listEl, getItemByKey, mode = 'hover', anchorSelector = '#timeline .timeline-nav' }) {
  const el = ensurePopover();
  if (!listEl) return;
  // 记录模式与锚点（中文注释）
  modeRef = mode;
  anchorEl = document.querySelector(anchorSelector);
  if (modeRef === 'portrait-right') {
    el.classList.add('portrait-panel');
  } else {
    el.classList.remove('portrait-panel');
  }
  // 在页面滚动时隐藏弹窗，避免位置错位（中文注释）
  window.addEventListener('scroll', () => scheduleHide(), { passive: true });

  // 使用 mouseover / mouseout 事件委托到列表，保证鼠标在 li 上就显示弹窗（中文注释）
  listEl.addEventListener('mouseover', (e) => {
    const target = e.target.closest('.year-item');
    if (!target || !listEl.contains(target)) return;
    // 从同一个 li 的子节点之间移动，不触发显示（中文注释）
    const fromLi = e.relatedTarget && listEl.contains(e.relatedTarget)
      ? e.relatedTarget.closest('.year-item')
      : null;
    if (fromLi === target) return;
    // 进入新节点时，取消任何待执行的隐藏，防止闪烁（中文注释）
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    // 若正在淡出，立即取消淡出并保持可见（中文注释）
    if (fadingOut) {
      popEl.classList.add('is-visible');
      if (fadeOutEndHandler) {
        popEl.removeEventListener('transitionend', fadeOutEndHandler);
        fadeOutEndHandler = null;
      }
      fadingOut = false;
    }

    const key = target.dataset.key;
    const item = getItemByKey ? getItemByKey(key) : null;
    if (!item) return;
    const rect = target.getBoundingClientRect();
    // 右侧纵向面板固定在右侧，无需根据左右布局切换方向（中文注释）
    const orientation = (modeRef === 'portrait-right')
      ? 'right'
      : (target.classList.contains('tl-right') ? 'left' : 'right');

    // 首次显示或当前不可见：直接淡入（中文注释）
    if (el.style.display !== 'block' || !el.classList.contains('is-visible')) {
      setPopoverContent(item);
      el.style.display = 'block';
      // 防止之前处于退出态导致样式残留（中文注释）
      el.classList.remove('exiting');
      positionPopover(rect, { orientation });
      void el.offsetWidth; // 强制回流以启动过渡（中文注释）
      el.classList.add('is-visible');
      currentKey = key;
      return;
    }

    // 已显示且切换到不同节点：不完全淡出，使用轻微切换过渡（中文注释）
    if (currentKey !== key) {
      // 使用 swapping 轻过渡：先降低不透明度与微位移，再回到正常（中文注释）
      setPopoverContent(item);
      positionPopover(rect, { orientation });
      el.classList.add('swapping');
      // 下一帧移除 swapping，形成过渡（中文注释）
      requestAnimationFrame(() => {
        el.classList.remove('swapping');
      });
      currentKey = key;
    } else {
      // 同一节点，更新位置（例如窗口变化时）（中文注释）
      positionPopover(rect, { orientation });
    }
  });

  listEl.addEventListener('mouseout', (e) => {
    const fromLi = e.target.closest('.year-item');
    if (!fromLi) return;
    const toTarget = e.relatedTarget;
    const toLi = toTarget && listEl.contains(toTarget) ? toTarget.closest('.year-item') : null;
    // 在节点之间切换或移到弹窗上时不隐藏（中文注释）
    if (toLi || (popEl && toTarget && popEl.contains(toTarget))) return;
    scheduleHide();
    currentKey = null; // 离开列表后重置当前 key（中文注释）
  });
}
