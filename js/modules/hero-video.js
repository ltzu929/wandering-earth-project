// hero-video.js —— 首屏视频控制与降级处理（中文注释）
// 职责：
// - 尝试自动播放（muted + autoplay + loop），若失败，则保留海报与背景降级；
// - 保持铺满视口的裁切（object-fit: cover），兼容不同桌面分辨率；
// - 可扩展：根据网络状况或用户交互切换清晰度。

export function initHeroVideo({ videoSelector = '#hero-video', overlaySelector = '.hero-overlay' } = {}) {
  const video = document.querySelector(videoSelector);
  const overlay = document.querySelector(overlaySelector);
  if (!video) return;

  // 桌面浏览器通常允许 muted 的自动播放；如失败则进入降级
  const tryPlay = async () => {
    try {
      await video.play();
      // 成功播放时，适度提升叠加层透明度，保留空间感同时保证可读性
      if (overlay) overlay.style.backgroundBlendMode = 'normal';
    } catch (err) {
      // 自动播放失败：移除 autoplay 属性并保留 poster/背景
      video.removeAttribute('autoplay');
      // 叠加层加强，以获得更好对比度
      if (overlay) overlay.style.background = 'linear-gradient(180deg, rgba(8,11,16,0.9) 0%, rgba(8,11,16,0.7) 100%)';
      // 控制台提示，便于调试资源或策略问题
      console.warn('[hero-video] 自动播放失败，已降级为静态背景。', err);
    }
  };

  // 视频就绪后尝试播放；若资源缺失则不报错，保持静态背景
  if (video.readyState >= 2) {
    tryPlay();
  } else {
    video.addEventListener('canplay', tryPlay, { once: true });
  }

  // 视口变化时维持覆盖裁切（多数浏览器 object-fit 即可）
  const onResize = () => {
    // 这里保留扩展点：可根据窗口比例动态选择更合适的视频源。
  };
  window.addEventListener('resize', onResize);
}

