// 报错弹窗管理器
class ErrorPopupManager {
    constructor() {
        this.errorBox = document.getElementById('errorBox');
        this.maxErrors = 3;
        this.errorTimeout = 5000; // 5秒
        this.currentErrors = new Map(); // 存储错误ID和对应的元素
        
        this.init();
    }
    
    init() {
        // 确保errorBox存在
        if (!this.errorBox) {
            this.errorBox = document.createElement('div');
            this.errorBox.id = 'errorBox';
            this.errorBox.className = 'error-box-container';
            document.body.appendChild(this.errorBox);
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
        
        // 上移现有的报错div
        this.moveUpExistingErrors();
        
        // 添加新的报错div
        this.errorBox.appendChild(errorDiv);
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
     * 上移现有的报错div
     */
    moveUpExistingErrors() {
        const existingErrors = Array.from(this.errorBox.children);
        existingErrors.forEach((errorDiv, index) => {
            // 为每个报错添加轻微的向上移动动画
            errorDiv.style.transform = `translateY(-${(index + 1) * 60}px)`;
            errorDiv.style.transition = 'transform 0.3s ease';
        });
    }
    
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
            
            // 重新调整剩余报错的位置
            this.repositionRemainingErrors();
        }, 300);
    }
    
    /**
     * 重新定位剩余的报错
     */
    repositionRemainingErrors() {
        const remainingErrors = Array.from(this.errorBox.children);
        remainingErrors.forEach((errorDiv, index) => {
            errorDiv.style.transform = `translateY(-${index * 60}px)`;
        });
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