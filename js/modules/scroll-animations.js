// scroll-animations.js —— 滚动触发动画（中文注释）
// 职责：使用 IntersectionObserver 观察 .reveal 元素，进入视口时添加 .reveal-active。

export function initScrollAnimations({ selector = '.reveal', activeClass = 'reveal-active' } = {}) {
  const items = Array.from(document.querySelectorAll(selector));
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(activeClass);
        // 添加后即可取消观察，提高性能
        io.unobserve(entry.target);
      }
    });
  }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

  items.forEach((el, idx) => {
    // 分段延迟：使相邻元素进场更有节奏感
    el.style.transitionDelay = `${(idx % 4) * 120}ms`;
    io.observe(el);
  });
}

