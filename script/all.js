// ==================== 配置和状态定义 ====================
// 配置常量
const CONFIG = {
    GRID_SIZE: 10,
    INITIAL_DIMENSION: '0×0',
    // 状态定义
    STATES: {
        SELECT_DIMENSION: 'select_dimension',
        INPUT_ELEMENTS: 'input_elements',
        ELEMENTARY_TRANSFORMATION: 'elementary_transformation'  // 新增初等变换状态
    }
};

// 状态管理
const state = {
    currentHoverCell: null,
    lastSelectedDimension: CONFIG.INITIAL_DIMENSION,
    gridCells: [], // 缓存网格元素引用
    gridInputs: [], // 缓存输入框元素引用
    currentState: CONFIG.STATES.SELECT_DIMENSION, // 当前状态
    matrixData: null, // 存储矩阵数据，预期格式{rows，cols，elements}
    previousStates: [] // 状态历史，用于撤销
};

// DOM元素引用
const elements = {
    windowDiv: document.getElementById('window'),
    coordinatesDiv: document.getElementById('coordinates'),
    undoButton: document.getElementById('undoButton'),
    nextButton: document.getElementById('nextButton'),
    inputMatrixDiv: document.getElementById('InputMatrix'),
    buttonInputMatrix: document.getElementById('ButtonInputMartix'),
    tipDiv: document.getElementById('tip')
};

// ==================== 初始化函数 ====================
/**
 * 初始化应用
 */
function init() {
    createGrid();
    setupEventListeners();
    updateUIForCurrentState();
}
// 初始化应用
document.addEventListener('DOMContentLoaded', init);
// ==================== 状态机函数 ====================
/**
 * 更新UI以反映当前状态
 */
function updateUIForCurrentState() {
    switch (state.currentState) {
        case CONFIG.STATES.SELECT_DIMENSION:
            console.log('to select dimension');
            elements.tipDiv.textContent = '点击网格选择矩阵大小';
            elements.nextButton.textContent = '下一步';
            elements.undoButton.disabled = true;
            elements.undoButton.style.opacity = '0.6';
            enableGridInteraction();
            break;

        case CONFIG.STATES.INPUT_ELEMENTS:
            console.log('to input elements');
            console.log(`矩阵维度: ${state.lastSelectedDimension}`);

            elements.tipDiv.textContent = '请在输入框中输入矩阵元素（非‘0’），点击下一步后，空白处将用‘0’填充';
            elements.nextButton.textContent = '下一步';
            elements.undoButton.disabled = false;
            elements.undoButton.style.opacity = '1';
            enableInputInteraction();
            break;



        case CONFIG.STATES.ELEMENTARY_TRANSFORMATION:  // 新增初等变换状态
            console.log('to elementary transformation');
            console.table(`矩阵数据: ${JSON.stringify(state.matrixData.elements)}`);
            elements.tipDiv.textContent = '可以进行初等变换操作';
            elements.nextButton.textContent = '完成';
            elements.nextButton.disabled = true;
            elements.nextButton.style.opacity = '0.6';
            elements.undoButton.disabled = false;
            elements.undoButton.style.opacity = '1';
            showElementaryTransformationUI();
            break;
    }
}

/**
 * 处理矩阵维度选择
 */
