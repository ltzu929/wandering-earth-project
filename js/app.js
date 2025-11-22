// app.js —— 入口脚本（中文注释）
// app.js —— 核心应用逻辑（中文注释）
import { initNav } from './modules/nav.js';
import { initHeroVideo } from './modules/hero-video.js';
import { initAudio } from './modules/audio.js';
import { initScrollAnimations } from './modules/scroll-animations.js';
import { initTimeline } from './modules/timeline.js';
import { settingsData } from './data/settingsData.js';
import { initSettings } from './modules/settings.js';
import { initArrowVisibility } from './modules/arrow-visibility.js';
import { initFactions } from './modules/factions.js';
// 不再渲染首页时间线的年份刻度（根据需求移除，中文注释）

// 首页精选设定：只展示最具代表性的7-8个设定（中文注释）
// 选择标准：涵盖核心概念、关键技术、重大事件、主要角色等不同方面
// 既能体现流浪地球世界的宏大世界观，又能激发用户兴趣点击查看更多
const featuredSettings = [
  settingsData.find(item => item.id === 'concept-wandering-earth'), // 流浪地球计划 - 核心概念
  settingsData.find(item => item.id === 'tech-planetary-engine'), // 行星发动机 - 关键技术
  settingsData.find(item => item.id === 'concept-jupiter-crisis'), // 木星引力危机 - 重大事件
  settingsData.find(item => item.id === 'tech-moss'), // 人工智能MOSS - AI系统
  settingsData.find(item => item.id === 'concept-underground-city'), // 地下城 - 社会环境
  
].filter(Boolean); // 过滤掉未找到的项，确保数据安全

// 等待 DOM 就绪后进行初始化，保证元素可用
document.addEventListener('DOMContentLoaded', () => {
  // 1）初始化导航（滚动加深背景、锚点平滑跳转）
  initNav();

  // 2）初始化首屏视频（自动播放与降级处理）
  initHeroVideo({
    videoSelector: '#hero-video',
    overlaySelector: '.hero-overlay'
  });

  // 3）初始化氛围音效（按钮控制开关、记忆用户选择）
  initAudio({
    audioSelector: '#ambience',
    toggleButtonSelector: '#audio-toggle'
  });

  // 4）初始化滚动触发动画（统一 reveal 动画）
  initScrollAnimations({
    selector: '.reveal',
    activeClass: 'reveal-active'
  });

  // 5）“点火 · 探索”按钮：触发视觉强调并滚动至世界观段落
  const igniteBtn = document.querySelector('#ignite-btn');
  if (igniteBtn) {
    igniteBtn.addEventListener('click', () => {
      igniteBtn.classList.add('ignite-flash');
      const target = document.querySelector('#overview');
      if (target) {
        // 平滑滚动到下一段（桌面端）
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // 动画类短暂保留后移除，避免长期占用
      setTimeout(() => igniteBtn.classList.remove('ignite-flash'), 1000);
    });
  }

  // 6）初始化世界观时间线交互（节点点击显示详情）
  initTimeline({
    nodesSelector: '#overview .timeline-node',
    detailSelector: '#overview #timeline-detail'
  });

  // 7）初始化设定列表 + 右侧图片预览
  // 使用精选设定数据，而非全部22个设定，让首页更简洁（中文注释）
  initSettings('#settings-thumbs', featuredSettings, { previewSelector: '#settings-preview' });

  // 8）原：在轨道上渲染年份刻度（与节点位置对齐）
  // 现：根据你的要求，移除年份刻度的渲染，避免出现 span.timeline-tick（中文注释）

  // 9）为新插入的 .reveal 元素重新绑定滚动触发动画（保证列表项显示）
  initScrollAnimations({ selector: '.reveal', activeClass: 'reveal-active' });

  // 10）时间线右侧箭头：仅在 #overview 可见时显示（中文注释）
  initArrowVisibility({
    arrowSelector: '#overview .arrow-link',
    sectionSelector: '#overview',
    threshold: 0.35
  });

  // 设置页右侧箭头：仅在 #settings 可见时显示，并点击跳转到更多内容（中文注释）
  initArrowVisibility({
    arrowSelector: '#settings .arrow-link',
    sectionSelector: '#settings',
    threshold: 0.35
  });
  const settingsArrow = document.querySelector('#settings .arrow-link');
  if (settingsArrow) {
    settingsArrow.addEventListener('click', () => { window.location.href = 'settings.html'; });
    settingsArrow.setAttribute('aria-hidden', 'true');
  }

  // 各大势力：仅提供点击跳转，不做默认选中与键盘支持（中文注释）
  initFactions();

  // 返回详情页后的到达过渡：从右到左遮罩滑入（中文注释）
  try {
    const flag = sessionStorage.getItem('rtlTransition');
    if (flag === '1') {
      sessionStorage.removeItem('rtlTransition');
      sessionStorage.removeItem('rtlTransitionTarget');
      const overlay = document.createElement('div');
      overlay.className = 'page-transition-rtl';
      document.body.appendChild(overlay);
      overlay.addEventListener('animationend', () => { overlay.remove(); }, { once: true });
      setTimeout(() => { overlay.remove(); }, 580);
    }
  } catch (_) {}
});
