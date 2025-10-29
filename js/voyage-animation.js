// 动画模块 - 相机动画和时间线管理
// Animation Module - Camera Animation and Timeline Management

// 动画配置
const ANIMATION_CONFIG = {
    // 相机动画
    camera: {
        positions: [
            { x: 0, y: 50, z: 200, target: { x: 0, y: 0, z: 0 }, duration: 5000 },
            { x: 100, y: 30, z: 150, target: { x: 0, y: 0, z: 0 }, duration: 8000 },
            { x: -80, y: 60, z: 180, target: { x: 0, y: 0, z: 0 }, duration: 6000 },
            { x: 0, y: 100, z: 300, target: { x: 0, y: 0, z: 0 }, duration: 10000 }
        ],
        transitionDuration: 3000,
        autoRotate: true,
        rotateSpeed: 0.5
    },
    
    // 时间线配置
    timeline: {
        startYear: 2019,
        endYear: 2030,
        speed: 1.0,
        accelerationFactor: 2.0,
        keyEvents: [
            { year: 2019, name: '太阳氦闪危机', description: '太阳开始不稳定，地球面临生存危机' },
            { year: 2020, name: '流浪地球计划启动', description: '行星发动机点火，地球开始离开轨道' },
            { year: 2022, name: '木星引力助推', description: '利用木星引力加速逃离太阳系' },
            { year: 2023, name: '木星危机', description: '地球险些被木星引力撕裂' },
            { year: 2025, name: '深空流浪', description: '地球进入漫长的星际旅行' }
        ]
    },
    
    // 特效配置
    effects: {
        fadeInDuration: 2000,
        fadeOutDuration: 1500,
        particleCount: 1000,
        trailLength: 50
    }
};

// 相机控制器
class CameraController {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
        this.currentPosition = 0;
        this.isAnimating = false;
        this.animationStartTime = 0;
        this.autoRotateEnabled = ANIMATION_CONFIG.camera.autoRotate;
        
        // 初始化相机位置
        this.setInitialPosition();
    }
    
    setInitialPosition() {
        const initialPos = ANIMATION_CONFIG.camera.positions[0];
        this.camera.position.set(initialPos.x, initialPos.y, initialPos.z);
        if (this.controls) {
            this.controls.target.set(initialPos.target.x, initialPos.target.y, initialPos.target.z);
            this.controls.update();
        }
    }
    
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animationStartTime = Date.now();
        this.currentPosition = 0;
    }
    
    stopAnimation() {
        this.isAnimating = false;
    }
    
    update() {
        if (!this.isAnimating) {
            // 自动旋转
            if (this.autoRotateEnabled && this.controls) {
                this.controls.autoRotate = true;
                this.controls.autoRotateSpeed = ANIMATION_CONFIG.camera.rotateSpeed;
                this.controls.update();
            }
            return;
        }
        
        const now = Date.now();
        const positions = ANIMATION_CONFIG.camera.positions;
        const currentPos = positions[this.currentPosition];
        const nextPos = positions[(this.currentPosition + 1) % positions.length];
        
        const elapsed = now - this.animationStartTime;
        const progress = Math.min(elapsed / ANIMATION_CONFIG.camera.transitionDuration, 1);
        
        // 使用缓动函数
        const eased = this.easeInOutCubic(progress);
        
        // 插值相机位置
        this.camera.position.lerpVectors(
            new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z),
            new THREE.Vector3(nextPos.x, nextPos.y, nextPos.z),
            eased
        );
        
        // 插值目标位置
        if (this.controls) {
            const currentTarget = new THREE.Vector3(currentPos.target.x, currentPos.target.y, currentPos.target.z);
            const nextTarget = new THREE.Vector3(nextPos.target.x, nextPos.target.y, nextPos.target.z);
            this.controls.target.lerpVectors(currentTarget, nextTarget, eased);
            this.controls.update();
        }
        
        // 检查是否完成当前动画
        if (progress >= 1) {
            this.currentPosition = (this.currentPosition + 1) % positions.length;
            this.animationStartTime = now + currentPos.duration;
        }
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    setAutoRotate(enabled) {
        this.autoRotateEnabled = enabled;
        if (this.controls) {
            this.controls.autoRotate = enabled;
        }
    }
}

// 时间线管理器
class TimelineManager {
    constructor() {
        this.currentYear = ANIMATION_CONFIG.timeline.startYear;
        this.speed = ANIMATION_CONFIG.timeline.speed;
        this.isPlaying = false;
        this.startTime = 0;
        this.pausedTime = 0;
        
        // 事件回调
        this.onYearChange = null;
        this.onEventTrigger = null;
    }
    
    start() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.startTime = Date.now() - this.pausedTime;
    }
    
    pause() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        this.pausedTime = Date.now() - this.startTime;
    }
    
    reset() {
        this.currentYear = ANIMATION_CONFIG.timeline.startYear;
        this.isPlaying = false;
        this.startTime = 0;
        this.pausedTime = 0;
    }
    
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(10, speed));
    }
    
    update() {
        if (!this.isPlaying) return;
        
        const now = Date.now();
        const elapsed = (now - this.startTime) * this.speed;
        
        // 计算当前年份（每秒代表1年）
        const newYear = ANIMATION_CONFIG.timeline.startYear + elapsed / 1000;
        
        // 检查是否有年份变化
        if (Math.floor(newYear) !== Math.floor(this.currentYear)) {
            this.currentYear = newYear;
            
            // 触发年份变化回调
            if (this.onYearChange) {
                this.onYearChange(this.currentYear);
            }
            
            // 检查关键事件
            this.checkKeyEvents(this.currentYear);
        } else {
            this.currentYear = newYear;
        }
        
        // 检查是否到达终点
        if (this.currentYear >= ANIMATION_CONFIG.timeline.endYear) {
            this.pause();
        }
    }
    
    checkKeyEvents(year) {
        const events = ANIMATION_CONFIG.timeline.keyEvents;
        for (const event of events) {
            if (Math.abs(year - event.year) < 0.1 && this.onEventTrigger) {
                this.onEventTrigger(event);
            }
        }
    }
    
    getCurrentYear() {
        return this.currentYear;
    }
    
    getProgress() {
        const totalDuration = ANIMATION_CONFIG.timeline.endYear - ANIMATION_CONFIG.timeline.startYear;
        const currentProgress = this.currentYear - ANIMATION_CONFIG.timeline.startYear;
        return Math.min(currentProgress / totalDuration, 1);
    }
}

