// 初等变换符号状态管理
let symbolStatus = {
    currentSymbol: '',
    activeButton: null
};

// 初始化函数
function initTransformationButtons() {
    // 获取所有按钮和输入框
    const buttonChange = document.getElementById('button-change');
    const buttonAdd = document.getElementById('button-add');
    const buttonSub = document.getElementById('button-sub');
    const buttonMul = document.getElementById('button-mul');
    const transformCoefficient = document.getElementById('transform-coefficient');
    const transformOperator = document.getElementById('transform-operator');

    // 为按钮绑定点击事件
    buttonChange.addEventListener('click', function() {
        setActiveSymbol('↔', buttonChange);
        // 隐藏系数输入框
        transformCoefficient.style.display = 'none';
        // 设置运算符值
        if (transformOperator) {
            transformOperator.value = '↔';
        }
    });

    buttonAdd.addEventListener('click', function() {
        setActiveSymbol('+', buttonAdd);
        // 显示系数输入框
        transformCoefficient.style.display = 'block';
        // 设置运算符值
        if (transformOperator) {
            transformOperator.value = '+';
        }
    });

    buttonSub.addEventListener('click', function() {
        setActiveSymbol('−', buttonSub);
        // 显示系数输入框
        transformCoefficient.style.display = 'block';
        // 设置运算符值
        if (transformOperator) {
            transformOperator.value = '−';
        }
    });

    buttonMul.addEventListener('click', function() {
        setActiveSymbol('×', buttonMul);
        // 显示系数输入框
        transformCoefficient.style.display = 'block';
        // 设置运算符值
        if (transformOperator) {
            transformOperator.value = '×';
        }
    });

    // 初始化状态
    resetButtonStyles();
}

// 设置活动符号和按钮样式
function setActiveSymbol(symbol, activeButton) {
    // 更新状态
    symbolStatus.currentSymbol = symbol;
    symbolStatus.activeButton = activeButton;

    // 重置所有按钮样式
    resetButtonStyles();

    // 设置活动按钮样式
    activeButton.style.backgroundColor = '#4a6fa5'; // 主色调
    activeButton.style.color = 'white';
    activeButton.style.border = '2px solid #4a6fa5';

    // 设置其他按钮为灰色
    const allButtons = document.querySelectorAll('#arithmetic-symbols button');
    allButtons.forEach(button => {
        if (button !== activeButton) {
            button.style.backgroundColor = '#cccccc';
            button.style.color = '#666666';
            button.style.border = '1px solid #999999';
        }
    });
}

// 重置所有按钮样式
function resetButtonStyles() {
    const allButtons = document.querySelectorAll('#arithmetic-symbols button');
    allButtons.forEach(button => {
        button.style.backgroundColor = '';
        button.style.color = '';
        button.style.border = '';
    });
}

// 获取当前符号状态
function getCurrentSymbol() {
    return symbolStatus.currentSymbol;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待DOM完全加载后初始化
    setTimeout(initTransformationButtons, 100);
});