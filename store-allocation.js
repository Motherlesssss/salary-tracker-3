// ============== 门店目标分配模块 ==============
// 处理门店级别的目标分配和数据生成

let storeAllocationChart = null;
let storeAllocationData = {
    labels: [],           // 门店名称
    allocations: [],      // 各门店分配的目标
    adjustments: {},      // 记录调整 { storeIndex: multiplier }
    regionTotal: 0,       // 区域总目标
    allocationMode: 'auto',  // 分配模式：'auto' 自动分配 或 'preset' 预设目标
    presetVehicleTargets: {}  // 预设的门店车型目标 { storeName: { vehicle: number } }
};

let isStoreDragging = false;
let dragStoreIndex = null;

// ============== 初始化门店分配图表 ==============
function initializeStoreAllocationChart() {
    // 验证必要条件
    if (!state.selectedRegion) {
        console.error('未选择区域');
        alert('请先选择区域！');
        return;
    }

    if (!regionsData[state.selectedRegion]) {
        console.error('区域数据不存在:', state.selectedRegion);
        alert('区域数据错误，请刷新页面重试');
        return;
    }

    const region = regionsData[state.selectedRegion];
    const regionTotal = Object.values(state.vehicleTargets).reduce((sum, val) => sum + val, 0);

    if (regionTotal === 0) {
        console.error('区域总目标为0');
        alert('请先为各车型设置月度目标！');
        return;
    }

    // 准备图表数据
    storeAllocationData.labels = region.stores;
    storeAllocationData.allocations = region.stores.map(store => state.storeAllocations[store] || 0);
    storeAllocationData.regionTotal = regionTotal;
    storeAllocationData.adjustments = {};

    // 渲染输入表格（不再是拖拽图表）
    renderStoreAllocationTable();

    // 绑定按钮事件
    bindStoreAllocationButtons();

    // 更新统计信息
    updateStoreAllocationStats();
}

// ============== 渲染门店分配表格（输入框模式）==============
function renderStoreAllocationTable() {
    // 获取整个调整区域容器
    const chartAdjustmentArea = document.getElementById('storeAllocationPlaceholder');

    if (!chartAdjustmentArea) {
        console.error('找不到门店分配容器元素');
        return;
    }

    const region = regionsData[state.selectedRegion];
    const regionTotal = storeAllocationData.regionTotal;

    // 替换整个区域的内容
    chartAdjustmentArea.innerHTML = `
        <div class="chart-header">
            <h3>门店目标分配</h3>
            <div class="chart-controls">
                <button id="resetStoreAllocationBtn" class="btn btn-secondary">重置为平均分配</button>
                <button id="confirmStoreAllocationBtn" class="btn btn-primary">确认分配并生成门店数据</button>
            </div>
        </div>

        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-top: 16px;">
            <!-- 分配模式选择 -->
            <div style="margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 2px solid #e0e0e0;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #333;">目标分配方式：</h4>
                <div style="display: flex; gap: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 16px; background: white; border: 2px solid #4285F4; border-radius: 8px; transition: all 0.2s;">
                        <input type="radio" name="allocationMode" value="auto" checked onchange="handleAllocationModeChange('auto')" style="width: 18px; height: 18px; cursor: pointer;">
                        <div>
                            <div style="font-weight: 600; color: #333; font-size: 13px;">自动分配（按历史占比）</div>
                            <div style="font-size: 11px; color: #666; margin-top: 2px;">为门店分配月度总目标，车型比例自动继承区域</div>
                        </div>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 16px; background: white; border: 2px solid #e0e0e0; border-radius: 8px; transition: all 0.2s;">
                        <input type="radio" name="allocationMode" value="preset" onchange="handleAllocationModeChange('preset')" style="width: 18px; height: 18px; cursor: pointer;">
                        <div>
                            <div style="font-weight: 600; color: #333; font-size: 13px;">预设目标（Excel导入）</div>
                            <div style="font-size: 11px; color: #666; margin-top: 2px;">精确指定各门店分车型目标，避免汇总偏差</div>
                        </div>
                    </label>
                </div>
            </div>

            <!-- 文件上传区域 -->
            <div style="margin-bottom: 16px; padding: 16px; background: #f8f9fa; border: 2px dashed #ccc; border-radius: 8px;" class="file-upload-area">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <span style="font-weight: 600; color: #333;">📂 批量导入门店目标：</span>
                    <button onclick="downloadStoreTemplate()"
                            style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;"
                            onmouseover="this.style.background='#218838'"
                            onmouseout="this.style.background='#28a745'">
                        <span>⬇️</span> 下载模板
                    </button>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <input type="file"
                           id="storeAllocationFileInput"
                           accept=".xlsx,.xls"
                           style="display: none;"
                           onchange="handleStoreAllocationFileUpload(event)">
                    <button onclick="document.getElementById('storeAllocationFileInput').click()"
                            style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;"
                            onmouseover="this.style.background='#0056b3'"
                            onmouseout="this.style.background='#007bff'">
                        <span>📤</span> 上传文件
                    </button>
                    <span id="storeUploadStatus" style="color: #666; font-size: 13px;"></span>
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: #999; padding: 8px; background: white; border-radius: 4px;" class="upload-hint">
                    模板格式：门店名称 | 月度目标
                </div>
            </div>

            <!-- 校验结果和智能调整区域 -->
            <div id="validationPanel" style="display: none; margin-bottom: 16px;"></div>

            <div style="max-height: 500px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="position: sticky; top: 0; background: linear-gradient(to right, #f5f5f5, #e8e8e8); z-index: 10;">
                        <tr>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600; color: #333; width: 50%;">门店名称</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; color: #333; width: 25%;">月度目标</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; color: #333; width: 25%;">占比</th>
                        </tr>
                    </thead>
                    <tbody id="storeAllocationTableBody">
                    </tbody>
                    <tfoot style="position: sticky; bottom: 0; background: linear-gradient(to right, #667eea, #764ba2); color: white; font-weight: 700;">
                        <tr>
                            <td style="padding: 14px; border-top: 2px solid #ddd;">区域总计</td>
                            <td style="padding: 14px; text-align: center; border-top: 2px solid #ddd; font-size: 18px;" id="allocationTableTotal">${regionTotal}</td>
                            <td style="padding: 14px; text-align: center; border-top: 2px solid #ddd;">100%</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div style="margin-top: 12px; display: flex; gap: 12px;">
                <button onclick="fillAllStoresEqually()" style="flex: 1; padding: 10px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s;"
                        onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f5f5f5'">
                    ⚖️ 平均分配
                </button>
                <button onclick="applyMultiplierToStores()" style="flex: 1; padding: 10px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s;"
                        onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f5f5f5'">
                    🔢 批量调整
                </button>
            </div>
        </div>
    `;

    // 渲染表格行
    renderStoreAllocationRows();
}

