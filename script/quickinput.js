// ==================== 快速录入功能 ====================
// 全局变量，用于跟踪快速录入输入框是否已添加
let quickInputAdded = false;

/**
 * 初始化快速录入功能
 */
function initQuickInput() {
    // 为快速录入按钮绑定点击事件
    const buttonQuickInput = document.getElementById('ButtonQuickInput');
    if (buttonQuickInput) {
        buttonQuickInput.addEventListener('click', handleQuickInputClick);
    }
}

/**
 * 处理快速录入按钮点击事件
 */
function handleQuickInputClick() {
    const header = document.querySelector('header');

    // 如果输入框已经存在，则不再添加
    if (quickInputAdded) {
        return;
    }

    // 创建输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'input';
    input.placeholder = '请输入二维数组';
    input.style.marginLeft = '10px';
    input.style.marginRight = '10px';  // 添加右边距
    input.style.padding = '8px 12px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    input.style.width = '200px';

    // 添加到header中
    header.appendChild(input);
    quickInputAdded = true;

    // 获取"录入矩阵"按钮
    const buttonInputMatrix = document.getElementById('ButtonInputMartix');
    if (buttonInputMatrix) {
        // 将"录入矩阵"按钮移动到header的最后面
        header.appendChild(buttonInputMatrix);
    }

}

/**
 * 处理快速录入矩阵功能（由main.js调用）
 */
function handleQuickInputMatrix() {
    const quickInput = document.getElementById('input');
    if (!quickInput) {
        showError('快速录入输入框不存在');
        return false;
    }

    const inputValue = quickInput.value.trim();
    if (inputValue === '') {
        showError('请输入二维数组');
        return false;
    }

    // 检验并解析二维数组
    const validationResult = validateAndParseMatrix(inputValue);
    if (!validationResult.isValid) {
        showError(validationResult.message);
        return false;
    }

    // 存储矩阵数据到state
    state.matrixData = {
        rows: validationResult.rows,
        cols: validationResult.cols,
        elements: validationResult.elements
    };

    // 设置状态为初等变换
    state.currentState = CONFIG.STATES.ELEMENTARY_TRANSFORMATION;

    // 显示表格（使用与addRowColumnIndices相同的格式）
    displayMatrixTable();

    // 更新UI状态
    updateUIForCurrentState();

    // 显示成功消息
    showSuccess(`矩阵录入成功！维度: ${validationResult.rows}×${validationResult.cols}`);
    return true;
}

/**
 * 检验并解析二维数组字符串
 * @param {string} input - 输入的二维数组字符串
 * @returns {Object} {isValid: boolean, message: string, rows: number, cols: number, elements: Array}
 */
