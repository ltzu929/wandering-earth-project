// nav.js —— 导航交互（中文注释）
// 职责：
// 1）根据滚动位置为导航添加/移除 .scrolled 类，增强背景与可读性；
// 2）为锚点链接提供平滑滚动；
// 3）（可选）根据可视段落高亮当前菜单项（此处保留基础逻辑）。

export function initNav() {
  const header = document.querySelector('#site-header .nav');
  const links = document.querySelectorAll('.nav-list a[href^="#"]');

  // 滚动时加深导航背景（桌面端体验更稳定）
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (!header) return;
    if (y > 20) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // 初始化时执行一次

  // 锚点平滑滚动（拦截默认行为，由 JS 控制）
  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const href = a.getAttribute('href');
      const target = href ? document.querySelector(href) : null;
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