// ============== 渲染门店分配表格行 ==============
function renderStoreAllocationRows() {
    const tbody = document.getElementById('storeAllocationTableBody');
    const region = regionsData[state.selectedRegion];
    const regionTotal = storeAllocationData.regionTotal;

    let html = '';
    region.stores.forEach((store, index) => {
        const allocation = state.storeAllocations[store] || 0;
        const percent = regionTotal > 0 ? ((allocation / regionTotal) * 100).toFixed(2) : 0;
        const isAdjusted = storeAllocationData.adjustments[index] !== undefined;

        html += `
            <tr style="background: ${index % 2 === 0 ? 'white' : '#fafafa'}; transition: background 0.2s;"
                onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background='${index % 2 === 0 ? 'white' : '#fafafa'}'">
                <td style="padding: 10px 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 8px;">
                    <span style="color: ${isAdjusted ? '#ff8c00' : '#666'}; font-weight: ${isAdjusted ? '600' : '400'};">
                        ${store}
                    </span>
                    ${isAdjusted ? '<span style="font-size: 10px; padding: 2px 6px; background: rgba(255,159,64,0.2); border-radius: 4px; color: #ff8c00;">已调</span>' : ''}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: center;">
                    <input type="number"
                           value="${allocation}"
                           min="0"
                           step="1"
                           data-store-index="${index}"
                           data-store-name="${store}"
                           onchange="updateStoreAllocation(this)"
                           style="width: 100px; padding: 6px 10px; border: 2px solid ${isAdjusted ? '#ff8c00' : '#ddd'};
                                  border-radius: 6px; text-align: center; font-size: 14px; font-weight: 600;
                                  transition: all 0.2s;"
                           onfocus="this.style.borderColor='#4285F4'; this.select()"
                           onblur="this.style.borderColor='${isAdjusted ? '#ff8c00' : '#ddd'}'">
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: center; color: #666; font-size: 13px;">
                    ${percent}%
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ============== 更新单个门店分配 ==============
window.updateStoreAllocation = function(input) {
    const storeIndex = parseInt(input.dataset.storeIndex);
    const storeName = input.dataset.storeName;
    const newValue = Math.max(0, parseInt(input.value) || 0);

    // 更新状态
    state.storeAllocations[storeName] = newValue;
    storeAllocationData.allocations[storeIndex] = newValue;

    // 记录调整
    const originalValue = Math.floor(storeAllocationData.regionTotal / storeAllocationData.labels.length);
    if (Math.abs(newValue - originalValue) > 1) {
        storeAllocationData.adjustments[storeIndex] = true;
    } else {
        delete storeAllocationData.adjustments[storeIndex];
    }

    // 更新统计和显示
    updateStoreAllocationStats();
    renderStoreAllocationRows();
};

// ============== 平均分配 ==============
window.fillAllStoresEqually = function() {
    const region = regionsData[state.selectedRegion];
    const regionTotal = storeAllocationData.regionTotal;
    const storeCount = region.stores.length;
    const avgTarget = Math.floor(regionTotal / storeCount);
    const remainder = regionTotal % storeCount;

    region.stores.forEach((store, index) => {
        const allocation = avgTarget + (index < remainder ? 1 : 0);
        state.storeAllocations[store] = allocation;
        storeAllocationData.allocations[index] = allocation;
    });

    // 清空调整记录
    storeAllocationData.adjustments = {};

    updateStoreAllocationStats();
    renderStoreAllocationRows();
};

// ============== 批量调整 ==============
window.applyMultiplierToStores = function() {
    const input = prompt('请输入调整系数（例如：1.2表示增加20%，0.8表示减少20%）：', '1.0');
    if (!input) return;

    const multiplier = parseFloat(input);
    if (isNaN(multiplier) || multiplier <= 0) {
        alert('请输入有效的正数！');
        return;
    }

    const region = regionsData[state.selectedRegion];
    const regionTotal = storeAllocationData.regionTotal;

    // 应用系数
    let sum = 0;
    region.stores.forEach((store, index) => {
        const newValue = Math.round(state.storeAllocations[store] * multiplier);
        storeAllocationData.allocations[index] = newValue;
        sum += newValue;
    });

    // 调整以匹配总量
    if (sum !== regionTotal && region.stores.length > 0) {
        const ratio = regionTotal / sum;
        region.stores.forEach((store, index) => {
            storeAllocationData.allocations[index] = Math.round(storeAllocationData.allocations[index] * ratio);
        });
    }

    // 确保精确匹配
    const finalSum = storeAllocationData.allocations.reduce((a, b) => a + b, 0);
    const diff = regionTotal - finalSum;
    if (diff !== 0) {
        storeAllocationData.allocations[0] += diff;
    }

    // 更新state
    region.stores.forEach((store, index) => {
        state.storeAllocations[store] = storeAllocationData.allocations[index];
        storeAllocationData.adjustments[index] = true;
    });

    updateStoreAllocationStats();
    renderStoreAllocationRows();
};

// ============== 更新门店分配统计信息 ==============
function updateStoreAllocationStats() {
    // 更新表格底部的总计
    const allocationTableTotal = document.getElementById('allocationTableTotal');
    if (allocationTableTotal) {
        const allocatedTotal = storeAllocationData.allocations.reduce((sum, val) => sum + val, 0);
        allocationTableTotal.textContent = allocatedTotal;

        // 如果汇总不等于区域目标，改变颜色提示
        if (allocatedTotal !== storeAllocationData.regionTotal) {
            allocationTableTotal.style.color = '#ff4d4f';
        } else {
            allocationTableTotal.style.color = 'white';
        }
    }
}

// ============== 绑定门店分配按钮 ==============
function bindStoreAllocationButtons() {
    const resetBtn = document.getElementById('resetStoreAllocationBtn');
    const confirmBtn = document.getElementById('confirmStoreAllocationBtn');

    // 重置按钮
    resetBtn.onclick = () => {
        if (!confirm('确定要重置为平均分配吗？')) return;

        // 重新平均分配
        const region = regionsData[state.selectedRegion];
        const regionTotal = Object.values(state.vehicleTargets).reduce((sum, val) => sum + val, 0);
        const storeCount = region.stores.length;
        const avgTarget = Math.floor(regionTotal / storeCount);
        const remainder = regionTotal % storeCount;

        state.storeAllocations = {};
        region.stores.forEach((store, index) => {
            const allocation = avgTarget + (index < remainder ? 1 : 0);
            state.storeAllocations[store] = allocation;
            storeAllocationData.allocations[index] = allocation;
        });

        storeAllocationData.adjustments = {};

        updateStoreAllocationChart();
        updateStoreAllocationStats();
    };

    // 确认分配按钮
    confirmBtn.onclick = () => {
        generateStoreData();
    };
}

// ============== 生成门店级数据 ==============
function generateStoreData() {
    const region = regionsData[state.selectedRegion];
    const vehicles = Object.keys(state.vehicleTargets);

    // 获取区域总目标
    const regionTotal = Object.values(state.vehicleTargets).reduce((sum, val) => sum + val, 0);

    if (regionTotal === 0) {
        alert('区域总目标为0，无法生成门店数据');
        return;
    }

    // ★ 校验门店分配汇总是否等于区域总目标
    const storeTotal = Object.values(state.storeAllocations).reduce((sum, val) => sum + val, 0);
    const diff = regionTotal - storeTotal;

    if (diff !== 0) {
        const confirmMsg = `⚠️ 门店分配汇总（${storeTotal}）不等于区域总目标（${regionTotal}），差异：${diff}\n\n是否仍要继续生成？`;
        if (!confirm(confirmMsg)) {
            return;
        }
    }

    // 计算区域各车型的调整后比例
    const regionDailyRatios = {}; // { vehicle: [day1_ratio, day2_ratio, ...] }
    const regionVehicleRatios = {}; // { vehicle: ratio_in_total }

    // 计算各车型占比
    vehicles.forEach(vehicle => {
        regionVehicleRatios[vehicle] = state.vehicleTargets[vehicle] / regionTotal;
    });

    // 获取区域调整后的日比例（从chartData中获取）
    if (window.chartData && window.chartData.adjustedVehicleData) {
        vehicles.forEach(vehicle => {
            const vehicleData = window.chartData.adjustedVehicleData[vehicle];
            if (vehicleData) {
                const vehicleTotal = state.vehicleTargets[vehicle];
                if (vehicleTotal > 0) {
                    regionDailyRatios[vehicle] = vehicleData.map(amount =>
                        Math.max(0, amount) / vehicleTotal
                    );
                } else {
                    regionDailyRatios[vehicle] = vehicleData.map(() => 0);
                }
            }
        });
    } else {
        // 如果没有调整，使用原始比例
        vehicles.forEach(vehicle => {
            regionDailyRatios[vehicle] = state.results[vehicle].map(r =>
                Math.max(0, r.ratio) / 100
            );
        });
    }

    // 为每个门店生成数据
    state.storeData = {};
    region.stores.forEach(store => {
        const storeTotal = Math.max(0, state.storeAllocations[store] || 0);
        const storeVehicles = {};

        // 获取天数
        const daysCount = regionDailyRatios[vehicles[0]]?.length || 0;

        // ★★★ 优化后的三层约束算法 ★★★
        // 同时满足三个约束：
        // 1. 每天各车型总和 = 每日目标
        // 2. 各车型的月度总量 ≈ 区域车型目标比例
        // 3. 所有天的总和 = 门店月度目标

        // ==== 第一步：计算各车型的门店月度目标 ====
        const vehicleMonthlyTargets = {};

        if (storeAllocationData.allocationMode === 'preset' && storeAllocationData.presetVehicleTargets[store]) {
            // 预设模式：直接使用用户指定的门店车型目标
            const presetTargets = storeAllocationData.presetVehicleTargets[store];
            vehicles.forEach(vehicle => {
                vehicleMonthlyTargets[vehicle] = presetTargets[vehicle] || 0;
            });
        } else {
            // 自动模式：按区域比例分配
            const vehicleExactValues = vehicles.map(vehicle => ({
                vehicle,
                exactValue: storeTotal * regionVehicleRatios[vehicle]
            }));

            // 使用最大余数法确保车型月度目标总和 = 门店总目标
            const floorVehicleValues = vehicleExactValues.map(item => ({
                vehicle: item.vehicle,
                floor: Math.floor(item.exactValue),
                remainder: item.exactValue - Math.floor(item.exactValue)
            }));

            let vehicleDistributed = floorVehicleValues.reduce((sum, item) => sum + item.floor, 0);
            const vehicleExtra = storeTotal - vehicleDistributed;

            floorVehicleValues.sort((a, b) => b.remainder - a.remainder);

            floorVehicleValues.forEach((item, idx) => {
                vehicleMonthlyTargets[item.vehicle] = item.floor + (idx < vehicleExtra ? 1 : 0);
            });
        }

        // ==== 第二步：计算门店的每日总量目标 ====
        const regionDailyTotalRatios = [];
        for (let day = 0; day < daysCount; day++) {
            let dayRatioSum = 0;
            vehicles.forEach(vehicle => {
                const vehicleRatio = regionVehicleRatios[vehicle];
                const dayRatio = regionDailyRatios[vehicle][day] || 0;
                dayRatioSum += vehicleRatio * dayRatio;
            });
            regionDailyTotalRatios.push(dayRatioSum);
        }

        // 使用最大余数法分配门店总量到各天
        const exactDailyValues = regionDailyTotalRatios.map(ratio => storeTotal * ratio);
        const floorDailyValues = exactDailyValues.map((exact, index) => ({
            index,
            floor: Math.floor(exact),
            remainder: exact - Math.floor(exact)
        }));

        let dailyDistributed = floorDailyValues.reduce((sum, item) => sum + item.floor, 0);
        const dailyExtra = storeTotal - dailyDistributed;

        floorDailyValues.sort((a, b) => b.remainder - a.remainder);

        const targetDailyTotals = new Array(daysCount);
        floorDailyValues.forEach((item, idx) => {
            targetDailyTotals[item.index] = item.floor + (idx < dailyExtra ? 1 : 0);
        });

        // ==== 第三步：对每个车型按日分配，同时考虑每日总量约束 ====
        // 初始化车型数据结构
        vehicles.forEach(vehicle => {
            storeVehicles[vehicle] = new Array(daysCount).fill(0);
        });

        // 3.1 先按各车型的月度目标和日比例进行初步分配
        vehicles.forEach(vehicle => {
            const vehicleTarget = vehicleMonthlyTargets[vehicle];
            const vehicleDailyRatios = regionDailyRatios[vehicle];

            // 使用最大余数法按日分配
            const exactDailyValues = vehicleDailyRatios.map(ratio => vehicleTarget * ratio);
            const floorDailyValues = exactDailyValues.map((exact, index) => ({
                index,
                floor: Math.floor(exact),
                remainder: exact - Math.floor(exact)
            }));

            let distributed = floorDailyValues.reduce((sum, item) => sum + item.floor, 0);
            const extra = vehicleTarget - distributed;

            floorDailyValues.sort((a, b) => b.remainder - a.remainder);

            floorDailyValues.forEach((item, idx) => {
                storeVehicles[vehicle][item.index] = item.floor + (idx < extra ? 1 : 0);
            });
        });

        // 3.2 调整使每一天的车型总和 = 该天的目标总量
        for (let day = 0; day < daysCount; day++) {
            // 计算当前该天各车型的总和
            let dayCurrentSum = 0;
            vehicles.forEach(vehicle => {
                dayCurrentSum += storeVehicles[vehicle][day];
            });

            const dayTarget = targetDailyTotals[day];
            let diff = dayTarget - dayCurrentSum;

            // 如果有差异，需要调整
            if (diff !== 0) {
                // 计算各车型当前的累计偏离度（累计值 - 目标值）
                const vehicleDeviations = vehicles.map(vehicle => {
                    const currentTotal = storeVehicles[vehicle].reduce((sum, val) => sum + val, 0);
                    const targetTotal = vehicleMonthlyTargets[vehicle];
                    return {
                        vehicle,
                        deviation: currentTotal - targetTotal,
                        currentDayValue: storeVehicles[vehicle][day]
                    };
                });

                // 如果 diff > 0，需要增加；优先给偏离度为负（低于目标）的车型
                // 如果 diff < 0，需要减少；优先从偏离度为正（高于目标）的车型减
                if (diff > 0) {
                    // 需要增加，按偏离度升序排列（最负的排前面）
                    vehicleDeviations.sort((a, b) => a.deviation - b.deviation);
                    for (let i = 0; i < Math.abs(diff); i++) {
                        const target = vehicleDeviations[i % vehicleDeviations.length];
                        storeVehicles[target.vehicle][day]++;
                    }
                } else {
                    // 需要减少，按偏离度降序排列（最正的排前面），且当前值>0才能减
                    vehicleDeviations.sort((a, b) => b.deviation - a.deviation);
                    let adjusted = 0;
                    let attempts = 0;
                    const maxAttempts = vehicleDeviations.length * Math.abs(diff) * 2;

                    while (adjusted < Math.abs(diff) && attempts < maxAttempts) {
                        for (let i = 0; i < vehicleDeviations.length && adjusted < Math.abs(diff); i++) {
                            const target = vehicleDeviations[i];
                            if (storeVehicles[target.vehicle][day] > 0) {
                                storeVehicles[target.vehicle][day]--;
                                adjusted++;
                                // 更新偏离度
                                target.deviation--;
                            }
                        }
                        attempts++;
                        // 重新排序，确保每次都从偏离度最大的开始
                        vehicleDeviations.sort((a, b) => b.deviation - a.deviation);
                    }
                }
            }
        }

        // 计算实际的每日总量（用于验证）
        const dailyTotals = [];
        for (let day = 0; day < daysCount; day++) {
            const dayTotal = vehicles.reduce((sum, vehicle) => {
                const amount = storeVehicles[vehicle]?.[day] || 0;
                return sum + Math.max(0, amount);
            }, 0);
            dailyTotals.push(dayTotal);
        }

        state.storeData[store] = {
            vehicles: storeVehicles,
            originalVehicles: JSON.parse(JSON.stringify(storeVehicles)), // 保存原始车型数据
            dailyTotals: dailyTotals,
            monthlyTarget: storeTotal,
            adjustments: {}, // 门店级别的调整记录
            vehicleMonthlyTargets: vehicleMonthlyTargets // 保存车型月度目标用于验证
        };
    });

    // 显示门店详细数据section
    showStoreDetailSection();

    // 渲染区域车型汇总对比
    renderRegionVehicleSummary();
}

// ============== 显示门店详细数据section ==============
function showStoreDetailSection() {
    const storeDataSection = document.getElementById('storeDataSection');

    if (!storeDataSection) {
        console.error('找不到 storeDataSection 元素');
        return;
    }

    storeDataSection.classList.remove('hidden');

    // 生成门店tabs
    renderStoreTabs();

    // 平滑滚动
    setTimeout(() => {
        storeDataSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// ============== 渲染门店Tabs ==============
function renderStoreTabs() {
    const storeTabs = document.getElementById('storeTabs');

    if (!storeTabs) {
        console.error('找不到 storeTabs 元素');
        return;
    }

    const region = regionsData[state.selectedRegion];

    if (!region || !region.stores) {
        console.error('区域数据不存在');
        return;
    }

    let tabsHTML = '<div class="tabs-container" style="max-height: 400px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; padding: 12px; background: #f5f7fa; border-radius: 8px;">';

    region.stores.forEach((store, index) => {
        const isActive = index === 0 ? 'active' : '';
        const storeData = state.storeData[store];
        const monthlyTotal = storeData?.monthlyTarget || 0;

        tabsHTML += `
            <button class="tab-btn store-tab-btn ${isActive}" onclick="switchStore('${store}')"
                    style="display: flex; flex-direction: column; align-items: flex-start; padding: 12px;
                           background: ${isActive ? '#4285F4' : 'white'}; color: ${isActive ? 'white' : '#333'};
                           border: 2px solid ${isActive ? '#4285F4' : '#e0e0e0'}; border-radius: 8px;
                           cursor: pointer; transition: all 0.2s; text-align: left; min-height: 70px;">
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;"
                     title="${store}">
                    ${store}
                </div>
                <div style="font-size: 11px; opacity: 0.8;">
                    月度目标: <strong>${monthlyTotal}</strong>
                </div>
                ${storeData?.adjustments && Object.keys(storeData.adjustments).length > 0
                    ? `<div style="font-size: 10px; margin-top: 4px; padding: 2px 6px; background: rgba(255,159,64,0.2); border-radius: 4px; color: #ff8c00;">已调整</div>`
                    : ''}
            </button>
        `;
    });

    tabsHTML += '</div>';

    // 添加提示信息
    tabsHTML += `
        <div style="margin-top: 12px; padding: 10px; background: #fff9e5; border-left: 4px solid #ffc107; border-radius: 4px; font-size: 12px; color: #666;">
            <strong>💡 提示：</strong>点击门店名称查看详细数据，可在下方图表中拖拽调整该门店的每日分配
        </div>
    `;

    storeTabs.innerHTML = tabsHTML;

    // 默认显示第一个门店
    if (region.stores.length > 0) {
        window.currentStore = region.stores[0];
        renderStoreChart(region.stores[0]);
        renderStoreDataTable(region.stores[0]);
    }
}

// ============== 切换门店 ==============
window.switchStore = function(storeName) {
    window.currentStore = storeName;

    // 更新tab状态
    const tabs = document.querySelectorAll('#storeTabs .store-tab-btn');
    tabs.forEach(tab => {
        const btnStoreName = tab.querySelector('div').textContent.trim();
        if (btnStoreName === storeName) {
            tab.classList.add('active');
            tab.style.background = '#4285F4';
            tab.style.color = 'white';
            tab.style.borderColor = '#4285F4';
        } else {
            tab.classList.remove('active');
            tab.style.background = 'white';
            tab.style.color = '#333';
            tab.style.borderColor = '#e0e0e0';
        }
    });

    // 渲染该门店的图表和数据
    renderStoreChart(storeName);
    renderStoreDataTable(storeName);
};

// ============== 渲染门店图表 ==============
let storeChart = null;
let storeChartData = {
    labels: [],
    originalAmounts: [],
    adjustedAmounts: [],
    adjustments: {},
    storeName: null
};

let isStoreChartDragging = false;
let dragStoreDayIndex = null;

function renderStoreChart(storeName) {
    const canvas = document.getElementById('storeRatioChart');
    const ctx = canvas.getContext('2d');
    const storeData = state.storeData[storeName];

    if (!storeData) return;

    // 准备图表数据
    storeChartData.storeName = storeName;
    storeChartData.labels = storeData.dailyTotals.map((_, i) => `${state.targetMonth}/${i + 1}`);
    storeChartData.originalAmounts = [...storeData.dailyTotals];
    storeChartData.adjustedAmounts = storeData.adjustments && Object.keys(storeData.adjustments).length > 0
        ? calculateStoreAdjustedAmounts(storeName)
        : [...storeData.dailyTotals];
    storeChartData.adjustments = storeData.adjustments || {};

    // 销毁旧图表
    if (storeChart) {
        storeChart.destroy();
    }

    storeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: storeChartData.labels,
            datasets: [{
                label: '每日分配量',
                data: storeChartData.adjustedAmounts,
                backgroundColor: storeChartData.labels.map((_, i) =>
                    storeChartData.adjustments[i] !== undefined ? '#FF9F40' : '#4285F4'
                ),
                borderColor: storeChartData.labels.map((_, i) =>
                    storeChartData.adjustments[i] !== undefined ? '#FF8C00' : '#1967D2'
                ),
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} 辆`;
                        }
                    }
                },
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    formatter: (value) => value,
                    font: { size: 10, weight: 'bold' },
                    color: '#333'
                }
            },
            scales: {
                x: {
                    ticks: { font: { size: 10 } }
                },
                y: {
                    beginAtZero: true,
                    ticks: { callback: (value) => Math.round(value) }
                }
            },
            onHover: (event, activeElements) => {
                const isOverBar = activeElements.length > 0 && activeElements[0].datasetIndex === 0;
                event.native.target.style.cursor = isOverBar ? 'ns-resize' : 'default';
            }
        },
        plugins: [ChartDataLabels]
    });

    // 绑定拖拽事件
    bindStoreChartDragEvents(canvas);

    // 更新统计信息
    updateStoreChartStats(storeName);
}

