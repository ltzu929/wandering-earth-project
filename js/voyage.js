/**
 * 航程引导动画模块
 * 负责创建太阳系3D场景和电影级推镜动画
 * 
 * 功能特性：
 * - Three.js 3D太阳系场景
 * - 从宏观到地球特写的推镜动画
 * - 粒子星空背景
 * - 流畅的相机运动
 * - 无缝过渡到主控台
 */

// 全局状态管理
let voyageState = {
    scene: null,
    camera: null,
    renderer: null,
    container: null,
    isActive: false,
    animationId: null,
    planets: {},
    stars: null,
    timeline: null
};

// 动画配置
const VOYAGE_CONFIG = {
    duration: 8000,          // 总动画时长（毫秒）
    starCount: 2000,         // 星空粒子数量
    cameraPath: [
        { position: [0, 0, 100], target: [0, 0, 0], duration: 2000 },    // 太阳系全景
        { position: [20, 10, 50], target: [0, 0, 0], duration: 2000 },   // 接近内行星
        { position: [10, 5, 25], target: [8, 0, 0], duration: 2000 },    // 聚焦地球轨道
        { position: [12, 2, 15], target: [8, 0, 0], duration: 2000 }     // 地球特写
    ],
    planets: {
        sun: { radius: 2, position: [0, 0, 0], color: 0xFFAA00 },
        mercury: { radius: 0.2, position: [3, 0, 0], color: 0x8C7853, orbit: 3 },
        venus: { radius: 0.4, position: [4.5, 0, 0], color: 0xFFC649, orbit: 4.5 },
        earth: { radius: 0.5, position: [8, 0, 0], color: 0x6B93D6, orbit: 8 },
        mars: { radius: 0.3, position: [12, 0, 0], color: 0xCD5C5C, orbit: 12 }
    }
};

/**
 * 初始化航程引导模块
 */
function initVoyage() {
    console.log('🚀 初始化航程引导动画模块');
    
    // 创建Three.js场景
    createScene();
    
    // 创建星空背景
    createStarField();
    
    // 创建太阳系
    createSolarSystem();
    
    // 设置相机初始位置
    setupCamera();
    
    console.log('✅ 航程引导模块初始化完成');
}

/**
 * 创建Three.js场景
 */
function createScene() {
    // 创建场景
    voyageState.scene = new THREE.Scene();
    voyageState.scene.background = new THREE.Color(0x000000);
    
    // 创建相机
    voyageState.camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    
    // 创建渲染器
    voyageState.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    voyageState.renderer.setSize(window.innerWidth, window.innerHeight);
    voyageState.renderer.shadowMap.enabled = true;
    voyageState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    console.log('✅ Three.js场景创建完成');
}

/**
 * 创建星空背景
 */
function createStarField() {
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(VOYAGE_CONFIG.starCount * 3);
    const starColors = new Float32Array(VOYAGE_CONFIG.starCount * 3);
    
    for (let i = 0; i < VOYAGE_CONFIG.starCount; i++) {
        const i3 = i * 3;
        
        // 随机位置（球形分布）
        const radius = Math.random() * 200 + 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i3 + 2] = radius * Math.cos(phi);
        
        // 随机颜色（蓝白色调）
        const brightness = Math.random() * 0.5 + 0.5;
        starColors[i3] = brightness;
        starColors[i3 + 1] = brightness * (0.8 + Math.random() * 0.2);
        starColors[i3 + 2] = brightness;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    voyageState.stars = new THREE.Points(starGeometry, starMaterial);
    voyageState.scene.add(voyageState.stars);
    
    console.log('✅ 星空背景创建完成');
}

/**
 * 创建太阳系
 */
