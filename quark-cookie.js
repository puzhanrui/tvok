// 夸克网盘Cookie获取脚本
// 适用于Surge 5

const cookieName = "夸克网盘Cookie";
const cookieKey = "quark_cookie_v3";
const statusKey = "quark_cookie_status";

// 主函数
(async () => {
    // 如果是清除Cookie的请求
    if (typeof $argument !== "undefined" && $argument === "clear") {
        $persistentStore.write("", cookieKey);
        $persistentStore.write("未获取", statusKey);
        
        $notification.post(cookieName, "Cookie已清除", "请重新获取");
        $done();
        return;
    }
    
    // 如果是HTTP请求拦截
    if ($request) {
        handleRequest();
    } else {
        // 如果是面板状态检查
        showStatus();
    }
    
    $done();
})();

// 处理HTTP请求获取Cookie
function handleRequest() {
    try {
        const request = $request;
        const url = request.url;
        
        // 只处理夸克网盘的请求
        if (!url.includes("pan.quark.cn")) {
            $done({});
            return;
        }
        
        // 从请求头获取Cookie
        let cookie = request.headers["Cookie"] || request.headers["cookie"];
        
        if (!cookie) {
            // 尝试从Set-Cookie响应头获取
            if ($response && $response.headers) {
                const setCookie = $response.headers["Set-Cookie"] || $response.headers["set-cookie"];
                if (setCookie) {
                    cookie = extractCookieFromSetCookie(setCookie);
                }
            }
        }
        
        if (cookie) {
            // 清理和格式化Cookie
            cookie = cleanCookie(cookie);
            
            // 保存Cookie
            $persistentStore.write(cookie, cookieKey);
            
            // 保存状态
            const status = `已获取 (${new Date().toLocaleDateString()})`;
            $persistentStore.write(status, statusKey);
            
            // 发送通知
            $notification.post(cookieName, "Cookie获取成功", "Cookie已保存，可用于签到");
            
            console.log(`✅ Cookie获取成功: ${cookie.substring(0, 50)}...`);
        } else {
            console.log("⚠️ 未找到Cookie");
        }
        
    } catch (error) {
        console.log(`❌ Cookie获取失败: ${error}`);
    }
    
    $done({});
}

// 显示Cookie状态
function showStatus() {
    const status = $persistentStore.read(statusKey) || "未获取";
    const cookie = $persistentStore.read(cookieKey);
    
    if (cookie) {
        // 解析Cookie中的关键信息
        const cookieInfo = parseCookieInfo(cookie);
        let message = `状态: ${status}\n`;
        
        if (cookieInfo.qd_uid) {
            message += `用户ID: ${cookieInfo.qd_uid}\n`;
        }
        if (cookieInfo.token) {
            message += `Token: ${cookieInfo.token.substring(0, 10)}...\n`;
        }
        
        message += `获取时间: ${new Date().toLocaleString()}`;
        
        $notification.post(cookieName, "Cookie状态", message);
    } else {
        $notification.post(cookieName, "Cookie未获取", "请访问夸克网盘获取Cookie");
    }
}

// 工具函数：从Set-Cookie头提取Cookie
function extractCookieFromSetCookie(setCookie) {
    if (Array.isArray(setCookie)) {
        return setCookie.map(c => c.split(';')[0]).join('; ');
    } else if (typeof setCookie === 'string') {
        return setCookie.split(';')[0];
    }
    return '';
}

// 工具函数：清理Cookie
function cleanCookie(cookie) {
    // 移除多余的空格和换行
    let cleaned = cookie.replace(/\s+/g, '').trim();
    
    // 确保以分号分隔
    if (!cleaned.endsWith(';')) {
        cleaned += ';';
    }
    
    return cleaned;
}

// 工具函数：解析Cookie信息
function parseCookieInfo(cookie) {
    const info = {};
    const parts = cookie.split(';');
    
    for (let part of parts) {
        const [key, value] = part.split('=');
        if (key && value) {
            const trimmedKey = key.trim();
            if (trimmedKey.includes('qd_uid')) {
                info.qd_uid = value.trim();
            }
            if (trimmedKey.includes('token')) {
                info.token = value.trim();
            }
        }
    }
    
    return info;
}