function calculateStoreAdjustedAmounts(storeName) {
    const storeData = state.storeData[storeName];
    const adjustments = storeData.adjustments;
    const dailyTotals = [...storeData.dailyTotals];
    const originalDailyTotals = [...storeData.dailyTotals]; // 保存原始量
    const monthlyTarget = storeData.monthlyTarget;

    if (!adjustments || Object.keys(adjustments).length === 0) {
        return dailyTotals;
    }

    // 应用调整
    Object.keys(adjustments).forEach(dayIndex => {
        const multiplier = adjustments[dayIndex];
        dailyTotals[parseInt(dayIndex)] = Math.round(storeData.dailyTotals[dayIndex] * multiplier);
    });

    // 重新分配保持总量不变
    const adjustedIndices = Object.keys(adjustments).map(i => parseInt(i));
    redistributeStoreDailyAmounts(dailyTotals, originalDailyTotals, adjustedIndices, monthlyTarget);

    return dailyTotals;
}

function bindStoreChartDragEvents(canvas) {
    let startY = 0;
    let startValue = 0;

    canvas.addEventListener('mousedown', (e) => {
        const elements = storeChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
        if (elements.length > 0 && elements[0].datasetIndex === 0) {
            isStoreChartDragging = true;
            dragStoreDayIndex = elements[0].index;
            startY = e.clientY;
            startValue = storeChartData.adjustedAmounts[dragStoreDayIndex];
            canvas.style.cursor = 'ns-resize';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isStoreChartDragging || dragStoreDayIndex === null) return;

        const deltaY = startY - e.clientY;
        const chart = storeChart;
        const scale = chart.scales.y;
        const pixelPerUnit = (scale.max - scale.min) / scale.height;
        const valueDelta = deltaY * pixelPerUnit;

        let newValue = Math.round(startValue + valueDelta);
        newValue = Math.max(0, newValue);

        storeChartData.adjustedAmounts[dragStoreDayIndex] = newValue;

        // 记录调整系数
        const originalValue = storeChartData.originalAmounts[dragStoreDayIndex];
        if (originalValue > 0) {
            storeChartData.adjustments[dragStoreDayIndex] = newValue / originalValue;
        } else {
            storeChartData.adjustments[dragStoreDayIndex] = 1;
        }

        // 重新分配其他天数
        redistributeStoreDays(dragStoreDayIndex);

        // 更新图表
        updateStoreChart();
        updateStoreChartStats(storeChartData.storeName);
    });

    canvas.addEventListener('mouseup', () => {
        if (isStoreChartDragging) {
            isStoreChartDragging = false;

            // 保存调整到state
            const storeName = storeChartData.storeName;
            state.storeData[storeName].adjustments = { ...storeChartData.adjustments };

            // 重新计算该门店各车型的每日数据
            recalculateStoreVehicleData(storeName);

            dragStoreDayIndex = null;
            canvas.style.cursor = 'default';

            // 重新渲染表格
            renderStoreDataTable(storeName);
        }
    });

    canvas.addEventListener('mouseleave', () => {
        if (isStoreChartDragging) {
            isStoreChartDragging = false;
            dragStoreDayIndex = null;
            canvas.style.cursor = 'default';
        }
    });
}

