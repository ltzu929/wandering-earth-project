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
    duration: 15000,         // 总动画时长（毫秒）- 延长以适应地球环绕
    starCount: 1000,         // 星空粒子数量（优化：从2000减少到1000）
    targetFPS: 60,           // 目标帧率
    cameraPath: [
        { position: [0, 0, 150], target: [0, 0, 0], duration: 2500 },    // 太阳系全景（更远视角）
        { position: [50, 20, 100], target: [0, 0, 0], duration: 2500 },  // 接近内行星区域
        { position: [25, 10, 60], target: [8, 0, 0], duration: 2500 },   // 聚焦地球轨道区域
        { position: [15, 5, 25], target: [8, 0, 0], duration: 2500 },    // 接近地球
        { position: [10, 2, 12], target: [8, 0, 0], duration: 2500 },    // 地球近距离
        { position: [8.5, 1, 8.5], target: [8, 0, 0], duration: 2500 }  // 地球表面附近，开始环绕
    ],
    // 地球环绕动画配置
    earthOrbit: {
        radius: 1.5,         // 环绕半径
        height: 0.5,         // 环绕高度变化
        speed: 0.002,        // 环绕速度
        duration: 5000       // 环绕持续时间
    },
    planets: {
        sun: { radius: 2, position: [0, 0, 0], color: 0xFFAA00 },
        // 内行星 - 添加不同的轨道角度和运动速度
        mercury: { 
            radius: 0.15, 
            orbitRadius: 4, 
            orbitAngle: 0, 
            orbitSpeed: 0.04,
            color: 0x8C7853, 
            orbit: 4 
        },
        venus: { 
            radius: 0.35, 
            orbitRadius: 6, 
            orbitAngle: Math.PI * 0.3, 
            orbitSpeed: 0.025,
            color: 0xFFC649, 
            orbit: 6 
        },
        earth: { 
            radius: 0.4, 
            orbitRadius: 8, 
            orbitAngle: Math.PI * 0.6, 
            orbitSpeed: 0.02,
            color: 0x6B93D6, 
            orbit: 8 
        },
        mars: { 
            radius: 0.25, 
            orbitRadius: 12, 
            orbitAngle: Math.PI * 0.9, 
            orbitSpeed: 0.015,
            color: 0xCD5C5C, 
            orbit: 12 
        },
        // 外行星
        jupiter: { 
            radius: 1.2, 
            orbitRadius: 20, 
            orbitAngle: Math.PI * 1.2, 
            orbitSpeed: 0.008,
            color: 0xD8CA9D, 
            orbit: 20 
        },
        saturn: { 
            radius: 1.0, 
            orbitRadius: 30, 
            orbitAngle: Math.PI * 1.5, 
            orbitSpeed: 0.006,
            color: 0xFAD5A5, 
            orbit: 30, 
            hasRings: true 
        },
        uranus: { 
            radius: 0.6, 
            orbitRadius: 45, 
            orbitAngle: Math.PI * 1.8, 
            orbitSpeed: 0.004,
            color: 0x4FD0E7, 
            orbit: 45 
        },
        neptune: { 
            radius: 0.58, 
            orbitRadius: 60, 
            orbitAngle: Math.PI * 0.1, 
            orbitSpeed: 0.003,
            color: 0x4B70DD, 
            orbit: 60 
        }
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
    const starSizes = new Float32Array(VOYAGE_CONFIG.starCount);
    
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
        const colorVariation = Math.random();
        
        if (colorVariation < 0.7) {
            // 白色星星
            starColors[i3] = brightness;
            starColors[i3 + 1] = brightness * (0.9 + Math.random() * 0.1);
            starColors[i3 + 2] = brightness;
        } else if (colorVariation < 0.9) {
            // 蓝色星星
            starColors[i3] = brightness * 0.7;
            starColors[i3 + 1] = brightness * 0.8;
            starColors[i3 + 2] = brightness;
        } else {
            // 红色星星
            starColors[i3] = brightness;
            starColors[i3 + 1] = brightness * 0.6;
            starColors[i3 + 2] = brightness * 0.4;
        }
        
        // 随机大小
        starSizes[i] = Math.random() * 2 + 0.5;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    const starMaterial = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    voyageState.stars = new THREE.Points(starGeometry, starMaterial);
    voyageState.scene.add(voyageState.stars);
    
    // 添加星云效果
    createNebula();
    
    console.log('✅ 星空背景创建完成');
}