function validateAndParseMatrix(input) {
    try {
        // 去除多余空格和换行符
        const cleanedInput = input.replace(/\s+/g, ' ').trim();

        // 检查是否为有效的二维数组格式
        if (!cleanedInput.startsWith('[') || !cleanedInput.endsWith(']')) {
            return {
                isValid: false,
                message: '请输入有效的二维数组格式，如：[[1,2,3],[4,5,6]]'
            };
        }

        // 尝试解析为JSON
        let parsed;
        try {
            parsed = JSON.parse(cleanedInput);
        } catch (e) {
            return {
                isValid: false,
                message: '数组格式错误，请检查括号和逗号'
            };
        }

        // 检查是否为数组
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return {
                isValid: false,
                message: '请输入有效的二维数组'
            };
        }

        // 检查每个元素是否为数组
        const rows = parsed.length;
        let cols = 0;

        for (let i = 0; i < rows; i++) {
            if (!Array.isArray(parsed[i])) {
                return {
                    isValid: false,
                    message: `第${i + 1}行不是数组`
                };
            }

            // 检查列数是否一致
            if (i === 0) {
                cols = parsed[i].length;
            } else if (parsed[i].length !== cols) {
                return {
                    isValid: false,
                    message: `第${i + 1}行列数与第一行不一致`
                };
            }
        }

        // 检查每个元素是否为有效矩阵元素
        const elements = [];
        for (let i = 0; i < rows; i++) {
            elements[i] = [];
            for (let j = 0; j < cols; j++) {
                const value = parsed[i][j];
                // 允许数字、字符串形式的数字、分数、小数、未知数、多项式
                if (value === null || value === undefined || value === '') {
                    elements[i][j] = '0';
                } else {
                    const strValue = String(value).trim();
                    // 检查是否为有效矩阵元素（数字、分数、小数、未知数、多项式）
                    const validationResult = isValidMatrixElement(strValue);
                    if (validationResult.isValid) {
                        // 小数转分数处理
                        const decimalPattern = /^-?\d+\.\d+$/;
                        const fractionPattern = /^-?\d+\/\d+$/;

                        // 小数转分数处理
                        if (decimalPattern.test(strValue)) {
                            try {
                                const decimalValue = parseFloat(strValue);
                                const fraction = math.fraction(decimalValue);

                                // 检查分母是否为1，如果是则转换为整数
                                if (fraction.d === 1) {
                                    elements[i][j] = fraction.n.toString();
                                } else {
                                    const fractionString = math.format(fraction, { fraction: 'ratio' });
                                    elements[i][j] = fractionString;
                                }
                            } catch (error) {
                                return {
                                    isValid: false,
                                    message: `第${i + 1}行第${j + 1}列小数转换失败：${strValue}`
                                };
                            }
                        }
                        // 分数化简处理
                        else if (fractionPattern.test(strValue)) {
                            try {
                                const fraction = math.fraction(strValue);

                                // 检查分母是否为1，如果是则转换为整数
                                if (fraction.d === 1) {
                                    elements[i][j] = fraction.n.toString();
                                } else {
                                    const simplifiedFraction = math.format(fraction, { fraction: 'ratio' });
                                    elements[i][j] = simplifiedFraction;
                                }
                            } catch (error) {
                                return {
                                    isValid: false,
                                    message: `第${i + 1}行第${j + 1}列分数化简失败：${strValue}`
                                };
                            }
                        } else {
                            // 其他有效元素（未知数、多项式等）保持原样
                            elements[i][j] = strValue;
                        }
                    } else {
                        return {
                            isValid: false,
                            message: `第${i + 1}行第${j + 1}列的值"${strValue}"不是有效矩阵元素。${validationResult.message}`
                        };
                    }
                }
            }
        }

        return {
            isValid: true,
            message: '解析成功',
            rows: rows,
            cols: cols,
            elements: elements
        };

    } catch (error) {
        return {
            isValid: false,
            message: `解析过程中发生错误: ${error.message}`
        };
    }
}

/**
 * 检查字符串是否为有效矩阵元素
 * 支持：数字、分数、小数、未知数、包含未知数的多项式
 * 未知数只能是abcdmnxyz和λ中的单个字符
 * @param {string} str - 要检查的字符串
 * @returns {Object} {isValid: boolean, message: string}
 */