function handleDimensionSelection() {
    // 获取所有高亮的单元格
    const highlightedCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell.highlighted'));
    if (highlightedCells.length === 0) {
        // 替换alert为popup弹窗
        if (typeof showPopup === 'function') {
            showPopup('请先选择矩阵维度（点击并拖动网格）', 'warning');
        } else {
            alert('请先选择矩阵维度（点击并拖动网格）');
        }
        state.previousStates.pop(); // 移除无效的状态保存
        return;
    }
    // 计算矩阵的实际维度
    const matrixDimensions = calculateMatrixDimensions(highlightedCells);
    // 删除非高亮的网格
    removeNonHighlightedCells();
    // 将高亮单元格转换为输入框
    convertHighlightedCellsToInputs(highlightedCells);
    // 调整窗口大小以适应新的矩阵
    resizeWindow(matrixDimensions);
    // 更新坐标显示为实际矩阵维度
    updateCoordinatesDisplay(`${matrixDimensions.rows}×${matrixDimensions.cols}`);
    // 初始化矩阵数据
    state.matrixData = {
        rows: matrixDimensions.rows,
        cols: matrixDimensions.cols,
        elements: Array.from({ length: matrixDimensions.rows }, () =>
            Array.from({ length: matrixDimensions.cols }, () => '')
        )
    };

    // 切换到输入元素状态
    state.currentState = CONFIG.STATES.INPUT_ELEMENTS;
    updateUIForCurrentState();
}


/**
 * 处理矩阵元素输入
 */
function handleElementInput() {
    // 验证所有输入框是否已填写
    const allFilled = fillEmptyInputsAndValidate();

    if (!allFilled) {
        if (typeof showPopup === 'function') {
            showPopup('请填写所有矩阵元素', 'warning');
        } else {
            alert('请填写所有矩阵元素');
        }
        state.previousStates.pop();
        return;
    }

    // 收集矩阵数据
    collectMatrixData();

    // 切换到数据校验状态
    state.currentState = CONFIG.STATES.DATA_VALIDATION;
    updateUIForCurrentState();

    // 执行数据校验
    validateMatrixData();
}

/**
 * 处理数据校验
 */
function handleDataValidation() {

    if (state.currentState !== CONFIG.STATES.INPUT_ELEMENTS) {
        return;
    }

    // 1. 收集矩阵数据（确保数据已收集）
    collectMatrixData();

    // 2. 执行数据校验（去除空数据校验，改为自动补零）
    const validationResult = validateMatrixData();
    if (!validationResult.isValid) {
        // 校验失败：提示错误并终止流程
        if (typeof showPopup === 'function') {
            showPopup(validationResult.message, 'error');
        } else {
            alert(validationResult.message);
        }
        return;
    }

    // 3. 校验通过：保存当前状态（用于撤销）
    state.previousStates.push({
        state: state.currentState,
        matrixData: JSON.parse(JSON.stringify(state.matrixData))
    });

    // 4. 切换到初等变换状态
    state.currentState = CONFIG.STATES.ELEMENTARY_TRANSFORMATION;

    // 5. 渲染初等变换UI（确保矩阵元素能正确显示）
    showElementaryTransformationUI();

    // 6. 更新下一步按钮状态
    elements.nextButton.disabled = true;
    elements.nextButton.style.opacity = '0.5';

    // 7. 更新坐标显示和全局UI
    updateCoordinatesDisplay(`${state.matrixData.rows}×${state.matrixData.cols}`);
    updateUIForCurrentState();
}


/**
 * 处理数据确认
 */
function handleDataConfirmation() {
    // 完成矩阵录入 - 替换alert为popup弹窗
    if (typeof showPopup === 'function') {
        showPopup(`矩阵录入完成！\n维度: ${state.matrixData.rows}×${state.matrixData.cols}\n数据已保存`, 'success');
    } else {
        alert(`矩阵录入完成！\n维度: ${state.matrixData.rows}×${state.matrixData.cols}\n数据已保存`);
    }

    // 可以在这里添加后续处理逻辑，比如发送到服务器或进行矩阵运算
}

/**
 * 重置到初始状态
 */
function resetToInitialState() {
    // 清空窗口内容
    elements.windowDiv.innerHTML = '';

    // 重置窗口样式
    elements.windowDiv.classList.remove('dynamic');
    elements.windowDiv.style.width = '400px';
    elements.windowDiv.style.height = '400px';
    elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
    elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';

    // 重新创建网格
    createGrid();

    // 重置状态
    state.currentState = CONFIG.STATES.SELECT_DIMENSION;
    state.matrixData = null;
    state.previousStates = [];
    state.gridInputs = [];

    // 重置坐标显示
    updateCoordinatesDisplay('0×0');
    state.lastSelectedDimension = '0×0';

    // 更新UI
    updateUIForCurrentState();
}