function redistributeStoreDays(adjustedIndex) {
    const monthlyTarget = state.storeData[storeChartData.storeName].monthlyTarget;

    // 找出所有已调整的天（包括当前天）
    const adjustedIndices = Object.keys(storeChartData.adjustments).map(k => parseInt(k));
    if (!adjustedIndices.includes(adjustedIndex)) {
        adjustedIndices.push(adjustedIndex);
    }

    // 计算已调整天的总量
    const adjustedDaysTotal = adjustedIndices.reduce((sum, i) => sum + storeChartData.adjustedAmounts[i], 0);

    // 计算未调整天需要分配的总量
    const unadjustedDaysTarget = monthlyTarget - adjustedDaysTotal;

    // 找出未调整的天
    const unadjustedIndices = storeChartData.labels
        .map((_, i) => i)
        .filter(i => !adjustedIndices.includes(i));

    if (unadjustedIndices.length === 0) {
        // 所有天都已调整，确保总和等于目标
        const currentSum = storeChartData.adjustedAmounts.reduce((sum, val) => sum + val, 0);
        const diff = monthlyTarget - currentSum;
        if (diff !== 0) {
            storeChartData.adjustedAmounts[adjustedIndex] = Math.max(0, storeChartData.adjustedAmounts[adjustedIndex] + diff);
        }
        return;
    }

    // 收集未调整天的原始量
    let unadjustedOriginalTotal = 0;
    const unadjustedDays = unadjustedIndices.map(i => {
        const originalAmount = storeChartData.originalAmounts[i];
        unadjustedOriginalTotal += originalAmount;
        return { index: i, originalAmount };
    });

    // 按原始比例重新分配未调整天（使用最大余数法）
    if (unadjustedOriginalTotal > 0) {
        // 计算每天的精确分配量
        const exactAllocations = unadjustedDays.map(({ index, originalAmount }) => ({
            index,
            exactValue: (originalAmount / unadjustedOriginalTotal) * unadjustedDaysTarget
        }));

        // 先全部向下取整
        const floorAllocations = exactAllocations.map(item => ({
            index: item.index,
            floor: Math.floor(item.exactValue),
            remainder: item.exactValue - Math.floor(item.exactValue)
        }));

        // 计算已分配量和余量
        let distributed = floorAllocations.reduce((sum, item) => sum + item.floor, 0);
        const extra = Math.round(unadjustedDaysTarget) - distributed;

        // 按余数降序排列
        floorAllocations.sort((a, b) => b.remainder - a.remainder);

        // 分配余量
        floorAllocations.forEach((item, idx) => {
            let finalValue = item.floor;
            if (idx < extra) {
                finalValue++;
            }
            storeChartData.adjustedAmounts[item.index] = Math.max(0, finalValue);
        });
    } else {
        // 原始总量为0，平均分配
        const avgAmount = Math.floor(unadjustedDaysTarget / unadjustedIndices.length);
        const remainder = unadjustedDaysTarget % unadjustedIndices.length;

        unadjustedIndices.forEach((i, idx) => {
            storeChartData.adjustedAmounts[i] = avgAmount + (idx < remainder ? 1 : 0);
        });
    }
}

function redistributeStoreDailyAmounts(dailyTotals, originalDailyTotals, adjustedIndices, monthlyTarget) {
    // 计算已调整天的总量
    const adjustedDaysTotal = adjustedIndices.reduce((sum, i) => sum + dailyTotals[i], 0);

    // 计算未调整天需要分配的总量
    const unadjustedDaysTarget = monthlyTarget - adjustedDaysTotal;

    // 找出未调整的天
    const unadjustedIndices = dailyTotals
        .map((_, i) => i)
        .filter(i => !adjustedIndices.includes(i));

    if (unadjustedIndices.length === 0) {
        // 所有天都已调整，确保总和等于目标
        const currentSum = dailyTotals.reduce((sum, val) => sum + val, 0);
        const diff = monthlyTarget - currentSum;
        if (diff !== 0 && adjustedIndices.length > 0) {
            dailyTotals[adjustedIndices[0]] = Math.max(0, dailyTotals[adjustedIndices[0]] + diff);
        }
        return;
    }

    // 收集未调整天的原始量
    let unadjustedOriginalTotal = 0;
    const unadjustedDays = unadjustedIndices.map(i => {
        const originalAmount = originalDailyTotals[i];
        unadjustedOriginalTotal += originalAmount;
        return { index: i, originalAmount };
    });

    // 按原始比例重新分配未调整天（使用最大余数法）
    if (unadjustedOriginalTotal > 0) {
        // 计算每天的精确分配量
        const exactAllocations = unadjustedDays.map(({ index, originalAmount }) => ({
            index,
            exactValue: (originalAmount / unadjustedOriginalTotal) * unadjustedDaysTarget
        }));

        // 先全部向下取整
        const floorAllocations = exactAllocations.map(item => ({
            index: item.index,
            floor: Math.floor(item.exactValue),
            remainder: item.exactValue - Math.floor(item.exactValue)
        }));

        // 计算已分配量和余量
        let distributed = floorAllocations.reduce((sum, item) => sum + item.floor, 0);
        const extra = Math.round(unadjustedDaysTarget) - distributed;

        // 按余数降序排列
        floorAllocations.sort((a, b) => b.remainder - a.remainder);

        // 分配余量
        floorAllocations.forEach((item, idx) => {
            let finalValue = item.floor;
            if (idx < extra) {
                finalValue++;
            }
            dailyTotals[item.index] = Math.max(0, finalValue);
        });
    } else {
        // 原始总量为0，平均分配
        const avgAmount = Math.floor(unadjustedDaysTarget / unadjustedIndices.length);
        const remainder = unadjustedDaysTarget % unadjustedIndices.length;

        unadjustedIndices.forEach((i, idx) => {
            dailyTotals[i] = avgAmount + (idx < remainder ? 1 : 0);
        });
    }
}

