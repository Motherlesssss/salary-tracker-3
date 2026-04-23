// ============== 车型节奏预设模板（基于真实历史数据）==============
// 数据来源：i8 (2025.7.29发布) + 焕新MEGA (2025.4.29发布)

const vehicleRhythmTemplates = {

    // 模板1：平均模板（推荐）
    average: {
        name: "平均模板",
        description: "基于i8和MEGA的平均数据，适用于大部分新车型",
        icon: "📊",
        phases: [
            { start: 0, end: 0, weight: 1.02, name: '发布日' },
            { start: 1, end: 3, weight: 1.48, name: '上升期' },
            { start: 4, end: 6, weight: 1.75, name: '峰值期' },
            { start: 7, end: 10, weight: 1.27, name: '回落期' },
            { start: 11, end: 999, weight: 1.10, name: '稳定期' }
        ]
    },

    // 模板2：i8模板（热度持久）
    i8: {
        name: "i8模板",
        description: "热度持久型，适合重磅主力车型（发布后热度持续更久）",
        icon: "🔥",
        phases: [
            { start: 0, end: 0, weight: 1.04, name: '发布日' },
            { start: 1, end: 3, weight: 1.33, name: '上升期' },
            { start: 4, end: 6, weight: 1.69, name: '峰值期' },
            { start: 7, end: 10, weight: 1.46, name: '持续期' },
            { start: 11, end: 20, weight: 1.55, name: '缓降期' },
            { start: 21, end: 999, weight: 1.10, name: '稳定期' }
        ]
    },

    // 模板3：MEGA模板（快速回落）
    mega: {
        name: "MEGA模板",
        description: "快速回落型，适合小众/改款车型（热度来得快去得快）",
        icon: "⚡",
        phases: [
            { start: 0, end: 0, weight: 1.00, name: '发布日' },
            { start: 1, end: 3, weight: 1.63, name: '上升期' },
            { start: 4, end: 6, weight: 1.81, name: '峰值期' },
            { start: 7, end: 10, weight: 1.08, name: '快速回落' },
            { start: 11, end: 999, weight: 1.00, name: '正常期' }
        ]
    }
};

/**
 * 应用车型模板到指定月份，生成每日权重数组
 */
function applyVehicleTemplate(templateKey, launchDate, year, month) {
    const template = vehicleRhythmTemplates[templateKey];
    if (!template) {
        console.error(`模板 ${templateKey} 不存在`);
        return null;
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const launchDateTime = new Date(launchDate);
    const dailyWeights = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const daysOffset = Math.floor((currentDate - launchDateTime) / (1000 * 60 * 60 * 24));

        let weight = 1.00;

        for (const phase of template.phases) {
            if (daysOffset >= phase.start && daysOffset <= phase.end) {
                weight = phase.weight;
                break;
            }
        }

        dailyWeights.push(weight);
    }

    return dailyWeights;
}

/**
 * 生成去库存衰减权重
 */
function generateClearStockWeights(clearStartDate, clearEndDate, year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const clearStart = new Date(clearStartDate);
    const clearEnd = new Date(clearEndDate);
    const dailyWeights = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        let weight = 1.00;

        if (currentDate < clearStart) {
            weight = 1.00;
        } else if (currentDate > clearEnd) {
            weight = 0.00;
        } else {
            const totalDays = Math.ceil((clearEnd - clearStart) / (1000 * 60 * 60 * 24));
            const elapsedDays = Math.ceil((currentDate - clearStart) / (1000 * 60 * 60 * 24));
            weight = Math.max(0, 1.0 - (elapsedDays / totalDays));
        }

        dailyWeights.push(weight);
    }

    return dailyWeights;
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.vehicleRhythmTemplates = vehicleRhythmTemplates;
    window.applyVehicleTemplate = applyVehicleTemplate;
    window.generateClearStockWeights = generateClearStockWeights;
}