// ==================== 事件处理函数 ====================
/**
 * 处理下一步按钮点击
 */
function Next() {
    state.previousStates.push({
        state: state.currentState,
        matrixData: state.matrixData ? JSON.parse(JSON.stringify(state.matrixData)) : null
    });

    switch (state.currentState) {
        case CONFIG.STATES.SELECT_DIMENSION:
            console.log('in select dimension state, next');
            handleDimensionSelection();
            break;

        case CONFIG.STATES.INPUT_ELEMENTS:
            console.log('in input elements state, next');
            handleDataValidation();  // 使用新的处理函数
            break;

        /*case CONFIG.STATES.ELEMENTARY_TRANSFORMATION:  // 新增初等变换状态
            console.log('in elementary transformation state, next');
            handleElementaryTransformation();
            break;
            */
    }
}

/**
 * 处理撤销按钮点击
 */
function Undo() {
    if (state.previousStates.length === 0) {
        if (typeof showPopup === 'function') {
            showPopup('没有可撤销的操作', 'warning');
        } else {
            alert('没有可撤销的操作');
        }
        return;
    }

    // 弹出最后一次保存的状态（深拷贝避免引用污染）
    const previousState = state.previousStates.pop();
    const prevStateType = previousState.state;
    const prevMatrixData = previousState.matrixData ? JSON.parse(JSON.stringify(previousState.matrixData)) : null;

    // 1. 先清理当前状态的特殊UI（比如初等变换操作框）
    if (state.currentState === CONFIG.STATES.ELEMENTARY_TRANSFORMATION) {
        hideElementaryTransformationUI(); // 隐藏初等变换UI
    }
    // 2. 恢复前一个状态
    switch (state.currentState) {
        case CONFIG.STATES.SELECT_DIMENSION:
            console.log('in select dimension state, undo');
            restoreOriginalGrid();
            enableGridInteraction();
            break;

        case CONFIG.STATES.INPUT_ELEMENTS:
            console.log('in input elements state, undo');
            restoreGridForInputElements();
            break;


        case CONFIG.STATES.ELEMENTARY_TRANSFORMATION:  // 初等变换状态撤销
            console.log('in elementary transformation state, undo');
            restoreGridForInputElements();
            break;
    }

    // 3. 全局状态回滚
    state.currentState = prevStateType;
    state.matrixData = prevMatrixData;

    // 4. 恢复坐标显示和UI
    const dim = state.matrixData ? `${state.matrixData.rows}×${state.matrixData.cols}` : CONFIG.INITIAL_DIMENSION;
    updateCoordinatesDisplay(dim);
    state.lastSelectedDimension = dim;
    updateUIForCurrentState();
}

/**
 * 切换输入矩阵区域的显示/隐藏
 */
function toggleInputMatrix() {
    elements.inputMatrixDiv.classList.toggle('visible');
}

/**
 * 处理鼠标按下事件
 */
function handleMouseDown(e) {
    if (e.target.classList.contains('grid-cell')) {
        updateGrid(e.target);
    }
}

/**
 * 处理鼠标离开网格区域
 */
function handleMouseLeave() {
    elements.coordinatesDiv.textContent = `矩阵维度: ${state.lastSelectedDimension}`;
}
/**
 * 更新网格状态
 */
function updateGrid(cell) {
    const { x, y } = getCellCoordinates(cell);
    const dimensionText = `${y + 1}×${x + 1}`;

    // 更新显示
    updateCoordinatesDisplay(dimensionText);
    state.lastSelectedDimension = dimensionText;

    // 更新高亮状态
    updateHighlightedCells(x, y);
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 使用事件委托，减少事件监听器数量
    elements.windowDiv.addEventListener('mousedown', handleMouseDown);
    elements.windowDiv.addEventListener('mouseleave', handleMouseLeave);

    // 添加按钮事件监听器
    elements.undoButton.addEventListener('click', Undo);
    elements.nextButton.addEventListener('click', Next);

    // 添加录入矩阵按钮点击事件
    elements.buttonInputMatrix.addEventListener('click', toggleInputMatrix);

}

