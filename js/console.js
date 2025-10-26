/**
 * MOSS 纪念档案馆 - 主控台模块
 * 
 * 功能说明：
 * 1. 管理主控台界面布局
 * 2. 处理指令解析和执行
 * 3. 管理全局事件日志
 * 4. 协调各个子模块的交互
 */

// ===== 全局变量 =====
let consoleContainer = null;            // 主控台容器
let commandInput = null;                // 命令输入框
let mainDisplay = null;                 // 主显示区域
let eventLog = null;                    // 事件日志区域
let earthStatus = null;                 // 地球状态区域
let currentCommand = '';                // 当前输入的命令

// ===== 可用指令列表 =====
const AVAILABLE_COMMANDS = {
    'help': {
        description: '显示可用指令列表',
        handler: showHelpMenu
    },
    'load timeline': {
        description: '加载历史时间轴',
        handler: loadTimeline
    },
    'query': {
        description: '查询档案信息 (用法: query [关键词])',
        handler: executeQuery
    },
    'status': {
        description: '显示系统状态',
        handler: showSystemStatus
    },
    'clear': {
        description: '清空主显示区域',
        handler: clearMainDisplay
    }
};

// ===== 事件日志数据 =====
const SYSTEM_LOGS = [
    '[2075.02.14] 地球发动机启动检测完成',
    '[2075.02.14] 木星引力数据同步中...',
    '[2075.02.13] 全球通讯网络状态正常',
    '[2075.02.13] 人口统计数据更新完成',
    '[2075.02.12] 地下城生命支持系统运行正常',
    '[2075.02.12] 太阳监测数据接收中...',
    '[2075.02.11] 导航系统校准完成',
    '[2075.02.11] 资源分配算法优化完成'
];

/**
 * 初始化主控台模块
 */
function initConsole() {
    createConsoleLayout();
    bindConsoleEvents();
    startSystemSimulation();
    
    console.log('🖥️  MOSS 主控台系统已启动');
}

/**
 * 创建主控台布局
 */
