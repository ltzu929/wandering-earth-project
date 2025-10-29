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
    timeline: null,
    // 新增：编年史时间线状态
    chronicleTime: 0,           // 当前编年史时间（年份）
    chronicleSpeed: 1,          // 时间流逝速度（年/秒）
    earthTrajectoryPhase: 'solar_orbit'  // 地球轨道阶段
};

/**
 * 更新地球行星发动机状态
 */
function updatePlanetaryEngines(earth, currentYear) {
    const engineConfig = earth.userData.engineConfig;
    if (!engineConfig) return;
    
    // 根据当前年份确定激活阶段
    let activeRatio = 0;
    const phases = engineConfig.activationPhases;
    
    if (currentYear >= phases.departure.start && currentYear <= phases.departure.end) {
        activeRatio = phases.departure.activeRatio;
    } else if (currentYear >= phases.wandering.start && currentYear <= phases.wandering.end) {
        activeRatio = phases.wandering.activeRatio;
    } else if (currentYear >= phases.jupiter_crisis.start && currentYear <= phases.jupiter_crisis.end) {
        activeRatio = phases.jupiter_crisis.activeRatio;
    } else if (currentYear >= phases.deep_space.start && currentYear <= phases.deep_space.end) {
        activeRatio = phases.deep_space.activeRatio;
    }
    
    // 更新发动机激活数量
    engineConfig.activeCount = Math.floor(engineConfig.count * activeRatio);
    engineConfig.currentThrust = activeRatio * engineConfig.maxThrust;
    
    // 更新视觉效果强度
    if (earth.userData.engines && earth.userData.flames) {
        const engineMaterial = earth.userData.engines.material;
        const flameMaterial = earth.userData.flames.material;
        
        // 根据激活比例调整透明度和大小
        engineMaterial.opacity = 0.8 * activeRatio;
        flameMaterial.opacity = 0.6 * activeRatio;
        engineMaterial.size = 0.1 * (0.5 + activeRatio * 0.5);
        flameMaterial.size = 0.05 * (0.5 + activeRatio * 0.5);
        
        // 在木星危机期间增强效果
        if (currentYear >= phases.jupiter_crisis.start && currentYear <= phases.jupiter_crisis.end) {
            engineMaterial.opacity = Math.min(1.0, engineMaterial.opacity * 1.5);
            flameMaterial.opacity = Math.min(1.0, flameMaterial.opacity * 1.5);
            engineMaterial.size *= 1.3;
            flameMaterial.size *= 1.3;
        }
    }
}