function createSolarSystem() {
    // 创建太阳
    const sunGeometry = new THREE.SphereGeometry(VOYAGE_CONFIG.planets.sun.radius, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: VOYAGE_CONFIG.planets.sun.color,
        emissive: VOYAGE_CONFIG.planets.sun.color,
        emissiveIntensity: 0.3
    });
    voyageState.planets.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    voyageState.planets.sun.position.set(...VOYAGE_CONFIG.planets.sun.position);
    voyageState.scene.add(voyageState.planets.sun);
    
    // 添加太阳光源
    const sunLight = new THREE.PointLight(0xFFFFFF, 2, 100);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    voyageState.scene.add(sunLight);
    
    // 创建行星
    Object.keys(VOYAGE_CONFIG.planets).forEach(planetName => {
        if (planetName === 'sun') return;
        
        const planetConfig = VOYAGE_CONFIG.planets[planetName];
        const geometry = new THREE.SphereGeometry(planetConfig.radius, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color: planetConfig.color });
        
        const planet = new THREE.Mesh(geometry, material);
        planet.position.set(...planetConfig.position);
        planet.castShadow = true;
        planet.receiveShadow = true;
        
        voyageState.planets[planetName] = planet;
        voyageState.scene.add(planet);
        
        // 为地球添加特殊效果
        if (planetName === 'earth') {
            // 添加大气层效果
            const atmosphereGeometry = new THREE.SphereGeometry(planetConfig.radius * 1.1, 16, 16);
            const atmosphereMaterial = new THREE.MeshBasicMaterial({
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.2,
                side: THREE.BackSide
            });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            atmosphere.position.copy(planet.position);
            voyageState.scene.add(atmosphere);
        }
        
        // 创建轨道线
        if (planetConfig.orbit) {
            const orbitGeometry = new THREE.RingGeometry(planetConfig.orbit - 0.1, planetConfig.orbit + 0.1, 64);
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbit.rotation.x = Math.PI / 2;
            voyageState.scene.add(orbit);
        }
    });
    
    console.log('✅ 太阳系创建完成');
}

/**
 * 设置相机初始位置
 */
function setupCamera() {
    const initialPath = VOYAGE_CONFIG.cameraPath[0];
    voyageState.camera.position.set(...initialPath.position);
    voyageState.camera.lookAt(...initialPath.target);
}

/**
 * 启动航程引导动画
 */
