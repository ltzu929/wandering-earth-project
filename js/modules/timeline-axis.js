// timeline-axis.js —— 为首页世界观时间线（#overview）在轨道上渲染年份刻度（中文注释）
// 职责：
// 1）读取每个 .timeline-node 的位置与数据年份，在 .timeline 容器上生成对齐的刻度文字；
// 2）监听窗口尺寸变化，重新计算刻度位置，保证响应式；
// 3）与现有交互模块（timeline.js）解耦，仅负责“轴刻度”的渲染与更新。

/**
 * 计算并渲染刻度（中文注释）
 */
function renderTicks({ container, nodes }) {
  if (!container || !nodes || !nodes.length) return;

  // 若已存在旧的轴容器，先移除，避免重复（中文注释）
  const oldAxis = container.querySelector('.timeline-axis');
  if (oldAxis) oldAxis.remove();

  // 创建轴容器（绝对定位在轨道上方，随容器横向滚动）
  const axis = document.createElement('div');
  axis.className = 'timeline-axis';

  // 以容器为参考系计算每个节点的中心点位置（中文注释）
  const containerRect = container.getBoundingClientRect();

  nodes.forEach((node) => {
    const year = node.getAttribute('data-year');
    const nodeRect = node.getBoundingClientRect();
    // 可视坐标转内容坐标：可视差 + 滚动偏移 + 半宽（中文注释）
    const left = (nodeRect.left - containerRect.left) + container.scrollLeft + (nodeRect.width / 2);

    const tick = document.createElement('span');
    tick.className = 'timeline-tick';
    tick.style.left = `${left}px`;
    tick.textContent = year || '';
    axis.appendChild(tick);
  });

  container.appendChild(axis);
}

/**
 * 初始化入口（中文注释）
 */
export function initTimelineAxis({ containerSelector = '#overview .timeline', nodesSelector = '#overview .timeline-node' } = {}) {
  const container = document.querySelector(containerSelector);
  const nodes = Array.from(document.querySelectorAll(nodesSelector));
  if (!container || !nodes.length) return;

  // 第一次渲染（中文注释）
  renderTicks({ container, nodes });

  // 监听窗口尺寸变化，重新计算（中文注释）
  let resizeRaf = null;
  const onResize = () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => renderTicks({ container, nodes }));
  };
  window.addEventListener('resize', onResize, { passive: true });

  // 若容器发生横向滚动，也重算一次，避免极端情况下的布局跳变（中文注释）
  let scrollRaf = null;
  const onScroll = () => {
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => renderTicks({ container, nodes }));
  };
  container.addEventListener('scroll', onScroll, { passive: true });
}