// ==================== 网格操作函数 ====================
/**
 * 创建网格
 */
function createGrid() {
    state.gridCells = [];
    const fragment = document.createDocumentFragment();

    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            fragment.appendChild(cell);
            state.gridCells.push(cell);
        }
    }

    elements.windowDiv.appendChild(fragment);
}

/**
 * 恢复原始网格
 */
function restoreOriginalGrid() {
    // 清空窗口内容
    elements.windowDiv.innerHTML = '';

    // 重置窗口样式
    elements.windowDiv.classList.remove('dynamic');
    elements.windowDiv.style.width = '400px';
    elements.windowDiv.style.height = '400px';
    elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
    elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';

    // 重新创建网格
    createGrid();

    // 清空输入框状态
    state.gridInputs = [];

    // 重置坐标显示
    updateCoordinatesDisplay('0×0');
    state.lastSelectedDimension = '0×0';
}

/**
 * 恢复输入元素状态的网格（补全数据恢复逻辑）
 * @param {Object} prevMatrixData 前序矩阵数据
 */
function restoreGridForInputElements(prevMatrixData) {
    // 清空窗口
    elements.windowDiv.innerHTML = '';
    state.gridInputs = [];
    state.gridCells = [];

    if (prevMatrixData) {
        // 重建输入框网格
        createInputGrid(prevMatrixData.rows, prevMatrixData.cols);
        // 恢复输入框的值（修复表格数据丢失bug）
        state.gridInputs.forEach((input, index) => {
            const row = Math.floor(index / prevMatrixData.cols);
            const col = index % prevMatrixData.cols;
            input.value = prevMatrixData.elements[row][col] || '';
        });
        // 恢复坐标显示
        updateCoordinatesDisplay(`${prevMatrixData.rows}×${prevMatrixData.cols}`);
    } else {
        // 无数据时恢复初始网格
        createGrid();
        updateCoordinatesDisplay(CONFIG.INITIAL_DIMENSION);
    }
}

/**
 * 恢复网格单元格
 */
function restoreGridCells() {
    if (!state.gridInputs) return;

    state.gridInputs.forEach(input => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.x = input.dataset.x;
        cell.dataset.y = input.dataset.y;
        cell.dataset.index = input.dataset.index;

        // 替换输入框
        input.parentNode.replaceChild(cell, input);

        // 重新添加到网格单元格数组
        const index = parseInt(input.dataset.index);
        state.gridCells[index] = cell;
    });

    // 清空输入框状态
    state.gridInputs = [];
}
/**
 * 辅助：基于行列数创建输入框网格（修复表格结构bug）
 * @param {number} rows 行数
 * @param {number} cols 列数
 */
function createInputGrid(rows, cols) {
    elements.windowDiv.classList.add('dynamic');
    elements.windowDiv.style.gridTemplateColumns = `repeat(${cols}, 80px)`;
    elements.windowDiv.style.gridTemplateRows = `repeat(${rows}, 40px)`;
    elements.windowDiv.style.width = `${cols * 80}px`;
    elements.windowDiv.style.height = `${rows * 40}px`;

    // 重建输入框并缓存引用
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'grid-cell-input';
            input.dataset.row = i;
            input.dataset.col = j;
            elements.windowDiv.appendChild(input);
            state.gridInputs.push(input);
        }
    }
}

/**
 * 将高亮单元格转换为输入框
 */
