# 核心代码改动说明

## 总体策略
在现有代码基础上，**最小改动**实现新功能，保持向后兼容。

## app.js 关键改动

### 1. 扩展state对象（第1-21行）
```javascript
const state = {
    // ... 现有字段保持不变

    // ★ 新增：工作流状态
    workflow: {
        regionSelected: false,
        dataUploaded: false,
        vehiclesConfigured: false,
        monthSelected: false,
        ratiosGenerated: false
    },

    // ★ 新增：车型配置
    vehicleConfig: {},           // { vehicleCode: { type, enabled, template, ... } }
    historicalVehicles: [],      // 历史车型代码列表
    newVehicles: [],             // 新增车型代码列表
    clearStockVehicles: [],      // 去库存车型代码列表
    enabledVehicleCount: 0       // 启用的车型数量
};
```

### 2. 新增：统一的状态检查函数（在aggregateData之后）
```javascript
/**
 * 检查并更新所有按钮和步骤的状态
 */
function checkWorkflowState() {
    // 更新生成按钮状态
    const generateBtn = document.getElementById('generateBtn');
    const canGenerate = state.workflow.vehiclesConfigured && state.workflow.monthSelected;
    generateBtn.disabled = !canGenerate;
    generateBtn.title = canGenerate ? '' : '请完成：车型配置和月份选择';

    // 更新导出按钮状态
    const exportBtn = document.getElementById('exportBtn');
    const exportHorizontalBtn = document.getElementById('exportHorizontalBtn');
    if (exportBtn) exportBtn.disabled = !state.workflow.ratiosGenerated;
    if (exportHorizontalBtn) exportHorizontalBtn.disabled = !state.workflow.ratiosGenerated;

    // 更新步骤提示
    updateStepHints();
}

/**
 * 更新步骤提示信息
 */
function updateStepHints() {
    // 根据workflow状态显示对应提示
    if (!state.workflow.regionSelected) {
        showStepHint(1, 'info', '请选择区域');
    } else if (!state.workflow.dataUploaded) {
        showStepHint(2, 'success', '✓ 区域已选择，请上传历史数据');
    } else if (!state.workflow.vehiclesConfigured) {
        showStepHint(2.5, 'success', `✓ 数据已上传，检测到${state.enabledVehicleCount}个车型，请确认配置`);
    } else if (!state.workflow.monthSelected) {
        showStepHint(3, 'success', '✓ 车型已确认，请选择预测月份');
    } else if (!state.workflow.ratiosGenerated) {
        showStepHint(5, 'success', '✓ 准备就绪，点击生成按钮');
    } else {
        showStepHint(6, 'success', '✓ 比例已生成，可查看和调整');
    }
}

function showStepHint(step, type, message) {
    // 在对应步骤卡片显示提示信息
    const stepCard = document.querySelector(`[data-step="${step}"]`);
    if (stepCard) {
        let hintDiv = stepCard.querySelector('.step-hint');
        if (!hintDiv) {
            hintDiv = document.createElement('div');
            hintDiv.className = 'step-hint';
            stepCard.querySelector('.card-body').prepend(hintDiv);
        }
        hintDiv.className = `step-hint ${type}`;
        hintDiv.innerHTML = message;
    }
}
```

### 3. 修改handleRegionChange（约900行）
```javascript
function handleRegionChange() {
    const select = document.getElementById('regionSelect');
    const regionName = select.value;

    if (regionName && regionsData[regionName]) {
        state.selectedRegion = regionName;
        state.workflow.regionSelected = true;  // ★ 新增

        const feedback = document.getElementById('regionFeedback');
        feedback.textContent = `已选择：${regionName}`;
        feedback.style.color = '#52c41a';

        checkWorkflowState();  // ★ 新增：更新状态
    }
}
```

### 4. 修改handleFileUpload的onload回调（约990行）
```javascript
reader.onload = function(e) {
    try {
        // ... 现有解析逻辑保持不变

        state.uploadedData = cleanedData;
        state.workflow.dataUploaded = true;  // ★ 新增

        displayFileInfo(file.name, cleanedData.length);
        aggregateData();

        // ★ 新增：初始化车型配置并显示车型管理
        initializeVehicleConfig();
        showVehicleManagement();

        checkWorkflowState();  // ★ 新增

    } catch (error) {
        alert('文件解析失败：' + error.message);
    }
};
```

