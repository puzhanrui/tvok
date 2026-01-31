// 夸克网盘签到脚本 for Surge
// 配置步骤：
// 1. 在 [Script] 部分添加此脚本
// 2. 在 [MITM] 添加 hostname = pan.quark.cn
// 3. 在面板中手动运行一次以获取Cookie

const cookieName = "夸克网盘"
const cookieKey = "quark_cookie"
const authUrl = "https://pan.quark.cn"
const signUrl = "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/info"

let headers = $request.headers
let body = $response.body

// 获取Cookie
if ($request && $request.url.includes("pan.quark.cn")) {
    let cookie = headers['Cookie'] || headers['cookie']
    if (cookie) {
        $persistentStore.write(cookie, cookieKey)
        $notification.post("夸克网盘", "Cookie获取成功", "请手动运行签到")
    }
}

// 签到函数
async function sign() {
    let cookie = $persistentStore.read(cookieKey)
    
    if (!cookie) {
        $notification.post(cookieName, "签到失败", "未获取到Cookie")
        return
    }

    // 获取签到信息
    let infoRequest = {
        url: signUrl + "?pr=ucpro&fr=pc",
        headers: {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    }

    try {
        let infoResponse = await $http.get(infoRequest)
        let infoData = JSON.parse(infoResponse.body)
        
        if (infoData.data && infoData.data.sign) {
            let signData = infoData.data.sign
            let message = `已连续签到 ${signData.sign_daily_days} 天`
            
            // 如果今天未签到，执行签到
            if (!signData.is_sign_today) {
                let signRequest = {
                    url: "https://drive-pc.quark.cn/1/clouddrive/capacity/growth/sign",
                    headers: {
                        "Cookie": cookie,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({})
                }
                
                let signResponse = await $http.post(signRequest)
                let result = JSON.parse(signResponse.body)
                
                if (result.data && result.data.sign_daily_reward) {
                    let reward = result.data.sign_daily_reward
                    message += `\n今日签到获得：${reward.value}${reward.unit}`
                }
            } else {
                message += "\n今日已签到"
            }
            
            // 显示容量信息
            if (infoData.data.capacity) {
                let cap = infoData.data.capacity
                message += `\n总容量：${(cap.total / 1024 / 1024 / 1024).toFixed(2)}GB`
                message += `\n已用：${(cap.used / 1024 / 1024 / 1024).toFixed(2)}GB`
            }
            
            $notification.post(cookieName, "签到成功", message)
        }
    } catch (error) {
        $notification.post(cookieName, "签到失败", error.message || "网络错误")
    }
}

// 手动运行入口
if (typeof $argument != "undefined") {
    sign()
}

// 定时任务入口
if ($request && $request.url.includes("pan.quark.cn")) {
    // 这里可以添加自动签到的逻辑
    // 建议使用定时触发
}