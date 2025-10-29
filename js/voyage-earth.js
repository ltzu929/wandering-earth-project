// 地球模块 - 轨道变化和行星发动机系统
// Earth Module - Orbital Changes and Planetary Engine System

// 地球配置
const EARTH_CONFIG = {
    // 轨道参数
    orbit: {
        initialRadius: 150,
        finalRadius: 300,
        escapeRadius: 500,
        escapeSpeed: 0.02
    },
    
    // 行星发动机配置
    engines: {
        count: 10000,
        thrust: 0.001,
        activationPhases: {
            departure: { year: 2019, activeRatio: 0.3, thrustMultiplier: 1.0 },
            wandering: { year: 2020, activeRatio: 0.5, thrustMultiplier: 1.2 },
            jupiterCrisis: { year: 2023, activeRatio: 0.8, thrustMultiplier: 2.0 },
            deepSpace: { year: 2025, activeRatio: 0.6, thrustMultiplier: 1.5 }
        },
        visualEffects: {
            flameColor: { r: 0.2, g: 0.6, b: 1.0 },
            intensity: 0.8,
            particleCount: 5000,
            flameLength: 2.0
        }
    },
    
    // 轨道阶段
    phases: {
        stable: { startYear: 2019, endYear: 2020 },
        departure: { startYear: 2020, endYear: 2022 },
        wandering: { startYear: 2022, endYear: 2023 },
        jupiterCrisis: { startYear: 2023, endYear: 2024 },
        deepSpace: { startYear: 2024, endYear: 2030 }
    }
};