function isValidMatrixElement(str) {
    // 空字符串视为0
    if (str === '') {
        return { isValid: true, message: '' };
    }

    // 允许的未知数字符
    const allowedVariables = ['a', 'b', 'c', 'd', 'm', 'n', 'x', 'y', 'z', 'λ'];

    // 1. 纯数字（整数、小数）
    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return { isValid: true, message: '' };
    }

    // 2. 分数（支持正负分数）
    if (/^-?\d+\/\d+$/.test(str)) {
        const parts = str.split('/');
        if (parts[1] === '0') {
            return { isValid: false, message: '分母不能为0' };
        }
        return { isValid: true, message: '' };
    }

    // 3. 单个未知数（只能是允许的字符）
    if (allowedVariables.includes(str)) {
        return { isValid: true, message: '' };
    }

    // 4. 带系数的未知数（如2x, -3y, 0.5λ）
    const coefficientVariablePattern = /^(-?\d+(\.\d+)?)([a-dm-nxyzλ])$/;
    const coefficientMatch = str.match(coefficientVariablePattern);
    if (coefficientMatch) {
        const variable = coefficientMatch[3];
        if (allowedVariables.includes(variable)) {
            return { isValid: true, message: '' };
        }
    }

    // 5. 多项式（如2x+3y, x-y, 3a+2b-λ）
    // 先检查是否包含允许的未知数
    const variablePattern = new RegExp(`[${allowedVariables.join('')}]`, 'g');
    const variablesInStr = str.match(variablePattern);

    if (variablesInStr) {
        // 检查所有未知数是否都是允许的
        const invalidVariables = variablesInStr.filter(v => !allowedVariables.includes(v));
        if (invalidVariables.length > 0) {
            return {
                isValid: false,
                message: `未知数"${invalidVariables[0]}"不在允许范围内（允许的未知数：${allowedVariables.join(', ')}）`
            };
        }

        // 多项式格式验证：允许数字、未知数、加减号、系数
        // 格式示例：2x+3y, x-y, 3a+2b-λ, 0.5x-1.2y+3z
        const polynomialPattern = /^([+-]?(\d+(\.\d+)?)?[a-dm-nxyzλ])([+-](\d+(\.\d+)?)?[a-dm-nxyzλ])*$/;

        // 简化验证：检查是否只包含数字、允许的未知数、加减号、小数点
        const validCharsPattern = /^[0-9a-dm-nxyzλ+\-\.\s]+$/;
        if (!validCharsPattern.test(str.replace(/\s/g, ''))) {
            return {
                isValid: false,
                message: '多项式格式错误，只能包含数字、未知数、加减号和小数点'
            };
        }

        // 基本结构检查：不能以加减号结尾，不能有连续的加减号
        const cleanedStr = str.replace(/\s/g, '');
        if (/[+\-]$/.test(cleanedStr)) {
            return { isValid: false, message: '多项式不能以加减号结尾' };
        }
        if (/[+\-]{2,}/.test(cleanedStr)) {
            return { isValid: false, message: '多项式不能有连续的加减号' };
        }

        return { isValid: true, message: '' };
    }

    // 6. 如果以上都不匹配，返回错误
    return {
        isValid: false,
        message: `格式错误。支持：数字、分数、未知数（${allowedVariables.join(', ')}）、多项式`
    };
}

/**
 * 显示矩阵表格（使用与addRowColumnIndices相同的格式）
 */
function displayMatrixTable() {
    if (!state.matrixData) return;

    const { rows, cols, elements: matrixElements } = state.matrixData;

    // 创建表格容器
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = '0px auto';

    // 创建数据行（行索引放在行末尾）
    for (let row = 0; row < rows; row++) {
        const tr = document.createElement('tr');

        // 添加数据单元格（先添加数据，再添加行索引）
        for (let col = 0; col < cols; col++) {
            const td = document.createElement('td');
            // 直接显示矩阵值
            const cellValue = matrixElements[row][col] || '0';
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

    // 替换原来的输入框布局
    elements.windowDiv.innerHTML = '';
    elements.windowDiv.appendChild(table);

    // 计算并调整windowDiv大小以适应表格
    setTimeout(() => {
        const windowWidth = table.offsetWidth;
        const windowHeight = table.offsetHeight;
        elements.windowDiv.style.width = `${windowWidth}px`;
        elements.windowDiv.style.height = `${windowHeight}px`;
        elements.windowDiv.style.gridTemplateColumns = 'none';
        elements.windowDiv.style.gridTemplateRows = 'none';
        elements.windowDiv.style.overflow = 'visible';
        elements.windowDiv.style.display = 'block';
        elements.inputMatrixDiv.style.display = 'block';
    }, 0);
    console.log('表格显示成功');
    // 绑定行列索引按钮事件
    bindRowColumnIndexEvents();

}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showError(message) {
    if (typeof showPopup === 'function') {
        showPopup(message, 'error');
    } else {
        alert(message);
    }
}

/**
 * 显示成功消息
 * @param {string} message - 成功消息
 */
function showSuccess(message) {
    if (typeof showPopup === 'function') {
        showPopup(message, 'success');
    } else {
        alert(message);
    }
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    initQuickInput();
});