function convertHighlightedCellsToInputs(highlightedCells) {
    highlightedCells.forEach(cell => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'grid-cell-input';
        input.dataset.x = cell.dataset.x;
        input.dataset.y = cell.dataset.y;
        input.dataset.index = cell.dataset.index;
        input.placeholder = '0';
        input.maxLength = 5; // 增加输入长度限制

        // 替换原单元格
        cell.parentNode.replaceChild(input, cell);

        // 添加到状态管理
        state.gridInputs = state.gridInputs || [];
        state.gridInputs.push(input);
    });
}
/**
 * 启用网格交互（用于撤销功能）
 */
function enableGridInteraction() {
    // 重新添加事件监听器
    elements.windowDiv.addEventListener('mousedown', handleMouseDown);
    elements.windowDiv.addEventListener('mouseleave', handleMouseLeave);

    // 启用下一步按钮
    elements.nextButton.disabled = false;
    elements.nextButton.style.opacity = '1';
    elements.nextButton.style.cursor = 'pointer';
}

/**
 * 禁用网格交互
 */
function disableGridInteraction() {
    // 移除所有事件监听器
    elements.windowDiv.removeEventListener('mousedown', handleMouseDown);
    elements.windowDiv.removeEventListener('mouseleave', handleMouseLeave);

    // 禁用下一步按钮
    elements.nextButton.disabled = true;
    elements.nextButton.style.opacity = '0.6';
    elements.nextButton.style.cursor = 'not-allowed';
}

/**
 * 启用输入框交互
*/
function enableInputInteraction() {
    // 启用所有输入框
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    inputs.forEach(input => {
        input.disabled = false;
        input.style.backgroundColor = 'white';
        input.style.cursor = 'text';
    });
}

/**
 * 禁用输入框交互
 */
function disableInputInteraction() {
    // 禁用所有输入框
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    inputs.forEach(input => {
        input.disabled = true;
        input.style.backgroundColor = '#f0f0f0';
        input.style.cursor = 'not-allowed';
        console.log('禁用成功');
    });
}


/**
 * 删除非高亮的单元格
 */
function removeNonHighlightedCells() {
    const allCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell'));
    const nonHighlightedCells = allCells.filter(cell => !cell.classList.contains('highlighted'));

    nonHighlightedCells.forEach(cell => {
        cell.remove();
    });

    // 更新网格单元格数组
    state.gridCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell'));
}
// ====================  数据处理函数 ====================
/**
 * 收集矩阵数据
 */
function collectMatrixData() {
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));

inputs.forEach(input => {
        const x = parseInt(input.dataset.x);
        const y = parseInt(input.dataset.y);
        state.matrixData.elements[y][x] = input.value.trim();
    });
}

/**
 * 矩阵数据校验核心函数（整合版）
 * 支持小数转分数、自动补零和多种数据格式验证
 * @param {boolean} useDOM - 是否从DOM元素中读取数据（否则从state.matrixData.elements读取）
 * @returns {Object} {isValid: boolean, message: string}
 */
