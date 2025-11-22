// timeline-full.js —— 完整时间线渲染与交互模块（中文注释）
// 职责：从 timelineData 读取数据，渲染左侧年份列表并在右侧展示详情；
//      支持按“航线/工程/人文”类别筛选；支持 URL 参数定位指定年份。

import { timelineData } from '../data/timelineData.js';

/**
 * 根据第一个与最后一个年份项，动态设置时间脊柱的起止位置（中文注释）
 * 目标：让竖线从第一个圆点开始，到最后一个圆点结束，不再“穿头穿尾”。
 */
function updateSpineRange({ listEl }) {
  if (!listEl) return;
  const items = listEl.querySelectorAll('.year-item');
  if (!items.length) {
    // 无项目时移除变量（中文注释）
    listEl.style.removeProperty('--spine-top');
    listEl.style.removeProperty('--spine-bottom');
    return;
  }
  const listRect = listEl.getBoundingClientRect();
  const firstRect = items[0].getBoundingClientRect();
  const lastRect = items[items.length - 1].getBoundingClientRect();
  // 圆点位于年份项垂直居中（top + height/2）（中文注释）
  const firstCenter = (firstRect.top - listRect.top) + (firstRect.height / 2);
  const lastCenter = (lastRect.top - listRect.top) + (lastRect.height / 2);
  const topOffset = Math.round(firstCenter);
  const bottomOffset = Math.round(listRect.height - lastCenter);
  listEl.style.setProperty('--spine-top', `${topOffset}px`);
  listEl.style.setProperty('--spine-bottom', `${bottomOffset}px`);
}

/**
 * 将年份列表渲染到左侧导航（中文注释）
 */
function renderYearList({ container, data }) {
  // 先清空容器（中文注释）
  container.innerHTML = '';
  // 按年份升序排序（中文注释）
  const sorted = [...data].sort((a, b) => a.year - b.year);
  // 创建文档片段，降低多次插入的性能开销（中文注释）
  const frag = document.createDocumentFragment();
  sorted.forEach((item, idx) => {
    const li = document.createElement('li');
    // 年份项：默认为滚动出现动画的隐藏态，左右交替方向（中文注释）
    li.className = 'year-item tl-appear ' + (idx % 2 === 0 ? 'tl-left' : 'tl-right');
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    // 使用唯一 key，避免“同一年多事件”冲突（中文注释）
    li.dataset.key = String(idx);
    // 同时记录年份，便于深链定位（中文注释）
    li.dataset.year = String(item.year);

    const yearEl = document.createElement('div');
    yearEl.className = 'year';
    yearEl.textContent = String(item.year);

    const titleEl = document.createElement('div');
    titleEl.className = 'title';
    titleEl.textContent = item.title;
    li.appendChild(yearEl);
    li.appendChild(titleEl);
    frag.appendChild(li);
  });
  container.appendChild(frag);
  // 渲染完成后更新时间脊柱的起止位置（中文注释）
  updateSpineRange({ listEl: container });
  // 渲染完成后启动滚动出现动画（中文注释）
  initAppearAnimations(container);
}

/**
 * 根据当前选中项更新右侧详情面板（中文注释）
 */
function updateDetail({ detailEl, item }) {
  detailEl.innerHTML = '';
  const title = document.createElement('h2');
  title.className = 'timeline-detail-title';
  title.textContent = `${item.year} · ${item.title}`;

  const text = document.createElement('p');
  text.className = 'timeline-detail-text';
  text.textContent = item.content;

  // 先插入标题（中文注释）
  detailEl.appendChild(title);
  // 可选插图：若数据提供 image，则在详情区展示（中文注释）
  if (item.image) {
    const img = document.createElement('img');
    img.className = 'timeline-detail-image';
    img.src = item.image; // 例如 'assets/images/jupiter-burn.jpg'
    img.alt = item.title;
    // 图片加载失败时优雅降级（中文注释）
    img.addEventListener('error', () => {
      img.remove();
    });
    detailEl.appendChild(img);
  }
  // 再插入正文（中文注释）
  detailEl.appendChild(text);

  // 叙事式正文（单段）：优先使用数据提供的 story；否则将 details/类别要点整合为一段完整叙述（中文注释）
  const body = document.createElement('div');
  body.className = 'timeline-detail-body';
  const narrative = composeNarrative(item);
  const p = document.createElement('p');
  p.textContent = narrative;
  body.appendChild(p);
  detailEl.appendChild(body);

  // 元信息：类别与阶段（中文注释）
  const meta = document.createElement('div');
  meta.className = 'timeline-detail-meta';
  meta.textContent = `类别：${item.category} · 阶段：${item.phase || '—'}`;
  detailEl.appendChild(meta);

  try {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 900px)').matches) {
      detailEl.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  } catch (_) {}
}

