/**
 * 航程引导动画 - 核心模块
 * 负责场景管理、配置和基础功能
 */

// 全局状态管理
const voyageState = {
    scene: null,
    camera: null,
    renderer: null,
    container: null,
    isActive: false,
    animationId: null,
    planets: {},
    stars: null,
    timeline: null,
    // 编年史时间线状态
    chronicleTime: 0,           // 当前编年史时间（年份）
    chronicleSpeed: 1,          // 时间流逝速度（年/秒）
    earthTrajectoryPhase: 'solar_orbit'  // 地球轨道阶段
};

// 动画配置
const VOYAGE_CONFIG = {
    duration: 15000,         // 总动画时长（毫秒）
    starCount: 500,          // 星空粒子数量
    targetFPS: 60,           // 目标帧率
    
    // 编年史时间线配置
    chronicle: {
        startYear: 2019,        // 开始年份
        endYear: 4500,          // 结束年份
        timeScale: 0.1,         // 时间缩放（秒对应年的比例）
        phases: {
            solar_orbit: { start: 2019, end: 2058 },      // 太阳轨道阶段
            departure: { start: 2058, end: 2075 },        // 脱离阶段
            wandering: { start: 2075, end: 2500 },        // 流浪阶段
            jupiter_crisis: { start: 2500, end: 2501 },   // 木星危机
            deep_space: { start: 2501, end: 4500 }        // 深空流浪
        }
    },
    
    cameraPath: [
        { position: [0, 0, 150], target: [0, 0, 0], duration: 2500 },
        { position: [50, 20, 100], target: [0, 0, 0], duration: 2500 },
        { position: [25, 10, 60], target: [8, 0, 0], duration: 2500 },
        { position: [15, 5, 25], target: [8, 0, 0], duration: 2500 },
        { position: [10, 2, 12], target: [8, 0, 0], duration: 2500 },
        { position: [8.5, 1, 8.5], target: [8, 0, 0], duration: 2500 }
    ],
    
    // 地球环绕动画配置
    earthOrbit: {
        radius: 1.5,         // 环绕半径
        height: 0.5,         // 环绕高度变化
        speed: 0.002,        // 环绕速度
        duration: 5000       // 环绕持续时间
    }
};

/**
 * 创建Three.js场景
 */
function createScene(container) {
    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 创建轨道控制器
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    
    console.log('✅ Three.js场景创建完成');
    
    return { scene, camera, renderer, controls };
}

/**
 * 创建星空背景
 */
function createStarField(scene) {
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
        starSizes[i] = Math.random() * 0.8 + 0.2;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    const starMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    return stars;
}

/**
 * 创建星云效果
 */
function createNebula(scene) {
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
        scene.add(nebula);
    }
}

/**
 * 工具函数
 */
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

function lerpVector3(a, b, t) {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t
    };
}

function normalizeVector(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return {
        x: vector.x / length,
        y: vector.y / length,
        z: vector.z / length
    };
}

/**
 * 窗口大小调整处理
 */
function handleResize(camera, renderer, controls) {
    if (!camera || !renderer) return;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    if (controls) {
        controls.update();
    }
}

// 将函数添加到全局作用域
if (typeof window !== 'undefined') {
    window.voyageState = voyageState;
    window.VOYAGE_CONFIG = VOYAGE_CONFIG;
    window.createScene = createScene;
    window.createStarField = createStarField;
    window.createNebula = createNebula;
    window.easeInOutCubic = easeInOutCubic;
    window.lerpVector3 = lerpVector3;
    window.normalizeVector = normalizeVector;
    window.handleResize = handleResize;
}