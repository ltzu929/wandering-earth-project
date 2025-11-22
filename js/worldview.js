// worldview.js —— 世界观详情页入口脚本（中文注释）
// 职责：仅初始化详情页所需的模块（导航、音频、滚动动画），避免加载首屏视频逻辑。

import { initNav } from './modules/nav.js';
import { initAudio } from './modules/audio.js';
import { initScrollAnimations } from './modules/scroll-animations.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1）初始化导航（滚动加深背景）与锚点平滑（本页仅保留“返回首页”链接）
  initNav();

  // 2）初始化氛围音效（保持与首页一致的自动播放与循环）
  initAudio({
    audioSelector: '#ambience',
    toggleButtonSelector: '#audio-toggle'
  });

  // 3）初始化滚动触发动画（reveal）
  initScrollAnimations({
    selector: '.reveal',
    activeClass: 'reveal-active'
  });
});