function recalculateStoreVehicleData(storeName) {
    const storeData = state.storeData[storeName];
    const vehicles = Object.keys(storeData.vehicles);
    const newDailyTotals = [...storeChartData.adjustedAmounts];
    const daysCount = newDailyTotals.length;

    // 找出被调整的天
    const adjustedDays = Object.keys(storeChartData.adjustments).map(k => parseInt(k));

    if (adjustedDays.length === 0) {
        storeData.dailyTotals = newDailyTotals;
        return;
    }

    // 对每个车型进行重新分配（保持车型月度总量不变）
    vehicles.forEach(vehicle => {
        // 使用原始车型数据计算月度总量，确保总量不变
        const vehicleMonthlyTarget = storeData.originalVehicles[vehicle].reduce((sum, val) => sum + Math.max(0, val || 0), 0);

        if (vehicleMonthlyTarget === 0) {
            // 如果车型总量为0，按每日总量占比分配
            storeData.vehicles[vehicle] = newDailyTotals.map(dayTotal => {
                const totalSum = newDailyTotals.reduce((a, b) => a + b, 0);
                return totalSum > 0 ? Math.round(dayTotal / totalSum * vehicleMonthlyTarget) : 0;
            });
            return;
        }

        // 初始化该车型的调整数据
        if (!storeData.adjustedVehicleData) {
            storeData.adjustedVehicleData = {};
        }
        if (!storeData.adjustedVehicleData[vehicle]) {
            // 初始化为正确长度的数组，填充原始值
            storeData.adjustedVehicleData[vehicle] = [...storeData.originalVehicles[vehicle]];
        }

        // 第一步:计算被调整天该车型的新分配量
        let adjustedDaysTotal = 0;
        adjustedDays.forEach(dayIndex => {
            const dayNewTotal = Math.round(newDailyTotals[dayIndex]);
            const dayOriginalTotal = storeChartData.originalAmounts[dayIndex];

            if (dayOriginalTotal === 0 || dayOriginalTotal === null || dayOriginalTotal === undefined) {
                // 原始总量为0,按该车型在门店月度总量中的占比分配
                const storeMonthlyTotal = vehicles.reduce((sum, v) => {
                    return sum + storeData.originalVehicles[v].reduce((s, val) => s + (val || 0), 0);
                }, 0);
                const vehicleRatioInStore = storeMonthlyTotal > 0 ? vehicleMonthlyTarget / storeMonthlyTotal : 0;
                const vehicleNewAmountExact = dayNewTotal * vehicleRatioInStore;
                storeData.adjustedVehicleData[vehicle][dayIndex] = vehicleNewAmountExact;
                adjustedDaysTotal += vehicleNewAmountExact;
            } else {
                // 该车型在这一天的原始占比(使用originalVehicles)
                const vehicleOriginalAmount = storeData.originalVehicles[vehicle][dayIndex] || 0;
                const vehicleRatioInDay = vehicleOriginalAmount / dayOriginalTotal;

                // 该车型在这一天的新量
                const vehicleNewAmountExact = dayNewTotal * vehicleRatioInDay;
                storeData.adjustedVehicleData[vehicle][dayIndex] = vehicleNewAmountExact;
                adjustedDaysTotal += vehicleNewAmountExact;
            }
        });

        // 对被调整天进行精确整数分配
        const adjustedDaysAllocations = adjustedDays.map(dayIndex => ({
            dayIndex,
            exactValue: storeData.adjustedVehicleData[vehicle][dayIndex]
        }));

        const floorAllocations = adjustedDaysAllocations.map(item => ({
            dayIndex: item.dayIndex,
            floor: Math.floor(item.exactValue),
            remainder: item.exactValue - Math.floor(item.exactValue)
        }));

        let adjustedDaysDistributed = floorAllocations.reduce((sum, item) => sum + item.floor, 0);
        const adjustedDaysExtra = Math.round(adjustedDaysTotal) - adjustedDaysDistributed;

        floorAllocations.sort((a, b) => b.remainder - a.remainder);

        // 重新分配被调整天的整数值
        adjustedDaysTotal = 0;
        floorAllocations.forEach((item, index) => {
            let finalValue = item.floor;
            if (index < adjustedDaysExtra) {
                finalValue++;
            }
            storeData.adjustedVehicleData[vehicle][item.dayIndex] = finalValue;
            adjustedDaysTotal += finalValue;
        });

        // 第二步：计算未调整天需要分配的总量
        const unadjustedDaysTarget = vehicleMonthlyTarget - adjustedDaysTotal;

        // 第三步：收集未调整天的信息
        const unadjustedDays = [];
        let unadjustedOriginalTotal = 0;

        for (let dayIndex = 0; dayIndex < daysCount; dayIndex++) {
            if (!adjustedDays.includes(dayIndex)) {
                const originalAmount = storeData.originalVehicles[vehicle][dayIndex] || 0;
                unadjustedDays.push({ dayIndex, originalAmount });
                unadjustedOriginalTotal += originalAmount;
            }
        }

        // 第四步：按原始比例重新分配未调整天
        if (unadjustedOriginalTotal > 0 && unadjustedDays.length > 0) {
            const exactAllocations = unadjustedDays.map(({ dayIndex, originalAmount }) => ({
                dayIndex,
                exactValue: (originalAmount / unadjustedOriginalTotal) * unadjustedDaysTarget
            }));

            const floorAllocs = exactAllocations.map(item => ({
                dayIndex: item.dayIndex,
                floor: Math.floor(item.exactValue),
                remainder: item.exactValue - Math.floor(item.exactValue)
            }));

            let distributed = floorAllocs.reduce((sum, item) => sum + item.floor, 0);
            const extra = Math.round(unadjustedDaysTarget) - distributed;

            floorAllocs.sort((a, b) => b.remainder - a.remainder);

            floorAllocs.forEach((item, index) => {
                let finalValue = item.floor;
                if (index < extra) {
                    finalValue++;
                }
                storeData.adjustedVehicleData[vehicle][item.dayIndex] = finalValue;
            });
        } else if (unadjustedDays.length > 0) {
            // 原始总量为0，平均分配剩余量
            const avgAmount = Math.floor(unadjustedDaysTarget / unadjustedDays.length);
            const remainder = unadjustedDaysTarget % unadjustedDays.length;

            unadjustedDays.forEach((day, idx) => {
                const allocation = avgAmount + (idx < remainder ? 1 : 0);
                storeData.adjustedVehicleData[vehicle][day.dayIndex] = allocation;
            });
        }

        // 更新该车型的实际数据
        storeData.vehicles[vehicle] = storeData.adjustedVehicleData[vehicle].map(v => Math.max(0, v || 0));
    });

    // 校验和调整：确保每一天各车型加起来等于当日汇总
    for (let dayIndex = 0; dayIndex < daysCount; dayIndex++) {
        let dayVehiclesSum = 0;
        vehicles.forEach(vehicle => {
            dayVehiclesSum += storeData.vehicles[vehicle][dayIndex] || 0;
        });

        const dayTarget = Math.round(newDailyTotals[dayIndex]);
        const diff = dayTarget - dayVehiclesSum;

        if (diff !== 0) {
            // 找到该天分配量最大的车型，将差值加到它身上
            let maxVehicle = vehicles[0];
            let maxAmount = storeData.vehicles[vehicles[0]][dayIndex] || 0;

            vehicles.forEach(vehicle => {
                const amount = storeData.vehicles[vehicle][dayIndex] || 0;
                if (amount > maxAmount) {
                    maxAmount = amount;
                    maxVehicle = vehicle;
                }
            });

            // 调整最大车型的量
            const adjustedAmount = Math.max(0, (storeData.vehicles[maxVehicle][dayIndex] || 0) + diff);
            storeData.vehicles[maxVehicle][dayIndex] = adjustedAmount;

            // 同步更新adjustedVehicleData
            if (storeData.adjustedVehicleData && storeData.adjustedVehicleData[maxVehicle]) {
                storeData.adjustedVehicleData[maxVehicle][dayIndex] = adjustedAmount;
            }
        }
    }

    // 更新每日总量
    storeData.dailyTotals = newDailyTotals;

    // 更新区域车型汇总对比（手动调整后实时更新）
    renderRegionVehicleSummary();
}

function updateStoreChart() {
    if (!storeChart) return;

    storeChart.data.datasets[0].data = storeChartData.adjustedAmounts;
    storeChart.data.datasets[0].backgroundColor = storeChartData.labels.map((_, i) =>
        storeChartData.adjustments[i] !== undefined ? '#FF9F40' : '#4285F4'
    );
    storeChart.data.datasets[0].borderColor = storeChartData.labels.map((_, i) =>
        storeChartData.adjustments[i] !== undefined ? '#FF8C00' : '#1967D2'
    );

    storeChart.update('none');
}

function updateStoreChartStats(storeName) {
    const storeData = state.storeData[storeName];
    const adjustedCount = Object.keys(storeChartData.adjustments).length;

    let maxAdjustment = 0;
    Object.keys(storeChartData.adjustments).forEach(i => {
        const multiplier = storeChartData.adjustments[i];
        const change = Math.abs(multiplier - 1) * 100;
        maxAdjustment = Math.max(maxAdjustment, change);
    });

    document.getElementById('storeAdjustedDaysCount').textContent = adjustedCount;
    document.getElementById('storeMaxAdjustment').textContent = maxAdjustment.toFixed(1) + '%';
    document.getElementById('storeMonthlyTotal').textContent = storeData.monthlyTarget;
}

// ============== 渲染门店数据表格 ==============
function renderStoreDataTable(storeName) {
    const container = document.getElementById('storeDataTableContainer');
    const storeData = state.storeData[storeName];

    if (!storeData) {
        container.innerHTML = '<p style="text-align: center; color: #999;">暂无数据</p>';
        return;
    }

    const vehicles = Object.keys(storeData.vehicles);
    const daysCount = storeData.dailyTotals.length;

    let html = '<div class="comparison-panel" style="width: 100%;">';

    // 标题栏带统计信息
    html += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
                <span style="font-size: 18px;">🏪</span> ${storeName} - 每日分配详情
            </h3>
            <div style="display: flex; gap: 20px; font-size: 12px;">
                <div>
                    <span style="opacity: 0.8;">月度总量:</span>
                    <strong style="font-size: 16px; margin-left: 4px;">${storeData.monthlyTarget}</strong>
                </div>
                <div>
                    <span style="opacity: 0.8;">车型数:</span>
                    <strong style="font-size: 16px; margin-left: 4px;">${vehicles.length}</strong>
                </div>
                <div>
                    <span style="opacity: 0.8;">天数:</span>
                    <strong style="font-size: 16px; margin-left: 4px;">${daysCount}</strong>
                </div>
            </div>
        </div>
    `;

    html += '<div class="results-table-container" style="max-height: 600px; overflow: auto;">';
    html += '<table class="results-table" style="width: 100%; border-collapse: collapse;">';

    // 表头
    html += '<thead style="position: sticky; top: 0; background: white; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';
    html += '<tr style="background: linear-gradient(to right, #f8f9fa, #e9ecef);">';
    html += '<th style="padding: 12px 8px; border: 1px solid #dee2e6; font-weight: 600; color: #495057; min-width: 80px;">日期</th>';

    vehicles.forEach((vehicle, idx) => {
        const colors = ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#9C27B0', '#00BCD4'];
        const color = colors[idx % colors.length];
        html += `<th style="padding: 12px 8px; border: 1px solid #dee2e6; font-weight: 600; color: ${color}; min-width: 100px;">${vehicle}</th>`;
    });

    html += '<th style="padding: 12px 8px; border: 1px solid #dee2e6; font-weight: 700; background: #f8f9fa; color: #212529; min-width: 100px;">每日总量</th>';
    html += '</tr></thead>';

    // 表体
    html += '<tbody>';

    let totalByVehicle = {};
    vehicles.forEach(vehicle => {
        totalByVehicle[vehicle] = 0;
    });
    let grandTotal = 0;

    for (let day = 0; day < daysCount; day++) {
        const date = new Date(state.targetYear, state.targetMonth - 1, day + 1);
        const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        html += `<tr style="background: ${isWeekend ? '#fff3e0' : 'white'}; transition: background 0.2s;"
                     onmouseover="this.style.background='#f0f7ff'"
                     onmouseout="this.style.background='${isWeekend ? '#fff3e0' : 'white'}'">`;

        html += `<td style="padding: 10px 8px; border: 1px solid #dee2e6; font-weight: 500; color: #495057;">
                    ${state.targetMonth}/${day + 1}
                    <span style="font-size: 11px; color: #6c757d; margin-left: 4px;">${weekday}</span>
                 </td>`;

        vehicles.forEach((vehicle, idx) => {
            const amount = storeData.vehicles[vehicle][day] || 0;
            totalByVehicle[vehicle] += amount;
            const colors = ['#e3f2fd', '#e8f5e9', '#fff9c4', '#fce4ec', '#f3e5f5', '#e0f7fa'];
            const bgColor = colors[idx % colors.length];

            html += `<td style="padding: 10px 8px; border: 1px solid #dee2e6; text-align: center; background: ${bgColor}; font-weight: 500;">
                        ${amount}
                     </td>`;
        });

        const dayTotal = storeData.dailyTotals[day] || 0;
        grandTotal += dayTotal;

        html += `<td style="padding: 10px 8px; border: 1px solid #dee2e6; text-align: center; font-weight: 700; background: #f8f9fa; color: #212529;">
                    ${dayTotal}
                 </td>`;
        html += '</tr>';
    }

    // 汇总行
    html += '<tr style="background: linear-gradient(to right, #667eea, #764ba2); color: white; font-weight: 700; position: sticky; bottom: 0;">';
    html += '<td style="padding: 12px 8px; border: 1px solid #dee2e6;">月度汇总</td>';

    vehicles.forEach(vehicle => {
        html += `<td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center;">${totalByVehicle[vehicle]}</td>`;
    });

    html += `<td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center; font-size: 16px;">${grandTotal}</td>`;
    html += '</tr>';

    html += '</tbody></table>';
    html += '</div>';

    // 数据验证提示
    const isValid = grandTotal === storeData.monthlyTarget;
    html += `
        <div style="margin-top: 12px; padding: 10px; background: ${isValid ? '#d4edda' : '#fff3cd'};
                    border-left: 4px solid ${isValid ? '#28a745' : '#ffc107'}; border-radius: 4px; font-size: 12px;">
            <strong>${isValid ? '✓' : '⚠'} 数据验证：</strong>
            月度汇总 (<strong>${grandTotal}</strong>) ${isValid ? '=' : '≠'} 月度目标 (<strong>${storeData.monthlyTarget}</strong>)
            ${!isValid ? `<span style="color: #856404; margin-left: 8px;">差异: ${grandTotal - storeData.monthlyTarget}</span>` : ''}
        </div>
    `;

    html += '</div>';

    container.innerHTML = html;
}

