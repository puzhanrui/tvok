// 夸克网盘签到脚本
// 需要先通过Cookie获取模块获取Cookie

const cookieName = "夸克网盘签到";
const cookieKey = "quark_cookie_v3";

(async () => {
    // 读取Cookie
    const cookie = $persistentStore.read(cookieKey);
    
    if (!cookie) {
        $notification.post(cookieName, "错误", "请先获取Cookie：访问夸克网盘");
        $done();
        return;
    }
    
    try {
        let message = "";
        
        // 1. 获取用户信息
        const userInfo = await getUserInfo(cookie);
        if (userInfo) {
            message += `👤 ${userInfo.nickname}\n`;
        }
        
        // 2. 获取容量信息
        const capacityInfo = await getCapacityInfo(cookie);
        if (capacityInfo) {
            message += `💾 ${capacityInfo}\n`;
        }
        
        // 3. 获取签到状态并签到
        const signResult = await processSign(cookie);
        message += signResult;
        
        // 4. 显示最后更新时间
        message += `\n⏰ ${new Date().toLocaleString()}`;
        
        $notification.post(cookieName, "签到完成", message);
        
    } catch (error) {
        $notification.post(cookieName, "签到失败", error.message);
        console.log(`签到错误: ${error}`);
    }
    
    $done();
})();

// 获取用户信息
async function getUserInfo(cookie) {
    try {
        const response = await $http.get({
            url: "https://pan.quark.cn/account/info",
            headers: {
                "Cookie": cookie,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
            }
        });
        
        if (response.status === 200) {
            const data = JSON.parse(response.body);
            if (data.data && data.data.nickname) {
                return {
                    nickname: data.data.nickname,
                    avatar: data.data.avatar
                };
            }
        }
    } catch (error) {
        // 用户信息获取失败不影响签到
    }
    return null;
}

// 获取容量信息
async function getCapacityInfo(cookie) {
    try {
        const response = await $http.get({
            url: "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/info?pr=ucpro&fr=pc",
            headers: {
                "Cookie": cookie,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
            }
        });
        
        if (response.status === 200) {
            const data = JSON.parse(response.body);
            if (data.data && data.data.capacity) {
                const cap = data.data.capacity;
                const totalGB = (cap.total / 1024 / 1024 / 1024).toFixed(2);
                const usedGB = (cap.used / 1024 / 1024 / 1024).toFixed(2);
                const freeGB = (cap.free / 1024 / 1024 / 1024).toFixed(2);
                
                return `${usedGB}GB / ${totalGB}GB (剩余 ${freeGB}GB)`;
            }
        }
    } catch (error) {
        // 容量信息获取失败不影响签到
    }
    return "容量信息获取失败";
}

// 处理签到流程
async function processSign(cookie) {
    let resultMessage = "";
    
    try {
        // 获取签到状态
        const signInfo = await getSignInfo(cookie);
        
        if (signInfo.is_sign_today) {
            resultMessage = `✅ 今日已签到 (连续${signInfo.sign_daily_days}天)`;
        } else {
            // 执行签到
            const signResult = await doSign(cookie);
            if (signResult.success) {
                resultMessage = `🎉 签到成功！\n`;
                resultMessage += `获得: ${signResult.reward}\n`;
                resultMessage += `连续签到: ${signInfo.sign_daily_days + 1}天`;
            } else {
                resultMessage = `❌ 签到失败: ${signResult.message}`;
            }
        }
        
    } catch (error) {
        resultMessage = `⚠️ 签到异常: ${error.message}`;
    }
    
    return resultMessage;
}

// 获取签到信息
async function getSignInfo(cookie) {
    const response = await $http.get({
        url: "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/info?pr=ucpro&fr=pc",
        headers: {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        }
    });
    
    if (response.status === 200) {
        const data = JSON.parse(response.body);
        if (data.data && data.data.sign) {
            return {
                is_sign_today: data.data.sign.is_sign_today,
                sign_daily_days: data.data.sign.sign_daily_days || 0
            };
        }
    }
    
    throw new Error("无法获取签到信息");
}

// 执行签到
async function doSign(cookie) {
    const response = await $http.post({
        url: "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/sign",
        headers: {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    });
    
    if (response.status === 200) {
        const data = JSON.parse(response.body);
        if (data.status === 200 && data.data) {
            const reward = data.data.sign_daily_reward;
            if (reward) {
                return {
                    success: true,
                    reward: `${reward.value || 0}${reward.unit || 'MB'}`
                };
            }
        }
        return {
            success: false,
            message: data.message || "未知错误"
        };
    }
    
    return {
        success: false,
        message: `HTTP错误: ${response.status}`
    };
}