function validateMatrixData(useDOM = false) {
    // 空数据校验
    if (!useDOM && (!state.matrixData || !state.matrixData.elements)) {
        return {
            isValid: false,
            message: '矩阵数据为空，请先输入元素值'
        };
    }

    const { rows, cols } = state.matrixData;
    let elements = [];
    let inputs = [];

    // 选择数据来源
    if (useDOM) {
        // 从DOM中读取数据
        inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    } else {
        // 从state中读取数据
        elements = state.matrixData.elements;
    }

    // 正则表达式定义
    const validPattern = /^(-)?(\d+(\/\d+)?|[a-zA-Z]\d*)$/; // 整数、分数、未知数
    const decimalPattern = /^-?\d+\.\d+$/; // 小数
    const unknownPattern = /^[a-zA-Z]\d*$/; // 支持带下标的未知数，如a1, b2
    const integerPattern = /^[+-]?\d+$/; // 整数

    // 遍历数据进行校验和转换
    if (useDOM) {
        // DOM数据源处理（一维数组）
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            let value = input.value.trim();
            const row = Math.floor(i / cols) + 1;
            const col = (i % cols) + 1;

            // 自动补零
            if (!value) {
                input.value = '0';
                continue;
            }

            // 小数转分数处理
            if (decimalPattern.test(value)) {
                try {
                    const decimalValue = parseFloat(value);
                    const fraction = math.fraction(decimalValue);
                    const fractionString = math.format(fraction, { fraction: 'ratio' });
                    input.value = fractionString;
                    continue;
                } catch (error) {
                    return {
                        isValid: false,
                        message: `第${row}行第${col}列小数转换失败：${value}`
                    };
                }
            }

            // 未知数验证
            if (unknownPattern.test(value)) {
                continue;
            }

            // 分数验证
            if (value.includes('/')) {
                const parts = value.split('/');
                if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1]) || parts[1] === '0') {
                    return {
                        isValid: false,
                        message: `第${row}行第${col}列无效的分数格式：${value}`
                    };
                }
                continue;
            }

            // 整数验证
            if (!integerPattern.test(value)) {
                return {
                    isValid: false,
                    message: `第${row}行第${col}列包含无效字符：${value}`
                };
            }
        }
    } else {
        // State数据源处理（二维数组）
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let value = elements[row][col]?.trim() || '';

                // 自动补零
                if (!value) {
                    elements[row][col] = '0';
                    continue;
                }

                // 小数转分数处理
                if (decimalPattern.test(value)) {
                    try {
                        const decimalValue = parseFloat(value);
                        const fraction = math.fraction(decimalValue);
                        const fractionString = math.format(fraction, { fraction: 'ratio' });
                        elements[row][col] = fractionString;
                        continue;
                    } catch (error) {
                        return {
                            isValid: false,
                            message: `第${row + 1}行第${col + 1}列小数转换失败：${value}`
                        };
                    }
                }

                // 未知数验证
                if (unknownPattern.test(value)) {
                    continue;
                }

                // 分数验证
                if (value.includes('/')) {
                    const parts = value.split('/');
                    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1]) || parts[1] === '0') {
                        return {
                            isValid: false,
                            message: `第${row + 1}行第${col + 1}列无效的分数格式：${value}`
                        };
                    }
                    continue;
                }

                // 整数验证
                if (!integerPattern.test(value)) {
                    return {
                        isValid: false,
                        message: `第${row + 1}行第${col + 1}列包含无效字符：${value}`
                    };
                }
            }
        }
    }

    // 所有校验通过
    return {
        isValid: true,
        message: '数据校验通过'
    };
}

/**  
* 填充空输入框并验证
 */
function fillEmptyInputsAndValidate() {
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));

    // 遍历所有输入框，将空输入框的值设为0
    inputs.forEach(input => {
        if (input.value.trim() === '') {
            input.value = '0';
        }
    });

    // 验证所有输入框是否已填写（现在应该都填了）
    return inputs.every(input => input.value.trim() !== '');
}

/**
 * 计算矩阵的实际维度
 */
function calculateMatrixDimensions(highlightedCells) {
    let maxX = 0;
    let maxY = 0;

    highlightedCells.forEach(cell => {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    });

    return {
        rows: maxY + 1,
        cols: maxX + 1
    };
}
// ====================  UI操作函数 ====================

/**
 * 显示初等变换UI
 */
function showElementaryTransformationUI() {
    // 移除hidden类，显示初等变换界面
    const elementaryTransformationDiv = document.querySelector('.hidden');
    if (elementaryTransformationDiv) {
        elementaryTransformationDiv.classList.remove('hidden');

        // 确保初等变换界面也继承body的居中样式
        elementaryTransformationDiv.style.display = 'flex';
        elementaryTransformationDiv.style.flexDirection = 'column';
        elementaryTransformationDiv.style.alignItems = 'center';
        elementaryTransformationDiv.style.width = '100%';
        elementaryTransformationDiv.style.maxWidth = '1000px';
        elementaryTransformationDiv.style.margin = '0 auto';
    }

    // 为输入框添加行列索引按钮
    addRowColumnIndices();

    // 重新组织布局，避免元素重叠
    reorganizeLayoutForElementaryTransformation();
}

