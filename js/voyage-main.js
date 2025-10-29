/**
 * 流浪地球航程动画 - 主模块
 * Wandering Earth Voyage Animation - Main Module
 * 
 * 整合所有子模块，提供统一的接口
 */

// 导入所有模块（在HTML中通过script标签加载）
// voyage-core.js - 核心功能
// voyage-planets.js - 行星系统
// voyage-earth.js - 地球模块
// voyage-animation.js - 动画模块

class VoyageMain {
    constructor() {
        this.state = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // 管理器
        this.timelineManager = null;
        this.cameraController = null;
        this.particleManager = null;
        this.uiController = null;
        
        // 天体对象
        this.sun = null;
        this.earth = null;
        this.planets = {};
        
        // 动画状态
        this.isActive = false;
        this.animationId = null;
    }
    
    // 初始化整个系统
    async init(containerId) {
        try {
            console.log('初始化流浪地球动画系统...');
            
            // 1. 创建基础场景
            this.initScene(containerId);
            
            // 2. 创建太阳系
            this.createSolarSystem();
            
            // 3. 初始化管理器
            this.initManagers();
            
            // 4. 启动动画循环
            this.startAnimation();
            
            console.log('流浪地球动画系统初始化完成');
            return true;
            
        } catch (error) {
            console.error('初始化失败:', error);
            return false;
        }
    }
    
