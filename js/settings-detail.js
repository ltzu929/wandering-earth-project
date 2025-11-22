// js/settings-detail.js —— 设定详情页渲染模块（中文注释）
// 职责：解析 URL 参数，查找设定数据，渲染标题、图片、摘要、描述、统计、相关与参考。

/**
 * 初始化设定详情页渲染。
 * @param {Object} opts - 配置项。
 * @param {Array<Object>} opts.data - 设定数据数组（含 id/name/...）。
 * @param {string} opts.titleSelector - 标题元素选择器。
 * @param {string} opts.categorySelector - 分类 chip 选择器。
 * @param {string} opts.imageSelector - 主图 img 选择器。
 * @param {string} opts.imagePlaceholderSelector - 图片占位容器选择器。
 * @param {string} opts.summarySelector - 摘要段落选择器。
 * @param {string} opts.descriptionSelector - 描述容器选择器（支持多段）。
 * @param {string} opts.statsSelector - 统计/关键事实 dl 容器选择器。
 * @param {string} opts.relatedGridSelector - 相关设定网格容器选择器。
 * @param {string} opts.refsSelector - 参考资料列表容器选择器。
 * @param {string} opts.copyBtnSelector - 复制链接按钮选择器。
 */
export function initSettingsDetail(opts) {
  const {
    data,
    titleSelector,
    categorySelector,
    summarySelector,
    descriptionSelector,
    statsSelector,
    
  } = opts;

  // 解析 URL 参数中的 id（中文注释）
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    renderNotFound('缺少参数 id');
    return;
  }
  const item = data.find(d => d.id === id);
  if (!item) {
    renderNotFound(`未找到设定：${id}`);
    return;
  }

  // 选择元素（中文注释）
  const titleEl = document.querySelector(titleSelector);
  const catEl = document.querySelector(categorySelector);
  const imgEl = null;
  const imgPhEl = null;
  const summaryEl = document.querySelector(summarySelector);
  const descEl = document.querySelector(descriptionSelector);
  const statsEl = document.querySelector(statsSelector);
  const relatedEl = null;
  const refsEl = null;
  const copyBtn = null;

  // 标题与分类（中文注释）
  if (titleEl) titleEl.textContent = item.name || '设定详情';
  document.title = `${item.name || '设定详情'} · 流浪地球主题站`;
  if (catEl) catEl.textContent = item.category || '';

  // 图片已移除（中文注释）

  // 摘要与描述（中文注释）
  if (summaryEl) summaryEl.textContent = item.summary || '';
  if (descEl) {
    const desc = item.description || '';
    // 支持将长描述按“。 ”分段显示（中文注释）
    const paras = desc.split(/\n+|(?<=。)\s+/).filter(Boolean);
    descEl.innerHTML = paras.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  }

  // 统计/关键事实（中文注释）
  if (statsEl) {
    const stats = item.stats || {};
    const keys = Object.keys(stats);
    if (!keys.length) {
      statsEl.innerHTML = '<div class="muted">暂无关键事实</div>';
    } else {
      statsEl.innerHTML = keys.map(k => `
        <div class="stat-item"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(stats[k]))}</dd></div>
      `).join('');
    }
  }

  // 相关设定：已移除（中文注释）

  // 参考资料：已移除（中文注释）

  // 复制链接：已移除（中文注释）
}

// 简易转义（中文注释）：避免插入 HTML 的 XSS 风险
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 属性值转义（中文注释）
function escapeAttr(str) {
  return escapeHtml(str).replace(/\s/g, '%20');
}

// 未找到页的简单替代渲染（中文注释）
function renderNotFound(msg) {
  const container = document.querySelector('#setting-detail .container');
  if (!container) return;
  container.innerHTML = `
    <h1 class="section-title">未找到设定</h1>
    <p class="lead">${escapeHtml(msg || '请返回设定百科重试。')}</p>
    <div class="section-actions" style="margin-top: 12px;">
      <a class="btn btn-outline" href="settings.html">返回设定百科</a>
    </div>
  `;
}
