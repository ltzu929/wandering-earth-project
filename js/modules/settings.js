// js/modules/settings.js
// 世界观设定列表 + 图片预览模块（中文注释）

/**
 * 初始化世界观设定板块：左侧列表 + 右侧图片预览。
 * @param {string} listSelector - 左侧列表容器选择器（如 '#settings-list'）。
 * @param {Array<Object>} data - 设定数据数组。
 * @param {Object} [opts]
 * @param {string} [opts.previewSelector] - 右侧预览容器选择器（默认 '#settings-preview'）。
 */
export function initSettings(listSelector, data, { previewSelector = '#settings-preview' } = {}) {
  const listEl = document.querySelector(listSelector);
  const previewEl = document.querySelector(previewSelector);
  if (!listEl) return;
  listEl.innerHTML = '';

  const frag = document.createDocumentFragment();
  data.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'thumb-item reveal';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.dataset.id = item.id;

    const imageDiv = document.createElement('div');
    imageDiv.className = 'thumb-image';
    if (item.image) {
      imageDiv.style.backgroundImage = `url(${item.image})`;
    } else {
      imageDiv.classList.add('skeleton');
    }
    const title = document.createElement('div');
    title.className = 'thumb-title';
    title.textContent = item.name;
    card.appendChild(imageDiv);
    card.appendChild(title);

    const show = () => showPreview({ item, previewEl, listEl });
    card.addEventListener('mouseenter', show);
    card.addEventListener('focus', show);
    card.addEventListener('click', () => {
      listEl.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
      card.classList.add('active');
      show();
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
    frag.appendChild(card);
  });
  listEl.appendChild(frag);

  if (data.length) {
    const first = listEl.querySelector('.thumb-item');
    if (first) {
      first.classList.add('active');
      showPreview({ item: data[0], previewEl, listEl });
    }
  }

  // 首次进入视窗时，若缩略项已在可视区域内，直接激活显示
  try {
    const items = listEl.querySelectorAll('.thumb-item.reveal');
    if (items.length) {
      requestAnimationFrame(() => {
        const vh = window.innerHeight || document.documentElement.clientHeight || 800;
        items.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < vh * 0.9 && r.bottom > 0) {
            el.classList.add('reveal-active');
          }
        });
      });
    }
  } catch (_) {}
}

/**
 * 更新右侧预览区域为指定项的图片。
 * @param {Object} ctx
 * @param {Object} ctx.item - 设定项数据对象。
 * @param {HTMLElement} ctx.previewEl - 预览容器。
 * @param {HTMLElement} ctx.listEl - 列表容器，用于同步激活态。
 */
function showPreview({ item, previewEl, listEl }) {
  if (!previewEl) return;
  previewEl.innerHTML = '';

  // 背景图设为整个预览区域（中文注释）
  if (item.image) {
    previewEl.style.backgroundImage = `url(${item.image})`;
    previewEl.style.backgroundSize = 'cover';
    previewEl.style.backgroundPosition = 'center';
    previewEl.style.backgroundRepeat = 'no-repeat';
  } else {
    previewEl.style.backgroundImage = '';
  }

  const info = document.createElement('div');
  info.className = 'settings-info';
  const title = document.createElement('h3');
  title.className = 'settings-info-title';
  title.textContent = item.name || '';
  const summary = document.createElement('p');
  summary.className = 'settings-info-summary';
  summary.textContent = item.summary || '';
  const desc = document.createElement('p');
  desc.className = 'settings-info-desc';
  desc.textContent = item.description || '';
  info.appendChild(title);
  info.appendChild(summary);
  info.appendChild(desc);

  const statsWrap = document.createElement('div');
  statsWrap.className = 'settings-info-stats';
  if (item.stats && typeof item.stats === 'object') {
    Object.entries(item.stats).forEach(([k, v]) => {
      const cell = document.createElement('div');
      cell.textContent = `${k}：${v}`;
      statsWrap.appendChild(cell);
    });
    info.appendChild(statsWrap);
  }

  previewEl.appendChild(info);

  if (listEl) {
    listEl.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
    const activeEl = listEl.querySelector(`.thumb-item[data-id="${item.id}"]`);
    if (activeEl) activeEl.classList.add('active');
  }
}