    // 初始化场景
    initScene(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`找不到容器元素: ${containerId}`);
        }
        
        // 使用核心模块创建场景
        const sceneData = createScene(container);
        this.scene = sceneData.scene;
        this.camera = sceneData.camera;
        this.renderer = sceneData.renderer;
        this.controls = sceneData.controls;
        
        // 创建星空背景
        createStarField(this.scene);
        createNebula(this.scene);
        
        // 设置窗口调整
        window.addEventListener('resize', () => {
            handleResize(this.camera, this.renderer, this.controls);
        });
    }
    
    // 创建太阳系
    createSolarSystem() {
        // 创建太阳系
        const solarSystem = createSolarSystem(this.scene);
        this.sun = solarSystem.sun;
        this.planets = solarSystem.planets;
        
        // 特别处理地球
        this.earth = this.planets.Earth;
        if (!this.earth) {
            // 如果行星系统中没有地球，单独创建
            this.earth = createEarth(this.scene);
            this.planets.Earth = this.earth;
        }
        
        // 设置光照
        setupLighting(this.scene);
    }
    
    // 初始化管理器
    initManagers() {
        // 时间线管理器
        this.timelineManager = new TimelineManager();
        
        // 相机控制器
        this.cameraController = new CameraController(this.camera, this.controls);
        
        // 粒子效果管理器
        this.particleManager = new ParticleEffectManager(this.scene);
        
        // UI控制器
        this.uiController = new UIController(this.timelineManager, this.cameraController);
        
        // 设置事件回调
        this.setupEventCallbacks();
    }
    
    // 设置事件回调
    setupEventCallbacks() {
        // 年份变化回调
        this.timelineManager.onYearChange = (year) => {
            this.updateSimulation(year);
        };
        
        // 关键事件回调
        this.timelineManager.onEventTrigger = (event) => {
            this.handleKeyEvent(event);
        };
    }
    
    // 更新模拟
    updateSimulation(currentYear) {
        try {
            // 更新行星演化（包括太阳演化）
            updatePlanetaryEvolution(this.scene, this.sun, this.planets, currentYear);
            
            // 更新地球轨道
            if (this.earth) {
                updateEarthTrajectory(this.earth, currentYear);
                updatePlanetaryEngines(this.earth, currentYear);
                updateJupiterGravityAssist(this.earth, currentYear);
                syncEarthEffects(this.earth);
            }
            
            // 更新行星轨道
            updatePlanetOrbits(this.planets, currentYear);
            
        } catch (error) {
            console.error('更新模拟时出错:', error);
        }
    }
    
    // 更新行星演化
    updatePlanetEvolution(planet, currentYear) {
        const name = planet.name;
        
        try {
            switch (name) {
                case 'Mercury':
                case 'Venus':
                    updateInnerPlanetEvolution(planet, currentYear);
                    break;
                case 'Mars':
                    updateMarsEvolution(planet, currentYear);
                    break;
                case 'Jupiter':
                case 'Saturn':
                case 'Uranus':
                case 'Neptune':
                    updateOuterPlanetEvolution(planet, currentYear);
                    break;
            }
        } catch (error) {
            console.error(`更新${name}演化时出错:`, error);
        }
    }
    
    // 处理关键事件
    handleKeyEvent(event) {
        console.log(`关键事件: ${event.name} - ${event.description}`);
        
        switch (event.year) {
            case 2019:
                // 太阳氦闪危机
                this.triggerSolarFlare();
                break;
            case 2020:
                // 流浪地球计划启动
                this.triggerEngineIgnition();
                break;
            case 2022:
                // 木星引力助推
                this.triggerJupiterAssist();
                break;
            case 2023:
                // 木星危机
                this.triggerJupiterCrisis();
                break;
            case 2025:
                // 深空流浪
                this.triggerDeepSpace();
                break;
        }
    }
    
    // 触发太阳耀斑效果
    triggerSolarFlare() {
        if (this.sun && this.particleManager) {
            this.particleManager.createExplosion(
                this.sun.position,
                0xff4444,
                200
            );
        }
    }
    
    // 触发发动机点火效果
    triggerEngineIgnition() {
        if (this.earth && this.particleManager) {
            // 创建发动机点火的视觉效果
            const enginePositions = this.earth.userData.engines;
            if (enginePositions) {
                // 在地球周围创建多个小爆炸效果
                for (let i = 0; i < 10; i++) {
                    const angle = (i / 10) * Math.PI * 2;
                    const radius = 8;
                    const pos = new THREE.Vector3(
                        this.earth.position.x + Math.cos(angle) * radius,
                        this.earth.position.y,
                        this.earth.position.z + Math.sin(angle) * radius
                    );
                    
                    this.particleManager.createExplosion(pos, 0x4488ff, 50);
                }
            }
        }
    }
    
    // 触发木星引力助推效果
    triggerJupiterAssist() {
        const jupiter = this.planets.Jupiter;
        if (jupiter && this.earth && this.particleManager) {
            // 创建引力轨迹
            this.particleManager.createStarTrail(
                this.earth.position,
                jupiter.position,
                0xffaa00,
                3000
            );
        }
    }
    
    // 触发木星危机效果
    triggerJupiterCrisis() {
        const jupiter = this.planets.Jupiter;
        if (jupiter && this.particleManager) {
            // 木星周围的引力扰动效果
            this.particleManager.createExplosion(
                jupiter.position,
                0xff8800,
                300
            );
        }
    }
    
    // 触发深空流浪效果
    triggerDeepSpace() {
        if (this.earth && this.particleManager) {
            // 地球进入深空的尾迹效果
            const trailStart = this.earth.position.clone();
            const trailEnd = trailStart.clone().add(new THREE.Vector3(-50, 0, -50));
            
            this.particleManager.createStarTrail(
                trailStart,
                trailEnd,
                0x88aaff,
                5000
            );
        }
    }
    
    // 启动动画循环
    startAnimation() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.animate();
    }
    
    // 停止动画
    stopAnimation() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    // 动画循环
    animate() {
        if (!this.isActive) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        try {
            // 更新时间线
            if (this.timelineManager) {
                this.timelineManager.update();
            }
            
            // 更新相机控制
            if (this.cameraController) {
                this.cameraController.update();
            }
            
            // 更新控制器
            if (this.controls) {
                this.controls.update();
            }
            
            // 渲染场景
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
            
        } catch (error) {
            console.error('动画循环出错:', error);
        }
    }
    
    // 销毁资源
    dispose() {
        this.stopAnimation();
        
        // 清理管理器
        if (this.particleManager) {
            this.particleManager.dispose();
        }
        
        // 清理场景
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
        
        // 清理渲染器
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // 移除UI
        const controlPanel = document.getElementById('voyage-controls');
        if (controlPanel) {
            controlPanel.remove();
        }
    }
    
    // 公共接口方法
    play() {
        if (this.timelineManager) {
            this.timelineManager.start();
        }
    }
    
    pause() {
        if (this.timelineManager) {
            this.timelineManager.pause();
        }
    }
    
    reset() {
        if (this.timelineManager) {
            this.timelineManager.reset();
        }
    }
    
    setSpeed(speed) {
        if (this.timelineManager) {
            this.timelineManager.setSpeed(speed);
        }
    }
    
    getCurrentYear() {
        return this.timelineManager ? this.timelineManager.getCurrentYear() : 2019;
    }
    
    getProgress() {
        return this.timelineManager ? this.timelineManager.getProgress() : 0;
    }
}

// 全局实例
let voyageInstance = null;

// 初始化函数
async function initVoyage(containerId = 'voyage-container') {
    if (voyageInstance) {
        voyageInstance.dispose();
    }
    
    voyageInstance = new VoyageMain();
    const success = await voyageInstance.init(containerId);
    
    if (success) {
        console.log('流浪地球动画系统启动成功');
        return voyageInstance;
    } else {
        console.error('流浪地球动画系统启动失败');
        return null;
    }
}

// 导出接口
if (typeof window !== 'undefined') {
    window.VoyageMain = VoyageMain;
    window.initVoyage = initVoyage;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        VoyageMain,
        initVoyage
    };
}