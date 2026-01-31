#!name=夸克网盘Cookie获取
#!desc=自动获取夸克网盘Cookie，用于签到脚本
#!author=Generated
#!date=2024-01-20
#!module=quark-cookie

[Script]
# HTTP拦截获取Cookie
quark-cookie-get = type=http-request, pattern=^https?:\/\/pan\.quark\.cn, script-path= https://raw.githubusercontent.com/puzhanrui/tvok/refs/heads/main/quark-cookie.js, requires-body=true, timeout=10

# 清除Cookie脚本
quark-cookie-clear = type=generic, script-path= https://raw.githubusercontent.com/puzhanrui/tvok/refs/heads/main/quark-cookie.js, argument=clear, timeout=5

[MITM]
# 夸克网盘域名
hostname = pan.quark.cn, drive-pc.quark.cn

[Panel]
# 获取Cookie面板按钮
quark-get-cookie = script-name=quark-cookie-get, title="获取夸克Cookie", content="点击后访问夸克网盘", icon=key.fill, color=#FF9500

# Cookie状态显示
quark-cookie-status = script-name=quark-cookie-get, title="夸克Cookie状态", content="未获取", update-interval=3600