### 5. 新增：车型管理模块（在aggregateData之后插入，约1060行）
```javascript
// ============== 车型管理模块 ==============

function initializeVehicleConfig() {
    if (!state.aggregatedData) return;

    const vehicles = getUniqueVehicles();
    console.log('初始化车型配置，检测到车型:', vehicles);

    state.vehicleConfig = {};
    state.historicalVehicles = [];
    state.newVehicles = [];
    state.clearStockVehicles = [];
    state.enabledVehicleCount = 0;

    vehicles.forEach(vehicleCode => {
        state.vehicleConfig[vehicleCode] = {
            code: vehicleCode,
            name: vehicleCode,
            type: 'historical',
            enabled: true,
            source: 'historical'
        };
        state.historicalVehicles.push(vehicleCode);
        state.enabledVehicleCount++;
    });
}

function showVehicleManagement() {
    const section = document.getElementById('vehicleManagementSection');
    if (!section) return;

    section.classList.remove('hidden');
    renderVehicleManagementUI();

    // 滚动到车型管理区域
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderVehicleManagementUI() {
    // 渲染历史车型列表
    const tbody = document.getElementById('vehicleManagementList');
    let html = '';

    Object.values(state.vehicleConfig).forEach(config => {
        const statusBadge = config.enabled ?
            '<span style="color: #52c41a;">✅ 启用</span>' :
            '<span style="color: #8c8c8c;">⚪ 停用</span>';

        const typeLabel = config.type === 'historical' ? '历史数据' :
                         config.type === 'new' ? `模板：${config.template}` :
                         config.type === 'clearStock' ? `去库存（${config.clearStartDate}~${config.clearEndDate}）` : '';

        const toggleBtn = config.enabled ?
            `<button class="btn-small btn-secondary" onclick="toggleVehicleEnabled('${config.code}', false)">停用</button>` :
            `<button class="btn-small btn-primary" onclick="toggleVehicleEnabled('${config.code}', true)">启用</button>`;

        const actionBtns = config.type === 'historical' && config.enabled ?
            `<button class="btn-small btn-secondary" onclick="markAsClearStock('${config.code}')">标记去库存</button>` : '';

        const deleteBtn = config.type === 'new' ?
            `<button class="btn-small btn-danger" onclick="deleteVehicle('${config.code}')">删除</button>` : '';

        html += `
            <tr style="background: ${config.type === 'new' ? '#e6f7ff' : 'white'};">
                <td style="padding: 12px;">${config.code} ${config.type === 'new' ? '🆕' : config.type === 'clearStock' ? '📉' : ''}</td>
                <td style="padding: 12px;">${config.name}</td>
                <td style="padding: 12px; text-align: center;">${typeLabel}</td>
                <td style="padding: 12px; text-align: center;">${statusBadge}</td>
                <td style="padding: 12px; text-align: center;">
                    ${toggleBtn}
                    ${actionBtns}
                    ${deleteBtn}
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999;">暂无车型</td></tr>';

    // 更新统计
    const hintDiv = document.getElementById('vehicleManagementHint');
    hintDiv.textContent = `当前启用 ${state.enabledVehicleCount} 个车型`;

    // 更新确认按钮状态
    const confirmBtn = document.getElementById('confirmVehicleConfigBtn');
    confirmBtn.disabled = state.enabledVehicleCount === 0;
    confirmBtn.title = state.enabledVehicleCount === 0 ? '请至少启用一个车型' : '';
}

function toggleVehicleEnabled(vehicleCode, enabled) {
    state.vehicleConfig[vehicleCode].enabled = enabled;
    state.enabledVehicleCount += enabled ? 1 : -1;
    renderVehicleManagementUI();
}

