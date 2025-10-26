/**
 * MOSS 认证协议模块
 * 负责用户身份验证和登录转场效果
 * 
 * 功能特性：
 * - MOSS风格登录界面
 * - 粒子转场动画
 * - 科幻辉光效果
 * - 无缝过渡到主控台
 */

// 全局状态管理
let authState = {
    isAuthenticated: false,
    currentInput: '',
    isTransitioning: false,
    isActive: false,
    particles: []
};

// 粒子系统配置
const PARTICLE_CONFIG = {
    count: 50,
    speed: 2,
    fadeSpeed: 0.02,
    colors: ['#00FFFF', '#FFFFFF', '#00CCCC']
};

/**
 * 初始化认证模块
 */
/**
 * 显示认证模块
 */
function showAuth() {
    console.log('🔐 显示认证模块');
    
    const loginContainer = document.querySelector('.login-container');
    if (loginContainer) {
        loginContainer.style.display = 'block';
    }
    
    // 绑定键盘事件监听器
    document.addEventListener('keydown', handleKeyInput);
    
    authState.isActive = true;
}

/**
 * 隐藏认证模块
 */
function hideAuth() {
    console.log('🔄 隐藏认证模块');
    
    const loginContainer = document.querySelector('.login-container');
    if (loginContainer) {
        loginContainer.style.display = 'none';
    }
    
    // 移除键盘事件监听器
    document.removeEventListener('keydown', handleKeyInput);
    
    authState.isActive = false;
}

function initAuth() {
    console.log('🔐 MOSS认证协议已启动');
    
    // 创建粒子背景容器
    createParticleBackground();
    
    // 启动背景粒子动画
    startBackgroundParticles();
    
    console.log('✅ 认证界面初始化完成');
}

/**
 * 创建粒子背景容器
 */
function createParticleBackground() {
    const loginContainer = document.querySelector('.login-container');
    if (!loginContainer) return;
    
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particles-background';
    particleContainer.id = 'particles-bg';
    
    loginContainer.appendChild(particleContainer);
}

/**
 * 启动背景粒子动画
 */
function startBackgroundParticles() {
    const container = document.getElementById('particles-bg');
    if (!container) return;
    
    // 创建少量背景粒子
    for (let i = 0; i < 20; i++) {
        createBackgroundParticle(container);
    }
    
    // 启动粒子动画循环
    animateBackgroundParticles();
}

/**
 * 创建背景粒子
 */
function createBackgroundParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle-transition';
    
    // 随机位置和属性
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = Math.random() * window.innerHeight + 'px';
    particle.style.opacity = Math.random() * 0.3 + 0.1;
    
    // 随机大小
    const size = Math.random() * 2 + 1;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    container.appendChild(particle);
    
    // 添加到粒子数组
    authState.particles.push({
        element: particle,
        x: parseFloat(particle.style.left),
        y: parseFloat(particle.style.top),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: parseFloat(particle.style.opacity),
        life: 1.0
    });
}

/**
 * 动画背景粒子
 */
function animateBackgroundParticles() {
    authState.particles.forEach((particle, index) => {
        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // 边界检查
        if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
        if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;
        
        // 更新DOM元素
        particle.element.style.left = particle.x + 'px';
        particle.element.style.top = particle.y + 'px';
    });
    
    // 继续动画循环
    if (!authState.isTransitioning) {
        requestAnimationFrame(animateBackgroundParticles);
    }
}

/**
 * 处理键盘输入
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyInput(event) {
    // 只有在认证模块活跃时才处理输入
    if (!authState.isActive || authState.isTransitioning) {
        return;
    }
    
    event.preventDefault();
    
    switch (event.key) {
        case 'Enter':
            if (authState.currentInput.toLowerCase() === 'login') {
                executeLoginSequence();
            } else {
                showErrorFeedback();
            }
            break;
        case 'Backspace':
            if (authState.currentInput.length > 0) {
                authState.currentInput = authState.currentInput.slice(0, -1);
                updateInputDisplay();
            }
            break;
        default:
            if (event.key.length === 1) {
                authState.currentInput += event.key;
                updateInputDisplay();
            }
            break;
    }
}

/**
 * 更新输入显示
 */
function updateInputDisplay() {
    const inputDisplay = document.querySelector('.input-display');
    if (inputDisplay) {
        inputDisplay.textContent = authState.currentInput;
    }
}

/**
 * 显示错误反馈
 */
