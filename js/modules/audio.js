// audio.js —— 氛围音效控制（中文注释）
// 职责：
// - 提供按钮启停氛围音效；默认不自动播放，遵循浏览器策略；
// - 记忆用户选择（localStorage），下次访问保持同样偏好；
// - 可扩展：音量渐入/淡出、音景切换。

export function initAudio({ audioSelector = '#ambience', toggleButtonSelector } = {}) {
  // 音频初始化：进入页面即尝试播放；若无按钮，则仅做自动播放与失败处理
  const audio = document.querySelector(audioSelector);
  const btn = toggleButtonSelector ? document.querySelector(toggleButtonSelector) : null;
  if (!audio) return;

  // 尽可能让浏览器加载并播放（不强制静音）；若被策略拦截，监听一次用户手势后继续播放
  // 尝试立即播放；若失败，注册更广的交互事件用于解锁
  const playImmediate = async () => {
    try {
      audio.autoplay = true;
      audio.preload = 'auto';
      audio.loop = true; // 循环播放
      audio.muted = false; // 明确取消静音
      await audio.play();
    } catch (err) {
      console.warn('[audio] 自动播放被浏览器限制，等待用户手势解锁。', err);

      // 更广覆盖的事件列表：点击、按键、触摸、滚轮、移动等
      const gestures = [
        'click','mousedown','mouseup','pointerdown','pointerup',
        'touchstart','touchend','keydown','keypress','keyup',
        'wheel','mousewheel','mousemove','contextmenu'
      ];

      const resume = async () => {
        try { audio.loop = true; audio.muted = false; await audio.play(); } catch (_) {}
        cleanup();
      };
      const cleanup = () => {
        gestures.forEach((ev) => window.removeEventListener(ev, resume, opts));
        document.removeEventListener('visibilitychange', onVisible, opts);
        window.removeEventListener('scroll', resume, opts);
      };
      const opts = { once: true, passive: true, capture: false };
      gestures.forEach((ev) => window.addEventListener(ev, resume, opts));
      // 可见性变化（标签页切回时尝试播放）与滚动也尝试触发一次
      const onVisible = () => { if (document.visibilityState === 'visible') resume(); };
      document.addEventListener('visibilitychange', onVisible, opts);
      window.addEventListener('scroll', resume, opts);
    }
  };

  // 若存在按钮，则提供开启/关闭控制（保持兼容），默认进入时尝试播放
  if (btn) {
    const setEnabledUI = (on) => {
      btn.textContent = on ? '关闭音效' : '开启音效';
      btn.classList.toggle('btn-primary', on);
      btn.classList.toggle('btn-outline', !on);
    };
    // 默认播放
    setEnabledUI(true);
    playImmediate();
    btn.addEventListener('click', async () => {
      const isOn = btn.textContent.includes('关闭');
      if (isOn) {
        audio.pause();
        setEnabledUI(false);
      } else {
        await playImmediate();
        setEnabledUI(true);
      }
    });
  } else {
    // 无按钮：仅做自动播放尝试
    playImmediate();
  }
}