// 叙事段落生成：基于 story/要点与类别，组织为“起因—过程—结果—影响”（中文注释）
function composeNarrative(item) {
  // 若提供了多段 story，则合并为单段（中文注释）
  if (typeof item.story === 'string' && item.story.trim().length > 0) {
    return item.story.replace(/\s*\n+\s*/g, ' ').trim();
  }
  const details = Array.isArray(item.details) ? item.details : [];
  const titlePart = `${item.title}发生于“${item.phase || '当期阶段'}”，${item.content}。`;
  const backgroundPart = '在全球协作与资源约束并存的语境下，它成为叙事与工程的交汇点。';
  const prepRaw = composeCategoryPreparation(item);
  const execRaw = details.length
    ? `围绕核心目标按既定节奏推进：${details.join('；')}，全过程保持审计与回退预案。`
    : composeCategoryMiddle(item);
  const outcomeRaw = composeCategoryOutcome(item);
  const impactRaw = composeCategoryImpact(item);

  // 去除分点式标签，使语句更连贯（中文注释）
  const strip = (s) => String(s)
    .replace(/^准备：/, '')
    .replace(/^结果：/, '')
    .replace(/^结果是/, '最终，')
    .replace(/^(工程团队|航天与计算团队|治理结构)[，：]/, '$1在');

  const prep = strip(prepRaw);
  const exec = strip(execRaw);
  const outcome = strip(outcomeRaw);
  const impact = strip(impactRaw);

  return [titlePart, backgroundPart, prep, exec, outcome, impact].join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function composeCategoryMiddle(item) {
  switch (item.category) {
    case '工程':
      return '工程团队在技术验证—小规模部署—风险回滚的闭环中推进，MOSS 与人工值守形成双轨制以保障安全。';
    case '航线':
      return '航天与计算团队依据窗口参数进行轨道与姿态协同校正，确保能量交换与推力分配的整体效率。';
    case '人文':
      return '治理结构、伦理与社会秩序在争论与妥协中调整，公共沟通与教育维持大规模协作的韧性。';
    default:
      return '相关方在既定约束与目标之下持续推进，细节以安全与可靠为先。';
  }
}

function composeCategoryImpact(item) {
  switch (item.category) {
    case '工程':
      return '结果是工程能力与安全冗余同步提升，为后续节点提供坚实的技术与组织基础。';
    case '航线':
      return '结果是航线稳定性与推进效率得到保证，后续调整与观测窗口更为可控。';
    case '人文':
      return '结果是治理与社会体系适应了长期非常态，文明选择被系统记录并影响后续决策。';
    default:
      return '该事件的完成直接改善了体系运行质量，并对后续阶段产生持续正向影响。';
  }
}

function composeCategoryPreparation(item) {
  switch (item.category) {
    case '工程':
      return '准备：以“试验—验证—部署”的闭环推进方案，完成风险识别、冗余设计与物资调度；MOSS 与人工值守的职责边界被明确。';
    case '航线':
      return '准备：围绕窗口参数与姿态稳定的目标，建立联合仿真与地面—轨道的闭环校验，确保能量管理与推力分配的可控性。';
    case '人文':
      return '准备：治理结构与社会沟通机制被同步优化，伦理与公共教育的议题进入常态化讨论，为长期协作提供韧性。';
    default:
      return '准备：各方在约束条件下完成必要的校验与资源预置，确保执行阶段可控可回退。';
  }
}

function composeCategoryOutcome(item) {
  switch (item.category) {
    case '工程':
      return '结果：关键里程碑如期完成，系统稳定性与可维护性得到验证，经验被记录并回流到后续批次。';
    case '航线':
      return '结果：轨道策略与姿态控制达到预期，能量曲线保持在安全与效率的平衡带之内。';
    case '人文':
      return '结果：社会秩序与治理能力在磨合中稳步提升，面向公众的叙事更为清晰一致。';
    default:
      return '结果：任务达成并进入复盘环节，形成制度化的经验与风险库。';
  }
}

/**
 * 绑定交互事件（点击与键盘触发），并管理激活态（中文注释）
 */
function bindInteractions({ listEl, detailEl, filteredData }) {
  // 以唯一 key 建立映射，支持同一年多事件（中文注释）
  const itemsByKey = new Map();
  filteredData.forEach((d, i) => itemsByKey.set(String(i), d));

  // 激活态同步（中文注释）
  function setActive(target) {
    listEl.querySelectorAll('.year-item.active').forEach((el) => el.classList.remove('active'));
    if (target) target.classList.add('active');
  }

  function handleSelect(keyStr, targetEl) {
    const item = itemsByKey.get(keyStr);
    if (!item) return;
    setActive(targetEl);
    if (detailEl) {
      updateDetail({ detailEl, item });
    }
  }

  listEl.addEventListener('click', (e) => {
    const target = e.target.closest('.year-item');
    if (!target) return;
    handleSelect(target.dataset.key, target);
  });

  listEl.addEventListener('keydown', (e) => {
    const target = e.target.closest('.year-item');
    if (!target) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(target.dataset.key, target);
    }
  });
}

