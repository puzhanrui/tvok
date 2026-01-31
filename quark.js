// 夸克网盘签到脚本 for Surge 5
// 支持自动获取Cookie和每日签到
// 使用方法：
// 1. 在模块中导入此脚本
// 2. 访问一次夸克网盘网页版获取Cookie
// 3. 设置定时任务或手动运行

const $ = new API("quark-sign", true);
const cookieName = "夸克网盘";
const cookieKey = "quark_cookie_v2";

// API接口
const apis = {
    // 签到状态查询
    signInfo: "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/info?pr=ucpro&fr=pc",
    // 执行签到
    doSign: "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/sign",
    // 任务列表
    tasks: "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/tasks",
    // 领取任务奖励
    receiveTask: "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/task/reward"
};

// 工具函数：格式化存储大小
function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// 工具函数：获取当前时间
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// 获取Cookie处理器
function getCookieHandler(event) {
    try {
        const request = event.request;
        const headers = request.headers;
        
        // 从请求头中提取Cookie
        let cookie = headers['Cookie'] || headers['cookie'];
        
        if (cookie && request.url.includes('pan.quark.cn')) {
            // 保存Cookie
            $.write(cookie, cookieKey);
            
            $.notify({
                title: cookieName,
                subtitle: "Cookie获取成功",
                message: "Cookie已保存，请手动运行签到测试",
                sound: "glass"
            });
            
            $.log(`✅ Cookie获取成功: ${cookie.substring(0, 50)}...`);
        }
    } catch (error) {
        $.log(`❌ 获取Cookie失败: ${error}`);
    }
}