function addNewVehicle() {
    // 创建模态框
    const modal = createModal('添加新车型', `
        <div style="padding: 20px;">
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">车型代码 *</label>
                <input type="text" id="newVehicleCode" placeholder="如 W03" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">车型名称</label>
                <input type="text" id="newVehicleName" placeholder="如 理想L6" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">节奏模板 *</label>
                <label style="display: block; margin-bottom: 8px; padding: 10px; border: 2px solid #1890ff; border-radius: 6px; cursor: pointer;">
                    <input type="radio" name="template" value="average" checked>
                    <span style="font-weight: 600;">平均模板</span> - 适用于大部分车型
                </label>
                <label style="display: block; margin-bottom: 8px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                    <input type="radio" name="template" value="i8">
                    <span style="font-weight: 600;">i8模板</span> - 热度持久型
                </label>
                <label style="display: block; margin-bottom: 8px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                    <input type="radio" name="template" value="mega">
                    <span style="font-weight: 600;">MEGA模板</span> - 快速回落型
                </label>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">发布日期 *</label>
                <input type="date" id="newVehicleLaunchDate" value="${state.targetYear}-${String(state.targetMonth).padStart(2, '0')}-01" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
        </div>

        <div style="padding: 16px; border-top: 1px solid #f0f0f0; text-align: right;">
            <button class="btn btn-secondary" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" onclick="submitNewVehicle()">确认添加</button>
        </div>
    `);

    document.body.appendChild(modal);
}

function submitNewVehicle() {
    const code = document.getElementById('newVehicleCode').value.trim();
    const name = document.getElementById('newVehicleName').value.trim() || code;
    const template = document.querySelector('input[name="template"]:checked').value;
    const launchDate = document.getElementById('newVehicleLaunchDate').value;

    if (!code) {
        alert('请输入车型代码');
        return;
    }

    if (state.vehicleConfig[code]) {
        alert('车型代码已存在');
        return;
    }

    if (!launchDate) {
        alert('请选择发布日期');
        return;
    }

    state.vehicleConfig[code] = {
        code,
        name,
        type: 'new',
        enabled: true,
        source: 'template',
        template,
        launchDate
    };

    state.newVehicles.push(code);
    state.enabledVehicleCount++;

    closeModal();
    renderVehicleManagementUI();

    alert(`新车型 ${code} 添加成功！`);
}

function markAsClearStock(vehicleCode) {
    // 类似addNewVehicle，创建去库存配置模态框
    // ... 实现细节省略
}

function deleteVehicle(vehicleCode) {
    if (!confirm(`确定删除车型 ${vehicleCode} 吗？`)) return;

    delete state.vehicleConfig[vehicleCode];
    state.newVehicles = state.newVehicles.filter(v => v !== vehicleCode);
    if (state.vehicleConfig[vehicleCode]?.enabled) {
        state.enabledVehicleCount--;
    }

    renderVehicleManagementUI();
}

function confirmVehicleConfig() {
    if (state.enabledVehicleCount === 0) {
        alert('请至少启用一个车型');
        return;
    }

    state.workflow.vehiclesConfigured = true;

    // 隐藏车型管理
    document.getElementById('vehicleManagementSection').classList.add('hidden');

    // 解锁步骤3
    document.getElementById('monthSelect').disabled = false;
    document.getElementById('yearSelect').disabled = false;

    checkWorkflowState();

    // 滚动到步骤3
    document.querySelector('[data-step="3"]').scrollIntoView({ behavior: 'smooth' });
}

// 辅助函数：创建模态框
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.id = 'vehicleModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
        z-index: 10000;
    `;
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                <h3 style="margin: 0; font-size: 18px;">${title}</h3>
            </div>
            ${content}
        </div>
    `;
    return modal;
}

function closeModal() {
    const modal = document.getElementById('vehicleModal');
    if (modal) modal.remove();
}
```

### 6. 修改generateDailyRatios函数（约1510行）
```javascript
function generateDailyRatios() {
    const loading = document.getElementById('loading');
    loading.classList.remove('hidden');

    setTimeout(() => {
        try {
            const results = {};
            const enabledVehicles = Object.keys(state.vehicleConfig).filter(code =>
                state.vehicleConfig[code].enabled
            );

            if (enabledVehicles.length === 0) {
                alert('没有启用的车型');
                loading.classList.add('hidden');
                return;
            }

            console.log('开始生成比例，启用车型:', enabledVehicles);

            enabledVehicles.forEach(vehicleCode => {
                const config = state.vehicleConfig[vehicleCode];

                if (config.type === 'historical') {
                    // 历史车型：使用现有算法
                    results[vehicleCode] = calculateVehicleDailyRatios(vehicleCode);

                } else if (config.type === 'new') {
                    // 新增车型：使用模板
                    results[vehicleCode] = generateFromTemplate(config);

                } else if (config.type === 'clearStock') {
                    // 去库存：历史 × 衰减
                    const baseRatios = calculateVehicleDailyRatios(vehicleCode);
                    const decayWeights = generateClearStockWeights(
                        config.clearStartDate,
                        config.clearEndDate,
                        state.targetYear,
                        state.targetMonth
                    );
                    results[vehicleCode] = applyClearStockDecay(baseRatios, decayWeights);
                }
            });

            state.results = results;
            state.workflow.ratiosGenerated = true;

            displayResults();
            checkWorkflowState();
            loading.classList.add('hidden');

        } catch (error) {
            console.error('生成失败:', error);
            alert('生成失败：' + error.message);
            loading.classList.add('hidden');
        }
    }, 500);
}