// 暴露到window对象
window.initializeStoreAllocationChart = initializeStoreAllocationChart;

// ============== 门店级别导出功能 ==============
function initializeStoreExportButton() {
    const exportStoreBtn = document.getElementById('exportStoreBtn');
    if (exportStoreBtn) {
        exportStoreBtn.addEventListener('click', exportStoreDataToExcel);
    }
}

function exportStoreDataToExcel() {
    if (!state.storeData || Object.keys(state.storeData).length === 0) {
        alert('请先生成门店数据');
        return;
    }

    const wb = XLSX.utils.book_new();
    const region = regionsData[state.selectedRegion];
    const vehicles = Object.keys(state.vehicleTargets);

    // 为每个车型创建一个Sheet
    vehicles.forEach(vehicle => {
        // 准备表头：第一列是门店名称，其余列是日期
        const daysCount = state.results[vehicle].length;
        const headers = ['门店名称'];
        for (let day = 1; day <= daysCount; day++) {
            headers.push(`${state.targetMonth}/${day}`);
        }

        const sheetData = [headers];

        // 为每个门店添加一行数据
        region.stores.forEach(store => {
            const storeData = state.storeData[store];
            const vehicleData = storeData.vehicles[vehicle];

            const row = [store, ...vehicleData];
            sheetData.push(row);
        });

        // 添加汇总行
        const totalRow = ['区域汇总'];
        for (let day = 0; day < daysCount; day++) {
            const dayTotal = region.stores.reduce((sum, store) => {
                return sum + state.storeData[store].vehicles[vehicle][day];
            }, 0);
            totalRow.push(dayTotal);
        }
        sheetData.push(totalRow);

        // 创建工作表
        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        // 设置列宽
        ws['!cols'] = [{ wch: 20 }]; // 门店名称列
        for (let i = 1; i < headers.length; i++) {
            ws['!cols'].push({ wch: 10 });
        }

        // 添加到工作簿
        XLSX.utils.book_append_sheet(wb, ws, vehicle);
    });

    // 生成文件名
    const fileName = `${state.selectedRegion}_门店分配_${state.targetYear}年${state.targetMonth}月.xlsx`;

    // 下载
    XLSX.writeFile(wb, fileName);
}

// 初始化导出按钮
document.addEventListener('DOMContentLoaded', function() {
    initializeStoreExportButton();
    initializeStoreChartButtons();
});

// ============== 门店图表按钮功能 ==============
function initializeStoreChartButtons() {
    const resetBtn = document.getElementById('resetStoreAdjustmentBtn');
    const toggleBtn = document.getElementById('toggleStoreChartBtn');

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (!window.currentStore) return;

            if (!confirm('确定要重置该门店的调整吗？')) return;

            const storeName = window.currentStore;
            const storeData = state.storeData[storeName];

            // 清空调整记录
            storeData.adjustments = {};
            storeChartData.adjustments = {};

            // 重新生成门店数据（使用原始比例）
            const regionVehicles = Object.keys(state.vehicleTargets);
            const regionTotal = Object.values(state.vehicleTargets).reduce((sum, val) => sum + val, 0);

            // 重新按原始比例分配
            regionVehicles.forEach(vehicle => {
                const vehicleRatio = state.vehicleTargets[vehicle] / regionTotal;
                const vehicleTarget = Math.round(storeData.monthlyTarget * vehicleRatio);

                // 按原始日比例分配
                const vehicleDailyRatios = state.results[vehicle].map(r => r.ratio / 100);
                const dailyAmounts = vehicleDailyRatios.map(ratio => Math.round(vehicleTarget * ratio));

                // 调整余数
                const sum = dailyAmounts.reduce((a, b) => a + b, 0);
                const diff = vehicleTarget - sum;
                if (diff !== 0 && dailyAmounts.length > 0) {
                    dailyAmounts[0] += diff;
                }

                storeData.vehicles[vehicle] = dailyAmounts;
            });

            // 重新计算每日总量
            const daysCount = storeData.vehicles[regionVehicles[0]].length;
            const dailyTotals = [];
            for (let day = 0; day < daysCount; day++) {
                const dayTotal = regionVehicles.reduce((sum, vehicle) =>
                    sum + storeData.vehicles[vehicle][day], 0
                );
                dailyTotals.push(dayTotal);
            }
            storeData.dailyTotals = dailyTotals;

            // 重新渲染
            renderStoreChart(storeName);
            renderStoreDataTable(storeName);
        });
    }

    if (toggleBtn) {
        let chartVisible = true;
        toggleBtn.addEventListener('click', () => {
            const chartArea = document.getElementById('storeChartAdjustmentArea');
            if (chartVisible) {
                chartArea.style.display = 'none';
                toggleBtn.textContent = '展开图表';
            } else {
                chartArea.style.display = 'block';
                toggleBtn.textContent = '收起图表';
            }
            chartVisible = !chartVisible;
        });
    }
}

// ============== 下载门店目标模板 ==============
window.handleAllocationModeChange = function(mode) {
    storeAllocationData.allocationMode = mode;

    // 更新UI提示
    const uploadArea = document.querySelector('#storeAllocationPlaceholder .file-upload-area');
    if (!uploadArea) return;

    const hint = uploadArea.querySelector('.upload-hint');
    if (mode === 'auto') {
        hint.textContent = '模板格式：门店名称 | 月度目标';
        // 更新边框样式
        document.querySelectorAll('input[name="allocationMode"]').forEach((input, idx) => {
            const label = input.parentElement;
            if (idx === 0) {
                label.style.borderColor = '#4285F4';
                label.style.background = 'white';
            } else {
                label.style.borderColor = '#e0e0e0';
                label.style.background = 'white';
            }
        });
    } else {
        hint.textContent = '模板格式：门店名称 | W01 | W02 | L6 | L7 | L9 | X01 | X04 | 合计';
        // 更新边框样式
        document.querySelectorAll('input[name="allocationMode"]').forEach((input, idx) => {
            const label = input.parentElement;
            if (idx === 1) {
                label.style.borderColor = '#4285F4';
                label.style.background = 'white';
            } else {
                label.style.borderColor = '#e0e0e0';
                label.style.background = 'white';
            }
        });
    }
};

function downloadStoreTemplate() {
    if (!state.selectedRegion) {
        alert('请先选择区域！');
        return;
    }

    const region = regionsData[state.selectedRegion];
    if (!region || !region.stores) {
        alert('区域数据错误！');
        return;
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    let data, ws, fileName;

    if (storeAllocationData.allocationMode === 'preset') {
        // 预设模式：生成包含车型列的模板
        const vehicles = Object.keys(state.vehicleTargets);

        if (vehicles.length === 0) {
            alert('请先为各车型设置月度目标！');
            return;
        }

        // 表头：门店名称 | 车型1 | 车型2 | ... | 合计
        const headers = ['门店名称', ...vehicles, '合计'];
        data = [headers];

        // 为每个门店添加一行（初始值为0）
        region.stores.forEach(store => {
            const row = [store];
            let total = 0;

            // 如果已有预设目标，填充；否则填0
            vehicles.forEach(vehicle => {
                const value = storeAllocationData.presetVehicleTargets[store]?.[vehicle] || 0;
                row.push(value);
                total += value;
            });
            row.push(total);
            data.push(row);
        });

        // 添加区域汇总行
        const totalRow = ['区域汇总'];
        vehicles.forEach(vehicle => {
            totalRow.push(state.vehicleTargets[vehicle] || 0);
        });
        const regionTotal = Object.values(state.vehicleTargets).reduce((sum, val) => sum + val, 0);
        totalRow.push(regionTotal);
        data.push(totalRow);

        // 创建工作表
        ws = XLSX.utils.aoa_to_sheet(data);

        // 设置列宽
        ws['!cols'] = [{ wch: 30 }]; // 门店名称列
        for (let i = 0; i < vehicles.length + 1; i++) {
            ws['!cols'].push({ wch: 12 });
        }

        fileName = `${state.selectedRegion}_门店分车型目标模板.xlsx`;
    } else {
        // 自动模式：生成门店总目标模板
        data = [
            ['门店名称', '月度目标'],
            ...region.stores.map(store => [store, state.storeAllocations[store] || 0])
        ];

        // 创建工作表
        ws = XLSX.utils.aoa_to_sheet(data);

        // 设置列宽
        ws['!cols'] = [
            { wch: 30 },  // 门店名称列
            { wch: 15 }   // 月度目标列
        ];

        fileName = `${state.selectedRegion}_门店目标模板.xlsx`;
    }

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '门店目标分配');

    // 下载文件
    XLSX.writeFile(wb, fileName);

    // 更新状态
    const statusElem = document.getElementById('storeUploadStatus');
    if (statusElem) {
        statusElem.textContent = '✅ 模板已下载';
        statusElem.style.color = '#28a745';
        setTimeout(() => {
            statusElem.textContent = '';
        }, 3000);
    }
}