// 主签到函数
async function signTask() {
    try {
        // 读取Cookie
        const cookie = $.read(cookieKey);
        
        if (!cookie) {
            $.notify({
                title: cookieName,
                subtitle: "签到失败",
                message: "未找到Cookie，请先访问夸克网盘网页版",
                sound: "failure"
            });
            return;
        }
        
        // 请求头配置
        const headers = {
            'Cookie': cookie,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://pan.quark.cn/',
            'Origin': 'https://pan.quark.cn'
        };
        
        let finalMessage = '';
        let totalReward = 0;
        
        // 1. 获取签到信息
        $.log("📋 获取签到信息...");
        const infoResponse = await $.http.get({
            url: apis.signInfo,
            headers: headers
        });
        
        if (infoResponse.statusCode !== 200) {
            throw new Error(`获取信息失败: ${infoResponse.statusCode}`);
        }
        
        const infoData = JSON.parse(infoResponse.body);
        
        if (infoData.status !== 200) {
            throw new Error(`API返回错误: ${infoData.message}`);
        }
        
        const signData = infoData.data?.sign;
        const capacityData = infoData.data?.capacity;
        
        if (!signData) {
            throw new Error('无法获取签到数据');
        }
        
        // 显示基本信息
        const signDays = signData.sign_daily_days || 0;
        const isSigned = signData.is_sign_today || false;
        
        finalMessage += `📅 连续签到: ${signDays}天\n`;
        
        // 显示容量信息
        if (capacityData) {
            const totalSize = capacityData.total || 0;
            const usedSize = capacityData.used || 0;
            const freeSize = capacityData.free || 0;
            
            finalMessage += `💾 总容量: ${formatSize(totalSize)}\n`;
            finalMessage += `📊 已使用: ${formatSize(usedSize)}\n`;
            finalMessage += `🆓 剩余空间: ${formatSize(freeSize)}\n`;
        }
        
        // 2. 执行签到（如果未签到）
        if (!isSigned) {
            $.log("🔄 执行签到...");
            const signResponse = await $.http.post({
                url: apis.doSign,
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            if (signResponse.statusCode !== 200) {
                throw new Error(`签到失败: ${signResponse.statusCode}`);
            }
            
            const signResult = JSON.parse(signResponse.body);
            
            if (signResult.status === 200 && signResult.data) {
                const reward = signResult.data.sign_daily_reward;
                if (reward) {
                    const rewardValue = reward.value || 0;
                    const rewardUnit = reward.unit || '';
                    totalReward += rewardValue;
                    finalMessage += `🎁 签到奖励: +${rewardValue}${rewardUnit}\n`;
                }
            } else {
                $.log(`⚠️ 签到结果异常: ${signResult.message}`);
            }
        } else {
            finalMessage += "✅ 今日已签到\n";
        }
        
        // 3. 获取任务列表（可选）
        try {
            $.log("📋 获取任务列表...");
            const tasksResponse = await $.http.get({
                url: apis.tasks,
                headers: headers
            });
            
            if (tasksResponse.statusCode === 200) {
                const tasksData = JSON.parse(tasksResponse.body);
                if (tasksData.status === 200 && tasksData.data) {
                    const taskList = tasksData.data.tasks || [];
                    
                    // 检查可完成的任务
                    for (const task of taskList) {
                        if (task.complete_status === 2) { // 2表示任务已完成可领取
                            $.log(`🎯 发现可领取任务: ${task.name}`);
                            
                            const taskResponse = await $.http.post({
                                url: apis.receiveTask,
                                headers: {
                                    ...headers,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ task_id: task.task_id })
                            });
                            
                            if (taskResponse.statusCode === 200) {
                                const taskResult = JSON.parse(taskResponse.body);
                                if (taskResult.status === 200 && taskResult.data) {
                                    const reward = taskResult.data.reward;
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
            $.log(`⚠️ 任务处理跳过: ${taskError}`);
        }
        
        // 汇总信息
        if (totalReward > 0) {
            finalMessage += `💰 今日总计: +${totalReward}MB\n`;
        }
        
        finalMessage += `⏰ 执行时间: ${getCurrentTime()}`;
        
        // 发送通知
        $.notify({
            title: cookieName,
            subtitle: isSigned ? "签到检查完成" : "签到成功",
            message: finalMessage,
            sound: isSigned ? "clock" : "cash"
        });
        
        $.log(`✅ 签到完成: ${finalMessage}`);
        
    } catch (error) {
        $.notify({
            title: cookieName,
            subtitle: "签到失败",
            message: error.message || "未知错误",
            sound: "failure"
        });
        $.log(`❌ 签到失败: ${error.stack}`);
    }
}

// Surge 5 兼容性封装
class API {
    constructor(name, debug = false) {
        this.name = name;
        this.debug = debug;
    }
    
    read(key) {
        try {
            return $persistentStore.read(key);
        } catch (e) {
            this.log(`读取存储失败: ${e}`);
            return null;
        }
    }
    
    write(value, key) {
        try {
            $persistentStore.write(value, key);
            return true;
        } catch (e) {
            this.log(`写入存储失败: ${e}`);
            return false;
        }
    }
    
    notify(options) {
        try {
            $notification.post(options.title, options.subtitle, options.message, {
                url: options.url || "",
                sound: options.sound || ""
            });
        } catch (e) {
            this.log(`发送通知失败: ${e}`);
        }
    }
    
    async http(request) {
        return new Promise((resolve, reject) => {
            try {
                const method = request.method?.toUpperCase() || 'GET';
                const httpMethod = method === 'POST' ? $http.post : 
                                 method === 'PUT' ? $http.put : 
                                 method === 'DELETE' ? $http.delete : $http.get;
                
                httpMethod({
                    url: request.url,
                    headers: request.headers || {},
                    body: request.body
                }, (error, response, body) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({
                            statusCode: response.status,
                            headers: response.headers,
                            body: body
                        });
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }
    
    log(message) {
        if (this.debug) {
            console.log(`[${this.name}] ${message}`);
        }
    }
}

// 主函数
(async () => {
    // 根据传入参数决定执行逻辑
    if (typeof $argument !== "undefined") {
        // 从面板按钮点击触发
        if ($argument === "getcookie") {
            // 这里需要配合HTTP拦截获取Cookie
            $.notify({
                title: cookieName,
                subtitle: "提示",
                message: "请访问 https://pan.quark.cn 获取Cookie",
                sound: "bell"
            });
        } else {
            await signTask();
        }
    } else if ($request) {
        // HTTP请求拦截
        getCookieHandler({ request: $request });
    } else {
        // 定时任务触发
        await signTask();
    }
})().catch(error => {
    $.log(`脚本执行异常: ${error}`);
});