function startVoyageAnimation() {
    console.log('🎬 启动航程引导动画');
    
    voyageState.isActive = true;
    
    // 创建容器并添加到页面
    const voyageContainer = document.createElement('div');
    voyageContainer.id = 'voyage-container';
    voyageContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1000;
        background: #000000;
    `;
    
    document.body.appendChild(voyageContainer);
    voyageContainer.appendChild(voyageState.renderer.domElement);
    
    // 开始相机动画
    animateCamera();
    
    // 开始渲染循环
    renderLoop();
    
    // 设置动画完成回调
    setTimeout(() => {
        completeVoyageAnimation();
    }, VOYAGE_CONFIG.duration);
}

/**
 * 相机动画
 */
function animateCamera() {
    let currentPathIndex = 0;
    let startTime = Date.now();
    
    function updateCamera() {
        if (!voyageState.isActive) return;
        
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        
        if (currentPathIndex < VOYAGE_CONFIG.cameraPath.length) {
            const currentPath = VOYAGE_CONFIG.cameraPath[currentPathIndex];
            const progress = Math.min(elapsed / currentPath.duration, 1);
            
            // 使用缓动函数
            const easeProgress = easeInOutCubic(progress);
            
            if (currentPathIndex === 0) {
                // 第一段：从初始位置开始
                const startPos = VOYAGE_CONFIG.cameraPath[0].position;
                const startTarget = VOYAGE_CONFIG.cameraPath[0].target;
                
                voyageState.camera.position.set(...startPos);
                voyageState.camera.lookAt(...startTarget);
            } else {
                // 后续段：在路径点之间插值
                const prevPath = VOYAGE_CONFIG.cameraPath[currentPathIndex - 1];
                const currPath = VOYAGE_CONFIG.cameraPath[currentPathIndex];
                
                // 位置插值
                const pos = lerpVector3(prevPath.position, currPath.position, easeProgress);
                const target = lerpVector3(prevPath.target, currPath.target, easeProgress);
                
                voyageState.camera.position.set(...pos);
                voyageState.camera.lookAt(...target);
            }
            
            if (progress >= 1) {
                currentPathIndex++;
                startTime = currentTime;
            }
        }
        
        requestAnimationFrame(updateCamera);
    }
    
    updateCamera();
}

/**
 * 渲染循环
 */
function renderLoop() {
    if (!voyageState.isActive) return;
    
    // 旋转行星
    Object.keys(voyageState.planets).forEach(planetName => {
        if (planetName === 'sun') {
            voyageState.planets[planetName].rotation.y += 0.01;
        } else {
            voyageState.planets[planetName].rotation.y += 0.02;
        }
    });
    
    // 缓慢旋转星空
    if (voyageState.stars) {
        voyageState.stars.rotation.y += 0.0005;
    }
    
    // 渲染场景
    voyageState.renderer.render(voyageState.scene, voyageState.camera);
    
    voyageState.animationId = requestAnimationFrame(renderLoop);
}

/**
 * 完成航程引导动画
 */
function completeVoyageAnimation() {
    console.log('✅ 航程引导动画完成');
    
    voyageState.isActive = false;
    
    // 停止动画循环
    if (voyageState.animationId) {
        cancelAnimationFrame(voyageState.animationId);
    }
    
    // 淡出动画
    const voyageContainer = document.getElementById('voyage-container');
    if (voyageContainer) {
        voyageContainer.style.transition = 'opacity 1s ease-out';
        voyageContainer.style.opacity = '0';
        
        setTimeout(() => {
            voyageContainer.remove();
            
            // 航程引导完成，显示结束信息
            showVoyageComplete();
        }, 1000);
    }
}

/**
 * 显示航程引导完成信息
 */
function showVoyageComplete() {
    console.log('🎯 航程引导体验完成');
    
    // 创建完成页面
    const completeDiv = document.createElement('div');
    completeDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #00FFFF;
        font-family: 'Courier New', monospace;
        z-index: 1000;
        opacity: 0;
        transition: opacity 1s ease-in;
    `;
    
    completeDiv.innerHTML = `
        <div style="text-align: center; max-width: 600px; padding: 40px;">
            <h1 style="font-size: 2.5em; margin-bottom: 30px; text-shadow: 0 0 20px #00FFFF;">
                🌌 航程引导完成
            </h1>
            <p style="font-size: 1.2em; line-height: 1.8; margin-bottom: 40px; opacity: 0.9;">
                感谢您体验 MOSS 纪念档案馆的航程引导模块。<br>
                您已经完成了从太阳系全景到地球特写的虚拟旅程。
            </p>
            <div style="font-size: 1em; opacity: 0.7; line-height: 1.6;">
                <p>🚀 探索了太阳系的壮丽景象</p>
                <p>🌍 见证了地球在宇宙中的位置</p>
                <p>✨ 体验了流畅的3D动画效果</p>
            </div>
            <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.6;">
                <p>按 F5 刷新页面重新体验</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(completeDiv);
    
    // 淡入效果
    setTimeout(() => {
        completeDiv.style.opacity = '1';
    }, 100);
    
    console.log('✅ 航程引导体验结束');
}

/**
 * 工具函数：三次贝塞尔缓动
 */
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * 工具函数：向量插值
 */
function lerpVector3(a, b, t) {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
    ];
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
    if (voyageState.camera && voyageState.renderer) {
        voyageState.camera.aspect = window.innerWidth / window.innerHeight;
        voyageState.camera.updateProjectionMatrix();
        voyageState.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// 监听窗口大小变化
window.addEventListener('resize', handleResize);

// 导出模块接口
window.VoyageModule = {
    init: initVoyage,
    start: startVoyageAnimation,
    show: showVoyage,
    hide: hideVoyage,
    skipAnimation: completeVoyageAnimation,
    isActive: () => voyageState.isActive
};

/**
 * 显示航程引导模块
 */
function showVoyage() {
    console.log('🚀 显示航程引导模块');
    
    // 获取容器
    voyageState.container = document.getElementById('voyageContainer');
    if (!voyageState.container) {
        console.error('❌ 找不到航程引导容器');
        return;
    }
    
    // 显示容器
    voyageState.container.style.display = 'block';
    
    // 添加UI叠加层
    const uiOverlay = document.createElement('div');
    uiOverlay.className = 'voyage-ui';
    uiOverlay.innerHTML = `
        <div class="voyage-title">流浪地球：数字编年史</div>
        <div class="voyage-description">
            从太阳系的宏观视角，<br>
            到地球家园的细致观察，<br>
            见证人类文明的伟大征程...
        </div>
        <div class="voyage-skip" onclick="window.VoyageModule.skipAnimation()">
            按 ESC 跳过动画
        </div>
    `;
    voyageState.container.appendChild(uiOverlay);
    
    // 启动3D场景
    if (!voyageState.scene) {
        createScene();
        createStarField();
        createSolarSystem();
        setupCamera();
    }
    
    // 将渲染器添加到容器
    if (voyageState.renderer && voyageState.renderer.domElement) {
        voyageState.container.appendChild(voyageState.renderer.domElement);
    }
    
    // 启动动画
    startVoyageAnimation();
    
    voyageState.isActive = true;
}

/**
 * 隐藏航程引导模块
 */
function hideVoyage() {
    console.log('🔄 隐藏航程引导模块');
    
    if (voyageState.container) {
        voyageState.container.style.display = 'none';
    }
    
    // 停止动画循环
    if (voyageState.animationId) {
        cancelAnimationFrame(voyageState.animationId);
        voyageState.animationId = null;
    }
    
    voyageState.isActive = false;
}