// ============== 处理门店目标文件上传 ==============
function handleStoreAllocationFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusElem = document.getElementById('storeUploadStatus');
    if (statusElem) {
        statusElem.textContent = '⏳ 正在读取文件...';
        statusElem.style.color = '#666';
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // 读取第一个工作表
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // 转换为JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // 验证数据格式
            if (jsonData.length < 2) {
                throw new Error('文件格式错误：数据为空');
            }

            const header = jsonData[0];
            if (!header || header.length < 2) {
                throw new Error('文件格式错误：缺少必要列');
            }

            const region = regionsData[state.selectedRegion];

            if (storeAllocationData.allocationMode === 'preset') {
                // 预设模式：解析门店分车型目标
                parsePresetVehicleTargets(jsonData, header, region, statusElem);
            } else {
                // 自动模式：解析门店总目标
                parseAutoAllocations(jsonData, header, region, statusElem);
            }

        } catch (error) {
            console.error('文件解析错误:', error);
            if (statusElem) {
                statusElem.textContent = `❌ ${error.message}`;
                statusElem.style.color = '#dc3545';
            }
        }
    };

    reader.onerror = function() {
        if (statusElem) {
            statusElem.textContent = '❌ 文件读取失败';
            statusElem.style.color = '#dc3545';
        }
    };

    reader.readAsArrayBuffer(file);

    // 清空文件输入，允许重复上传同一文件
    event.target.value = '';
}

// 解析预设车型目标模式
function parsePresetVehicleTargets(jsonData, header, region, statusElem) {
    // 查找列索引
    let storeNameCol = -1;
    const vehicleCols = {};
    let totalCol = -1;

    header.forEach((col, index) => {
        const colName = String(col).trim();
        if (colName === '门店名称' || colName.includes('门店')) {
            storeNameCol = index;
        } else if (colName === '合计' || colName === '总计') {
            totalCol = index;
        } else {
            // 其他列视为车型列
            const vehicles = Object.keys(state.vehicleTargets);
            if (vehicles.includes(colName)) {
                vehicleCols[colName] = index;
            }
        }
    });

    if (storeNameCol === -1) {
        throw new Error('文件格式错误：找不到"门店名称"列');
    }

    if (Object.keys(vehicleCols).length === 0) {
        throw new Error('文件格式错误：找不到任何有效车型列');
    }

    // 解析数据
    const vehicles = Object.keys(state.vehicleTargets);
    let successCount = 0;
    let unmatchedStores = [];
    const presetTargets = {};

    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const storeName = String(row[storeNameCol] || '').trim();
        if (!storeName || storeName === '区域汇总' || storeName.includes('汇总')) continue;

        // 检查门店是否在当前区域
        if (region.stores.includes(storeName)) {
            presetTargets[storeName] = {};
            let storeTotal = 0;

            vehicles.forEach(vehicle => {
                const colIndex = vehicleCols[vehicle];
                if (colIndex !== undefined) {
                    const value = parseInt(row[colIndex]) || 0;
                    presetTargets[storeName][vehicle] = Math.max(0, value);
                    storeTotal += presetTargets[storeName][vehicle];
                } else {
                    presetTargets[storeName][vehicle] = 0;
                }
            });

            // 更新门店总目标
            state.storeAllocations[storeName] = storeTotal;
            successCount++;
        } else {
            unmatchedStores.push(storeName);
        }
    }

    // 保存预设目标
    storeAllocationData.presetVehicleTargets = presetTargets;

    // 更新显示
    if (successCount > 0) {
        renderStoreAllocationRows();
        updateStoreAllocationStats();

        // 校验各车型汇总是否匹配区域目标
        const validationResult = validatePresetTargets(presetTargets, vehicles);

        // 显示校验结果面板
        displayValidationPanel(validationResult, presetTargets, vehicles);

        if (statusElem) {
            if (validationResult.allPerfect) {
                statusElem.textContent = `✅ 成功导入 ${successCount} 个门店，所有车型汇总正确！`;
                statusElem.style.color = '#28a745';
            } else {
                const warnings = validationResult.warnings.slice(0, 3).join(', ');
                statusElem.textContent = `⚠️ 导入 ${successCount} 个门店，但部分车型汇总不匹配：${warnings}${validationResult.warnings.length > 3 ? '...' : ''}`;
                statusElem.style.color = '#ff8c00';
            }
        }

        if (unmatchedStores.length > 0) {
            console.warn('以下门店未在当前区域中找到:', unmatchedStores);
        }
    } else {
        throw new Error('未找到有效的门店数据');
    }
}

// 验证预设目标
function validatePresetTargets(presetTargets, vehicles) {
    const result = {
        allPerfect: true,
        warnings: [],
        details: [] // 详细的差异信息
    };

    vehicles.forEach(vehicle => {
        let actualTotal = 0;
        Object.values(presetTargets).forEach(storeTargets => {
            actualTotal += storeTargets[vehicle] || 0;
        });

        const expectedTotal = state.vehicleTargets[vehicle] || 0;
        const diff = actualTotal - expectedTotal;

        if (diff !== 0) {
            result.allPerfect = false;
            result.warnings.push(`${vehicle}差${diff > 0 ? '+' : ''}${diff}`);
            result.details.push({
                vehicle,
                expected: expectedTotal,
                actual: actualTotal,
                diff
            });
        }
    });

    return result;
}

