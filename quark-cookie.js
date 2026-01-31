// 夸克网盘签到脚本 for Surge 5
// 支持自动获取Cookie和每日签到

const cookieName = "夸克网盘";
const cookieKey = "quark_cookie_v2";
const authUrl = "https://pan.quark.cn";
const signUrl = "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/info";

// 工具函数
function formatSize(bytes) {
    if (!bytes) return "0 B";
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// 主签到函数
async function sign() {
    let cookie = $persistentStore.read(cookieKey);
    
    if (!cookie) {
        $notification.post(cookieName, "签到失败", "未获取到Cookie，请先访问夸克网盘网页版");
        $done();
        return;
    }

    let finalMessage = '';
    let totalReward = 0;
    
    try {
        // 1. 获取签到信息
        let infoRequest = {
            url: signUrl + "?pr=ucpro&fr=pc",
            headers: {
                "Cookie": cookie,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://pan.quark.cn/"
            }
        };

        let infoResponse = await $http.get(infoRequest);
        
        if (infoResponse.status !== 200) {
            throw new Error(`获取信息失败: ${infoResponse.status}`);
        }
        
        let infoData = JSON.parse(infoResponse.body);
        
        if (infoData.status !== 200) {
            throw new Error(`API错误: ${infoData.message}`);
        }
        
        let signData = infoData.data?.sign;
        let capacityData = infoData.data?.capacity;
        
        if (!signData) {
            throw new Error('无法获取签到数据');
        }
        
        // 显示基本信息
        let signDays = signData.sign_daily_days || 0;
        let isSigned = signData.is_sign_today || false;
        
        finalMessage += `📅 连续签到: ${signDays}天\n`;
        
        // 显示容量信息
        if (capacityData) {
            let totalSize = capacityData.total || 0;
            let usedSize = capacityData.used || 0;
            
            finalMessage += `💾 总容量: ${formatSize(totalSize)}\n`;
            finalMessage += `📊 已使用: ${formatSize(usedSize)}\n`;
            
            if (capacityData.free) {
                finalMessage += `🆓 剩余空间: ${formatSize(capacityData.free)}\n`;
            }
        }
        
        // 2. 执行签到（如果未签到）
        if (!isSigned) {
            let signRequest = {
                url: "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/sign",
                headers: {
                    "Cookie": cookie,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://pan.quark.cn/",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({})
            };
            
            let signResponse = await $http.post(signRequest);
            
            if (signResponse.status !== 200) {
                throw new Error(`签到失败: ${signResponse.status}`);
            }
            
            let signResult = JSON.parse(signResponse.body);
            
            if (signResult.status === 200 && signResult.data) {
                let reward = signResult.data.sign_daily_reward;
                if (reward) {
                    let rewardValue = reward.value || 0;
                    let rewardUnit = reward.unit || 'MB';
                    totalReward += rewardValue;
                    finalMessage += `🎁 签到奖励: +${rewardValue}${rewardUnit}\n`;
                }
            }
        } else {
            finalMessage += "✅ 今日已签到\n";
        }
        
        // 3. 尝试获取任务奖励（可选）
        try {
            let taskRequest = {
                url: "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/tasks",
                headers: {
                    "Cookie": cookie,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://pan.quark.cn/"
                }
            };
            
            let taskResponse = await $http.get(taskRequest);
            
            if (taskResponse.status === 200) {
                let taskData = JSON.parse(taskResponse.body);
                if (taskData.status === 200 && taskData.data) {
                    let tasks = taskData.data.tasks || [];
                    
                    for (let task of tasks) {
                        if (task.complete_status === 2) { // 可领取
                            let receiveRequest = {
                                url: "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/task/reward",
                                headers: {
                                    "Cookie": cookie,
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({ task_id: task.task_id })
                            };
                            
                            let receiveResponse = await $http.post(receiveRequest);
                            if (receiveResponse.status === 200) {
                                let receiveData = JSON.parse(receiveResponse.body);
                                if (receiveData.status === 200 && receiveData.data) {
                                    let reward = receiveData.data.reward;
                                    if (reward) {
                                        totalReward += reward.value || 0;
                                        finalMessage += `🏆 ${task.name}: +${reward.value}${reward.unit}\n`;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (taskError) {
            // 任务处理失败不影响主流程
            console.log(`任务处理跳过: ${taskError}`);
        }
        
        // 汇总信息
        if (totalReward > 0) {
            finalMessage += `💰 今日总计: +${totalReward}MB\n`;
        }
        
        finalMessage += `⏰ 执行时间: ${getCurrentTime()}`;
        
        $notification.post(cookieName, isSigned ? "签到检查完成" : "签到成功", finalMessage);
        
    } catch (error) {
        $notification.post(cookieName, "签到失败", error.message || "网络错误");
        console.log(`签到失败: ${error}`);
    }
    
    $done();
}

// 获取Cookie处理器
function getCookie() {
    let request = $request;
    let headers = request.headers;
    
    // 从请求头中提取Cookie
    let cookie = headers['Cookie'] || headers['cookie'];
    
    if (cookie && request.url.includes('pan.quark.cn')) {
        $persistentStore.write(cookie, cookieKey);
        
        $notification.post(cookieName, "Cookie获取成功", "Cookie已保存，请手动运行签到测试");
        
        console.log(`Cookie获取成功: ${cookie.substring(0, 50)}...`);
    }
    
    $done();
}

// 主逻辑判断
if ($request) {
    // HTTP请求拦截 - 用于获取Cookie
    getCookie();
} else {
    // 定时任务或手动触发
    sign();
}