function showErrorFeedback() {
    const inputDisplay = document.querySelector('.input-display');
    if (!inputDisplay) return;
    
    // 保存原始内容
    const originalContent = inputDisplay.textContent;
    
    // 显示错误信息
    inputDisplay.textContent = '访问被拒绝 - 无效指令';
    inputDisplay.classList.add('error-text');
    
    // 2秒后恢复
    setTimeout(() => {
        inputDisplay.classList.remove('error-text');
        authState.currentInput = '';
        updateInputDisplay();
    }, 2000);
}

/**
 * 执行登录序列
 */
function executeLoginSequence() {
    console.log('🚀 开始MOSS登录序列');
    authState.isTransitioning = true;
    
    // 显示验证信息
    const inputDisplay = document.querySelector('.input-display');
    if (inputDisplay) {
        inputDisplay.textContent = '正在验证访问权限...';
        inputDisplay.style.color = '#FFFFFF';
    }
    
    // 延迟后开始粒子转场
    setTimeout(() => {
        startParticleTransition();
    }, 1500);
}

/**
 * 启动粒子转场效果
 */
function startParticleTransition() {
    console.log('✨ 启动粒子转场效果');
    
    const loginContainer = document.querySelector('.login-container');
    const particleContainer = document.getElementById('particles-bg');
    
    if (!loginContainer || !particleContainer) return;
    
    // 创建转场粒子
    createTransitionParticles(loginContainer, particleContainer);
    
    // 开始登录界面淡出
    setTimeout(() => {
        loginContainer.classList.add('login-fadeout');
    }, 500);
    
    // 转场完成后切换到主控台
    setTimeout(() => {
        transitionToMainConsole();
    }, 2500);
}

/**
 * 创建转场粒子效果
 */
function createTransitionParticles(loginContainer, particleContainer) {
    const commandPrompt = document.querySelector('.command-prompt');
    const cursor = document.querySelector('.cursor');
    const inputDisplay = document.querySelector('.input-display');
    
    // 为每个文本元素创建粒子分解效果
    [commandPrompt, cursor, inputDisplay].forEach(element => {
        if (element) {
            createTextParticles(element, particleContainer);
        }
    });
}

/**
 * 为文本元素创建粒子分解效果
 */
function createTextParticles(textElement, container) {
    const rect = textElement.getBoundingClientRect();
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle-transition';
        
        // 从文本位置开始
        const startX = rect.left + Math.random() * rect.width;
        const startY = rect.top + Math.random() * rect.height;
        
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        particle.style.opacity = '1';
        
        // 随机颜色
        const color = PARTICLE_CONFIG.colors[Math.floor(Math.random() * PARTICLE_CONFIG.colors.length)];
        particle.style.background = color;
        particle.style.boxShadow = `0 0 4px ${color}`;
        
        container.appendChild(particle);
        
        // 动画粒子
        animateTransitionParticle(particle);
    }
}

/**
 * 动画转场粒子
 */
function animateTransitionParticle(particle) {
    const startX = parseFloat(particle.style.left);
    const startY = parseFloat(particle.style.top);
    
    // 随机方向和速度
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    let x = startX;
    let y = startY;
    let opacity = 1;
    
    function animate() {
        x += vx;
        y += vy;
        opacity -= PARTICLE_CONFIG.fadeSpeed;
        
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.opacity = opacity;
        
        if (opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            particle.remove();
        }
    }
    
    animate();
}

/**
 * 转场到主控台
 */
function transitionToMainConsole() {
    console.log('🎯 转场到航程引导模块');
    
    // 隐藏登录界面
    const loginContainer = document.querySelector('.login-container');
    if (loginContainer) {
        loginContainer.style.display = 'none';
    }
    
    // 切换到航程引导模块
    if (window.MossApp && window.MossApp.switchModule) {
        window.MossApp.switchModule('auth', 'voyage');
    }
    
    // 更新认证状态
    authState.isAuthenticated = true;
    
    // 播放转场完成音效（占位符）
    playTransitionCompleteSound();
    
    console.log('✅ 航程引导模块激活完成');
}

/**
 * 播放转场完成音效（占位符）
 */
function playTransitionCompleteSound() {
    // TODO: 实现音效播放
    console.log('🔊 播放转场完成音效');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initAuth);

// 导出模块接口
window.AuthModule = {
    init: initAuth,
    show: showAuth,
    hide: hideAuth,
    isActive: () => authState.isActive,
    isAuthenticated: () => authState.isAuthenticated,
    getCurrentInput: () => authState.currentInput,
    forceLogin: executeLoginSequence
};