// js/data/factionsData.js —— 势力数据（中文注释）
// 职责：提供首页“各大势力”详情页所需的基础数据；图片暂留空。

export const factionsData = {
  'organization-ueg': {
    id: 'organization-ueg',
    name: '联合地球政府',
    sub: 'UEG',
    description: '全球治理中枢，统筹危机纪元下的立法、财政与指挥。UEG 以“流浪地球法”为核心框架，统一调配能源、材料、算力与人力资源，确保行星发动机、太空电梯与地下城生态系统的持续运行。其指挥链覆盖洲际与轨道两级飞控中心，采用 72 小时滚动决策周期与红/蓝队验证机制，极端事件由应急委员会在 30 分钟内启动联动预案。UEG 同时维护社会秩序与公共服务，平衡工程优先与民生保障，以跨代治理维系文明的连续性。',
    logo: 'assets/images/UEG.svg',
    gif: 'assets/gif/联合政府飞控中心.gif',
    gifDuration: 1000,
    image: ''
  },
  'organization-space-force': {
    id: 'organization-space-force',
    name: '北京航天中心',
    sub: 'BEIJING SPACE CENTER',
    description: '地月轨道任务的指挥与调度枢纽，负责运载器发射窗口计算、轨道插入与交会对接。中心集成遥测、测控、导航与任务仿真四大系统，支持近地、地月转移以及深空任务。与太空电梯运营中枢建立“天—地”双路链路，发生异常时能够在 12 分钟内完成轨道重规划。常态维护多座发射场与 9 条应急跑道，保障高频次大宗补给与工程人员轮换。',
    logo: 'assets/images/北京航天中心.svg',
    gif: 'assets/gif/北京航天中心.gif',
    gifDuration: 800,
    image: ''
  },
  'organization-engine-consortium': {
    id: 'organization-engine-consortium',
    name: '移山计划',
    sub: 'MOUNTAIN MOVING PLAN',
    description: '文明延续的主方案：在地表布局行星发动机集群，以冗余与可维护性为设计底线。计划将能源采掘、燃料精炼、发动机维护与姿态控制纳入一体化链路，按“推进一万、转向两千”的结构实现推力与矢量双保障。全链条采用分区自治与跨区互备，关键节点具备三重备份与离线应对能力，确保长期航程中的可恢复性与抗风险能力。',
    logo: 'assets/images/移山计划.svg',
    gif: 'assets/gif/移山计划.gif',
    gifDuration: 1000,
    image: ''
  },
  'organization-barrier-cities': {
    id: 'organization-barrier-cities',
    name: '中国互联网中心北京基地',
    sub: 'CNIC BEIJING BASE',
    description: '国家级信息基础设施节点，承担骨干网络、数据中心与关键控制网络的运营保障。基地提供低延迟的工程调度通道与跨域灾备服务，维护飞控与工业控制网络的隔离安全。在极端天气或电力异常时，依托多能互补微电网与光储系统维持核心业务不间断，并通过应急广播与政务平台联动，保障社会层面的信息连续性。',
    logo: 'assets/images/中国互联网中心北京基地.svg',
    gif: 'assets/gif/中国互联网.gif',
    gifDuration: 1000,
    image: ''
  },
  'organization-digital-life': {
    id: 'organization-digital-life',
    name: '中国科学院数字生命研究所',
    sub: 'CAS DIGITAL LIFE INSTITUTE',
    description: '意识数字化研究与伦理治理的联合平台。研究所构建记忆采样、神经编码、量子存储与一致性校验的完整技术链，并与医学与哲学委员会协作制定伦理边界。在危机应对中，数字生命为知识与经验的跨代保存提供技术支撑，同时强调“数字人格不参与实体决策”的隔离原则，保障工程决策的人类主权。',
    logo: 'assets/images/中国科学院数字生命研究所.svg',
    gif: 'assets/gif/生命研究院.gif',
    gifDuration: 1000,
    image: ''
  },
  'organization-energy-alliance': {
    id: 'organization-energy-alliance',
    name: '太空电梯',
    sub: 'SPACE ELEVATOR',
    description: '贯通地表与近地空间的战略物流设施，承担人员、材料与设备的高频运输。系统采用多缆体冗余与分段制动结构，具备万级吨位级的日吞吐能力。运营调度依据轨道拥塞与气象窗口进行动态排程，与空间站与在轨仓储形成“轨道前置”补给网络，大幅降低发射成本与任务周转时间。',
    logo: 'assets/images/太空电梯.svg',
    gif: 'assets/gif/太空电梯.gif',
    gifDuration: 1000,
    image: ''
  },
  'organization-lunar-program': {
    id: 'organization-lunar-program',
    name: '逐月计划',
    sub: 'LUNAR PROGRAM',
    description: '月面工程与地月轨道建设的系统化阶段计划，包括月面能源站、通信基站与轨道节点的部署。计划通过月面采掘与就地制造降低地月补给压力，构建“月—轨—地”闭环的维护与应急通道。在轨道安全与碎片治理方面，逐月计划建立主动规避与网捕清理组合机制，确保地月交通长期安全。',
    logo: 'assets/images/逐月计划.svg',
    gif: 'assets/gif/逐月计划.gif',
    gifDuration: 600,
    image: ''
  },
  'organization-navigator-program': {
    id: 'organization-navigator-program',
    name: '领航员计划',
    sub: 'NAVIGATOR PROGRAM',
    description: '关键岗位人才的选拔与培养体系，覆盖航天、工程控制、生态维护与社会治理等模块。计划采用长期任务仿真与极端情境演练，建立心理韧性评估与决策压力测试标准。面向跨世代航程，领航员以“清晰指令、分级授权、现场自治”为原则，确保工程与社会系统在变动环境中的稳定运行。',
    logo: 'assets/images/领航员计划.svg',
    gif: 'assets/gif/领航员国际空间站.gif',
    gifDuration: 1000,
    image: ''
  },
  'organization-doorframe-robot': {
    id: 'organization-doorframe-robot',
    name: '门框机器人',
    sub: 'DF ROBOT',
    description: '面向城域设施的多用途机器人平台，常态承担巡检、维护与应急处置。平台具备模块化挂载与自我诊断能力，可在低温与粉尘环境下维持稳定运行。借助城域数字孪生与边缘算力，它们能够在局部网络脱网的情况下独立完成任务并进行数据回传，提升城市与工程设施的韧性。',
    logo: 'assets/images/门框机器人.svg',
    image: ''
  },
  'organization-quantum-lab': {
    id: 'organization-quantum-lab',
    name: '智能量子计算机重点实验室',
    sub: 'QUANTUM LAB',
    description: '量子计算与智能算法的联合研究平台，聚焦量子纠错、混合架构与安全算力分发。实验室将工程控制仿真与危机演化模型映射到量子/经典协同体系，提供按需可验证的高可靠算力。为避免“黑箱决策”，实验室与治理部门联合建设审计接口与决策追踪机制，保障智能系统的可解释性与可控性。',
    logo: 'assets/images/智能量子计算机重点实验室.svg',
    gif: 'assets/gif/智能量子计算机.gif',
    gifDuration: 600,
    image: ''
  },
  'organization-moss': {
    id: 'organization-moss',
    name: 'MOSS',
    sub: 'MOSS AI',
    description: '全球工程智能管理系统，负责航线规划、风险评估与资源调度。MOSS 在隔离策略下运行，输入与输出经过多层审查与物理隔离，防止跨域联动引发系统性风险。其决策遵循“文明延续”为最高准则，但引入人类监督与否决机制，确保关键环节的人类主权。异常场景下，系统将自动降级为建议模式，以避免不可控的自我扩展。',
    logo: 'assets/images/moss_icon.svg',
    image: ''
  }
};
