/**
 * 航程引导动画 - 行星系统模块
 * 负责太阳系创建和行星演化
 */

// 行星配置
const PLANET_CONFIG = {
    sun: { radius: 2, position: [0, 0, 0], color: 0xFFAA00 },
    mercury: { 
        radius: 0.15, 
        orbitRadius: 4, 
        orbitAngle: 0, 
        orbitSpeed: 0.04,
        color: 0x8C7853, 
        orbit: 4,
        evolution: {
            originalRadius: 4,
            currentRadius: 4,
            isDestroyed: false,
            destructionYear: 2400
        }
    },
    venus: { 
        radius: 0.35, 
        orbitRadius: 6, 
        orbitAngle: Math.PI * 0.3, 
        orbitSpeed: 0.025,
        color: 0xFFC649, 
        orbit: 6,
        evolution: {
            originalRadius: 6,
            currentRadius: 6,
            isDestroyed: false,
            destructionYear: 2450
        }
    },
    mars: { 
        radius: 0.25, 
        orbitRadius: 12, 
        orbitAngle: Math.PI * 0.9, 
        orbitSpeed: 0.015,
        color: 0xCD5C5C, 
        orbit: 12,
        evolution: {
            originalRadius: 12,
            currentRadius: 12,
            orbitDecay: 0.001,
            atmosphereLoss: 0
        }
    },
    jupiter: { 
        radius: 1.2, 
        orbitRadius: 20, 
        orbitAngle: Math.PI * 1.2, 
        orbitSpeed: 0.008,
        color: 0xD8CA9D, 
        orbit: 20,
        evolution: {
            originalRadius: 20,
            currentRadius: 20,
            orbitExpansion: 0.0005,
            gravitationalInfluence: 1.0
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
        evolution: {
            originalRadius: 30,
            currentRadius: 30,
            orbitExpansion: 0.0003,
            ringStability: 1.0
        }
    },
    uranus: { 
        radius: 1.0, 
        orbitRadius: 45, 
        orbitAngle: Math.PI * 1.8, 
        orbitSpeed: 0.004,
        color: 0x4FD0E7, 
        orbit: 45,
        evolution: {
            originalRadius: 45,
            currentRadius: 45,
            orbitExpansion: 0.0002
        }
    },
    neptune: { 
        radius: 0.58, 
        orbitRadius: 60, 
        orbitAngle: Math.PI * 0.1, 
        orbitSpeed: 0.003,
        color: 0x4B70DD, 
        orbit: 60,
        evolution: {
            originalRadius: 60,
            currentRadius: 60,
            orbitExpansion: 0.0001
        }
    }
};

/**
 * 创建太阳系
 */
function createSolarSystem(scene) {
    const planets = {};
    
    // 创建太阳
    const sun = createSun(scene);
    planets.sun = sun;
    
    // 创建行星
    const planetObjects = createPlanets(scene);
    Object.assign(planets, planetObjects);
    
    // 设置光照
    setupLighting(scene);
    
    console.log('✅ 太阳系创建完成');
    return { sun, planets };
}

/**
 * 创建太阳
 */
function createSun(scene) {
    const sunGeometry = new THREE.SphereGeometry(PLANET_CONFIG.sun.radius, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: PLANET_CONFIG.sun.color,
        emissive: PLANET_CONFIG.sun.color,
        emissiveIntensity: 0.3
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(...PLANET_CONFIG.sun.position);
    sun.name = 'Sun';
    sun.userData = {
        type: 'star',
        originalRadius: PLANET_CONFIG.sun.radius,
        originalColor: PLANET_CONFIG.sun.color
    };
    scene.add(sun);
    
    // 添加太阳光晕效果
    const coronaGeometry = new THREE.SphereGeometry(PLANET_CONFIG.sun.radius * 1.5, 32, 32);
    const coronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFAA00,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    corona.position.copy(sun.position);
    scene.add(corona);
    
    return sun;
}

/**
 * 创建行星
 */
function createPlanets(scene) {
    const planets = {};
    
    Object.keys(PLANET_CONFIG).forEach(planetName => {
        if (planetName === 'sun') return;
        
        const planetConfig = PLANET_CONFIG[planetName];
        const geometry = new THREE.SphereGeometry(planetConfig.radius, 16, 16);
        const material = createPlanetMaterial(planetName, planetConfig);
        
        const planet = new THREE.Mesh(geometry, material);
        
        // 计算初始位置
        const orbitRadius = planetConfig.orbitRadius;
        const orbitAngle = planetConfig.orbitAngle;
        const x = Math.cos(orbitAngle) * orbitRadius;
        const z = Math.sin(orbitAngle) * orbitRadius;
        const y = 0;
        
        planet.position.set(x, y, z);
        planet.castShadow = true;
        planet.receiveShadow = true;
        planet.name = planetName;
        
        // 存储轨道信息
        planet.userData = {
            orbitRadius: orbitRadius,
            orbitAngle: orbitAngle,
            orbitSpeed: planetConfig.orbitSpeed,
            evolution: { ...planetConfig.evolution }
        };
        
        planets[planetName] = planet;
        scene.add(planet);
        
        // 创建轨道线
        createOrbitLine(scene, orbitRadius);
        
        // 为土星创建光环
        if (planetConfig.hasRings) {
            createSaturnRings(scene, planet);
        }
        
        // 为大行星添加发光效果
        if (planetName === 'jupiter' || planetName === 'saturn') {
            addPlanetGlow(scene, planet, planetConfig.color);
        }
    });
    
    return planets;
}

/**
 * 创建行星材质
 */
function createPlanetMaterial(planetName, planetConfig) {
    switch (planetName) {
        case 'mercury':
            return new THREE.MeshPhongMaterial({
                color: planetConfig.color,
                emissive: new THREE.Color(planetConfig.color).multiplyScalar(0.2),
                emissiveIntensity: 0.3,
                shininess: 100,
                specular: 0x444444
            });
        case 'venus':
            return new THREE.MeshPhongMaterial({
                color: planetConfig.color,
                emissive: new THREE.Color(0xFFAA00).multiplyScalar(0.3),
                emissiveIntensity: 0.4,
                shininess: 30,
                specular: 0x222222
            });
        case 'mars':
            return new THREE.MeshLambertMaterial({
                color: planetConfig.color,
                emissive: new THREE.Color(0x441100).multiplyScalar(0.5),
                emissiveIntensity: 0.3
            });
        case 'jupiter':
            return new THREE.MeshPhongMaterial({
                color: planetConfig.color,
                emissive: new THREE.Color(planetConfig.color).multiplyScalar(0.2),
                emissiveIntensity: 0.4,
                shininess: 20,
                specular: 0x333333
            });
        case 'saturn':
            return new THREE.MeshPhongMaterial({
                color: planetConfig.color,
                emissive: new THREE.Color(0xFFDD88).multiplyScalar(0.2),
                emissiveIntensity: 0.4,
                shininess: 15,
                specular: 0x222222
            });
        case 'uranus':
            return new THREE.MeshPhongMaterial({
                color: planetConfig.color,
                emissive: new THREE.Color(0x0088AA).multiplyScalar(0.3),
                emissiveIntensity: 0.5,
                shininess: 40,
                specular: 0x111111
            });
        case 'neptune':
            return new THREE.MeshPhongMaterial({
                color: planetConfig.color,
                emissive: new THREE.Color(0x0044AA).multiplyScalar(0.4),
                emissiveIntensity: 0.5,
                shininess: 50,
                specular: 0x222222
            });
        default:
            return new THREE.MeshLambertMaterial({ 
                color: planetConfig.color,
                emissive: new THREE.Color(planetConfig.color).multiplyScalar(0.3),
                emissiveIntensity: 0.4
            });
    }
}

/**
 * 设置光照
 */
function setupLighting(scene) {
    // 太阳光源
    const sunLight = new THREE.PointLight(0xFFFFFF, 3, 150);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    scene.add(sunLight);
    
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    
    // 定向光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
}

/**
 * 创建轨道线
 */
function createOrbitLine(scene, radius) {
    const orbitGeometry = new THREE.RingGeometry(radius - 0.05, radius + 0.05, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitLine.rotation.x = -Math.PI / 2;
    scene.add(orbitLine);
}

/**
 * 创建土星光环
 */
function createSaturnRings(scene, planet) {
    const ringGeometry = new THREE.RingGeometry(1.2, 2.0, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    const gradient = context.createRadialGradient(128, 128, 50, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.3, 'rgba(200, 200, 200, 0.6)');
    gradient.addColorStop(0.7, 'rgba(150, 150, 150, 0.4)');
    gradient.addColorStop(1, 'rgba(100, 100, 100, 0.1)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    
    const ringTexture = new THREE.CanvasTexture(canvas);
    const ringMaterial = new THREE.MeshBasicMaterial({
        map: ringTexture,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = -Math.PI / 2;
    rings.position.copy(planet.position);
    
    planet.userData.rings = rings;
    scene.add(rings);
}

/**
 * 为大行星添加发光效果
 */
function addPlanetGlow(scene, planet, color) {
    const glowGeometry = new THREE.SphereGeometry(planet.geometry.parameters.radius * 1.3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(planet.position);
    planet.userData.glow = glow;
    scene.add(glow);
}

/**
 * 更新行星轨道运动
 */
function updatePlanetOrbits(planets, deltaTime) {
    if (!planets) return;
    
    Object.keys(planets).forEach(planetName => {
        if (planetName === 'sun' || planetName === 'earth') return;
        
        const planet = planets[planetName];
        if (!planet || !planet.userData) return;
        
        // 更新轨道角度
        planet.userData.orbitAngle += planet.userData.orbitSpeed * deltaTime * 0.001;
        
        // 计算新位置
        const radius = planet.userData.orbitRadius;
        const angle = planet.userData.orbitAngle;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        planet.position.set(x, 0, z);
        
        // 同步附属对象位置
        if (planet.userData.rings) {
            planet.userData.rings.position.copy(planet.position);
        }
        if (planet.userData.glow) {
            planet.userData.glow.position.copy(planet.position);
        }
    });
}

/**
 * 更新太阳演化
 */
function updateSolarEvolution(sun, currentYear) {
    if (!sun) return;
    
    // 太阳演化阶段
    if (currentYear > 2200) {
        const evolutionProgress = Math.min(1, (currentYear - 2200) / 2000);
        
        // 太阳膨胀
        const expansionFactor = 1 + evolutionProgress * 50;
        sun.scale.setScalar(expansionFactor);
        
        // 颜色变化：从黄色到红色
        const redIntensity = Math.min(1, evolutionProgress * 2);
        const yellowIntensity = Math.max(0, 1 - evolutionProgress);
        
        const newColor = new THREE.Color(
            1,
            yellowIntensity * 0.67 + redIntensity * 0.2,
            yellowIntensity * 0.0 + redIntensity * 0.0
        );
        
        sun.material.color = newColor;
        sun.material.emissive = newColor;
        sun.material.emissiveIntensity = 0.3 + evolutionProgress * 0.4;
        
        console.log(`☀️ 太阳演化进度: ${Math.floor(evolutionProgress * 100)}% (${Math.floor(currentYear)}年)`);
    }
}

/**
 * 更新行星演化
 */
function updatePlanetaryEvolution(scene, sun, planets, currentYear, deltaTime) {
    if (!planets) return;
    
    // 更新太阳演化
    updateSolarEvolution(sun, currentYear);
    
    // 更新各行星演化
    Object.keys(PLANET_CONFIG).forEach(planetName => {
        if (planetName === 'sun' || planetName === 'earth') return;
        
        const planet = planets[planetName];
        const evolution = planet?.userData?.evolution;
        
        if (!planet || !evolution) return;
        
        if (planetName === 'mercury' || planetName === 'venus') {
            updateInnerPlanetEvolution(scene, planet, evolution, currentYear, planetName);
        } else if (planetName === 'mars') {
            updateMarsEvolution(planet, evolution, currentYear);
        } else {
            updateOuterPlanetEvolution(planet, evolution, currentYear);
        }
    });
}

/**
 * 更新内行星演化
 */
function updateInnerPlanetEvolution(scene, planet, evolution, currentYear, planetName) {
    if (currentYear > evolution.destructionYear && !evolution.isDestroyed) {
        evolution.isDestroyed = true;
        planet.visible = false;
        
        // 创建被吞噬效果
        createDestructionEffect(scene, planet.position, planetName);
        console.log(`💥 ${planetName}被太阳吞噬 (${Math.floor(currentYear)}年)`);
    }
}

/**
 * 更新火星演化
 */
function updateMarsEvolution(planet, evolution, currentYear) {
    if (currentYear > 2300) {
        const evolutionProgress = Math.min(1, (currentYear - 2300) / 1000);
        
        // 轨道衰减
        evolution.currentRadius = evolution.originalRadius * (1 - evolution.orbitDecay * evolutionProgress);
        planet.userData.orbitRadius = evolution.currentRadius;
        
        // 大气流失（颜色变暗）
        evolution.atmosphereLoss = evolutionProgress * 0.5;
        const darkenFactor = 1 - evolution.atmosphereLoss;
        planet.material.color.multiplyScalar(darkenFactor);
    }
}

/**
 * 更新外行星演化
 */
function updateOuterPlanetEvolution(planet, evolution, currentYear) {
    if (currentYear > 2200) {
        const solarMassLossProgress = Math.min(1, (currentYear - 2200) / 2000);
        const expansionFactor = 1 + evolution.orbitExpansion * solarMassLossProgress * 1000;
        
        evolution.currentRadius = evolution.originalRadius * expansionFactor;
        planet.userData.orbitRadius = evolution.currentRadius;
    }
}

/**
 * 创建毁灭效果
 */
function createDestructionEffect(scene, position, planetName) {
    const particleCount = 100;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = position.x + (Math.random() - 0.5) * 2;
        positions[i3 + 1] = position.y + (Math.random() - 0.5) * 2;
        positions[i3 + 2] = position.z + (Math.random() - 0.5) * 2;
        
        colors[i3] = 1;
        colors[i3 + 1] = Math.random() * 0.5;
        colors[i3 + 2] = 0;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const effect = new THREE.Points(particles, material);
    scene.add(effect);
    
    // 3秒后移除效果
    setTimeout(() => {
        scene.remove(effect);
    }, 3000);
}

// 将所有函数和配置添加到全局window对象
window.PLANET_CONFIG = PLANET_CONFIG;
window.createSolarSystem = createSolarSystem;
window.createSun = createSun;
window.createPlanets = createPlanets;
window.setupLighting = setupLighting;
window.createOrbitLine = createOrbitLine;
window.createSaturnRings = createSaturnRings;
window.addPlanetGlow = addPlanetGlow;
window.updatePlanetOrbits = updatePlanetOrbits;
window.updateSolarEvolution = updateSolarEvolution;
window.updatePlanetaryEvolution = updatePlanetaryEvolution;
window.createDestructionEffect = createDestructionEffect;