/**
 * 创建星云效果
 */
function createNebula() {
    const nebulaGeometry = new THREE.PlaneGeometry(100, 100);
    const nebulaMaterial = new THREE.MeshBasicMaterial({
        color: 0x4444ff,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    
    // 创建多个星云层
    for (let i = 0; i < 3; i++) {
        const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial.clone());
        nebula.position.set(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200
        );
        nebula.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        nebula.material.opacity = 0.05 + Math.random() * 0.05;
        voyageState.scene.add(nebula);
    }
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
    
    // 添加太阳光晕效果
    const coronaGeometry = new THREE.SphereGeometry(VOYAGE_CONFIG.planets.sun.radius * 1.5, 32, 32);
    const coronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFAA00,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    corona.position.copy(voyageState.planets.sun.position);
    voyageState.scene.add(corona);
    
    // 增强太阳光源强度
    const sunLight = new THREE.PointLight(0xFFFFFF, 3, 150);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    voyageState.scene.add(sunLight);
    
    // 增加环境光强度，让行星更明亮
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    voyageState.scene.add(ambientLight);
    
    // 添加额外的定向光源来照亮远处的行星
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    voyageState.scene.add(directionalLight);
    
    // 创建行星
    Object.keys(VOYAGE_CONFIG.planets).forEach(planetName => {
        if (planetName === 'sun') return;
        
        const planetConfig = VOYAGE_CONFIG.planets[planetName];
        const geometry = new THREE.SphereGeometry(planetConfig.radius, 16, 16);
        
        // 为不同行星创建更亮的材质
        let material;
        if (planetName === 'earth') {
            material = new THREE.MeshLambertMaterial({ 
                color: planetConfig.color,
                emissive: 0x001122,
                emissiveIntensity: 0.2
            });
        } else {
            // 为其他行星添加自发光效果，让它们更明亮
            const emissiveColor = new THREE.Color(planetConfig.color).multiplyScalar(0.3);
            material = new THREE.MeshLambertMaterial({ 
                color: planetConfig.color,
                emissive: emissiveColor,
                emissiveIntensity: 0.4
            });
        }
        
        const planet = new THREE.Mesh(geometry, material);
        
        // 根据轨道半径和角度计算初始位置
        const orbitRadius = planetConfig.orbitRadius;
        const orbitAngle = planetConfig.orbitAngle;
        const x = Math.cos(orbitAngle) * orbitRadius;
        const z = Math.sin(orbitAngle) * orbitRadius;
        const y = 0; // 保持在同一平面
        
        planet.position.set(x, y, z);
        planet.castShadow = true;
        planet.receiveShadow = true;
        
        // 存储轨道信息用于动画
        planet.userData = {
            orbitRadius: orbitRadius,
            orbitAngle: orbitAngle,
            orbitSpeed: planetConfig.orbitSpeed
        };
        
        voyageState.planets[planetName] = planet;
        voyageState.scene.add(planet);
        
        // 为地球添加特殊效果
        if (planetName === 'earth') {
            // 添加大气层效果
            const atmosphereGeometry = new THREE.SphereGeometry(planetConfig.radius * 1.1, 16, 16);
            const atmosphereMaterial = new THREE.MeshBasicMaterial({
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            atmosphere.position.copy(planet.position);
            voyageState.scene.add(atmosphere);
            
            // 存储大气层引用用于位置同步
            planet.userData.atmosphere = atmosphere;
            
            // 添加城市灯光效果
            const lightsGeometry = new THREE.SphereGeometry(planetConfig.radius * 1.01, 16, 16);
            const lightsMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFF88,
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending
            });
            const lights = new THREE.Mesh(lightsGeometry, lightsMaterial);
            lights.position.copy(planet.position);
            voyageState.scene.add(lights);
            
            // 存储城市灯光引用用于位置同步
            planet.userData.lights = lights;
        }
        
        // 为大行星添加光环效果，增加可见性
        if (planetName === 'jupiter' || planetName === 'saturn') {
            const glowGeometry = new THREE.SphereGeometry(planetConfig.radius * 1.2, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: planetConfig.color,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(planet.position);
            voyageState.scene.add(glow);
            
            // 存储光环引用用于位置同步
            planet.userData.glow = glow;
        }
        
        // 创建轨道线，增加透明度让它们更明显
        if (planetConfig.orbit) {
            const orbitGeometry = new THREE.RingGeometry(planetConfig.orbit - 0.05, planetConfig.orbit + 0.05, 64);
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.4,
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
    
    // 移除自动结束机制，让动画持续运行
    // 用户可以通过刷新页面或其他方式结束动画
    console.log('🌍 动画将持续运行，不会自动结束');
}

/**
 * 相机动画
 */
function animateCamera() {
    let currentPathIndex = 0;
    let startTime = Date.now();
    let lastFrameTime = Date.now();
    const frameInterval = 1000 / VOYAGE_CONFIG.targetFPS;
    let orbitStartTime = null;
    let isOrbiting = false;
    
    function updateCamera() {
        if (!voyageState.isActive) return;
        
        const currentTime = Date.now();
        const deltaTime = currentTime - lastFrameTime;
        
        // 帧率控制
        if (deltaTime < frameInterval) {
            requestAnimationFrame(updateCamera);
            return;
        }
        
        lastFrameTime = currentTime;
        const elapsed = currentTime - startTime;
        
        // 检查是否完成所有路径点，开始地球环绕
        if (currentPathIndex >= VOYAGE_CONFIG.cameraPath.length) {
            if (!isOrbiting) {
                isOrbiting = true;
                orbitStartTime = currentTime;
                console.log('🌍 开始地球环绕动画');
            }
            
            // 地球环绕动画
            const orbitElapsed = currentTime - orbitStartTime;
            const orbitProgress = Math.min(orbitElapsed / VOYAGE_CONFIG.earthOrbit.duration, 1);
            
            if (orbitProgress < 1) {
                // 计算环绕位置
                const earthPos = VOYAGE_CONFIG.planets.earth.position;
                const angle = orbitElapsed * VOYAGE_CONFIG.earthOrbit.speed;
                const radius = VOYAGE_CONFIG.earthOrbit.radius;
                const height = Math.sin(angle * 0.5) * VOYAGE_CONFIG.earthOrbit.height;
                
                const orbitX = earthPos[0] + Math.cos(angle) * radius;
                const orbitY = earthPos[1] + height;
                const orbitZ = earthPos[2] + Math.sin(angle) * radius;
                
                voyageState.camera.position.set(orbitX, orbitY, orbitZ);
                voyageState.camera.lookAt(earthPos[0], earthPos[1], earthPos[2]);
            }
            
            requestAnimationFrame(updateCamera);
            return;
        }
        
        // 正常路径动画
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
 * 渲染循环（优化版）
 */
function renderLoop() {
    if (!voyageState.isActive) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - (voyageState.lastRenderTime || currentTime);
    voyageState.lastRenderTime = currentTime;
    
    // 基于时间的动画，确保不同帧率下的一致性
    const rotationSpeed = 0.001 * deltaTime;
    
    // 旋转行星并更新轨道位置
    Object.keys(voyageState.planets).forEach(planetName => {
        const planet = voyageState.planets[planetName];
        
        if (planetName === 'sun') {
            planet.rotation.y += rotationSpeed * 10;
        } else {
            // 行星自转
            planet.rotation.y += rotationSpeed * 20;
            
            // 行星轨道运动
            if (planet.userData && planet.userData.orbitRadius) {
                // 更新轨道角度
                planet.userData.orbitAngle += planet.userData.orbitSpeed * deltaTime * 0.001;
                
                // 计算新位置
                const x = Math.cos(planet.userData.orbitAngle) * planet.userData.orbitRadius;
                const z = Math.sin(planet.userData.orbitAngle) * planet.userData.orbitRadius;
                const y = 0;
                
                planet.position.set(x, y, z);
                
                // 同步特殊效果的位置
                if (planet.userData.atmosphere) {
                    planet.userData.atmosphere.position.copy(planet.position);
                }
                if (planet.userData.lights) {
                    planet.userData.lights.position.copy(planet.position);
                }
                if (planet.userData.glow) {
                    planet.userData.glow.position.copy(planet.position);
                }
            }
        }
    });
    
    // 缓慢旋转星空
    if (voyageState.stars) {
        voyageState.stars.rotation.y += rotationSpeed * 0.5;
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
                <p>🌍 观看了地球在宇宙中的位置</p>
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