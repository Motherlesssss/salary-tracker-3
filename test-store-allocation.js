// ============== 门店分配测试脚本 ==============
// 此脚本用于测试修复后的generateStoreData()函数是否正确

/**
 * 测试门店数据分配的正确性
 * 在浏览器控制台中运行：testStoreAllocation()
 */
function testStoreAllocation() {
    console.log('========================================');
    console.log('🧪 开始测试门店数据分配');
    console.log('========================================');

    // 检查是否已生成门店数据
    if (!state.storeData || Object.keys(state.storeData).length === 0) {
        console.error('❌ 错误：尚未生成门店数据！请先完成以下步骤：');
        console.log('   1. 上传历史数据');
        console.log('   2. 生成每日比例');
        console.log('   3. 为所有车型设置月度目标');
        console.log('   4. 选择区域');
        console.log('   5. 分配门店目标并生成门店数据');
        return;
    }

    const vehicles = Object.keys(state.vehicleTargets);
    const region = regionsData[state.selectedRegion];
    let allTestsPassed = true;
    let totalErrors = 0;

    console.log(`\n📊 测试配置：`);
    console.log(`   区域：${state.selectedRegion}`);
    console.log(`   门店数量：${region.stores.length}`);
    console.log(`   车型数量：${vehicles.length}`);
    console.log(`   车型列表：${vehicles.join(', ')}`);

    // 遍历每个门店进行测试
    region.stores.forEach((store, storeIndex) => {
        const storeData = state.storeData[store];
        if (!storeData) {
            console.error(`❌ 门店 "${store}" 数据缺失`);
            allTestsPassed = false;
            totalErrors++;
            return;
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`🏪 测试门店 [${storeIndex + 1}/${region.stores.length}]: ${store}`);
        console.log(`${'='.repeat(60)}`);

        const monthlyTarget = storeData.monthlyTarget;
        const daysCount = storeData.dailyTotals.length;

        console.log(`   月度目标：${monthlyTarget}`);
        console.log(`   天数：${daysCount}`);

        // 测试1：验证每天各车型加起来是否等于该天的目标总量
        console.log(`\n✅ 测试1: 验证每天各车型加起来 = 该天的目标总量`);
        let test1Passed = true;
        let test1Errors = [];

        for (let day = 0; day < daysCount; day++) {
            let dayVehiclesSum = 0;
            vehicles.forEach(vehicle => {
                dayVehiclesSum += storeData.vehicles[vehicle][day] || 0;
            });

            const dayTarget = storeData.dailyTotals[day];
            const diff = dayTarget - dayVehiclesSum;

            if (diff !== 0) {
                test1Passed = false;
                test1Errors.push({
                    day: day + 1,
                    target: dayTarget,
                    actual: dayVehiclesSum,
                    diff: diff
                });
            }
        }

        if (test1Passed) {
            console.log(`   ✅ 通过！所有${daysCount}天的车型汇总都等于每日目标`);
        } else {
            console.error(`   ❌ 失败！发现${test1Errors.length}天的数据不匹配：`);
            test1Errors.slice(0, 5).forEach(err => {
                console.error(`      - 第${err.day}天: 目标=${err.target}, 实际=${err.actual}, 差异=${err.diff}`);
            });
            if (test1Errors.length > 5) {
                console.error(`      ... 还有 ${test1Errors.length - 5} 个错误未显示`);
            }
            allTestsPassed = false;
            totalErrors += test1Errors.length;
        }

        // 测试2：验证所有天的总量加起来是否等于门店月度总目标
        console.log(`\n✅ 测试2: 验证所有天的总量加起来 = 门店月度总目标`);
        const actualMonthTotal = storeData.dailyTotals.reduce((sum, val) => sum + val, 0);
        const monthDiff = monthlyTarget - actualMonthTotal;

        if (monthDiff === 0) {
            console.log(`   ✅ 通过！月度汇总 = 月度目标 (${actualMonthTotal})`);
        } else {
            console.error(`   ❌ 失败！月度汇总 (${actualMonthTotal}) ≠ 月度目标 (${monthlyTarget}), 差异: ${monthDiff}`);
            allTestsPassed = false;
            totalErrors++;
        }

        // 测试3：验证各车型的月度总量
        console.log(`\n✅ 测试3: 验证各车型的月度总量`);
        let test3Passed = true;
        const vehicleMonthTotals = {};

        vehicles.forEach(vehicle => {
            const vehicleTotal = storeData.vehicles[vehicle].reduce((sum, val) => sum + val, 0);
            vehicleMonthTotals[vehicle] = vehicleTotal;
        });

        const allVehiclesTotal = Object.values(vehicleMonthTotals).reduce((sum, val) => sum + val, 0);

        console.log(`   各车型月度总量：`);
        vehicles.forEach(vehicle => {
            const total = vehicleMonthTotals[vehicle];
            const percentage = ((total / allVehiclesTotal) * 100).toFixed(2);
            console.log(`      - ${vehicle}: ${total} (${percentage}%)`);
        });

        if (allVehiclesTotal === monthlyTarget) {
            console.log(`   ✅ 通过！各车型月度总和 = 门店月度目标 (${allVehiclesTotal})`);
        } else {
            console.error(`   ❌ 失败！各车型月度总和 (${allVehiclesTotal}) ≠ 门店月度目标 (${monthlyTarget}), 差异: ${monthlyTarget - allVehiclesTotal}`);
            allTestsPassed = false;
            test3Passed = false;
            totalErrors++;
        }

        // 测试4：验证每天各车型的值都是非负整数
        console.log(`\n✅ 测试4: 验证所有值都是非负整数`);
        let test4Passed = true;
        let test4Errors = [];

        vehicles.forEach(vehicle => {
            storeData.vehicles[vehicle].forEach((val, day) => {
                if (!Number.isInteger(val) || val < 0) {
                    test4Passed = false;
                    test4Errors.push({
                        vehicle,
                        day: day + 1,
                        value: val
                    });
                }
            });
        });

        if (test4Passed) {
            console.log(`   ✅ 通过！所有值都是非负整数`);
        } else {
            console.error(`   ❌ 失败！发现${test4Errors.length}个非法值：`);
            test4Errors.slice(0, 3).forEach(err => {
                console.error(`      - ${err.vehicle} 第${err.day}天: ${err.value}`);
            });
            if (test4Errors.length > 3) {
                console.error(`      ... 还有 ${test4Errors.length - 3} 个错误未显示`);
            }
            allTestsPassed = false;
            totalErrors += test4Errors.length;
        }
    });

    // ========== 区域级别测试：验证各车型的汇总 ==========
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌐 区域级别测试：验证各车型的汇总`);
    console.log(`${'='.repeat(60)}`);

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

    // 计算区域各车型的目标（从state.vehicleTargets获取）
    const regionVehicleTargets = state.vehicleTargets;
    const regionTotalTarget = Object.values(regionVehicleTargets).reduce((sum, val) => sum + val, 0);
    const regionActualTotal = Object.values(regionVehicleTotals).reduce((sum, val) => sum + val, 0);

    console.log(`\n📊 区域车型目标 vs 实际汇总：`);
    console.log(`   总目标：${regionTotalTarget.toLocaleString()}`);
    console.log(`   实际总和：${regionActualTotal.toLocaleString()}`);
    console.log(`   差异：${regionActualTotal - regionTotalTarget}`);

    let regionVehicleTestPassed = true;
    console.log(`\n   车型详情：`);

    vehicles.forEach(vehicle => {
        const target = regionVehicleTargets[vehicle];
        const actual = regionVehicleTotals[vehicle];
        const diff = actual - target;
        const diffPercent = target > 0 ? ((diff / target) * 100).toFixed(2) : 0;

        console.log(`   ${vehicle}:`);
        console.log(`      - 目标：${target.toLocaleString()}`);
        console.log(`      - 实际：${actual.toLocaleString()}`);
        console.log(`      - 差异：${diff} (${diffPercent}%)`);

        // 允许±1%的误差（因为整数舍入不可避免）
        if (Math.abs(diff) > Math.max(1, target * 0.01)) {
            console.error(`      ❌ 偏差过大！超过±1%`);
            regionVehicleTestPassed = false;
            allTestsPassed = false;
            totalErrors++;
        } else {
            console.log(`      ✅ 偏差在合理范围内`);
        }
    });

    // 汇总测试结果
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 最终测试结果`);
    console.log(`${'='.repeat(60)}`);

    if (allTestsPassed) {
        console.log(`\n🎉 恭喜！所有测试全部通过！`);
        console.log(`✅ 门店数据分配完全正确`);
        console.log(`✅ 每天各车型汇总 = 每日目标`);
        console.log(`✅ 月度汇总 = 月度目标`);
        console.log(`✅ 所有值都是非负整数`);
        console.log(`✅ 区域车型汇总接近设定目标（±1%以内）`);
    } else {
        console.error(`\n❌ 测试失败！发现 ${totalErrors} 个错误`);
        console.error(`请检查代码逻辑或联系开发人员`);
    }

    console.log(`\n========================================`);
    console.log(`🏁 测试完成`);
    console.log(`========================================\n`);

    return allTestsPassed;
}

