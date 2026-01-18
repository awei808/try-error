// ==================== 配置和状态定义 ====================
// 配置常量
const CONFIG = {
    GRID_SIZE: 10,
    INITIAL_DIMENSION: '0×0',
    // 状态定义
    STATES: {
        SELECT_DIMENSION: 'select_dimension',
        INPUT_ELEMENTS: 'input_elements',
        CONFIRM_DATA: 'confirm_data'
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
                       // 启用网格交互
            enableGridInteraction();
            break;

        case CONFIG.STATES.INPUT_ELEMENTS:
            console.log('to input elements');
            console.log(`矩阵维度: ${state.lastSelectedDimension}`);
            elements.tipDiv.textContent = '请在输入框中输入矩阵元素（非‘0’），点击下一步后，空白处将用‘0’填充';
            elements.nextButton.textContent = '下一步';
            elements.undoButton.disabled = false;
            elements.undoButton.style.opacity = '1';
                     // 启用输入框交互
            enableInputInteraction();
            break;

        case CONFIG.STATES.CONFIRM_DATA:
            console.log('to confirm data');
            elements.tipDiv.textContent = '确认矩阵数据是否正确，可以点击上一步进行修改';
            elements.nextButton.textContent = '完成';
            elements.undoButton.disabled = false;
            elements.undoButton.style.opacity = '1';
                 // 禁用输入框交互
            disableInputInteraction();
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
        // 替换alert为popup弹窗
        if (typeof showPopup === 'function') {
            showPopup('请填写所有矩阵元素', 'warning');
        } else {
            alert('请填写所有矩阵元素');
        }
        state.previousStates.pop(); // 移除无效的状态保存
        return;
    }

    // 收集矩阵数据
    collectMatrixData();

    // 切换到确认数据状态
    state.currentState = CONFIG.STATES.CONFIRM_DATA;
    updateUIForCurrentState();
    
    // 显示矩阵数据预览
    showMatrixPreview();
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

// ==================== 按钮点击方法 ====================
/**
 * 处理下一步按钮点击
 */
function handleNext() {
    // 保存当前状态到历史
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
            handleElementInput();
            break;

        case CONFIG.STATES.CONFIRM_DATA:
            console.log('in confirm data state, next');
            handleDataConfirmation();
            break;
    }
}

/**
 * 处理撤销按钮点击
 */
function handleUndo() {
    if (state.previousStates.length === 0) {
        // 替换alert为popup弹窗
        if (typeof showPopup === 'function') {
            showPopup('没有可撤销的操作', 'warning');
        } else {
            alert('没有可撤销的操作');
        }
        return;
    }

    // 获取上一个状态
    const previousState = state.previousStates.pop();

    // 恢复状态
    state.currentState = previousState.state;
    state.matrixData = previousState.matrixData;

    // 根据状态执行相应的恢复操作
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

        case CONFIG.STATES.CONFIRM_DATA:
            console.log('in confirm data state, undo');
            // 保持当前确认状态
            break;
    }

    updateUIForCurrentState();
}

/**
 * 切换输入矩阵区域的显示/隐藏
 */
function toggleInputMatrix() {
    elements.inputMatrixDiv.classList.toggle('visible');
}

// ==================== 鼠标事件方法 ====================
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

// ==================== 事件监听器设置 ====================
/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 使用事件委托，减少事件监听器数量
    elements.windowDiv.addEventListener('mousedown', handleMouseDown);
    elements.windowDiv.addEventListener('mouseleave', handleMouseLeave);

    // 添加按钮事件监听器
    elements.undoButton.addEventListener('click', handleUndo);
    elements.nextButton.addEventListener('click', handleNext);

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
 * 恢复网格和输入框状态（用于撤销功能）
 */
function restoreGridForInputElements() {
 /*   // 清空窗口内容
    elements.windowDiv.innerHTML = '';

    // 重置窗口样式
    elements.windowDiv.classList.remove('dynamic');
    elements.windowDiv.style.width = '400px';
    elements.windowDiv.style.height = '400px';
    elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
    elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';

    // 重新创建网格
    createGrid();

    // 根据matrixData恢复高亮显示
    if (state.matrixData && state.matrixData.rows && state.matrixData.cols) {
        const { rows, cols } = state.matrixData;
        highlightCellsInRange(cols - 1, rows - 1);
        updateCoordinatesDisplay(`${rows}×${cols}`);
        state.lastSelectedDimension = `${rows}×${cols}`;
    } else {
        updateCoordinatesDisplay('0×0');
        state.lastSelectedDimension = '0×0';
    }

    // 清空输入框状态
    state.gridInputs = [];*/
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

// ==================== 高亮和显示函数 ====================
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
 * 获取单元格坐标
 */
function getCellCoordinates(cell) {
    return {
        x: parseInt(cell.dataset.x),
        y: parseInt(cell.dataset.y)
    };
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
    });
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);