function createConsoleLayout() {
    // 创建主控台容器
    consoleContainer = document.createElement('div');
    consoleContainer.className = 'main-console';
    consoleContainer.innerHTML = `
        <div class="console-grid">
            <!-- 左列：地球状态 -->
            <div class="console-panel">
                <div class="panel-title">// 地球状态</div>
                <div id="earthStatus" class="earth-status-display">
                    <div class="status-item">
                        <span class="status-label">当前位置:</span>
                        <span class="status-value">木星轨道附近</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">发动机状态:</span>
                        <span class="status-value status-active">运行中</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">人口数量:</span>
                        <span class="status-value">35亿</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">氧气储量:</span>
                        <span class="status-value">78%</span>
                    </div>
                    <div class="earth-model-placeholder">
                        <div class="earth-icon">🌍</div>
                        <div class="model-text">3D地球模型占位符</div>
                    </div>
                </div>
            </div>
            
            <!-- 中列：主控台 -->
            <div class="console-panel main-panel">
                <div class="panel-title">// MOSS 主控台</div>
                <div id="mainDisplay" class="main-display">
                    <div class="welcome-message">
                        <h2>欢迎访问 MOSS 纪念档案馆</h2>
                        <p>输入 <span class="command-highlight">help</span> 查看可用指令</p>
                        <p>输入 <span class="command-highlight">load timeline</span> 开始探索人类历史</p>
                    </div>
                </div>
                <div class="command-input-container">
                    <span class="command-prompt">UEG_Researcher:> </span>
                    <span id="commandInput" class="command-input"></span>
                    <span class="input-cursor">_</span>
                </div>
            </div>
            
            <!-- 右列：全局事件日志 -->
            <div class="console-panel">
                <div class="panel-title">// 全局事件日志</div>
                <div id="eventLog" class="event-log">
                    ${SYSTEM_LOGS.map(log => `<div class="log-entry">${log}</div>`).join('')}
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(consoleContainer);
    
    // 获取关键元素引用
    commandInput = document.getElementById('commandInput');
    mainDisplay = document.getElementById('mainDisplay');
    eventLog = document.getElementById('eventLog');
    earthStatus = document.getElementById('earthStatus');
}

/**
 * 绑定控制台事件
 */
function bindConsoleEvents() {
    // 键盘事件现在在 showMainConsole 中绑定
}

/**
 * 处理控制台输入
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleConsoleInput(event) {
    event.preventDefault();
    
    switch (event.key) {
        case 'Enter':
            executeCommand();
            break;
        case 'Backspace':
            if (currentCommand.length > 0) {
                currentCommand = currentCommand.slice(0, -1);
                updateCommandDisplay();
            }
            break;
        default:
            if (event.key.length === 1) {
                currentCommand += event.key;
                updateCommandDisplay();
            }
            break;
    }
}

/**
 * 更新命令显示
 */
function updateCommandDisplay() {
    if (commandInput) {
        commandInput.textContent = currentCommand;
    }
}

/**
 * 执行命令
 */
function executeCommand() {
    const command = currentCommand.trim().toLowerCase();
    
    // 记录命令到日志
    addToEventLog(`[用户] 执行命令: ${currentCommand}`);
    
    // 查找并执行对应的命令处理器
    if (AVAILABLE_COMMANDS[command]) {
        AVAILABLE_COMMANDS[command].handler();
    } else if (command.startsWith('query ')) {
        const keyword = currentCommand.substring(6).trim();
        executeQuery(keyword);
    } else if (command === '') {
        // 空命令，不做处理
    } else {
        showCommandNotFound(currentCommand);
    }
    
    // 清空当前命令
    currentCommand = '';
    updateCommandDisplay();
}

/**
 * 显示帮助菜单
 */
function showHelpMenu() {
    const helpContent = `
        <div class="help-menu">
            <h3>🔧 MOSS 系统可用指令</h3>
            <div class="command-list">
                ${Object.entries(AVAILABLE_COMMANDS).map(([cmd, info]) => `
                    <div class="command-item">
                        <span class="command-name">${cmd}</span>
                        <span class="command-desc">${info.description}</span>
                    </div>
                `).join('')}
            </div>
            <div class="help-footer">
                <p>💡 提示: 所有指令都不区分大小写</p>
            </div>
        </div>
    `;
    
    updateMainDisplay(helpContent);
    addToEventLog('[系统] 显示帮助信息');
}

/**
 * 加载时间轴
 */
function loadTimeline() {
    addToEventLog('[系统] 正在加载历史时间轴...');
    
    // 显示加载动画
    updateMainDisplay(`
        <div class="loading-timeline">
            <h3>📊 正在加载历史长河时间轴...</h3>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
            <p>正在从档案库中检索历史数据...</p>
        </div>
    `);
    
    // 模拟加载延迟
    setTimeout(() => {
        // 这里将调用时间轴模块
        if (window.TimelineModule && window.TimelineModule.show) {
            window.TimelineModule.show();
        } else {
            updateMainDisplay(`
                <div class="timeline-placeholder">
                    <h3>⏳ 历史长河时间轴</h3>
                    <p>时间轴模块将在模块三中实现</p>
                    <div class="timeline-preview">
                        <div class="timeline-node">移山计划</div>
                        <div class="timeline-line"></div>
                        <div class="timeline-node">刹车时代</div>
                        <div class="timeline-line"></div>
                        <div class="timeline-node">木星危机</div>
                        <div class="timeline-line"></div>
                        <div class="timeline-node">太阳氦闪</div>
                    </div>
                </div>
            `);
        }
        addToEventLog('[系统] 时间轴加载完成');
    }, 2000);
}

/**
 * 执行查询
 * @param {string} keyword - 查询关键词
 */
function executeQuery(keyword) {
    if (!keyword) {
        updateMainDisplay(`
            <div class="query-error">
                <h3>❌ 查询参数错误</h3>
                <p>请提供查询关键词</p>
                <p>用法示例: query 木星危机</p>
            </div>
        `);
        addToEventLog('[系统] 查询失败 - 缺少关键词');
        return;
    }
    
    addToEventLog(`[系统] 正在查询: ${keyword}`);
    
    // 模拟查询结果
    const queryResults = `
        <div class="query-results">
            <h3>🔍 查询结果: "${keyword}"</h3>
            <div class="result-item">
                <div class="result-title">档案编号: MOSS-2075-${Math.floor(Math.random() * 1000)}</div>
                <div class="result-content">
                    <p>关键词 "${keyword}" 在档案系统中找到 ${Math.floor(Math.random() * 50) + 1} 条相关记录</p>
                    <p>主要关联事件: 流浪地球计划、地球发动机项目、人类文明保护协议</p>
                    <p>时间范围: 2058年 - 2075年</p>
                </div>
            </div>
            <div class="result-footer">
                <p>💡 详细档案内容将在"事件档案厅"模块中展示</p>
            </div>
        </div>
    `;
    
    updateMainDisplay(queryResults);
    addToEventLog(`[系统] 查询完成 - 找到相关记录`);
}

/**
 * 显示系统状态
 */
function showSystemStatus() {
    const statusContent = `
        <div class="system-status">
            <h3>📊 MOSS 系统状态报告</h3>
            <div class="status-grid">
                <div class="status-section">
                    <h4>🌍 地球状态</h4>
                    <div class="status-item">位置: 木星轨道附近</div>
                    <div class="status-item">发动机: 11,000座 运行正常</div>
                    <div class="status-item">人口: 35亿人</div>
                </div>
                <div class="status-section">
                    <h4>🖥️ 系统运行</h4>
                    <div class="status-item">CPU使用率: 23%</div>
                    <div class="status-item">内存使用: 1.2TB/4.0TB</div>
                    <div class="status-item">网络延迟: 0.003ms</div>
                </div>
                <div class="status-section">
                    <h4>📡 通讯状态</h4>
                    <div class="status-item">全球网络: 在线</div>
                    <div class="status-item">深空通讯: 正常</div>
                    <div class="status-item">应急频道: 待机</div>
                </div>
            </div>
        </div>
    `;
    
    updateMainDisplay(statusContent);
    addToEventLog('[系统] 系统状态检查完成');
}

/**
 * 清空主显示区域
 */
function clearMainDisplay() {
    updateMainDisplay('<div class="clear-message">主显示区域已清空</div>');
    addToEventLog('[系统] 主显示区域已清空');
}

/**
 * 显示指令未找到错误
 * @param {string} command - 未识别的指令
 */
function showCommandNotFound(command) {
    updateMainDisplay(`
        <div class="command-error">
            <h3>❌ 未知指令: "${command}"</h3>
            <p>输入 "help" 查看可用指令列表</p>
        </div>
    `);
    addToEventLog(`[系统] 未知指令: ${command}`);
}

/**
 * 更新主显示区域
 * @param {string} content - HTML内容
 */
function updateMainDisplay(content) {
    if (mainDisplay) {
        mainDisplay.innerHTML = content;
    }
}

/**
 * 添加事件到日志
 * @param {string} message - 日志消息
 */
function addToEventLog(message) {
    if (eventLog) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry new-entry';
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        // 添加到日志顶部
        eventLog.insertBefore(logEntry, eventLog.firstChild);
        
        // 限制日志条数，移除过多的旧日志
        const entries = eventLog.querySelectorAll('.log-entry');
        if (entries.length > 20) {
            eventLog.removeChild(entries[entries.length - 1]);
        }
        
        // 移除新条目标记
        setTimeout(() => {
            logEntry.classList.remove('new-entry');
        }, 1000);
    }
}

/**
 * 启动系统模拟
 * 定期更新系统状态和日志
 */
function startSystemSimulation() {
    // 每30秒添加一条模拟的系统日志
    setInterval(() => {
        const randomLogs = [
            '数据同步完成',
            '系统自检通过',
            '网络连接稳定',
            '档案索引更新',
            '安全扫描完成',
            '备份任务执行'
        ];
        
        const randomLog = randomLogs[Math.floor(Math.random() * randomLogs.length)];
        addToEventLog(`[系统] ${randomLog}`);
    }, 30000);
}

/**
 * 显示主控台
 */
function showMainConsole() {
    console.log('🖥️ 显示主控台');
    
    if (consoleContainer) {
        consoleContainer.style.display = 'block';
    }
    
    // 绑定键盘事件监听器
    document.addEventListener('keydown', handleConsoleInput);
}

/**
 * 隐藏主控台
 */
function hideMainConsole() {
    console.log('🔄 隐藏主控台');
    
    if (consoleContainer) {
        consoleContainer.style.display = 'none';
    }
    
    // 移除键盘事件监听器
    document.removeEventListener('keydown', handleConsoleInput);
}

// ===== 导出接口 =====
window.ConsoleModule = {
    init: initConsole,
    show: showMainConsole,
    hide: hideMainConsole,
    addLog: addToEventLog
};