/**
 * 详细查看某个门店的数据
 * @param {string} storeName - 门店名称
 */
function inspectStore(storeName) {
    if (!state.storeData || !state.storeData[storeName]) {
        console.error(`❌ 门店 "${storeName}" 的数据不存在`);
        return;
    }

    const storeData = state.storeData[storeName];
    const vehicles = Object.keys(storeData.vehicles);
    const daysCount = storeData.dailyTotals.length;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 门店详细数据: ${storeName}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`月度目标: ${storeData.monthlyTarget}`);
    console.log(`天数: ${daysCount}`);
    console.log(`车型: ${vehicles.join(', ')}`);

    console.log(`\n每日数据明细：`);
    console.log(`${'='.repeat(60)}`);

    // 打印表头
    let header = '日期'.padEnd(8);
    vehicles.forEach(vehicle => {
        header += vehicle.padEnd(12);
    });
    header += '每日总计'.padEnd(12);
    console.log(header);
    console.log('-'.repeat(60));

    // 打印每天的数据
    for (let day = 0; day < daysCount; day++) {
        let row = `${day + 1}/${state.targetMonth}`.padEnd(8);
        let daySum = 0;

        vehicles.forEach(vehicle => {
            const val = storeData.vehicles[vehicle][day];
            daySum += val;
            row += String(val).padEnd(12);
        });

        row += String(storeData.dailyTotals[day]).padEnd(12);

        // 验证汇总
        if (daySum !== storeData.dailyTotals[day]) {
            row += ' ❌ 不匹配!';
        }

        console.log(row);
    }

    // 打印汇总行
    console.log('-'.repeat(60));
    let totalRow = '汇总'.padEnd(8);
    let grandTotal = 0;

    vehicles.forEach(vehicle => {
        const vehicleTotal = storeData.vehicles[vehicle].reduce((sum, val) => sum + val, 0);
        grandTotal += vehicleTotal;
        totalRow += String(vehicleTotal).padEnd(12);
    });

    const dailyTotalsSum = storeData.dailyTotals.reduce((sum, val) => sum + val, 0);
    totalRow += String(dailyTotalsSum).padEnd(12);

    console.log(totalRow);

    // 验证汇总
    console.log(`\n验证结果：`);
    console.log(`  各车型汇总: ${grandTotal}`);
    console.log(`  每日总计汇总: ${dailyTotalsSum}`);
    console.log(`  月度目标: ${storeData.monthlyTarget}`);

    if (grandTotal === storeData.monthlyTarget && dailyTotalsSum === storeData.monthlyTarget) {
        console.log(`  ✅ 数据完全正确！`);
    } else {
        console.log(`  ❌ 数据不匹配！`);
    }

    console.log(`${'='.repeat(60)}\n`);
}

