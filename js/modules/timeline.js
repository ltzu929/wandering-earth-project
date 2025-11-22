// timeline.js —— 世界观时间线交互（中文注释）
// 职责：
// - 将“航线时间线”作为世界观载体，支持点击/键盘触发查看详情；
// - 管理节点激活态与详情面板内容更新；
// - 保持模块化，便于首页与其他页调用。

import { homeOverviewTimeline } from '../data/homeTimelineOverview.js';

export function initTimeline({ nodesSelector, detailSelector }) {
  const nodes = Array.from(document.querySelectorAll(nodesSelector));
  const detail = document.querySelector(detailSelector);
  if (!nodes.length || !detail) return;

  // 电影叙事版详情映射（按年份），来源于编年史数据模块（中文注释）
  const detailsMap = homeOverviewTimeline;

  // 记录“最后一次确定选择”的节点（点击/键盘触发），用于在悬浮结束后恢复（中文注释）
  let selectedNode = null;

  /**
   * 根据节点更新详情面板文本（中文注释）
   */
  const updateDetail = (node) => {
    const year = node.getAttribute('data-year');
    const info = year ? detailsMap[year] : null;
    const titleEl = detail.querySelector('.timeline-detail-title');
    const textEl = detail.querySelector('.timeline-detail-text');
    if (info && titleEl && textEl) {
      // 移除历史遗留的“分点列表”，改为纯段落描述（中文注释）
      const legacyList = detail.querySelector('.timeline-detail-list');
      if (legacyList) legacyList.remove();

      titleEl.textContent = info.title;
      textEl.textContent = info.text;
      // 桌面端：确保详情区域可见（中文注释）
      detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  /**
   * 确认选择：点击或键盘触发，更新激活态并记住当前节点（中文注释）
   */
  const activateNode = (node) => {
    nodes.forEach((n) => n.classList.remove('active'));
    node.classList.add('active');
    selectedNode = node;
    updateDetail(node);
  };

  /**
   * 悬浮预览：鼠标移入或获得焦点时，临时显示对应详情（中文注释）
   */
  const previewNode = (node) => {
    nodes.forEach((n) => n.classList.remove('active'));
    node.classList.add('active');
    updateDetail(node);
  };

  nodes.forEach((node) => {
    node.addEventListener('click', () => activateNode(node));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateNode(node);
      }
    });

    // 鼠标悬浮预览（中文注释）
    node.addEventListener('mouseenter', () => previewNode(node));
    // 鼠标离开后，如果存在“已选择的节点”，恢复其详情与激活态（中文注释）
    node.addEventListener('mouseleave', () => {
      if (selectedNode) {
        activateNode(selectedNode);
      } else {
        node.classList.remove('active');
      }
    });
    // 键盘焦点预览与离焦恢复（中文注释）
    node.addEventListener('focus', () => previewNode(node));
    node.addEventListener('blur', () => {
      if (selectedNode) activateNode(selectedNode);
    });
  });
}