// 创建地球和相关效果
function createEarth(scene) {
    // 地球几何体和材质
    const earthGeometry = new THREE.SphereGeometry(6.371, 64, 32);
    const earthTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    const earthMaterial = new THREE.MeshPhongMaterial({ 
        map: earthTexture,
        shininess: 0.1
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.name = 'Earth';
    earth.userData = {
        type: 'planet',
        originalRadius: 150,
        currentRadius: 150,
        angle: 0,
        speed: 0.01,
        rotationSpeed: 0.01,
        engines: null,
        engineFlames: null,
        atmosphere: null,
        cityLights: null,
        clouds: null
    };
    
    scene.add(earth);
    
    // 创建地球大气层
    createEarthAtmosphere(earth, scene);
    
    // 创建城市灯光
    createCityLights(earth, scene);
    
    // 创建云层
    createClouds(earth, scene);
    
    // 创建行星发动机
    createPlanetaryEngines(earth, scene);
    
    return earth;
}

// 创建地球大气层
function createEarthAtmosphere(earth, scene) {
    const atmosphereGeometry = new THREE.SphereGeometry(6.8, 32, 16);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.name = 'EarthAtmosphere';
    scene.add(atmosphere);
    
    earth.userData.atmosphere = atmosphere;
    return atmosphere;
}

// 创建城市灯光
function createCityLights(earth, scene) {
    const cityGeometry = new THREE.SphereGeometry(6.372, 32, 16);
    const cityTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_lights_2048.jpg');
    const cityMaterial = new THREE.MeshBasicMaterial({
        map: cityTexture,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    const cityLights = new THREE.Mesh(cityGeometry, cityMaterial);
    cityLights.name = 'EarthCityLights';
    scene.add(cityLights);
    
    earth.userData.cityLights = cityLights;
    return cityLights;
}

// 创建云层
function createClouds(earth, scene) {
    const cloudGeometry = new THREE.SphereGeometry(6.4, 32, 16);
    const cloudTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.4
    });
    
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    clouds.name = 'EarthClouds';
    scene.add(clouds);
    
    earth.userData.clouds = clouds;
    return clouds;
}

// 创建行星发动机
function createPlanetaryEngines(earth, scene) {
    const engineCount = EARTH_CONFIG.engines.count;
    const enginePositions = new Float32Array(engineCount * 3);
    const engineColors = new Float32Array(engineCount * 3);
    
    // 生成发动机位置（在地球表面随机分布）
    for (let i = 0; i < engineCount; i++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = 2 * Math.PI * Math.random();
        
        const radius = 6.5; // 略高于地球表面
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        enginePositions[i * 3] = x;
        enginePositions[i * 3 + 1] = y;
        enginePositions[i * 3 + 2] = z;
        
        // 蓝色等离子火焰颜色
        const config = EARTH_CONFIG.engines.visualEffects.flameColor;
        engineColors[i * 3] = config.r;
        engineColors[i * 3 + 1] = config.g;
        engineColors[i * 3 + 2] = config.b;
    }
    
    // 创建发动机粒子系统
    const engineGeometry = new THREE.BufferGeometry();
    engineGeometry.setAttribute('position', new THREE.BufferAttribute(enginePositions, 3));
    engineGeometry.setAttribute('color', new THREE.BufferAttribute(engineColors, 3));
    
    const engineMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const engines = new THREE.Points(engineGeometry, engineMaterial);
    engines.name = 'PlanetaryEngines';
    scene.add(engines);
    
    // 创建火焰尾迹
    const flameCount = Math.floor(engineCount * 0.3); // 30%的发动机显示火焰
    const flamePositions = new Float32Array(flameCount * 3);
    const flameColors = new Float32Array(flameCount * 3);
    
    for (let i = 0; i < flameCount; i++) {
        const sourceIndex = Math.floor(Math.random() * engineCount);
        flamePositions[i * 3] = enginePositions[sourceIndex * 3] * 1.2;
        flamePositions[i * 3 + 1] = enginePositions[sourceIndex * 3 + 1] * 1.2;
        flamePositions[i * 3 + 2] = enginePositions[sourceIndex * 3 + 2] * 1.2;
        
        // 渐变色：从蓝色到透明
        const intensity = Math.random() * 0.5 + 0.5;
        flameColors[i * 3] = 0.2 * intensity;
        flameColors[i * 3 + 1] = 0.6 * intensity;
        flameColors[i * 3 + 2] = 1.0 * intensity;
    }
    
    const flameGeometry = new THREE.BufferGeometry();
    flameGeometry.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
    flameGeometry.setAttribute('color', new THREE.BufferAttribute(flameColors, 3));
    
    const flameMaterial = new THREE.PointsMaterial({
        size: 1.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    const engineFlames = new THREE.Points(flameGeometry, flameMaterial);
    engineFlames.name = 'EngineFlames';
    scene.add(engineFlames);
    
    earth.userData.engines = engines;
    earth.userData.engineFlames = engineFlames;
    
    return { engines, engineFlames };
}

// 更新地球轨道
function updateEarthTrajectory(earth, chronoYear) {
    if (!earth) return;
    
    const config = EARTH_CONFIG;
    let targetRadius = config.orbit.initialRadius;
    let speed = earth.userData.speed;
    
    // 根据时间阶段调整轨道
    if (chronoYear >= config.phases.departure.startYear) {
        const progress = Math.min(1, (chronoYear - config.phases.departure.startYear) / 
                                 (config.phases.deepSpace.endYear - config.phases.departure.startYear));
        
        if (chronoYear >= config.phases.deepSpace.startYear) {
            // 深空阶段：逃逸轨道
            targetRadius = config.orbit.escapeRadius;
            speed = config.orbit.escapeSpeed;
        } else if (chronoYear >= config.phases.jupiterCrisis.startYear) {
            // 木星危机：轨道扩张
            const crisisProgress = (chronoYear - config.phases.jupiterCrisis.startYear) / 
                                 (config.phases.jupiterCrisis.endYear - config.phases.jupiterCrisis.startYear);
            targetRadius = config.orbit.initialRadius + (config.orbit.finalRadius - config.orbit.initialRadius) * crisisProgress;
        } else {
            // 流浪阶段：缓慢扩张
            targetRadius = config.orbit.initialRadius + (config.orbit.finalRadius - config.orbit.initialRadius) * progress * 0.5;
        }
    }
    
    // 平滑过渡到目标轨道
    earth.userData.currentRadius += (targetRadius - earth.userData.currentRadius) * 0.02;
    earth.userData.speed = speed;
    
    // 更新位置
    earth.userData.angle += earth.userData.speed;
    earth.position.x = Math.cos(earth.userData.angle) * earth.userData.currentRadius;
    earth.position.z = Math.sin(earth.userData.angle) * earth.userData.currentRadius;
    
    // 自转
    earth.rotation.y += earth.userData.rotationSpeed;
}

// 同步地球效果
function syncEarthEffects(earth) {
    if (!earth) return;
    
    const position = earth.position;
    const rotation = earth.rotation;
    
    // 同步大气层
    if (earth.userData.atmosphere) {
        earth.userData.atmosphere.position.copy(position);
        earth.userData.atmosphere.rotation.copy(rotation);
    }
    
    // 同步城市灯光
    if (earth.userData.cityLights) {
        earth.userData.cityLights.position.copy(position);
        earth.userData.cityLights.rotation.copy(rotation);
    }
    
    // 同步云层
    if (earth.userData.clouds) {
        earth.userData.clouds.position.copy(position);
        earth.userData.clouds.rotation.y = rotation.y * 0.95; // 云层稍慢旋转
    }
    
    // 同步行星发动机
    if (earth.userData.engines) {
        earth.userData.engines.position.copy(position);
        earth.userData.engines.rotation.copy(rotation);
    }
    
    if (earth.userData.engineFlames) {
        earth.userData.engineFlames.position.copy(position);
        earth.userData.engineFlames.rotation.copy(rotation);
        
        // 火焰闪烁效果
        const time = Date.now() * 0.005;
        earth.userData.engineFlames.material.opacity = 0.4 + Math.sin(time) * 0.2;
    }
}

// 更新行星发动机
function updatePlanetaryEngines(earth, chronoYear) {
    if (!earth || !earth.userData.engines) return;
    
    const config = EARTH_CONFIG.engines;
    const phases = config.activationPhases;
    
    let currentPhase = null;
    let activeRatio = 0;
    let thrustMultiplier = 1.0;
    
    // 确定当前阶段
    if (chronoYear >= phases.deepSpace.year) {
        currentPhase = phases.deepSpace;
    } else if (chronoYear >= phases.jupiterCrisis.year) {
        currentPhase = phases.jupiterCrisis;
    } else if (chronoYear >= phases.wandering.year) {
        currentPhase = phases.wandering;
    } else if (chronoYear >= phases.departure.year) {
        currentPhase = phases.departure;
    }
    
    if (currentPhase) {
        activeRatio = currentPhase.activeRatio;
        thrustMultiplier = currentPhase.thrustMultiplier;
        
        // 木星危机期间增强效果
        if (chronoYear >= phases.jupiterCrisis.year && chronoYear < phases.deepSpace.year) {
            const crisisIntensity = 1.0 + Math.sin(Date.now() * 0.01) * 0.3;
            thrustMultiplier *= crisisIntensity;
            activeRatio = Math.min(1.0, activeRatio * crisisIntensity);
        }
    }
    
    // 更新发动机视觉效果
    if (earth.userData.engines) {
        const material = earth.userData.engines.material;
        material.opacity = activeRatio * config.visualEffects.intensity;
        material.size = 0.5 * thrustMultiplier;
    }
    
    if (earth.userData.engineFlames) {
        const material = earth.userData.engineFlames.material;
        material.opacity = activeRatio * 0.6;
        material.size = 1.0 * thrustMultiplier;
    }
}

// 木星引力助推
function updateJupiterGravityAssist(earth, chronoYear) {
    if (!earth) return;
    
    // 木星危机期间的引力助推效果
    if (chronoYear >= 2023 && chronoYear < 2024) {
        const progress = (chronoYear - 2023) / 1.0;
        const maxSpeed = 0.05;
        
        // 引力助推加速
        const assistSpeed = maxSpeed * Math.sin(progress * Math.PI);
        earth.userData.speed = Math.min(earth.userData.speed + assistSpeed * 0.1, maxSpeed);
        
        // 限制最大速度，避免轨道过于不稳定
        if (earth.userData.speed > maxSpeed) {
            earth.userData.speed = maxSpeed;
        }
    }
}

// 将所有函数和配置添加到全局window对象
window.EARTH_CONFIG = EARTH_CONFIG;
window.createEarth = createEarth;
window.createEarthAtmosphere = createEarthAtmosphere;
window.createCityLights = createCityLights;
window.createClouds = createClouds;
window.createPlanetaryEngines = createPlanetaryEngines;
window.updateEarthTrajectory = updateEarthTrajectory;
window.syncEarthEffects = syncEarthEffects;
window.updatePlanetaryEngines = updatePlanetaryEngines;
window.updateJupiterGravityAssist = updateJupiterGravityAssist;