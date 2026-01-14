// 报错弹窗管理器
class ErrorPopupManager {
    constructor() {
        this.popupBox = document.getElementById('popupBox');
        this.maxErrors = 3;
        this.errorTimeout = 500000; // 5秒
        this.currentErrors = new Map(); // 存储错误ID和对应的元素
        
        this.init();
    }
    
    init() {
        // 确保popupBox存在
        if (!this.popupBox) {
            this.popupBox = document.createElement('div');
            this.popupBox.id = 'popupBox';
            //this.popupBox.className = 'popup-box-container';
            document.body.appendChild(this.popupBox);
        }
        
        // 绑定debugError按钮事件
        const debugErrorBtn = document.getElementById('debugError');
        if (debugErrorBtn) {
            debugErrorBtn.addEventListener('click', () => {
                this.showError('这是一个测试报错信息，用于调试报错弹窗功能。');
            });
        }
    }
    
    /**
     * 显示报错弹窗
     * @param {string} message 报错信息
     * @param {string} type 错误类型（可选）
     */
    showError(message, type = 'error') {
        // 生成唯一ID
        const errorId = 'error-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // 创建报错div
        const errorDiv = this.createErrorPopup(message, type, errorId);
        
        // 如果已经有3个报错，移除最先出现的
        if (this.currentErrors.size >= this.maxErrors) {
            this.removeOldestError();
        }
        
        // ✅ 移除手动上移逻辑，依赖Flex布局自动排列
        //this.moveUpExistingErrors();
        
        // 添加新的报错div
        this.popupBox.appendChild(errorDiv);
        this.currentErrors.set(errorId, errorDiv);
        
        // 设置5秒后自动消失
        const timeoutId = setTimeout(() => {
            this.removeError(errorId);
        }, this.errorTimeout);
        
        // 存储timeout ID以便可以手动清除
        errorDiv.dataset.timeoutId = timeoutId;
    }
    
    /**
     * 创建报错弹窗元素
     */
    createErrorPopup(message, type, errorId) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-popup';
        errorDiv.id = errorId;
        
        errorDiv.innerHTML = `
            <div class="error-popup-content">
                <div class="error-popup-icon">⚠️</div>
                <p class="error-popup-message">${this.escapeHtml(message)}</p>
                <button class="error-popup-close" onclick="errorManager.removeError('${errorId}')">×</button>
            </div>
        `;
        
        return errorDiv;
    }
    
    /**
     * 上移现有的报错div（使用实际高度）
     */
    /*moveUpExistingErrors() {
        const existingErrors = Array.from(this.popupBox.children);
        
        if (existingErrors.length === 0) return;
        
        // 计算新报错的高度（预估）
        const newErrorHeight = 60; // 预估新报错高度
        const spacing = 10; // 间距

        existingErrors.forEach((errorDiv, index) => {
            // 获取当前报错的实际高度
            const currentHeight = errorDiv.offsetHeight || 60;
            
            // 移动距离 = 新报错高度 + 间距 + 前面报错的高度累计
            let moveDistance = newErrorHeight + spacing;
            
            // 累加前面报错的高度
            for (let i = 0; i < index; i++) {
                const prevError = existingErrors[i];
                moveDistance += (prevError.offsetHeight || 60) + spacing;
            }
            
            errorDiv.style.transform = `translateY(-${moveDistance}px)`;
            errorDiv.style.transition = 'transform 0.3s ease';
        });
    }*/
    
    /**
     * 移除最旧的报错
     */
    removeOldestError() {
        if (this.currentErrors.size === 0) return;
        
        const oldestId = Array.from(this.currentErrors.keys())[0];
        this.removeError(oldestId);
    }
    
    /**
     * 移除指定ID的报错
     */
    removeError(errorId) {
        const errorDiv = this.currentErrors.get(errorId);
        if (!errorDiv) return;
        
        // 清除定时器
        const timeoutId = errorDiv.dataset.timeoutId;
        if (timeoutId) {
            clearTimeout(parseInt(timeoutId));
        }
        
        // 添加淡出动画
        errorDiv.classList.add('fade-out');
        
        // 动画结束后移除元素
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
            this.currentErrors.delete(errorId);
            
        // ✅ 移除手动重定位逻辑，Flex会自动调整剩余弹窗位置
            // this.repositionRemainingErrors();
        }, 300);
    }
    
    /**
     * 重新定位剩余的报错
     */
    /*repositionRemainingErrors() {
        const remainingErrors = Array.from(this.popupBox.children);
        remainingErrors.forEach((errorDiv, index) => {
            errorDiv.style.transform = `translateY(-${index * 60}px)`;
        });
    }*/
    
    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 清除所有报错
     */
    clearAllErrors() {
        Array.from(this.currentErrors.keys()).forEach(errorId => {
            this.removeError(errorId);
        });
    }
}