function generateFromTemplate(config) {
    const dailyWeights = applyVehicleTemplate(
        config.template,
        config.launchDate,
        state.targetYear,
        state.targetMonth
    );

    if (!dailyWeights) {
        console.warn('模板应用失败，使用默认比例');
        return generateDefaultRatios();
    }

    const totalWeight = dailyWeights.reduce((sum, w) => sum + w, 0);
    const daysInMonth = new Date(state.targetYear, state.targetMonth, 0).getDate();
    const ratios = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${state.targetYear}-${String(state.targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(state.targetYear, state.targetMonth - 1, day).getDay();
        const dayOfWeekStr = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayOfWeek];

        const weight = dailyWeights[day - 1] || 1.0;
        const ratio = (weight / totalWeight) * 100;

        ratios.push({
            date: dateStr,
            dayOfWeek: dayOfWeekStr,
            ratio: ratio
        });
    }

    return ratios;
}

function applyClearStockDecay(baseRatios, decayWeights) {
    return baseRatios.map((dayData, index) => ({
        ...dayData,
        ratio: dayData.ratio * decayWeights[index]
    }));
}
```

### 7. 修改renderVehicleTabs函数（约2194行）
```javascript
function renderVehicleTabs(vehicles) {
    const vehicleTabs = document.getElementById('vehicleTabs');
    const tabs = [];

    // 1. 历史车型汇总
    const historicalVehicles = state.historicalVehicles.filter(code =>
        state.vehicleConfig[code].enabled
    );
    if (historicalVehicles.length > 0) {
        tabs.push(`
            <div class="vehicle-tab ${state.currentVehicle === '__HISTORICAL_SUMMARY__' ? 'active' : ''}"
                 data-vehicle="__HISTORICAL_SUMMARY__"
                 onclick="switchVehicle('__HISTORICAL_SUMMARY__')">
                📊 历史车型汇总
            </div>
        `);
    }

    // 2. 各历史车型
    historicalVehicles.forEach(vehicleCode => {
        const config = state.vehicleConfig[vehicleCode];
        const badge = config.type === 'clearStock' ? ' 📉' : '';

        tabs.push(`
            <div class="vehicle-tab ${state.currentVehicle === vehicleCode ? 'active' : ''}"
                 data-vehicle="${vehicleCode}"
                 onclick="switchVehicle('${vehicleCode}')">
                ${vehicleCode}${badge}
            </div>
        `);
    });

    // 3. 新增车型
    state.newVehicles.filter(code => state.vehicleConfig[code].enabled).forEach(vehicleCode => {
        tabs.push(`
            <div class="vehicle-tab ${state.currentVehicle === vehicleCode ? 'active' : ''}"
                 data-vehicle="${vehicleCode}"
                 onclick="switchVehicle('${vehicleCode}')"
                 style="background: #e6f7ff; border-color: #91d5ff;">
                ${vehicleCode} 🆕
            </div>
        `);
    });

    // 4. 总览
    tabs.push(`
        <div class="vehicle-tab ${state.currentVehicle === '__TOTAL_SUMMARY__' ? 'active' : ''}"
             data-vehicle="__TOTAL_SUMMARY__"
             onclick="switchVehicle('__TOTAL_SUMMARY__')"
             style="background: #f0f0f0; border-color: #d9d9d9;">
            📈 总览
        </div>
    `);

    vehicleTabs.innerHTML = tabs.join('');
}
```

## index.html 关键改动

### 1. 引入模板库（在</body>前）
```html
<script src="vehicle-templates.js"></script>
<script src="app.js"></script>
```

### 2. 添加车型管理section（在步骤2和步骤3之间）
```html
<!-- 步骤2.5: 车型管理 -->
<section class="card hidden" id="vehicleManagementSection" data-step="2.5">
    <div class="card-header">
        <span class="step-number">2.5</span>
        <h2>车型管理</h2>
    </div>
    <div class="card-body">
        <div class="step-hint"></div>

        <div style="margin: 20px 0; padding: 16px; background: #f0f7ff; border-left: 4px solid #1890ff; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div id="vehicleManagementHint" style="color: #1890ff; font-weight: 500;">
                    正在加载...
                </div>
                <button type="button" class="btn btn-primary btn-sm" onclick="addNewVehicle()">
                    ➕ 添加新车型
                </button>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0;">
            <thead style="background: #f5f5f5;">
                <tr>
                    <th style="padding: 12px;">车型代码</th>
                    <th style="padding: 12px;">车型名称</th>
                    <th style="padding: 12px; text-align: center;">数据来源</th>
                    <th style="padding: 12px; text-align: center;">状态</th>
                    <th style="padding: 12px; text-align: center;">操作</th>
                </tr>
            </thead>
            <tbody id="vehicleManagementList">
                <tr><td colspan="5" style="text-align:center;padding:20px;color:#999;">正在加载...</td></tr>
            </tbody>
        </table>

        <div style="margin-top: 24px; text-align: center;">
            <button id="confirmVehicleConfigBtn" type="button" class="btn btn-primary btn-lg" onclick="confirmVehicleConfig()" disabled>
                ✓ 确认车型配置，继续下一步
            </button>
        </div>
    </div>