// 动画配置
const VOYAGE_CONFIG = {
    duration: 15000,         // 总动画时长（毫秒）- 延长以适应地球环绕
    starCount: 500,          // 星空粒子数量（减少到500，避免与行星混淆）
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
            orbit: 4,
            // 水星轨道演化参数
            evolution: {
                originalRadius: 4,
                currentRadius: 4,
                isDestroyed: false,
                destructionYear: 2400  // 太阳膨胀时被吞噬
            }
        },
        venus: { 
            radius: 0.35, 
            orbitRadius: 6, 
            orbitAngle: Math.PI * 0.3, 
            orbitSpeed: 0.025,
            color: 0xFFC649, 
            orbit: 6,
            // 金星轨道演化参数
            evolution: {
                originalRadius: 6,
                currentRadius: 6,
                isDestroyed: false,
                destructionYear: 2450  // 太阳膨胀时被吞噬
            }
        },
        earth: { 
            radius: 0.4, 
            orbitRadius: 8, 
            orbitAngle: Math.PI * 0.6, 
            orbitSpeed: 0.02,
            color: 0x6B93D6, 
            orbit: 8,
            // 地球流浪轨迹参数
            wanderingTrajectory: {
                departureAngle: Math.PI * 0.6,    // 脱离时的角度
                departureRadius: 8,               // 脱离时的半径
                currentRadius: 8,                 // 当前半径
                velocity: { x: 0, y: 0, z: 0 },   // 当前速度
                acceleration: { x: 0, y: 0, z: 0 } // 当前加速度
            },
            // 行星发动机参数
            planetaryEngines: {
                count: 10000,                     // 发动机总数
                activeCount: 0,                   // 当前激活的发动机数量
                maxThrust: 1.0,                   // 最大推力
                currentThrust: 0.0,               // 当前推力
                activationPhases: {
                    departure: { start: 2058, end: 2075, activeRatio: 0.5 },    // 脱离阶段
                    wandering: { start: 2075, end: 2500, activeRatio: 0.3 },    // 流浪阶段
                    jupiter_crisis: { start: 2500, end: 2501, activeRatio: 1.0 }, // 木星危机
                    deep_space: { start: 2501, end: 4500, activeRatio: 0.2 }    // 深空流浪
                },
                visualEffects: {
                    flameColor: 0x00AAFF,         // 蓝色等离子体
                    flameIntensity: 1.0,          // 火焰强度
                    particleCount: 50,            // 每个发动机的粒子数
                    flameLength: 2.0              // 火焰长度倍数
                }
            }
        },
        mars: { 
            radius: 0.25, 
            orbitRadius: 12, 
            orbitAngle: Math.PI * 0.9, 
            orbitSpeed: 0.015,
            color: 0xCD5C5C, 
            orbit: 12,
            // 火星轨道演化参数
            evolution: {
                originalRadius: 12,
                currentRadius: 12,
                orbitDecay: 0.001,  // 轨道衰减率
                atmosphereLoss: 0   // 大气流失程度
            }
        },
        // 外行星
        jupiter: { 
            radius: 1.2, 
            orbitRadius: 20, 
            orbitAngle: Math.PI * 1.2, 
            orbitSpeed: 0.008,
            color: 0xD8CA9D, 
            orbit: 20,
            // 木星轨道演化参数
            evolution: {
                originalRadius: 20,
                currentRadius: 20,
                orbitExpansion: 0.0005,  // 轨道扩张率（太阳质量损失导致）
                gravitationalInfluence: 1.0  // 引力影响强度
            }
        },
        saturn: { 
            radius: 1.0, 
            orbitRadius: 30, 
            orbitAngle: Math.PI * 1.5, 
            orbitSpeed: 0.006,
            color: 0xFAD5A5, 
            orbit: 30, 
            hasRings: true,
            // 土星轨道演化参数
            evolution: {
                originalRadius: 30,
                currentRadius: 30,
                orbitExpansion: 0.0003,  // 轨道扩张率
                ringStability: 1.0       // 光环稳定性
            }
        },
        uranus: { 
            radius: 1.0, 
            orbitRadius: 45, 
            orbitAngle: Math.PI * 1.8, 
            orbitSpeed: 0.004,
            color: 0x4FD0E7, 
            orbit: 45,
            // 天王星轨道演化参数
            evolution: {
                originalRadius: 45,
                currentRadius: 45,
                orbitExpansion: 0.0002   // 轨道扩张率
            }
        },
        neptune: { 
            radius: 0.58, 
            orbitRadius: 60, 
            orbitAngle: Math.PI * 0.1, 
            orbitSpeed: 0.003,
            color: 0x4B70DD, 
            orbit: 60,
            // 海王星轨道演化参数
            evolution: {
                originalRadius: 60,
                currentRadius: 60,
                orbitExpansion: 0.0001   // 轨道扩张率
            }
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
        
        // 随机大小 - 减小星星大小
        starSizes[i] = Math.random() * 0.8 + 0.2; // 从 2+0.5 改为 0.8+0.2
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    const starMaterial = new THREE.PointsMaterial({
        size: 0.5,              // 从 1 减小到 0.5
        vertexColors: true,
        transparent: true,
        opacity: 0.6,           // 从 0.8 减小到 0.6，降低亮度
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
            // 为不同行星创建特色材质
            if (planetName === 'mercury') {
                // 水星 - 灰色岩石表面，高反射
                material = new THREE.MeshPhongMaterial({
                    color: planetConfig.color,
                    emissive: new THREE.Color(planetConfig.color).multiplyScalar(0.2),
                    emissiveIntensity: 0.3,
                    shininess: 100,
                    specular: 0x444444
                });
            } else if (planetName === 'venus') {
                // 金星 - 金黄色，厚重大气层效果
                material = new THREE.MeshPhongMaterial({
                    color: planetConfig.color,
                    emissive: new THREE.Color(0xFFAA00).multiplyScalar(0.3),
                    emissiveIntensity: 0.4,
                    shininess: 30,
                    specular: 0x222222
                });
            } else if (planetName === 'mars') {
                // 火星 - 红色沙漠，低反射
                material = new THREE.MeshLambertMaterial({
                    color: planetConfig.color,
                    emissive: new THREE.Color(0x441100).multiplyScalar(0.5),
                    emissiveIntensity: 0.3
                });
            } else if (planetName === 'jupiter') {
                // 木星 - 气体巨星，条纹效果
                material = new THREE.MeshPhongMaterial({
                    color: planetConfig.color,
                    emissive: new THREE.Color(planetConfig.color).multiplyScalar(0.2),
                    emissiveIntensity: 0.4,
                    shininess: 20,
                    specular: 0x333333
                });
            } else if (planetName === 'saturn') {
                // 土星 - 淡黄色气体巨星
                material = new THREE.MeshPhongMaterial({
                    color: planetConfig.color,
                    emissive: new THREE.Color(0xFFDD88).multiplyScalar(0.2),
                    emissiveIntensity: 0.4,
                    shininess: 15,
                    specular: 0x222222
                });
            } else if (planetName === 'uranus') {
                // 天王星 - 蓝绿色冰巨星
                material = new THREE.MeshPhongMaterial({
                    color: planetConfig.color,
                    emissive: new THREE.Color(0x0088AA).multiplyScalar(0.3),
                    emissiveIntensity: 0.5,
                    shininess: 40,
                    specular: 0x111111
                });
            } else if (planetName === 'neptune') {
                // 海王星 - 深蓝色冰巨星
                material = new THREE.MeshPhongMaterial({
                    color: planetConfig.color,
                    emissive: new THREE.Color(0x0044AA).multiplyScalar(0.4),
                    emissiveIntensity: 0.5,
                    shininess: 50,
                    specular: 0x222222
                });
            } else {
                // 默认材质
                const emissiveColor = new THREE.Color(planetConfig.color).multiplyScalar(0.3);
                material = new THREE.MeshLambertMaterial({ 
                    color: planetConfig.color,
                    emissive: emissiveColor,
                    emissiveIntensity: 0.4
                });
            }
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
            // 创建更详细的地球几何体
            const detailedGeometry = new THREE.SphereGeometry(planetConfig.radius, 64, 64);
            
            // 添加地形高度变化
            const positions = detailedGeometry.attributes.position;
            const vertex = new THREE.Vector3();
            
            for (let i = 0; i < positions.count; i++) {
                vertex.fromBufferAttribute(positions, i);
                
                // 使用噪声函数创建地形变化
                const noise = Math.sin(vertex.x * 10) * Math.cos(vertex.y * 10) * Math.sin(vertex.z * 10);
                const heightVariation = 1 + noise * 0.02; // 轻微的高度变化
                
                vertex.multiplyScalar(heightVariation);
                positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
            
            detailedGeometry.attributes.position.needsUpdate = true;
            detailedGeometry.computeVertexNormals();
            
            // 替换原有的地球几何体
            planet.geometry.dispose();
            planet.geometry = detailedGeometry;
            
            // 创建更真实的地球材质
            const earthMaterial = new THREE.MeshPhongMaterial({
                color: 0x6B93D6,
                emissive: 0x001122,
                emissiveIntensity: 0.1,
                shininess: 30,
                specular: 0x111111
            });
            
            // 添加程序化纹理效果
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 256;
            const context = canvas.getContext('2d');
            
            // 创建地球表面纹理
            const imageData = context.createImageData(canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                const x = (i / 4) % canvas.width;
                const y = Math.floor((i / 4) / canvas.width);
                
                // 创建大陆和海洋的分布
                const noise1 = Math.sin(x * 0.02) * Math.cos(y * 0.02);
                const noise2 = Math.sin(x * 0.01) * Math.cos(y * 0.01);
                const landMask = noise1 + noise2 * 0.5;
                
                if (landMask > 0.1) {
                    // 陆地 - 绿色和棕色
                    data[i] = 34 + Math.random() * 40;     // R
                    data[i + 1] = 139 + Math.random() * 40; // G
                    data[i + 2] = 34 + Math.random() * 20;  // B
                } else {
                    // 海洋 - 蓝色
                    data[i] = 25 + Math.random() * 20;      // R
                    data[i + 1] = 25 + Math.random() * 30;  // G
                    data[i + 2] = 112 + Math.random() * 50; // B
                }
                data[i + 3] = 255; // A
            }
            
            context.putImageData(imageData, 0, 0);
            
            // 创建纹理
            const earthTexture = new THREE.CanvasTexture(canvas);
            earthTexture.wrapS = THREE.RepeatWrapping;
            earthTexture.wrapT = THREE.RepeatWrapping;
            
            // 应用纹理到材质
            earthMaterial.map = earthTexture;
            
            // 替换地球材质
            planet.material.dispose();
            planet.material = earthMaterial;
            
            // 添加云层效果
            const cloudGeometry = new THREE.SphereGeometry(planetConfig.radius * 1.02, 32, 32);
            const cloudMaterial = new THREE.MeshLambertMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.4,
                blending: THREE.NormalBlending
            });
            
            // 创建云层纹理
            const cloudCanvas = document.createElement('canvas');
            cloudCanvas.width = 256;
            cloudCanvas.height = 128;
            const cloudContext = cloudCanvas.getContext('2d');
            const cloudImageData = cloudContext.createImageData(cloudCanvas.width, cloudCanvas.height);
            const cloudData = cloudImageData.data;
            
            for (let i = 0; i < cloudData.length; i += 4) {
                const x = (i / 4) % cloudCanvas.width;
                const y = Math.floor((i / 4) / cloudCanvas.width);
                
                // 创建云层分布
                const cloudNoise = Math.sin(x * 0.05) * Math.cos(y * 0.05) + 
                                  Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5;
                
                if (cloudNoise > 0.3) {
                    const intensity = Math.min((cloudNoise - 0.3) * 2, 1) * 255;
                    cloudData[i] = intensity;     // R
                    cloudData[i + 1] = intensity; // G
                    cloudData[i + 2] = intensity; // B
                    cloudData[i + 3] = intensity * 0.6; // A
                } else {
                    cloudData[i] = 0;
                    cloudData[i + 1] = 0;
                    cloudData[i + 2] = 0;
                    cloudData[i + 3] = 0;
                }
            }
            
            cloudContext.putImageData(cloudImageData, 0, 0);
            const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
            cloudTexture.wrapS = THREE.RepeatWrapping;
            cloudTexture.wrapT = THREE.RepeatWrapping;
            
            cloudMaterial.map = cloudTexture;
            cloudMaterial.alphaMap = cloudTexture;
            
            const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
            clouds.position.copy(planet.position);
            voyageState.scene.add(clouds);
            
            // 存储云层引用用于位置同步和动画
            planet.userData.clouds = clouds;
            
            // 添加大气层效果
            const atmosphereGeometry = new THREE.SphereGeometry(planetConfig.radius * 1.1, 32, 32);
            const atmosphereMaterial = new THREE.MeshBasicMaterial({
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.2,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            atmosphere.position.copy(planet.position);
            voyageState.scene.add(atmosphere);
            
            // 存储大气层引用用于位置同步
            planet.userData.atmosphere = atmosphere;
            
            // 添加城市灯光效果（夜晚一侧）
            const lightsGeometry = new THREE.SphereGeometry(planetConfig.radius * 1.005, 32, 32);
            const lightsMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFF88,
                transparent: true,
                opacity: 0.15,
                blending: THREE.AdditiveBlending
            });
            
            // 创建城市灯光纹理
            const lightsCanvas = document.createElement('canvas');
            lightsCanvas.width = 256;
            lightsCanvas.height = 128;
            const lightsContext = lightsCanvas.getContext('2d');
            const lightsImageData = lightsContext.createImageData(lightsCanvas.width, lightsCanvas.height);
            const lightsData = lightsImageData.data;
            
            for (let i = 0; i < lightsData.length; i += 4) {
                const x = (i / 4) % lightsCanvas.width;
                const y = Math.floor((i / 4) / lightsCanvas.width);
                
                // 在陆地区域添加城市灯光
                const landNoise = Math.sin(x * 0.02) * Math.cos(y * 0.02);
                const cityNoise = Math.sin(x * 0.1) * Math.cos(y * 0.1);
                
                if (landNoise > 0.1 && cityNoise > 0.5 && Math.random() > 0.7) {
                    const intensity = Math.random() * 255;
                    lightsData[i] = intensity;     // R
                    lightsData[i + 1] = intensity * 0.8; // G
                    lightsData[i + 2] = intensity * 0.3; // B
                    lightsData[i + 3] = intensity * 0.8; // A
                } else {
                    lightsData[i] = 0;
                    lightsData[i + 1] = 0;
                    lightsData[i + 2] = 0;
                    lightsData[i + 3] = 0;
                }
            }
            
            lightsContext.putImageData(lightsImageData, 0, 0);
            const lightsTexture = new THREE.CanvasTexture(lightsCanvas);
            lightsTexture.wrapS = THREE.RepeatWrapping;
            lightsTexture.wrapT = THREE.RepeatWrapping;
            
            lightsMaterial.map = lightsTexture;
            lightsMaterial.alphaMap = lightsTexture;
            
            const lights = new THREE.Mesh(lightsGeometry, lightsMaterial);
            lights.position.copy(planet.position);
            voyageState.scene.add(lights);
            
            // 存储城市灯光引用用于位置同步
            planet.userData.lights = lights;
            
            // 添加行星发动机视觉效果
            const engineConfig = planetConfig.planetaryEngines;
            if (engineConfig) {
                // 创建发动机火焰粒子系统
                const engineParticles = [];
                const engineGeometry = new THREE.BufferGeometry();
                const enginePositions = [];
                const engineColors = [];
                const engineSizes = [];
                
                // 在地球表面随机分布发动机位置
                for (let i = 0; i < engineConfig.visualEffects.particleCount; i++) {
                    // 使用球面坐标生成均匀分布的点
                    const phi = Math.acos(2 * Math.random() - 1); // 极角
                    const theta = 2 * Math.PI * Math.random();    // 方位角
                    
                    // 转换为笛卡尔坐标，稍微超出地球表面
                    const radius = planetConfig.radius * 1.05;
                    const x = radius * Math.sin(phi) * Math.cos(theta);
                    const y = radius * Math.sin(phi) * Math.sin(theta);
                    const z = radius * Math.cos(phi);
                    
                    enginePositions.push(x, y, z);
                    
                    // 蓝色等离子体颜色
                    const color = new THREE.Color(engineConfig.visualEffects.flameColor);
                    engineColors.push(color.r, color.g, color.b);
                    
                    // 随机大小
                    engineSizes.push(Math.random() * 0.1 + 0.05);
                }
                
                engineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(enginePositions, 3));
                engineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(engineColors, 3));
                engineGeometry.setAttribute('size', new THREE.Float32BufferAttribute(engineSizes, 1));
                
                const engineMaterial = new THREE.PointsMaterial({
                    size: 0.1,
                    sizeAttenuation: true,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.8,
                    blending: THREE.AdditiveBlending
                });
                
                const engines = new THREE.Points(engineGeometry, engineMaterial);
                engines.position.copy(planet.position);
                voyageState.scene.add(engines);
                
                // 创建发动机火焰拖尾效果
                const flameGeometry = new THREE.BufferGeometry();
                const flamePositions = [];
                const flameColors = [];
                
                for (let i = 0; i < engineConfig.visualEffects.particleCount * 3; i++) {
                    // 在发动机位置附近创建火焰粒子
                    const engineIndex = Math.floor(i / 3);
                    const baseX = enginePositions[engineIndex * 3];
                    const baseY = enginePositions[engineIndex * 3 + 1];
                    const baseZ = enginePositions[engineIndex * 3 + 2];
                    
                    // 计算从地心指向发动机的方向
                    const direction = new THREE.Vector3(baseX, baseY, baseZ).normalize();
                    
                    // 在发动机后方创建火焰拖尾
                    const flameDistance = (Math.random() * 0.5 + 0.2) * engineConfig.visualEffects.flameLength;
                    const flameX = baseX + direction.x * flameDistance;
                    const flameY = baseY + direction.y * flameDistance;
                    const flameZ = baseZ + direction.z * flameDistance;
                    
                    flamePositions.push(flameX, flameY, flameZ);
                    
                    // 火焰颜色渐变（从蓝色到透明）
                    const intensity = 1 - (flameDistance / (engineConfig.visualEffects.flameLength * 0.7));
                    const color = new THREE.Color(engineConfig.visualEffects.flameColor);
                    color.multiplyScalar(intensity);
                    flameColors.push(color.r, color.g, color.b);
                }
                
                flameGeometry.setAttribute('position', new THREE.Float32BufferAttribute(flamePositions, 3));
                flameGeometry.setAttribute('color', new THREE.Float32BufferAttribute(flameColors, 3));
                
                const flameMaterial = new THREE.PointsMaterial({
                    size: 0.05,
                    sizeAttenuation: true,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.6,
                    blending: THREE.AdditiveBlending
                });
                
                const flames = new THREE.Points(flameGeometry, flameMaterial);
                flames.position.copy(planet.position);
                voyageState.scene.add(flames);
                
                // 存储发动机引用用于位置同步和动画
                planet.userData.engines = engines;
                planet.userData.flames = flames;
                planet.userData.engineConfig = engineConfig;
            }
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
        
        // 为土星添加特殊的光环系统
        if (planetName === 'saturn') {
            // 创建土星光环
            const ringInnerRadius = planetConfig.radius * 1.3;
            const ringOuterRadius = planetConfig.radius * 2.2;
            const ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64);
            
            // 创建光环纹理
            const ringCanvas = document.createElement('canvas');
            ringCanvas.width = 256;
            ringCanvas.height = 32;
            const ringContext = ringCanvas.getContext('2d');
            const ringImageData = ringContext.createImageData(ringCanvas.width, ringCanvas.height);
            const ringData = ringImageData.data;
            
            for (let i = 0; i < ringData.length; i += 4) {
                const x = (i / 4) % ringCanvas.width;
                const y = Math.floor((i / 4) / ringCanvas.width);
                
                // 创建光环的条纹效果
                const ringPattern = Math.sin(x * 0.3) * Math.cos(x * 0.1);
                const opacity = Math.max(0, ringPattern * 0.5 + 0.3);
                
                // 土星光环的颜色 - 淡黄色
                const intensity = opacity * 255;
                ringData[i] = intensity * 0.9;     // R
                ringData[i + 1] = intensity * 0.8; // G
                ringData[i + 2] = intensity * 0.6; // B
                ringData[i + 3] = intensity * 0.7; // A
            }
            
            ringContext.putImageData(ringImageData, 0, 0);
            const ringTexture = new THREE.CanvasTexture(ringCanvas);
            ringTexture.wrapS = THREE.RepeatWrapping;
            ringTexture.wrapT = THREE.RepeatWrapping;
            
            const ringMaterial = new THREE.MeshBasicMaterial({
                map: ringTexture,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const rings = new THREE.Mesh(ringGeometry, ringMaterial);
            rings.position.copy(planet.position);
            rings.rotation.x = Math.PI / 2; // 水平放置光环
            rings.rotation.z = Math.PI * 0.1; // 轻微倾斜
            voyageState.scene.add(rings);
            
            // 存储光环引用用于位置同步
            planet.userData.rings = rings;
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
 * 相机动画 - 彻底重构版
 */
function animateCamera() {
    const startTime = Date.now();
    let lastFrameTime = Date.now();
    const frameInterval = 1000 / VOYAGE_CONFIG.targetFPS;
    
    // 简化的拉近动画配置
    const animation = {
        duration: 8000,         // 8秒拉近动画
        startDistance: 200,     // 起始距离
        endDistance: 3,         // 结束距离
        startHeight: 80,        // 起始高度
        endHeight: 1,           // 结束高度
        angle: Math.PI * 0.25   // 45度角度
    };
    
    console.log('🎬 开始拉近地球动画');
    
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
        
        // 获取地球当前位置
        const earthPlanet = voyageState.planets.earth;
        let earthPos = { x: 8, y: 0, z: 0 }; // 默认位置
        if (earthPlanet) {
            earthPos = earthPlanet.position;
        }
        
        // 检查动画是否完成
        if (elapsed >= animation.duration) {
            // 动画完成，进入跟踪模式
            const followX = earthPos.x + Math.cos(animation.angle) * animation.endDistance;
            const followY = earthPos.y + animation.endHeight;
            const followZ = earthPos.z + Math.sin(animation.angle) * animation.endDistance;
            
            voyageState.camera.position.set(followX, followY, followZ);
            voyageState.camera.lookAt(earthPos.x, earthPos.y, earthPos.z);
            
            requestAnimationFrame(updateCamera);
            return;
        }
        
        // 计算动画进度
        const progress = elapsed / animation.duration;
        const easeProgress = easeInOutCubic(progress);
        
        // 计算当前距离和高度
        const currentDistance = animation.startDistance + 
            (animation.endDistance - animation.startDistance) * easeProgress;
        const currentHeight = animation.startHeight + 
            (animation.endHeight - animation.startHeight) * easeProgress;
        
        // 计算摄像机位置（始终围绕地球）
        const cameraX = earthPos.x + Math.cos(animation.angle) * currentDistance;
        const cameraY = earthPos.y + currentHeight;
        const cameraZ = earthPos.z + Math.sin(animation.angle) * currentDistance;
        
        // 设置摄像机位置和目标
        voyageState.camera.position.set(cameraX, cameraY, cameraZ);
        voyageState.camera.lookAt(earthPos.x, earthPos.y, earthPos.z);
        
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
    
    // 更新编年史时间线和地球轨道
    updateChronicleTimeline(deltaTime);
    
    // 旋转行星并更新轨道位置
    Object.keys(voyageState.planets).forEach(planetName => {
        const planet = voyageState.planets[planetName];
        
        if (planetName === 'sun') {
            planet.rotation.y += rotationSpeed * 10;
        } else {
            // 行星自转 - 减慢地球自转速度
            if (planetName === 'earth') {
                planet.rotation.y += rotationSpeed * 3; // 从 20 减少到 3，大幅减慢地球自转
            } else {
                planet.rotation.y += rotationSpeed * 20;
            }
            
            // 行星轨道运动 - 地球轨道由编年史系统控制
            if (planet.userData && planet.userData.orbitRadius && planetName !== 'earth') {
                // 更新轨道角度（除地球外的其他行星）
                planet.userData.orbitAngle += planet.userData.orbitSpeed * deltaTime * 0.001;
                
                // 计算新位置
                const x = Math.cos(planet.userData.orbitAngle) * planet.userData.orbitRadius;
                const z = Math.sin(planet.userData.orbitAngle) * planet.userData.orbitRadius;
                const y = 0;
                
                planet.position.set(x, y, z);
                
                // 同步特殊效果的位置
                if (planet.userData.glow) {
                    planet.userData.glow.position.copy(planet.position);
                }
                if (planet.userData.rings) {
                    planet.userData.rings.position.copy(planet.position);
                    // 土星光环缓慢旋转
                    planet.userData.rings.rotation.z += rotationSpeed * 2;
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
            见证人类文明的伟大之旅...
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

/**
 * 更新编年史时间线
 */
function updateChronicleTimeline(deltaTime) {
    // 更新编年史时间
    voyageState.chronicleTime += voyageState.chronicleSpeed * deltaTime * VOYAGE_CONFIG.chronicle.timeScale;
    
    // 确保时间在有效范围内
    if (voyageState.chronicleTime < VOYAGE_CONFIG.chronicle.startYear) {
        voyageState.chronicleTime = VOYAGE_CONFIG.chronicle.startYear;
    }
    if (voyageState.chronicleTime > VOYAGE_CONFIG.chronicle.endYear) {
        voyageState.chronicleTime = VOYAGE_CONFIG.chronicle.endYear;
    }
    
    // 确定当前阶段
    const phases = VOYAGE_CONFIG.chronicle.phases;
    let currentPhase = 'solar_orbit';
    
    for (const [phaseName, phaseData] of Object.entries(phases)) {
        if (voyageState.chronicleTime >= phaseData.start && voyageState.chronicleTime <= phaseData.end) {
            currentPhase = phaseName;
            break;
        }
    }
    
    // 如果阶段发生变化，更新地球轨道状态
    if (voyageState.earthTrajectoryPhase !== currentPhase) {
        console.log(`🌍 地球轨道阶段变化: ${voyageState.earthTrajectoryPhase} -> ${currentPhase} (${Math.floor(voyageState.chronicleTime)}年)`);
        voyageState.earthTrajectoryPhase = currentPhase;
        
        // 初始化新阶段的轨道参数
        initializeEarthTrajectoryPhase(currentPhase);
    }
    
    // 更新地球轨道
    updateEarthTrajectory(deltaTime);
    
    // 更新地球行星发动机
    const earth = voyageState.planets.earth;
    if (earth) {
        updatePlanetaryEngines(earth, voyageState.chronicleTime);
    }
    
    // 更新其他行星的演化
    updatePlanetaryEvolution(deltaTime);
}

/**
 * 初始化地球轨道阶段
 */
function initializeEarthTrajectoryPhase(phase) {
    const earth = voyageState.planets.earth;
    if (!earth) return;
    
    const trajectory = earth.userData.wanderingTrajectory || VOYAGE_CONFIG.planets.earth.wanderingTrajectory;
    
    switch (phase) {
        case 'solar_orbit':
            // 太阳轨道阶段 - 正常轨道运动
            trajectory.currentRadius = VOYAGE_CONFIG.planets.earth.orbitRadius;
            trajectory.velocity = { x: 0, y: 0, z: 0 };
            trajectory.acceleration = { x: 0, y: 0, z: 0 };
            console.log('🌍 地球进入太阳轨道阶段');
            break;
            
        case 'departure':
            // 脱离阶段 - 开始脱离太阳轨道
            trajectory.departureAngle = earth.userData.orbitAngle;
            trajectory.departureRadius = earth.userData.orbitRadius;
            
            // 计算脱离速度（切向速度 + 径向速度）
            const escapeSpeed = 0.01; // 脱离速度
            const currentAngle = earth.userData.orbitAngle;
            
            // 切向速度（原轨道速度）
            trajectory.velocity.x = -Math.sin(currentAngle) * earth.userData.orbitSpeed * earth.userData.orbitRadius;
            trajectory.velocity.z = Math.cos(currentAngle) * earth.userData.orbitSpeed * earth.userData.orbitRadius;
            
            // 径向速度（向外脱离）
            trajectory.velocity.x += Math.cos(currentAngle) * escapeSpeed;
            trajectory.velocity.z += Math.sin(currentAngle) * escapeSpeed;
            trajectory.velocity.y = 0;
            
            console.log('🚀 地球开始脱离太阳轨道');
            break;
            
        case 'wandering':
            // 流浪阶段 - 直线运动，逐渐加速
            const wanderingDirection = normalizeVector(trajectory.velocity);
            const wanderingSpeed = 0.02; // 流浪速度
            
            trajectory.velocity.x = wanderingDirection.x * wanderingSpeed;
            trajectory.velocity.y = wanderingDirection.y * wanderingSpeed;
            trajectory.velocity.z = wanderingDirection.z * wanderingSpeed;
            
            // 行星发动机推进加速度
            trajectory.acceleration.x = wanderingDirection.x * 0.0001;
            trajectory.acceleration.y = wanderingDirection.y * 0.0001;
            trajectory.acceleration.z = wanderingDirection.z * 0.0001;
            
            console.log('🌌 地球进入流浪阶段');
            break;
            
        case 'jupiter_crisis':
            // 木星危机阶段 - 引力助推轨道
            const jupiter = voyageState.planets.jupiter;
            if (jupiter) {
                // 计算朝向木星的轨道
                const toJupiter = {
                    x: jupiter.position.x - earth.position.x,
                    y: jupiter.position.y - earth.position.y,
                    z: jupiter.position.z - earth.position.z
                };
                const jupiterDirection = normalizeVector(toJupiter);
                
                // 设置朝向木星的速度
                const approachSpeed = 0.03;
                trajectory.velocity.x = jupiterDirection.x * approachSpeed;
                trajectory.velocity.y = jupiterDirection.y * approachSpeed;
                trajectory.velocity.z = jupiterDirection.z * approachSpeed;
                
                // 木星引力加速度
                trajectory.acceleration.x = jupiterDirection.x * 0.0005;
                trajectory.acceleration.y = jupiterDirection.y * 0.0005;
                trajectory.acceleration.z = jupiterDirection.z * 0.0005;
            }
            
            console.log('⚡ 地球进入木星危机阶段');
            break;
            
        case 'deep_space':
            // 深空流浪阶段 - 高速直线运动
            const deepSpaceDirection = normalizeVector(trajectory.velocity);
            const deepSpaceSpeed = 0.04; // 更高的深空速度
            
            trajectory.velocity.x = deepSpaceDirection.x * deepSpaceSpeed;
            trajectory.velocity.y = deepSpaceDirection.y * deepSpaceSpeed;
            trajectory.velocity.z = deepSpaceDirection.z * deepSpaceSpeed;
            
            // 减少加速度，保持匀速
            trajectory.acceleration.x *= 0.1;
            trajectory.acceleration.y *= 0.1;
            trajectory.acceleration.z *= 0.1;
            
            console.log('🌠 地球进入深空流浪阶段');
            break;
    }
    
    // 更新地球的轨道数据
    earth.userData.wanderingTrajectory = trajectory;
}

/**
 * 更新地球轨道
 */
function updateEarthTrajectory(deltaTime) {
    const earth = voyageState.planets.earth;
    if (!earth) return;
    
    const trajectory = earth.userData.wanderingTrajectory;
    const phase = voyageState.earthTrajectoryPhase;
    
    switch (phase) {
        case 'solar_orbit':
            // 正常太阳轨道运动（保持原有逻辑）
            earth.userData.orbitAngle += earth.userData.orbitSpeed * deltaTime * 0.001;
            const x = Math.cos(earth.userData.orbitAngle) * earth.userData.orbitRadius;
            const z = Math.sin(earth.userData.orbitAngle) * earth.userData.orbitRadius;
            earth.position.set(x, 0, z);
            break;
            
        case 'departure':
        case 'wandering':
        case 'jupiter_crisis':
        case 'deep_space':
            // 基于速度和加速度的运动
            const timeScale = deltaTime * 0.001;
            
            // 更新速度
            trajectory.velocity.x += trajectory.acceleration.x * timeScale;
            trajectory.velocity.y += trajectory.acceleration.y * timeScale;
            trajectory.velocity.z += trajectory.acceleration.z * timeScale;
            
            // 更新位置
            earth.position.x += trajectory.velocity.x * timeScale;
            earth.position.y += trajectory.velocity.y * timeScale;
            earth.position.z += trajectory.velocity.z * timeScale;
            
            // 木星危机阶段的特殊处理
            if (phase === 'jupiter_crisis') {
                updateJupiterGravityAssist(earth, deltaTime);
            }
            
            break;
    }
    
    // 同步地球特效位置
    syncEarthEffects(earth);
}

/**
 * 更新木星引力助推效果
 * 根据编年史，这是2500年的关键事件
 */
function updateJupiterGravityAssist(earth, deltaTime) {
    const jupiter = voyageState.planets.jupiter;
    if (!jupiter) return;
    
    const trajectory = earth.userData.wanderingTrajectory;
    
    // 计算地球到木星的距离向量
    const distanceVector = {
        x: jupiter.position.x - earth.position.x,
        y: jupiter.position.y - earth.position.y,
        z: jupiter.position.z - earth.position.z
    };
    
    const distance = Math.sqrt(
        distanceVector.x * distanceVector.x +
        distanceVector.y * distanceVector.y +
        distanceVector.z * distanceVector.z
    );
    
    // 木星引力影响范围（更大的影响范围）
    const jupiterInfluenceRadius = 8;
    const jupiterCoreRadius = 2.5; // 危险区域
    
    if (distance < jupiterInfluenceRadius) {
        // 计算引力强度（使用更真实的引力公式）
        const jupiterMass = 1.898e27; // 木星质量（简化单位）
        const earthMass = 5.972e24;   // 地球质量（简化单位）
        const G = 6.674e-11;          // 引力常数（简化）
        
        // 简化的引力计算
        const gravityStrength = 0.005 / (distance * distance + 0.01);
        const normalizedGravity = normalizeVector(distanceVector);
        
        // 应用引力加速度
        trajectory.acceleration.x += normalizedGravity.x * gravityStrength;
        trajectory.acceleration.y += normalizedGravity.y * gravityStrength;
        trajectory.acceleration.z += normalizedGravity.z * gravityStrength;
        
        // 木星危机阶段的特殊处理
        if (distance < jupiterCoreRadius) {
            // 进入危险区域 - 模拟编年史中的危机
            console.log('⚠️ 地球进入木星危险区域！');
            
            // 强烈的潮汐力影响
            const tidalForce = 0.02 / distance;
            trajectory.acceleration.x += normalizedGravity.x * tidalForce;
            trajectory.acceleration.y += normalizedGravity.y * tidalForce;
            trajectory.acceleration.z += normalizedGravity.z * tidalForce;
            
            // 如果距离过近，触发紧急推进
            if (distance < 1.8) {
                console.log('🚨 启动紧急推进系统！');
                
                // 计算逃逸方向（垂直于引力方向）
                const escapeDirection = {
                    x: -normalizedGravity.y,
                    y: normalizedGravity.x,
                    z: normalizedGravity.z * 0.1
                };
                
                const emergencyThrust = 0.015;
                trajectory.velocity.x += escapeDirection.x * emergencyThrust;
                trajectory.velocity.y += escapeDirection.y * emergencyThrust;
                trajectory.velocity.z += escapeDirection.z * emergencyThrust;
            }
        }
        
        // 引力助推效果（当地球经过木星侧面时）
        const crossProduct = {
            x: trajectory.velocity.y * distanceVector.z - trajectory.velocity.z * distanceVector.y,
            y: trajectory.velocity.z * distanceVector.x - trajectory.velocity.x * distanceVector.z,
            z: trajectory.velocity.x * distanceVector.y - trajectory.velocity.y * distanceVector.x
        };
        
        const crossMagnitude = Math.sqrt(
            crossProduct.x * crossProduct.x +
            crossProduct.y * crossProduct.y +
            crossProduct.z * crossProduct.z
        );
        
        // 当地球与木星形成合适角度时，获得最大助推
        if (distance > 2.5 && distance < 4 && crossMagnitude > 0.01) {
            const slingshot = normalizeVector({
                x: trajectory.velocity.x + normalizedGravity.x * 0.1,
                y: trajectory.velocity.y + normalizedGravity.y * 0.1,
                z: trajectory.velocity.z + normalizedGravity.z * 0.1
            });
            
            const boostStrength = 0.008 * (1 - distance / jupiterInfluenceRadius);
            trajectory.velocity.x += slingshot.x * boostStrength;
            trajectory.velocity.y += slingshot.y * boostStrength;
            trajectory.velocity.z += slingshot.z * boostStrength;
            
            console.log('🚀 木星引力助推成功！速度提升：', boostStrength.toFixed(4));
        }
        
        // 限制最大速度，避免过度加速
        const maxSpeed = 0.1;
        const currentSpeed = Math.sqrt(
            trajectory.velocity.x * trajectory.velocity.x +
            trajectory.velocity.y * trajectory.velocity.y +
            trajectory.velocity.z * trajectory.velocity.z
        );
        
        if (currentSpeed > maxSpeed) {
            const speedRatio = maxSpeed / currentSpeed;
            trajectory.velocity.x *= speedRatio;
            trajectory.velocity.y *= speedRatio;
            trajectory.velocity.z *= speedRatio;
        }
    }
}

/**
 * 同步地球特效位置
 */
function syncEarthEffects(earth) {
    // 同步所有地球相关的特效位置
    if (earth.userData.atmosphere) {
        earth.userData.atmosphere.position.copy(earth.position);
    }
    if (earth.userData.lights) {
        earth.userData.lights.position.copy(earth.position);
    }
    if (earth.userData.clouds) {
        earth.userData.clouds.position.copy(earth.position);
        // 云层缓慢旋转
        earth.userData.clouds.rotation.y += 0.001;
    }
    
    // 同步行星发动机位置和效果
    if (earth.userData.engines) {
        earth.userData.engines.position.copy(earth.position);
    }
    
    if (earth.userData.flames) {
        earth.userData.flames.position.copy(earth.position);
        
        // 更新火焰动画效果
        const flameGeometry = earth.userData.flames.geometry;
        const colors = flameGeometry.attributes.color.array;
        
        // 添加火焰闪烁效果
        for (let i = 0; i < colors.length; i += 3) {
            const flickerIntensity = 0.8 + Math.random() * 0.4;
            const baseColor = new THREE.Color(earth.userData.engineConfig.visualEffects.flameColor);
            colors[i] = baseColor.r * flickerIntensity;
            colors[i + 1] = baseColor.g * flickerIntensity;
            colors[i + 2] = baseColor.b * flickerIntensity;
        }
        
        flameGeometry.attributes.color.needsUpdate = true;
    }
}

/**
 * 向量归一化
 */
function normalizeVector(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    if (length === 0) return { x: 0, y: 0, z: 1 }; // 默认方向
    
    return {
        x: vector.x / length,
        y: vector.y / length,
        z: vector.z / length
    };
}

/**
 * 更新木星的特殊演化
 */
function updateJupiterSpecialEvolution(planet, evolution, currentYear) {
    // 木星在2500年成为地球流浪路径的关键点
    if (currentYear >= 2500 && currentYear <= 2501) {
        // 增强木星的引力影响
        evolution.gravitationalInfluence = 1.5;
        
        // 视觉效果：木星变得更加明亮（引力活动增强）
        if (planet.material && planet.material.emissiveIntensity !== undefined) {
            planet.material.emissiveIntensity = 0.6;
        }
        
        // 增强木星的光环效果
        if (planet.userData.glow) {
            planet.userData.glow.material.opacity = 0.5;
        }
    } else {
        // 恢复正常状态
        evolution.gravitationalInfluence = 1.0;
        if (planet.material && planet.material.emissiveIntensity !== undefined) {
            planet.material.emissiveIntensity = 0.4;
        }
        if (planet.userData.glow) {
            planet.userData.glow.material.opacity = 0.3;
        }
    }
}

/**
 * 更新土星光环演化
 */
function updateSaturnRingEvolution(planet, evolution, currentYear) {
    // 光环稳定性随时间下降
    if (currentYear > 3000) {
        const ringDecayProgress = Math.min(1, (currentYear - 3000) / 1000);
        evolution.ringStability = 1 - ringDecayProgress * 0.7;
        
        // 更新光环透明度
        if (planet.userData.rings && planet.userData.rings.material) {
            planet.userData.rings.material.opacity = 0.8 * evolution.ringStability;
        }
        
        // 光环粒子散射效果
        if (planet.userData.rings) {
            const scatterAmount = ringDecayProgress * 0.1;
            planet.userData.rings.scale.set(
                1 + scatterAmount,
                1,
                1 + scatterAmount
            );
        }
    }
}

/**
 * 更新太阳演化
 * 模拟太阳从主序星到红巨星的演化过程
 */
function updateSolarEvolution(currentYear) {
    const sun = voyageState.planets.sun;
    if (!sun) return;
    
    // 太阳演化阶段
    if (currentYear > 2200 && currentYear < 2600) {
        // 太阳开始膨胀阶段
        const expansionProgress = (currentYear - 2200) / 400;
        const expansionFactor = 1 + expansionProgress * 2; // 最大膨胀3倍
        
        // 更新太阳大小
        sun.scale.set(expansionFactor, expansionFactor, expansionFactor);
        
        // 颜色变化：从黄色变为橙红色
        const redShift = expansionProgress * 0.3;
        if (sun.material && sun.material.color) {
            sun.material.color.setRGB(
                1.0,
                0.67 - redShift,
                0.0 + redShift * 0.2
            );
            sun.material.emissive.copy(sun.material.color);
        }
        
        // 增强光晕效果
        const coronas = voyageState.scene.children.filter(child => 
            child.material && child.material.side === THREE.BackSide && 
            child.position.distanceTo(sun.position) < 1
        );
        
        coronas.forEach(corona => {
            if (corona.material) {
                corona.scale.set(expansionFactor * 1.2, expansionFactor * 1.2, expansionFactor * 1.2);
                corona.material.opacity = 0.2 + expansionProgress * 0.3;
            }
        });
        
        console.log(`☀️ 太阳膨胀进度: ${(expansionProgress * 100).toFixed(1)}% (${Math.floor(currentYear)}年)`);
    }
    
    // 红巨星阶段
    else if (currentYear >= 2600) {
        // 太阳达到最大膨胀
        sun.scale.set(3, 3, 3);
        
        // 红巨星颜色
        if (sun.material && sun.material.color) {
            sun.material.color.setRGB(1.0, 0.3, 0.1);
            sun.material.emissive.copy(sun.material.color);
        }
        
        // 不稳定的脉动效果
        const pulsation = Math.sin(Date.now() * 0.001) * 0.1 + 1;
        sun.material.emissiveIntensity = 0.3 * pulsation;
    }
}

/**
 * 获取当前编年史状态信息
 */
function getChronicleStatus() {
    const year = Math.floor(voyageState.chronicleTime);
    const phase = voyageState.earthTrajectoryPhase;
    const phaseData = VOYAGE_CONFIG.chronicle.phases[phase];
    
    let phaseProgress = 0;
    if (phaseData) {
        phaseProgress = (voyageState.chronicleTime - phaseData.start) / (phaseData.end - phaseData.start);
        phaseProgress = Math.max(0, Math.min(1, phaseProgress));
    }
    
    return {
        year: year,
        phase: phase,
        phaseProgress: phaseProgress,
        totalProgress: (voyageState.chronicleTime - VOYAGE_CONFIG.chronicle.startYear) / 
                      (VOYAGE_CONFIG.chronicle.endYear - VOYAGE_CONFIG.chronicle.startYear)
    };
}

/**
 * 更新其他行星的轨道演化
 * 根据编年史时间线模拟太阳系的长期变化
 */
function updatePlanetaryEvolution(deltaTime) {
    const currentYear = voyageState.chronicleTime;
    
    // 更新太阳演化
    updateSolarEvolution(currentYear);
    
    // 遍历所有行星（除地球外）进行演化更新
    Object.keys(VOYAGE_CONFIG.planets).forEach(planetName => {
        if (planetName === 'sun' || planetName === 'earth') return;
        
        const planet = voyageState.planets[planetName];
        const planetConfig = VOYAGE_CONFIG.planets[planetName];
        
        if (!planet || !planetConfig.evolution) return;
        
        const evolution = planetConfig.evolution;
        
        // 根据行星类型应用不同的演化规则
        switch (planetName) {
            case 'mercury':
                updateInnerPlanetEvolution(planet, evolution, currentYear, planetName);
                break;
            case 'venus':
                updateInnerPlanetEvolution(planet, evolution, currentYear, planetName);
                break;
            case 'mars':
                updateMarsEvolution(planet, evolution, currentYear);
                break;
            case 'jupiter':
                updateJupiterSpecialEvolution(planet, evolution, currentYear);
                updateOuterPlanetEvolution(planet, evolution, currentYear);
                break;
            case 'saturn':
                updateSaturnRingEvolution(planet, evolution, currentYear);
                updateOuterPlanetEvolution(planet, evolution, currentYear);
                break;
            case 'uranus':
            case 'neptune':
                updateOuterPlanetEvolution(planet, evolution, currentYear);
                break;
        }
    });
}

/**
 * 更新内行星演化（水星、金星）
 * 主要受太阳膨胀影响
 */
function updateInnerPlanetEvolution(planet, evolution, currentYear, planetName) {
    // 检查是否被太阳吞噬
    if (currentYear >= evolution.destructionYear && !evolution.isDestroyed) {
        console.log(`☀️ ${planetName === 'mercury' ? '水星' : '金星'}被膨胀的太阳吞噬！`);
        
        // 标记为已被摧毁
        evolution.isDestroyed = true;
        
        // 隐藏行星
        planet.visible = false;
        
        // 隐藏相关效果
        if (planet.userData.glow) {
            planet.userData.glow.visible = false;
        }
        
        return;
    }
    
    // 太阳膨胀对内行星轨道的影响
    if (currentYear > 2200 && currentYear < evolution.destructionYear) {
        const solarExpansionProgress = (currentYear - 2200) / (evolution.destructionYear - 2200);
        
        // 轨道衰减（太阳质量损失和潮汐力）
        const orbitDecayFactor = 1 - solarExpansionProgress * 0.1;
        evolution.currentRadius = evolution.originalRadius * orbitDecayFactor;
        
        // 更新轨道半径
        if (planet.userData && planet.userData.orbitRadius) {
            planet.userData.orbitRadius = evolution.currentRadius;
        }
        
        // 视觉效果：行星变得更热（接近太阳）
        if (planet.material && planet.material.emissiveIntensity !== undefined) {
            const heatIntensity = 0.2 + solarExpansionProgress * 0.4;
            planet.material.emissiveIntensity = heatIntensity;
            
            // 颜色变化：变得更红
            if (planet.material.emissive) {
                const redShift = solarExpansionProgress * 0.3;
                const originalColor = new THREE.Color(VOYAGE_CONFIG.planets[planetName].color);
                planet.material.emissive.setRGB(
                    Math.min(1, originalColor.r + redShift),
                    originalColor.g * (1 - redShift * 0.5),
                    originalColor.b * (1 - redShift * 0.7)
                );
            }
        }
    }
}

/**
 * 更新火星演化
 * 大气流失和轨道变化
 */
function updateMarsEvolution(planet, evolution, currentYear) {
    // 火星大气流失（太阳风影响）
    if (currentYear > 2100) {
        const atmosphereLossProgress = Math.min(1, (currentYear - 2100) / 1000);
        evolution.atmosphereLoss = atmosphereLossProgress;
        
        // 视觉效果：火星变得更暗淡
        if (planet.material && planet.material.emissiveIntensity !== undefined) {
            const originalIntensity = 0.3;
            planet.material.emissiveIntensity = originalIntensity * (1 - atmosphereLossProgress * 0.5);
        }
        
        // 轨道缓慢衰减
        const orbitDecayFactor = 1 - evolution.orbitDecay * atmosphereLossProgress;
        evolution.currentRadius = evolution.originalRadius * orbitDecayFactor;
        
        if (planet.userData && planet.userData.orbitRadius) {
            planet.userData.orbitRadius = evolution.currentRadius;
        }
    }
    
    // 火星在地球流浪后期可能成为重要的参考点
    if (currentYear > 3000) {
        // 火星作为太阳系"遗迹"的象征意义
        if (planet.material && planet.material.emissive) {
            // 轻微的脉动效果，象征着过去的生命迹象
            const pulsation = Math.sin(Date.now() * 0.0005) * 0.1 + 0.9;
            const baseColor = new THREE.Color(VOYAGE_CONFIG.planets.mars.color);
            planet.material.emissive.copy(baseColor.multiplyScalar(0.2 * pulsation));
        }
    }
}

/**
 * 更新外行星演化（木星、土星、天王星、海王星）
 * 主要是轨道扩张
 */
function updateOuterPlanetEvolution(planet, evolution, currentYear) {
    // 太阳质量损失导致的轨道扩张
    if (currentYear > 2200) {
        const solarMassLossProgress = Math.min(1, (currentYear - 2200) / 2000);
        const expansionFactor = 1 + evolution.orbitExpansion * solarMassLossProgress * 1000;
        
        evolution.currentRadius = evolution.originalRadius * expansionFactor;
        
        // 更新轨道半径
        if (planet.userData && planet.userData.orbitRadius) {
            planet.userData.orbitRadius = evolution.currentRadius;
        }
        
        // 轨道速度调整（开普勒第三定律）
        if (planet.userData && planet.userData.orbitSpeed) {
            const speedFactor = Math.pow(evolution.originalRadius / evolution.currentRadius, 1.5);
            planet.userData.orbitSpeed = VOYAGE_CONFIG.planets[planet.name]?.orbitSpeed * speedFactor || planet.userData.orbitSpeed * speedFactor;
        }
    }
    
    // 深空阶段的外行星状态
    if (currentYear > 3000) {
        // 外行星变得更加寒冷和暗淡
        if (planet.material && planet.material.emissiveIntensity !== undefined) {
            const coolingProgress = Math.min(1, (currentYear - 3000) / 1500);
            const originalIntensity = 0.4;
            planet.material.emissiveIntensity = originalIntensity * (1 - coolingProgress * 0.6);
        }
        
        // 光环效果减弱
        if (planet.userData.glow) {
            const coolingProgress = Math.min(1, (currentYear - 3000) / 1500);
            planet.userData.glow.material.opacity = 0.3 * (1 - coolingProgress * 0.5);
        }
    }
}