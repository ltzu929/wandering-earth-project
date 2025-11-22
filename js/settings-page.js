// js/settings-page.js —— 设定百科页面脚本（中文注释）
// 职责：渲染设定卡片，实现分类筛选与搜索，不涉及历史时间线。

import { initScrollAnimations } from './modules/scroll-animations.js';

/**
 * 初始化设定百科页面的交互与渲染逻辑。
 * @param {Object} opts - 配置对象。
 * @param {Array<Object>} opts.data - 设定数据数组。
 * @param {string} opts.filterSelector - 分类筛选选择器。
 * @param {string} opts.searchSelector - 搜索输入选择器。
 * @param {string} opts.gridSelector - 卡片网格容器选择器。
 */
export function initSettingsPage({ data, filterSelector, searchSelector, gridSelector }) {
  const filterEl = filterSelector ? document.querySelector(filterSelector) : null;
  const searchEl = searchSelector ? document.querySelector(searchSelector) : null;
  const gridEl = document.querySelector(gridSelector);
  if (!gridEl) {
    console.error('[settings-page] 必要的DOM节点缺失: grid');
    return;
  }

  const source = Array.isArray(data) ? data.filter(d => !(d && typeof d.id === 'string' && (/^character-/.test(d.id) || /^organization-/.test(d.id)))) : [];

  const categories = ['全部', ...Array.from(new Set(source.map(d => d.category).filter(Boolean)))];
  if (filterEl) {
    filterEl.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    filterEl.value = '全部';
  }

  // 2）状态：当前筛选与搜索关键词（中文注释）
  let state = { category: '全部', keyword: '' };

  // 3）事件：分类筛选与搜索（中文注释）
  if (filterEl) {
    filterEl.addEventListener('change', () => {
      state.category = filterEl.value;
      render();
    });
  }
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      state.keyword = searchEl.value.trim();
      render();
    });
  }

  // 4）渲染函数：根据状态计算结果并绘制卡片（中文注释）
  function render() {
    const kw = state.keyword.toLowerCase();
    const filtered = source.filter(item => {
      const passCat = state.category === '全部' || item.category === state.category;
      const passKw = !kw ||
        (item.name && item.name.toLowerCase().includes(kw)) ||
        (item.summary && item.summary.toLowerCase().includes(kw));
      return passCat && passKw;
    });

    gridEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    filtered.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'card reveal';
      card.innerHTML = `
        <div class="card-content">
          <h3 class="card-title">${item.name}</h3>
          <p class="card-text">${item.summary || ''}</p>
          <div class="card-actions" style="margin-top:8px;">
            <a class="btn btn-outline focus-visible" href="settings-detail.html?id=${encodeURIComponent(item.id)}" aria-label="查看详情：${item.name}">查看详情</a>
          </div>
        </div>
      `;
      frag.appendChild(card);
    });
    gridEl.appendChild(frag);

    // 新插入元素绑定滚动动画（中文注释）
    initScrollAnimations({ selector: '.reveal', activeClass: 'reveal-active' });
  }

  // 首次渲染（中文注释）
  render();
}