</section>
```

### 3. 给现有步骤添加data-step属性
```html
<section class="card" data-step="1">
<section class="card" data-step="2">
<section class="card" data-step="3">
<section class="card" data-step="4">
<section class="card" data-step="5">
<section class="card hidden" id="resultsSection" data-step="6">
```

## demo-chart.js 关键改动

### 修改switchVehicle函数，支持新的视图类型
```javascript
window.switchVehicle = function(vehicle) {
    // ... 防并发逻辑保持不变

    if (vehicle === '__HISTORICAL_SUMMARY__') {
        // 历史车型汇总：可拖拽
        showHistoricalSummaryView();
        return;
    }

    if (vehicle === '__TOTAL_SUMMARY__') {
        // 总览：只读
        showTotalSummaryView();
        return;
    }

    // 普通车型
    originalSwitchVehicle.call(this, vehicle);
};

function showHistoricalSummaryView() {
    // 准备历史车型汇总数据
    // 显示可拖拽图表
    // ...
}

function showTotalSummaryView() {
    // 准备所有车型总和数据
    // 显示只读图表
    // ...
}
```

## style.css 新增样式

```css
/* 步骤提示 */
.step-hint {
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 8px;
    font-size: 14px;
}

.step-hint.info {
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    color: #0050b3;
}

.step-hint.success {
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    color: #389e0d;
}

/* 车型管理按钮 */
.btn-sm {
    padding: 6px 12px;
    font-size: 13px;
}

.btn-small {
    padding: 4px 10px;
    font-size: 12px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    margin: 0 4px;
}

.btn-small.btn-primary {
    background: #1890ff;
    color: white;
}

.btn-small.btn-secondary {
    background: #f0f0f0;
    color: #595959;
}

.btn-small.btn-danger {
    background: #ff4d4f;
    color: white;
}
```

## 关键检查清单

- [x] workflow状态对象已添加
- [x] checkWorkflowState函数统一控制按钮
- [x] 数据上传后自动显示车型管理
- [x] 车型管理UI完整（列表、添加、编辑、停用）
- [x] 生成逻辑分类处理（历史/模板/衰减）
- [x] 标签页结构正确（汇总/单车型/总览）
- [x] 按钮禁用状态和tooltip
- [x] 步骤提示信息
- [x] 模态框交互

## 测试流程

1. 选择区域 → 检查步骤2是否解锁
2. 上传数据 → 检查是否自动显示车型管理
3. 添加新车型 → 检查列表更新
4. 确认配置 → 检查步骤3是否解锁
5. 选择月份 → 检查生成按钮是否启用
6. 生成比例 → 检查标签页是否正确
7. 切换标签 → 检查汇总/总览视图
8. 导出Excel → 检查是否包含所有启用车型