// 粒子效果管理器
class ParticleEffectManager {
    constructor(scene) {
        this.scene = scene;
        this.effects = new Map();
    }
    
    createStarTrail(startPos, endPos, color = 0xffffff, duration = 2000) {
        const points = [];
        const segmentCount = ANIMATION_CONFIG.effects.trailLength;
        
        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount;
            const point = new THREE.Vector3().lerpVectors(startPos, endPos, t);
            points.push(point);
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const trail = new THREE.Line(geometry, material);
        this.scene.add(trail);
        
        // 淡出效果
        const startTime = Date.now();
        const fadeOut = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                material.opacity = 0.8 * (1 - progress);
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(trail);
                geometry.dispose();
                material.dispose();
            }
        };
        
        fadeOut();
        return trail;
    }
    
    createExplosion(position, color = 0xff4444, particleCount = 100) {
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // 随机位置
            positions[i * 3] = position.x + (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 2;
            
            // 随机速度
            velocities[i * 3] = (Math.random() - 0.5) * 10;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 10;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 10;
            
            // 颜色
            const c = new THREE.Color(color);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        const explosion = new THREE.Points(particles, material);
        this.scene.add(explosion);
        
        // 动画效果
        const startTime = Date.now();
        const duration = 3000;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // 更新粒子位置
                const pos = particles.attributes.position.array;
                for (let i = 0; i < particleCount; i++) {
                    pos[i * 3] += velocities[i * 3] * 0.016;
                    pos[i * 3 + 1] += velocities[i * 3 + 1] * 0.016;
                    pos[i * 3 + 2] += velocities[i * 3 + 2] * 0.016;
                }
                particles.attributes.position.needsUpdate = true;
                
                // 淡出
                material.opacity = 1 - progress;
                
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
                particles.dispose();
                material.dispose();
            }
        };
        
        animate();
        return explosion;
    }
    
    dispose() {
        this.effects.clear();
    }
}

// UI控制器
class UIController {
    constructor(timelineManager, cameraController) {
        this.timelineManager = timelineManager;
        this.cameraController = cameraController;
        this.createUI();
        this.bindEvents();
    }
    
    createUI() {
        // 创建控制面板
        const controlPanel = document.createElement('div');
        controlPanel.id = 'voyage-controls';
        controlPanel.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            z-index: 1000;
        `;
        
        controlPanel.innerHTML = `
            <h3>流浪地球控制面板</h3>
            <div>
                <button id="play-pause">播放/暂停</button>
                <button id="reset">重置</button>
                <button id="camera-toggle">相机动画</button>
            </div>
            <div style="margin-top: 10px;">
                <label>速度: <input type="range" id="speed-slider" min="0.1" max="5" step="0.1" value="1"></label>
                <span id="speed-value">1.0x</span>
            </div>
            <div style="margin-top: 10px;">
                <div>年份: <span id="current-year">2019</span></div>
                <div>进度: <span id="progress">0%</span></div>
            </div>
            <div id="event-display" style="margin-top: 10px; font-size: 12px; color: #ffff00;"></div>
        `;
        
        document.body.appendChild(controlPanel);
    }
    
    bindEvents() {
        // 播放/暂停按钮
        document.getElementById('play-pause').addEventListener('click', () => {
            if (this.timelineManager.isPlaying) {
                this.timelineManager.pause();
            } else {
                this.timelineManager.start();
            }
        });
        
        // 重置按钮
        document.getElementById('reset').addEventListener('click', () => {
            this.timelineManager.reset();
            this.updateUI();
        });
        
        // 相机动画切换
        document.getElementById('camera-toggle').addEventListener('click', () => {
            if (this.cameraController.isAnimating) {
                this.cameraController.stopAnimation();
            } else {
                this.cameraController.startAnimation();
            }
        });
        
        // 速度滑块
        const speedSlider = document.getElementById('speed-slider');
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.timelineManager.setSpeed(speed);
            document.getElementById('speed-value').textContent = speed.toFixed(1) + 'x';
        });
        
        // 时间线事件回调
        this.timelineManager.onYearChange = (year) => {
            this.updateUI();
        };
        
        this.timelineManager.onEventTrigger = (event) => {
            this.showEvent(event);
        };
    }
    
    updateUI() {
        const year = this.timelineManager.getCurrentYear();
        const progress = this.timelineManager.getProgress();
        
        document.getElementById('current-year').textContent = year.toFixed(1);
        document.getElementById('progress').textContent = (progress * 100).toFixed(1) + '%';
    }
    
    showEvent(event) {
        const display = document.getElementById('event-display');
        display.innerHTML = `<strong>${event.name}</strong><br>${event.description}`;
        
        // 3秒后清除
        setTimeout(() => {
            display.innerHTML = '';
        }, 3000);
    }
}

// 将所有类和配置添加到全局window对象
window.ANIMATION_CONFIG = ANIMATION_CONFIG;
window.CameraController = CameraController;
window.TimelineManager = TimelineManager;
window.ParticleEffectManager = ParticleEffectManager;
window.UIController = UIController;