/**
 * 快速查看区域车型汇总对比
 */
function checkRegionVehicleTotals() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌐 区域车型汇总对比`);
    console.log(`${'='.repeat(60)}`);

    if (!state.storeData || Object.keys(state.storeData).length === 0) {
        console.error('❌ 尚未生成门店数据！');
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

    console.log(`\n区域：${state.selectedRegion}`);
    console.log(`门店数量：${region.stores.length}`);
    console.log(`总目标：${regionTotalTarget.toLocaleString()}`);
    console.log(`实际总和：${regionActualTotal.toLocaleString()}`);
    console.log(`总差异：${regionActualTotal - regionTotalTarget}\n`);

    // 创建对比表格
    console.log(`${'车型'.padEnd(15)} ${'目标'.padEnd(12)} ${'实际'.padEnd(12)} ${'差异'.padEnd(12)} ${'偏差率'.padEnd(10)}`);
    console.log(`${'-'.repeat(60)}`);

    let allWithinRange = true;

    vehicles.forEach(vehicle => {
        const target = regionVehicleTargets[vehicle];
        const actual = regionVehicleTotals[vehicle];
        const diff = actual - target;
        const diffPercent = target > 0 ? ((diff / target) * 100).toFixed(2) : 0;

        const vehicleStr = vehicle.padEnd(15);
        const targetStr = target.toLocaleString().padEnd(12);
        const actualStr = actual.toLocaleString().padEnd(12);
        const diffStr = diff.toString().padEnd(12);
        const percentStr = `${diffPercent}%`.padEnd(10);

        // 检查是否在±1%范围内
        const withinRange = Math.abs(diff) <= Math.max(1, target * 0.01);
        const status = withinRange ? '✅' : '❌';

        console.log(`${vehicleStr} ${targetStr} ${actualStr} ${diffStr} ${percentStr} ${status}`);

        if (!withinRange) {
            allWithinRange = false;
        }
    });

    console.log(`${'-'.repeat(60)}`);
    const totalStr = '总计'.padEnd(15);
    const totalTargetStr = regionTotalTarget.toLocaleString().padEnd(12);
    const totalActualStr = regionActualTotal.toLocaleString().padEnd(12);
    const totalDiffStr = (regionActualTotal - regionTotalTarget).toString().padEnd(12);
    console.log(`${totalStr} ${totalTargetStr} ${totalActualStr} ${totalDiffStr}`);

    console.log(`\n结果评估：`);
    if (allWithinRange) {
        console.log(`✅ 所有车型的偏差都在±1%范围内，分配结果优秀！`);
    } else {
        console.log(`⚠️ 部分车型偏差超过±1%，但这可能是由于整数舍入导致的正常现象`);
        console.log(`   如果偏差较大，建议检查门店分配逻辑`);
    }

    console.log(`\n💡 说明：由于整数舍入，±1%以内的偏差是正常且可接受的`);
    console.log(`${'='.repeat(60)}\n`);

    return allWithinRange;
}

// 将测试函数暴露到全局作用域
window.testStoreAllocation = testStoreAllocation;
window.inspectStore = inspectStore;
window.checkRegionVehicleTotals = checkRegionVehicleTotals;

console.log('✅ 测试脚本已加载');
console.log('💡 使用方法：');
console.log('   1. testStoreAllocation() - 完整测试所有门店的数据分配');
console.log('   2. checkRegionVehicleTotals() - 快速查看区域车型汇总对比');
console.log('   3. inspectStore("门店名称") - 查看某个门店的详细数据');
console.log('   例如: inspectStore("北京祥云小镇")');