/**
 * 隐藏初等变换UI（核心：清理初等变换操作框）
 */
function hideElementaryTransformationUI() {
    // 移除初等变换相关的DOM元素（根据实际DOM结构调整选择器）
    const transformUI = document.querySelector('.elementary-transformation-ui');
    if (transformUI) {
        transformUI.remove();
    }
    // 恢复下一步按钮状态
    elements.nextButton.disabled = false;
    elements.nextButton.style.opacity = '1';
}

/**
 * 重新组织布局以适应初等变换状态
 */
function reorganizeLayoutForElementaryTransformation() {
    // 获取所有需要重新排列的元素
    const inputMatrixDiv = document.getElementById('InputMatrix');
    const assistGroup = document.querySelector('.assist-group');
    const operatorButtons = document.querySelectorAll('.operator-buttons');

    // 清空InputMatrix容器
    inputMatrixDiv.innerHTML = '';

    // 创建新的布局容器
    const layoutContainer = document.createElement('div');
    layoutContainer.style.display = 'flex';
    layoutContainer.style.flexDirection = 'column';
    layoutContainer.style.alignItems = 'center';
    layoutContainer.style.gap = '20px';
    layoutContainer.style.width = '100%';

    // 添加矩阵表格（包含行列索引）
    const matrixTable = elements.windowDiv.querySelector('table');
    if (matrixTable) {
        const matrixContainer = document.createElement('div');
        matrixContainer.style.textAlign = 'center';
        matrixContainer.appendChild(matrixTable);

        // 添加矩阵维度信息
        const coordinates = document.createElement('p');
        coordinates.id = 'coordinates';
        coordinates.textContent = `矩阵维度: ${state.matrixData.rows}×${state.matrixData.cols}`;
        matrixContainer.appendChild(coordinates);

        layoutContainer.appendChild(matrixContainer);
    }

    // 添加辅助按钮组
    if (assistGroup) {
        layoutContainer.appendChild(assistGroup);
    }

    // 添加操作按钮组
    operatorButtons.forEach(buttonGroup => {
        layoutContainer.appendChild(buttonGroup);
    });

    // 将新布局添加到InputMatrix容器
    inputMatrixDiv.appendChild(layoutContainer);
}

/**
 * 添加行列索引按钮
 */
function addRowColumnIndices() {
    // 修改：将解构的elements重命名为matrixElements，避免与全局elements对象冲突
    const { rows, cols, elements: matrixElements } = state.matrixData;

    // 创建表格容器
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = '20px auto';

    // 创建数据行（行索引放在行末尾）
    for (let row = 0; row < rows; row++) {
        const tr = document.createElement('tr');

        // 添加数据单元格（先添加数据，再添加行索引）
        for (let col = 0; col < cols; col++) {
            const td = document.createElement('td');
            // 直接显示矩阵值，不再使用输入框
            const cellValue = matrixElements[row][col] || '0'; // 默认值为0
            td.textContent = cellValue;
            
            // 添加样式类，保持与原输入框相似的外观
            td.className = 'grid-cell-value';
            td.style.border = '1px solid #ccc';
            td.style.padding = '8px 12px';
            td.style.textAlign = 'center';
            td.style.backgroundColor = '#f9f9f9';
            
            tr.appendChild(td);
        }

        // 添加行索引按钮（放在行末尾）
        const rowIndexTd = document.createElement('td');
        rowIndexTd.className = 'row-label';
        const rowButton = document.createElement('button');
        rowButton.textContent = `r${row + 1}`;
        rowButton.id = `button_add_r${row + 1}`;
        rowIndexTd.appendChild(rowButton);
        tr.appendChild(rowIndexTd);

        table.appendChild(tr);
    }

    // 创建列索引行（放在表格下方）
    const colTr = document.createElement('tr');

    // 添加列索引按钮（直接与数据列对齐）
    for (let col = 0; col < cols; col++) {
        const colTd = document.createElement('td');
        colTd.className = 'col-label';
        const colButton = document.createElement('button');
        colButton.textContent = `c${col + 1}`;
        colButton.id = `button_add_c${col + 1}`;
        colTd.appendChild(colButton);
        colTr.appendChild(colTd);
    }

    // 添加空单元格（对应行索引列的位置）
    const emptyTd = document.createElement('td');
    colTr.appendChild(emptyTd);

    table.appendChild(colTr);

    // 替换原来的输入框布局 - 现在可以正确访问全局的elements对象
    elements.windowDiv.innerHTML = '';
    elements.windowDiv.appendChild(table);
}

