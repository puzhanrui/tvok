// ============================================================
// 什么值得买 (SMZDM) Cookie 获取脚本 for Surge 5
// 类型：MITM (http-request)
// 作用：拦截 smzdm 域名请求，自动提取并保存完整 Cookie
// ------------------------------------------------------------
// 配合 Surge 配置使用：
//   [MITM]
//   hostname = %APPEND% *.smzdm.com
//
//   [Script]
//   http-request ^https?://(www|zhiyou|user-api)\.smzdm\.com/ script-path=smzdm_get_cookie.js, requires-body=false, tag=SMZDM获取Cookie
// ============================================================

(function () {
  'use strict';

  const cookieKey = 'smzdm_cookie';

  try {
    const request = $request || {};
    const headers = request.headers || {};
    // Surge 会把请求头 key 统一转成小写
    const cookie = headers['Cookie'] || headers['cookie'] || '';

    if (!cookie || cookie.trim().length === 0) {
      console.log('SMZDM 获取 Cookie：请求中未携带 Cookie，跳过');
      $done();
      return;
    }

    const oldCookie = $persistentStore.read(cookieKey);
    if (oldCookie === cookie) {
      // 与已保存内容一致，无需重复提醒
      $done();
      return;
    }

    $persistentStore.write(cookie, cookieKey);
    console.log('SMZDM Cookie 已更新：' + cookie.slice(0, 60) + '...');
    $notify('什么值得买', 'Cookie 已保存 ✅', '已自动记录 Cookie，现在可以运行每日签到脚本了');
  } catch (e) {
    console.log('SMZDM 获取 Cookie 出错：' + e);
  }

  $done();
})();