/**
 * 根据筛选选项过滤数据（中文注释）
 */
function getFilteredData(category) {
  if (!category || category === 'all') return timelineData;
  return timelineData.filter((d) => d.category === category);
}

/**
 * 支持通过 URL 参数 ?year=2102 直接定位（中文注释）
 */
function applyDeepLink({ listEl, detailEl, filteredData }) {
  const params = new URLSearchParams(window.location.search);
  const yearStr = params.get('year');
  if (!yearStr) return;
  const targetEl = listEl.querySelector(`.year-item[data-year="${yearStr}"]`);
  if (targetEl) {
    targetEl.focus();
    targetEl.click();
  } else {
    // 若当前筛选不包含该年份，回退为“全部”以尝试定位（中文注释）
    const allRadio = document.querySelector('.timeline-filters input[value="all"]');
    if (allRadio) {
      allRadio.checked = true;
      const dataAll = getFilteredData('all');
      renderYearList({ container: listEl, data: dataAll });
      bindInteractions({ listEl, detailEl, filteredData: dataAll });
      const fallbackEl = listEl.querySelector(`.year-item[data-year="${yearStr}"]`);
      if (fallbackEl) {
        fallbackEl.focus();
        fallbackEl.click();
      }
    }
  }
}

/**
 * 主初始化入口（中文注释）
 */
export function initTimelineFull({ listSelector, detailSelector, filterSelector }) {
  const listEl = document.querySelector(listSelector);
  // 详情容器可选：不存在时以纯列表模式运行（中文注释）
  const detailEl = (typeof detailSelector === 'string') ? document.querySelector(detailSelector) : null;
  const filtersEl = filterSelector ? document.querySelector(filterSelector) : null;
  if (!listEl) return;

  // 初始渲染：全部类别（中文注释）
  let currentCategory = 'all';
  let filteredData = getFilteredData(currentCategory);
  renderYearList({ container: listEl, data: filteredData });
  bindInteractions({ listEl, detailEl, filteredData });
  applyDeepLink({ listEl, detailEl, filteredData });
  // 监听窗口尺寸变化，动态调整时间脊柱范围（中文注释）
  window.addEventListener('resize', () => updateSpineRange({ listEl }));

  // 若存在筛选控件则绑定交互（中文注释）
  if (filtersEl) {
    filtersEl.addEventListener('change', (e) => {
      const radio = e.target.closest('input[type="radio"][name="tl-cat"]');
      if (!radio) return;
      currentCategory = radio.value;
      filteredData = getFilteredData(currentCategory);
      renderYearList({ container: listEl, data: filteredData });
      bindInteractions({ listEl, detailEl, filteredData });
      // 切换筛选后清空详情提示（中文注释）
      if (detailEl) {
        detailEl.innerHTML = '<h2 class="timeline-detail-title">选择左侧年份查看详情</h2>';
      }
      // 切换数据后更新时间脊柱范围（中文注释）
      updateSpineRange({ listEl });
    });
  }
}
/**
 * 使用 IntersectionObserver 让年份项在进入视窗时划入呈现（中文注释）
 */
function initAppearAnimations(listEl) {
  const items = listEl.querySelectorAll('.year-item.tl-appear');
  if (!items.length) return;
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('tl-in-view');
        // 进入后取消观察，避免重复触发（中文注释）
        obs.unobserve(entry.target);
      }
    });
  }, { root: null, threshold: 0.08, rootMargin: '0px 0px -10% 0px' });
  items.forEach((el) => io.observe(el));
}
