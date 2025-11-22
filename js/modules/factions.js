// factions.js —— 各大机构列表交互与预览（中文注释）
// 职责：为首页“各大机构”段落提供：
// 1）列表项点击跳转至详情页；
// 2）悬停/聚焦时在右侧面板预览机构标志图；
// 3）为每个列表项插入小图标，提高识别度。

import { factionsData } from '../data/factionsData.js';

export function initFactions({ listSelector = '#characters .faction-items', panelSelector = '#characters .faction-illustration' } = {}) {
  const list = document.querySelector(listSelector);
  const panel = document.querySelector(panelSelector);
  if (!list) return;

  // 右侧面板支持设置 GIF 背景：通过 data-gif 或 data-bg 指定路径（中文注释）
  if (panel) {
    const bg = panel.getAttribute('data-bg');
    if (bg) {
      const p = panel.closest('.faction-panel') || panel;
      p.style.backgroundImage = `url(${bg})`;
      p.style.backgroundSize = 'cover';
      p.style.backgroundPosition = 'center';
      p.style.backgroundRepeat = 'no-repeat';
    }
  }

  // 在右侧面板中使用<img>播放GIF，并在结束后冻结为最后一帧（中文注释）
  const panelRoot = panel ? (panel.closest('.faction-panel') || panel) : null;
  let panelGifEl = null;
  let panelLogoEl = null;
  let freezeTimer = null;
  const defaultGifDuration = 1000; // 默认时长（毫秒），用于无显式时长时冻结
  function clearPanelGif() {
    if (!panelRoot) return;
    if (freezeTimer) { clearTimeout(freezeTimer); freezeTimer = null; }
    if (panelGifEl) { panelGifEl.remove(); panelGifEl = null; }
    // GIF 播放结束或被清除后，恢复右侧面板的背景（中文注释）
    panelRoot.classList.remove('panel-playing');
  }
  function showPanelLogo(src) {
    if (!panelRoot || !src) return;
    if (panelLogoEl) { panelLogoEl.remove(); panelLogoEl = null; }
    // 显示 LOGO 时隐藏占位骨架，避免闪烁（中文注释）
    const illu = panelRoot.querySelector('.faction-illustration');
    if (illu) { illu.style.display = 'none'; }
    panelLogoEl = document.createElement('img');
    panelLogoEl.className = 'faction-panel-logo';
    panelLogoEl.alt = '组织与计划标志';
    panelLogoEl.decoding = 'async';
    panelLogoEl.loading = 'eager';
    panelLogoEl.style.opacity = '0';
    panelLogoEl.src = src;
    panelRoot.appendChild(panelLogoEl);
    requestAnimationFrame(() => { panelLogoEl.style.opacity = '0.96'; });
  }
  function playGifOnce(src, durationMs, logoSrc) {
    if (!panelRoot || !src) return;
    clearPanelGif();
    if (panelLogoEl) { panelLogoEl.remove(); panelLogoEl = null; }
    // 播放 GIF 期间移除面板的黑色背景与遮罩（中文注释）
    panelRoot.classList.add('panel-playing');
    panelGifEl = document.createElement('img');
    panelGifEl.className = 'faction-panel-gif';
    panelGifEl.alt = '组织与计划GIF';
    panelGifEl.decoding = 'async';
    panelGifEl.loading = 'eager';
    panelRoot.appendChild(panelGifEl);
    // onload 后启动冻结计时（中文注释）
    panelGifEl.onload = () => {
      const ms = Number.isFinite(durationMs) ? durationMs : defaultGifDuration;
      freezeTimer = setTimeout(() => {
        if (logoSrc) {
          // 先淡入 LOGO，再淡出 GIF，最后移除 GIF 与播放态（中文注释）
          showPanelLogo(logoSrc);
          if (panelGifEl) {
            panelGifEl.style.opacity = '0';
            setTimeout(() => { clearPanelGif(); }, 260);
          } else {
            clearPanelGif();
          }
        }
      }, ms);
    };
    panelGifEl.src = src;
  }

  // 鼠标跟随 LOGO 的全局叠加层（中文注释）
  const listWrap = list.closest('.factions-list') || list.parentElement;
  // 在左侧容器中创建“位于 ul 层下面”的叠加层（中文注释）
  const overlay = document.createElement('div');
  overlay.className = 'factions-overlay';
  const overlayImg = document.createElement('img');
  overlayImg.className = 'factions-overlay-img';
  overlay.appendChild(overlayImg);
  if (listWrap) listWrap.insertBefore(overlay, list); // 放在 ul 之前，处于下面一层
  let moveHandler = null;
  let rafId = null;
  let targetX = 0, targetY = 0;
  let curX = 0, curY = 0;
  const easing = 0.18; // 追随延迟（无拖影）

  function showOverlay(src) {
    if (!src) return;
    overlayImg.src = src;
    overlay.style.display = 'block';
  }
  function startFollow() {
    if (!moveHandler) {
      moveHandler = (e) => {
        if (!listWrap) return;
        const br = listWrap.getBoundingClientRect();
        targetX = Math.max(12, Math.min(br.width - 12, e.clientX - br.left + 12));
        targetY = Math.max(12, Math.min(br.height - 12, e.clientY - br.top + 12));
      };
      document.addEventListener('mousemove', moveHandler);
    }
    if (!rafId) {
      const step = () => {
        curX += (targetX - curX) * easing;
        curY += (targetY - curY) * easing;
        overlayImg.style.transform = `translate(${curX}px, ${curY}px)`;
        rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    }
  }
  function hideFollow() {
    overlay.style.display = 'none';
    overlayImg.removeAttribute('src');
    if (moveHandler) {
      document.removeEventListener('mousemove', moveHandler);
      moveHandler = null;
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  const items = Array.from(list.querySelectorAll('.faction-item'));
  // 按中文标题字符数排序（字少在前，字多在后；中文注释）
  const sorted = items.slice().sort((a, b) => {
    const ta = (a.querySelector('.faction-title')?.textContent || '').trim();
    const tb = (b.querySelector('.faction-title')?.textContent || '').trim();
    return ta.length - tb.length;
  });
  sorted.forEach(el => list.appendChild(el));
  // 仅保留有对应 GIF 的条目（中文注释）
  const afterSort = Array.from(list.querySelectorAll('.faction-item'));
  const filtered = afterSort.filter((item) => {
    const id = item.getAttribute('data-id');
    const data = id ? factionsData[id] : null;
    return !!(data && data.gif);
  });
  afterSort.forEach((item) => { if (!filtered.includes(item)) item.remove(); });
  // 为列表项插入小图标（若数据提供 logo），并绑定预览（中文注释）
  filtered.forEach((item) => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      if (!id) return;
      // 点击后触发“从右到左”的页面级过渡动画，再导航到详情页（中文注释）
      runPageTransitionRTL(() => {
        window.location.href = `faction.html?id=${encodeURIComponent(id)}`;
      });
    });

    const id = item.getAttribute('data-id');
    const data = id ? factionsData[id] : null;
    const logo = data && (data.logo || data.image) || '';
    const gif = data && data.gif || '';
    const gifDuration = data && data.gifDuration;

    // 插入小图标（左侧）：
    if (logo) {
      const icon = document.createElement('img');
      icon.className = 'faction-icon';
      icon.src = logo;
      icon.alt = data?.name || '机构标志';
      icon.loading = 'lazy';
      icon.referrerPolicy = 'no-referrer';
      icon.crossOrigin = 'anonymous';
      icon.addEventListener('error', () => { icon.remove(); });
      // 若标题前已有图标则跳过
      const titleEl = item.querySelector('.faction-title');
      if (titleEl && !item.querySelector('.faction-icon')) {
        item.insertBefore(icon, titleEl);
      }
    }

    // 悬停/聚焦：显示鼠标跟随 LOGO；移出/失焦隐藏（中文注释）
    item.addEventListener('mouseenter', () => { showOverlay(logo); startFollow(); playGifOnce(gif, gifDuration, logo); });
    item.addEventListener('focus', () => { showOverlay(logo); playGifOnce(gif, gifDuration, logo); });
    item.addEventListener('mouseleave', () => { hideFollow(); /* 保持最后一帧，不清除 */ });
    item.addEventListener('blur', () => { hideFollow(); /* 保持最后一帧，不清除 */ });
  });

  // 页面级过渡动画：从右到左的遮罩滑入（中文注释）
  function runPageTransitionRTL(onComplete, duration = 480) {
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-rtl';
    document.body.appendChild(overlay);
    const done = () => { if (onComplete) onComplete(); };
    overlay.addEventListener('animationend', done, { once: true });
    // 兜底超时，避免特殊环境下事件未触发（中文注释）
    setTimeout(done, duration + 80);
  }
}