// 全局错误管理器实例
const errorManager = new ErrorPopupManager();

// 全局错误显示函数
function showError(message, type = 'error') {
    errorManager.showError(message, type);
}

// 全局错误清除函数
function clearAllErrors() {
    errorManager.clearAllErrors();
}

// 导出到全局作用域
window.errorManager = errorManager;
window.showError = showError;
window.clearAllErrors = clearAllErrors;

// 弹窗管理器
class PopupManager {
    constructor() {
        this.popupBox = document.getElementById('popupBox');
        this.maxPopups = 3;
        this.popupTimeout = 5000; // 5秒
        this.currentPopups = new Map(); // 存储弹窗ID和对应的元素
        
        this.init();
    }
    
    init() {
        // 确保popupBox存在
        if (!this.popupBox) {
            this.popupBox = document.createElement('div');
            this.popupBox.id = 'popupBox';
            this.popupBox.className = 'popup-box-container';
            document.body.appendChild(this.popupBox);
        }
    }
    
    /**
     * 显示弹窗
     * @param {string} message 信息内容
     * @param {string} type 弹窗类型：error/warning/success
     */
    showPopup(message, type = 'error') {
        // 生成唯一ID
        const popupId = 'popup-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // 创建弹窗div
        const popupDiv = this.createPopup(message, type, popupId);
        
        // 如果已经有3个弹窗，移除最先出现的
        if (this.currentPopups.size >= this.maxPopups) {
            this.removeOldestPopup();
        }
        
        // 添加新的弹窗div
        this.popupBox.appendChild(popupDiv);
        this.currentPopups.set(popupId, popupDiv);
        
        // 设置5秒后自动消失
        const timeoutId = setTimeout(() => {
            this.removePopup(popupId);
        }, this.popupTimeout);
        
        // 存储timeout ID以便可以手动清除
        popupDiv.dataset.timeoutId = timeoutId;
    }
    
    /**
     * 创建弹窗元素（修复版）
     */
    createPopup(message, type, popupId) {
        const popupDiv = document.createElement('div');
        popupDiv.className = `popup ${type}-popup`;
        popupDiv.id = popupId;
        
        // 根据类型设置图标
        let icon = '⚠️';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';
        if (type === 'error') icon = '❌';
        
        popupDiv.innerHTML = `
            <div class="popup-content">
                <div class="popup-icon">${icon}</div>
                <p class="popup-message">${this.escapeHtml(message)}</p>
                <button class="popup-close" title="关闭">×</button>
            </div>
        `;
        
        // 使用事件监听器替代onclick（更可靠）
        const closeButton = popupDiv.querySelector('.popup-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            this.removePopup(popupId);
        });
        
        // 添加键盘支持
        closeButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.removePopup(popupId);
            }
        });
        
        return popupDiv;
    }
    
    /**
     * 移除最旧的弹窗
     */
    removeOldestPopup() {
        if (this.currentPopups.size === 0) return;
        
        const oldestId = Array.from(this.currentPopups.keys())[0];
        this.removePopup(oldestId);
    }
    
    /**
     * 移除指定ID的弹窗
     */
    removePopup(popupId) {
        const popupDiv = this.currentPopups.get(popupId);
        if (!popupDiv) return;
        
        // 清除定时器
        const timeoutId = popupDiv.dataset.timeoutId;
        if (timeoutId) {
            clearTimeout(parseInt(timeoutId));
        }
        
        // 添加淡出动画
        popupDiv.classList.add('fade-out');
        
        // 动画结束后移除元素
        setTimeout(() => {
            if (popupDiv.parentNode) {
                popupDiv.parentNode.removeChild(popupDiv);
            }
            this.currentPopups.delete(popupId);
        }, 300);
    }
    
    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 清除所有弹窗
     */
    clearAllPopups() {
        Array.from(this.currentPopups.keys()).forEach(popupId => {
            this.removePopup(popupId);
        });
    }
}

// 全局弹窗管理器实例
const popupManager = new PopupManager();

// 全局弹窗显示函数
function showPopup(message, type = 'error') {
    popupManager.showPopup(message, type);
}

// 全局弹窗清除函数
function clearAllPopups() {
    popupManager.clearAllPopups();
}

// 导出到全局作用域
window.popupManager = popupManager;
window.showPopup = showPopup;
window.clearAllPopups = clearAllPopups;