// js/faction-page.js —— 势力详情页渲染（中文注释）
// 职责：解析 URL 参数，读取 factionsData，居中渲染图片与文案；右下角提供返回按钮。

import { factionsData } from './data/factionsData.js';

function qs(sel) { return document.querySelector(sel); }

function renderNotFound() {
  const wrap = qs('#faction-hero');
  if (!wrap) return;
  wrap.innerHTML = '<div class="muted">未找到势力信息，请返回。</div>';
}

function initFactionPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const data = id ? factionsData[id] : null;
  if (!data) { renderNotFound(); return; }

  const titleEl = qs('#faction-title');
  const subEl = qs('#faction-sub');
  const descEl = qs('#faction-desc');
  const imgEl = qs('#faction-image');

  if (titleEl) titleEl.textContent = data.name;
  if (subEl) subEl.textContent = data.sub || '';
  if (descEl) descEl.textContent = data.description || '';
  if (imgEl) {
    imgEl.src = data.logo || data.image || '';
    imgEl.alt = data.name || '势力图案';
    imgEl.loading = 'lazy';
    imgEl.referrerPolicy = 'no-referrer';
    imgEl.crossOrigin = 'anonymous';
    imgEl.addEventListener('error', () => {
      const ph = document.createElement('div');
      ph.className = 'faction-image placeholder skeleton';
      imgEl.replaceWith(ph);
    });
  }

  const backLink = qs('.go-back a');
  if (backLink) {
    backLink.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        sessionStorage.setItem('rtlTransition', '1');
        sessionStorage.setItem('rtlTransitionTarget', '#characters');
      } catch (_) {}
      runPageTransitionRTL(() => {
        window.location.href = backLink.getAttribute('href') || 'index.html#characters';
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', initFactionPage);

export {}; // ESM 保持模块语义（中文注释）

function runPageTransitionRTL(onComplete, duration = 480) {
  const overlay = document.createElement('div');
  overlay.className = 'page-transition-rtl';
  document.body.appendChild(overlay);
  const done = () => { if (onComplete) onComplete(); };
  overlay.addEventListener('animationend', done, { once: true });
  setTimeout(done, duration + 80);
}