// 显示校验结果面板
function displayValidationPanel(validationResult, presetTargets, vehicles) {
    const panel = document.getElementById('validationPanel');
    if (!panel) return;

    if (validationResult.allPerfect) {
        panel.style.display = 'none';
        return;
    }

    // 显示校验结果和智能调整按钮
    let html = `
        <div style="padding: 16px; background: #fff3e0; border: 2px solid #ff9800; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #e65100;">
                        ⚠️ 检测到车型汇总不匹配
                    </h4>
                    <p style="margin: 0; font-size: 12px; color: #666;">
                        以下车型的门店汇总与区域目标存在差异，建议使用智能平衡功能自动调整
                    </p>
                </div>
                <button onclick="smartBalancePresetTargets()"
                        style="padding: 10px 20px; background: #ff9800; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; white-space: nowrap;"
                        onmouseover="this.style.background='#f57c00'"
                        onmouseout="this.style.background='#ff9800'">
                    🔧 智能平衡
                </button>
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead style="background: #fafafa; position: sticky; top: 0;">
                        <tr>
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: 600;">车型</th>
                            <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: 600;">区域目标</th>
                            <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: 600;">当前汇总</th>
                            <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: 600;">差异</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    validationResult.details.forEach(detail => {
        const diffColor = detail.diff > 0 ? '#f57c00' : (detail.diff < 0 ? '#1976d2' : '#666');
        html += `
            <tr style="background: white;">
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: 600;">${detail.vehicle}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${detail.expected}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${detail.actual}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #ddd; color: ${diffColor}; font-weight: 600;">
                    ${detail.diff > 0 ? '+' : ''}${detail.diff}
                </td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 12px; padding: 10px; background: white; border-radius: 4px; font-size: 11px; color: #666;">
                <strong>💡 智能平衡原理：</strong>根据差异量，按各门店当前占比智能调整，确保汇总100%准确
            </div>
        </div>
    `;

    panel.innerHTML = html;
    panel.style.display = 'block';
}

// 智能平衡预设目标
window.smartBalancePresetTargets = function() {
    if (!confirm('确定要执行智能平衡吗？这将自动调整各门店的车型目标以匹配区域总目标。')) {
        return;
    }

    const vehicles = Object.keys(state.vehicleTargets);
    const region = regionsData[state.selectedRegion];
    const presetTargets = storeAllocationData.presetVehicleTargets;

    // 对每个车型进行调整
    vehicles.forEach(vehicle => {
        const regionTarget = state.vehicleTargets[vehicle] || 0;
        let currentTotal = 0;
        const storeValues = [];

        // 收集当前各门店的值
        region.stores.forEach(store => {
            const value = presetTargets[store]?.[vehicle] || 0;
            currentTotal += value;
            storeValues.push({ store, value });
        });

        if (currentTotal === 0) {
            // 如果当前总量为0，平均分配
            const avgValue = Math.floor(regionTarget / region.stores.length);
            const remainder = regionTarget % region.stores.length;

            region.stores.forEach((store, idx) => {
                if (!presetTargets[store]) presetTargets[store] = {};
                presetTargets[store][vehicle] = avgValue + (idx < remainder ? 1 : 0);
            });
        } else if (currentTotal !== regionTarget) {
            // 按当前占比重新分配（使用最大余数法）
            const exactValues = storeValues.map(({ store, value }) => ({
                store,
                exactValue: (value / currentTotal) * regionTarget
            }));

            const floorValues = exactValues.map(item => ({
                store: item.store,
                floor: Math.floor(item.exactValue),
                remainder: item.exactValue - Math.floor(item.exactValue)
            }));

            let distributed = floorValues.reduce((sum, item) => sum + item.floor, 0);
            const extra = regionTarget - distributed;

            floorValues.sort((a, b) => b.remainder - a.remainder);

            floorValues.forEach((item, idx) => {
                if (!presetTargets[item.store]) presetTargets[item.store] = {};
                presetTargets[item.store][vehicle] = item.floor + (idx < extra ? 1 : 0);
            });
        }
    });

    // 更新门店总目标
    region.stores.forEach(store => {
        let storeTotal = 0;
        vehicles.forEach(vehicle => {
            storeTotal += presetTargets[store]?.[vehicle] || 0;
        });
        state.storeAllocations[store] = storeTotal;
    });

    // 更新显示
    renderStoreAllocationRows();
    updateStoreAllocationStats();

    // 重新校验
    const validationResult = validatePresetTargets(presetTargets, vehicles);
    displayValidationPanel(validationResult, presetTargets, vehicles);

    // 显示成功消息
    const statusElem = document.getElementById('storeUploadStatus');
    if (statusElem) {
        statusElem.textContent = '✅ 智能平衡完成，所有车型汇总已匹配！';
        statusElem.style.color = '#28a745';
        setTimeout(() => {
            statusElem.textContent = '';
        }, 3000);
    }
};

// 验证预设目标（原有函数保持不变，但返回扩展的details）

// 解析自动分配模式
function parseAutoAllocations(jsonData, header, region, statusElem) {
    // 查找列索引
    let storeNameCol = -1;
    let targetCol = -1;

    header.forEach((col, index) => {
        const colName = String(col).trim();
        if (colName === '门店名称' || colName.includes('门店')) {
            storeNameCol = index;
        } else if (colName === '月度目标' || colName.includes('目标')) {
            targetCol = index;
        }
    });

    if (storeNameCol === -1 || targetCol === -1) {
        throw new Error('文件格式错误：找不到"门店名称"或"月度目标"列');
    }

    // 解析数据
    let successCount = 0;
    let unmatchedStores = [];

    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const storeName = String(row[storeNameCol] || '').trim();
        const targetValue = parseInt(row[targetCol]);

        if (!storeName) continue;

        // 检查门店是否在当前区域
        if (region.stores.includes(storeName)) {
            if (!isNaN(targetValue) && targetValue >= 0) {
                state.storeAllocations[storeName] = targetValue;
                successCount++;
            }
        } else {
            unmatchedStores.push(storeName);
        }
    }

    // 更新显示
    if (successCount > 0) {
        renderStoreAllocationRows();
        updateStoreAllocationStats();

        // 校验汇总是否等于区域总目标
        const regionTotal = storeAllocationData.regionTotal;
        const uploadedTotal = Object.values(state.storeAllocations).reduce((sum, val) => sum + val, 0);
        const diff = regionTotal - uploadedTotal;

        if (diff === 0) {
            if (statusElem) {
                statusElem.textContent = `✅ 成功导入 ${successCount} 个门店，汇总正确（${uploadedTotal} = ${regionTotal}）`;
                statusElem.style.color = '#28a745';
            }
        } else {
            if (statusElem) {
                statusElem.textContent = `⚠️ 导入 ${successCount} 个门店，但汇总不匹配！已分配：${uploadedTotal}，应为：${regionTotal}，差异：${diff}`;
                statusElem.style.color = '#dc3545';
            }
        }

        if (unmatchedStores.length > 0) {
            console.warn('以下门店未在当前区域中找到:', unmatchedStores);
        }
    } else {
        throw new Error('未找到有效的门店数据');
    }
}

// 将函数暴露到全局作用域
window.downloadStoreTemplate = downloadStoreTemplate;
window.handleStoreAllocationFileUpload = handleStoreAllocationFileUpload;

// ============== 区域车型汇总对比显示 ==============
function renderRegionVehicleSummary() {
    const summaryContent = document.getElementById('regionVehicleSummaryContent');

    if (!summaryContent || !state.storeData || Object.keys(state.storeData).length === 0) {
        return;
    }

    const vehicles = Object.keys(state.vehicleTargets);
    const region = regionsData[state.selectedRegion];

    // 计算区域各车型的实际汇总
    const regionVehicleTotals = {};
    vehicles.forEach(vehicle => {
        regionVehicleTotals[vehicle] = 0;
    });

    region.stores.forEach(store => {
        const storeData = state.storeData[store];
        if (storeData) {
            vehicles.forEach(vehicle => {
                const vehicleTotal = storeData.vehicles[vehicle].reduce((sum, val) => sum + val, 0);
                regionVehicleTotals[vehicle] += vehicleTotal;
            });
        }
    });

    // 计算区域各车型的目标
    const regionVehicleTargets = state.vehicleTargets;
    const regionTotalTarget = Object.values(regionVehicleTargets).reduce((sum, val) => sum + val, 0);
    const regionActualTotal = Object.values(regionVehicleTotals).reduce((sum, val) => sum + val, 0);

    // 构建HTML
    let html = `
        <div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <span style="color: #666; font-size: 13px;">区域：</span>
                <strong style="color: #333; font-size: 14px;">${state.selectedRegion}</strong>
                <span style="color: #999; font-size: 13px; margin-left: 12px;">包含 ${region.stores.length} 个门店</span>
            </div>
            <div style="display: flex; gap: 20px; align-items: center;">
                <div style="text-align: right;">
                    <div style="font-size: 11px; color: #999; margin-bottom: 2px;">总目标</div>
                    <div style="font-size: 18px; font-weight: 700; color: #333;">${regionTotalTarget.toLocaleString()}</div>
                </div>
                <div style="width: 1px; height: 30px; background: #ddd;"></div>
                <div style="text-align: right;">
                    <div style="font-size: 11px; color: #999; margin-bottom: 2px;">实际汇总</div>
                    <div style="font-size: 18px; font-weight: 700; color: ${regionActualTotal === regionTotalTarget ? '#2e7d32' : '#f57c00'};">
                        ${regionActualTotal.toLocaleString()}
                    </div>
                </div>
                <div style="width: 1px; height: 30px; background: #ddd;"></div>
                <div style="text-align: right;">
                    <div style="font-size: 11px; color: #999; margin-bottom: 2px;">总差异</div>
                    <div style="font-size: 18px; font-weight: 700; color: ${regionActualTotal - regionTotalTarget === 0 ? '#2e7d32' : '#d32f2f'};">
                        ${regionActualTotal - regionTotalTarget > 0 ? '+' : ''}${regionActualTotal - regionTotalTarget}
                    </div>
                </div>
            </div>
        </div>

        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead style="background: linear-gradient(to right, #f5f5f5, #e8e8e8);">
                    <tr>
                        <th style="padding: 12px 16px; text-align: left; border: 1px solid #e0e0e0; font-weight: 600; color: #333; min-width: 120px;">车型</th>
                        <th style="padding: 12px 16px; text-align: center; border: 1px solid #e0e0e0; font-weight: 600; color: #333; min-width: 100px;">区域目标</th>
                        <th style="padding: 12px 16px; text-align: center; border: 1px solid #e0e0e0; font-weight: 600; color: #333; min-width: 100px;">实际汇总</th>
                        <th style="padding: 12px 16px; text-align: center; border: 1px solid #e0e0e0; font-weight: 600; color: #333; min-width: 80px;">差异</th>
                        <th style="padding: 12px 16px; text-align: center; border: 1px solid #e0e0e0; font-weight: 600; color: #333; min-width: 80px;">偏差率</th>
                        <th style="padding: 12px 16px; text-align: center; border: 1px solid #e0e0e0; font-weight: 600; color: #333; min-width: 100px;">占比（实际）</th>
                        <th style="padding: 12px 16px; text-align: center; border: 1px solid #e0e0e0; font-weight: 600; color: #333; min-width: 60px;">状态</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // 为每个车型添加一行
    vehicles.forEach((vehicle, index) => {
        const target = regionVehicleTargets[vehicle];
        const actual = regionVehicleTotals[vehicle];
        const diff = actual - target;
        const diffPercent = target > 0 ? ((diff / target) * 100).toFixed(2) : '0.00';
        const actualPercent = regionActualTotal > 0 ? ((actual / regionActualTotal) * 100).toFixed(2) : '0.00';
        const targetPercent = regionTotalTarget > 0 ? ((target / regionTotalTarget) * 100).toFixed(2) : '0.00';

        // 判断状态
        const withinRange = Math.abs(diff) <= Math.max(1, target * 0.01);
        const statusIcon = withinRange ? '✅' : (Math.abs(diff) <= Math.max(1, target * 0.03) ? '⚠️' : '❌');
        const statusText = withinRange ? '优秀' : (Math.abs(diff) <= Math.max(1, target * 0.03) ? '良好' : '需检查');
        const statusColor = withinRange ? '#2e7d32' : (Math.abs(diff) <= Math.max(1, target * 0.03) ? '#f57c00' : '#d32f2f');

        const diffColor = diff > 0 ? '#f57c00' : (diff < 0 ? '#1976d2' : '#2e7d32');
        const diffSign = diff > 0 ? '+' : '';

        const rowBg = index % 2 === 0 ? 'white' : '#fafafa';

        html += `
            <tr style="background: ${rowBg}; transition: background 0.2s;" onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background='${rowBg}'">
                <td style="padding: 12px 16px; border: 1px solid #e0e0e0; font-weight: 600; color: #333;">
                    ${vehicle}
                </td>
                <td style="padding: 12px 16px; border: 1px solid #e0e0e0; text-align: center; color: #666;">
                    ${target.toLocaleString()}
                    <span style="font-size: 11px; color: #999; margin-left: 4px;">(${targetPercent}%)</span>
                </td>
                <td style="padding: 12px 16px; border: 1px solid #e0e0e0; text-align: center; font-weight: 600; color: #333;">
                    ${actual.toLocaleString()}
                </td>
                <td style="padding: 12px 16px; border: 1px solid #e0e0e0; text-align: center; font-weight: 600; color: ${diffColor};">
                    ${diffSign}${diff}
                </td>
                <td style="padding: 12px 16px; border: 1px solid #e0e0e0; text-align: center; font-weight: 600; color: ${diffColor};">
                    ${diffSign}${diffPercent}%
                </td>
                <td style="padding: 12px 16px; border: 1px solid #e0e0e0; text-align: center; color: #666;">
                    ${actualPercent}%
                </td>
                <td style="padding: 12px 16px; border: 1px solid #e0e0e0; text-align: center;">
                    <span style="display: inline-block; padding: 4px 8px; background: ${statusColor}22; color: ${statusColor}; border-radius: 12px; font-size: 11px; font-weight: 600;">
                        ${statusIcon} ${statusText}
                    </span>
                </td>
            </tr>
        `;
    });

    // 汇总行
    html += `
                </tbody>
                <tfoot style="background: linear-gradient(to right, #667eea, #764ba2); color: white; font-weight: 700;">
                    <tr>
                        <td style="padding: 14px 16px; border: 1px solid #5a67d8;">总计</td>
                        <td style="padding: 14px 16px; border: 1px solid #5a67d8; text-align: center; font-size: 15px;">
                            ${regionTotalTarget.toLocaleString()}
                        </td>
                        <td style="padding: 14px 16px; border: 1px solid #5a67d8; text-align: center; font-size: 15px;">
                            ${regionActualTotal.toLocaleString()}
                        </td>
                        <td style="padding: 14px 16px; border: 1px solid #5a67d8; text-align: center; font-size: 15px;">
                            ${regionActualTotal - regionTotalTarget > 0 ? '+' : ''}${regionActualTotal - regionTotalTarget}
                        </td>
                        <td style="padding: 14px 16px; border: 1px solid #5a67d8; text-align: center;" colspan="3">
                            ${regionActualTotal === regionTotalTarget ? '<span style="font-size: 14px;">✅ 汇总正确</span>' : '<span style="font-size: 14px;">⚠️ 请检查</span>'}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div style="margin-top: 12px; padding: 12px; background: #fff9e5; border-left: 4px solid #ffc107; border-radius: 4px; font-size: 12px; color: #666;">
            <strong>💡 说明：</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                <li>偏差率在 <strong>±1%以内</strong> 为优秀（由于整数舍入，微小偏差是正常的）</li>
                <li>偏差率在 <strong>±1%~±3%</strong> 为良好（可接受范围）</li>
                <li>偏差率 <strong>>±3%</strong> 需要检查（可能存在分配问题）</li>
                <li>此数据会在您手动调整门店分配后 <strong>实时更新</strong></li>
            </ul>
        </div>
    `;

    summaryContent.innerHTML = html;
}

// 将函数暴露到全局作用域
window.renderRegionVehicleSummary = renderRegionVehicleSummary;
