// arrow-visibility.js —— 时间线右侧箭头的可见性控制（中文注释）
// 职责：当 #overview（时间线板块）进入视窗时显示箭头，离开视窗时隐藏。
// 原则：不改变文档结构，只通过类名控制显隐与动画触发。

/**
 * 初始化箭头可见性控制（中文注释）
 * @param {Object} options
 * @param {string} options.arrowSelector 箭头元素选择器（如：'#overview .arrow-link'）
 * @param {string} options.sectionSelector 需要观察的版块选择器（如：'#overview'）
 * @param {number} [options.threshold=0.35] 可见度阈值（交叉比例）
 */
export function initArrowVisibility({ arrowSelector, sectionSelector, threshold = 0.35 } = {}) {
  const arrow = document.querySelector(arrowSelector);
  const section = document.querySelector(sectionSelector);
  if (!arrow || !section) return;

  // 兼容性处理：若不支持 IntersectionObserver，则默认显示（中文注释）
  if (typeof IntersectionObserver !== 'function') {
    arrow.classList.add('is-visible');
    return;
  }

  // 使用 IntersectionObserver 观察时间线板块，控制箭头显隐（中文注释）
  const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
      arrow.classList.add('is-visible');
      arrow.setAttribute('aria-hidden', 'false');
    } else {
      arrow.classList.remove('is-visible');
      arrow.setAttribute('aria-hidden', 'true');
    }
  }, {
    root: null,
    threshold: [0, threshold, 0.99]
  });

  observer.observe(section);
}