/**
 * 更新高亮单元格
 */
function updateHighlightedCells(targetX, targetY) {
    // 清除所有高亮
    clearAllHighlights();

    // 高亮从(0,0)到当前网格的所有格子
    highlightCellsInRange(targetX, targetY);
}

/**
 * 清除所有高亮
 */
function clearAllHighlights() {
    state.gridCells.forEach(cell => {
        cell.classList.remove('highlighted');
    });
}

/**
 * 高亮指定范围内的单元格
 */
function highlightCellsInRange(targetX, targetY) {
    // 确保目标坐标在网格范围内
    const maxX = Math.min(targetX, CONFIG.GRID_SIZE - 1);
    const maxY = Math.min(targetY, CONFIG.GRID_SIZE - 1);
    for (let x = 0; x <= targetX; x++) {
        for (let y = 0; y <= targetY; y++) {
            const cellIndex = y * CONFIG.GRID_SIZE + x;
            if (state.gridCells[cellIndex]) {
                state.gridCells[cellIndex].classList.add('highlighted');
            }
        }
    }
}

/**
 * 显示最近选择的矩阵维度
 */
function showLastSelectedDimension() {
    elements.coordinatesDiv.textContent = `矩阵维度: ${state.lastSelectedDimension}`;
}

/**
 * 更新坐标显示
 */
function updateCoordinatesDisplay(dimensionText) {
    elements.coordinatesDiv.textContent = `矩阵维度: ${dimensionText}`;
}

// ==================== 底层工具函数 ====================

// ==================== 底层工具函数 ====================
/**
 * 获取单元格坐标
 */
function getCellCoordinates(cell) {
    return {
        x: parseInt(cell.dataset.x),
        y: parseInt(cell.dataset.y)
    };
}

/**
* 调整窗口大小以适应矩阵
 */
function resizeWindow(dimensions) {
    const inputWidth = 60;  // 输入框宽度
    const inputHeight = 50; // 输入框高度
    const gap = 0;          // 间距

const newWidth = dimensions.cols * (inputWidth + gap);
    const newHeight = dimensions.rows * (inputHeight + gap);

    // 添加动态调整类
    elements.windowDiv.classList.add('dynamic');

    // 更新窗口大小
    elements.windowDiv.style.width = `${newWidth}px`;
    elements.windowDiv.style.height = `${newHeight}px`;

    // 更新网格布局
    elements.windowDiv.style.gridTemplateColumns = `repeat(${dimensions.cols}, ${inputWidth}px)`;
    elements.windowDiv.style.gridTemplateRows = `repeat(${dimensions.rows}, ${inputHeight}px)`;
}

/**
 * 显示矩阵数据预览
 */
function showMatrixPreview() {
    // 格式化显示矩阵数据
    console.log(`维度: ${state.matrixData.rows}×${state.matrixData.cols}`);

    // 显示矩阵内容（不显示数组长度）
    console.log('矩阵内容:');
    state.matrixData.elements.forEach((row, rowIndex) => {
        // 使用JSON.stringify或者直接显示数组内容
        console.log(`第${rowIndex + 1}行: [${row.join(', ')}]`);
    });
}