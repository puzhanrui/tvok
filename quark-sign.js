// ============================================================
// 什么值得买 (SMZDM) 每日签到脚本 for Surge 5
// 类型：cron (定时任务)
// 支持：网页端签到（只需 Cookie）/ App 端签到（需 sk，更稳定）
// ------------------------------------------------------------
// Surge 配置：
//   cron "0 9 * * *" script-path=smzdm_checkin.js, tag=SMZDM每日签到
//
// 说明：
//   - 默认走【网页端】签到，只需 Cookie，最简单。
//   - 若你在持久化里存了 smzdm_sk（安卓 App 抓包得到），会自动切换为
//     【App 端】签到，签名更稳定、Cookie 有效期更长。
//   - 写入 sk：在 Surge「工具 → 脚本 → 编辑器」执行
//       $persistentStore.write('你的sk值', 'smzdm_sk'); $done();
// ============================================================

(function () {
  'use strict';

  const cookieKey = 'smzdm_cookie';
  const skKey = 'smzdm_sk';

  const cookie = $persistentStore.read(cookieKey);
  if (!cookie) {
    $notify('什么值得买签到', '❌ 未配置 Cookie', '请先运行「SMZDM获取Cookie」脚本（需开启 MITM 并访问一次 App/网页）');
    $done();
    return;
  }

  const sk = $persistentStore.read(skKey);
  if (sk && sk.trim().length > 0) {
    appCheckin(cookie, sk.trim());
  } else {
    webCheckin(cookie);
  }

  // ===================== 网页端签到（默认） =====================
  function webCheckin(cookie) {
    const url = 'https://www.smzdm.com/api/user/checkin';
    const headers = {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Referer': 'https://www.smzdm.com/',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9'
    };

    $httpClient.get({ url: url, headers: headers }, function (error, response, data) {
      if (error) {
        $notify('什么值得买签到', '❌ 请求失败', String(error));
        $done();
        return;
      }
      parseResult(data, '网页端');
    });
  }

  // ===================== App 端签到（可选） =====================
  function appCheckin(cookie, sk) {
    const url = 'https://user-api.smzdm.com/checkin';
    const now = Date.now();
    const time = String(now).slice(0, 10) + '000';
    const v = '9.9.12';
    // token 来自 Cookie 中的 sess 字段；抓不到则尝试匹配 数字_数字_字符串 格式
    let token = '';
    const sessMatch = cookie.match(/sess=([^;]+)/);
    if (sessMatch) token = decodeURIComponent(sessMatch[1]);
    if (!token) {
      const m = cookie.match(/(\d+_\d+_[A-Za-z0-9]+)/);
      if (m) token = m[1];
    }
    const zdmKey = 'wRRT$gJ/q.X24poeBInlUJC';
    const raw = 'f=android&sk=' + sk + '&time=' + time + '&token=' + token + '&v=' + v + '&weixin=1&key=' + zdmKey;
    const sign = md5(raw);

    const body = 'f=android&sk=' + sk + '&time=' + time + '&token=' + token + '&v=' + v + '&weixin=1&sign=' + sign;
    const headers = {
      'Cookie': cookie,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'smzdm 9.9.12 rv:1175 (iPhone 11; iOS 15.4; zh_CN)/iphone_smzdmapp/9.9.12',
      'request_key': String(Math.floor(Math.random() * 90000000) + 10000000) + now,
      'Accept': '*/*',
      'Accept-Language': 'zh-Hans-CN;q=1'
    };

    $httpClient.post({ url: url, headers: headers, body: body }, function (error, response, data) {
      if (error) {
        $notify('什么值得买签到', '❌ 请求失败', String(error));
        $done();
        return;
      }
      parseResult(data, 'App端');
    });
  }

  // ===================== 结果解析 =====================
  function parseResult(data, mode) {
    try {
      const text = typeof data === 'string' ? data : String(data);
      let json;
      // 兼容 jsonp 包裹：jQueryxxx({...})
      const m = text.match(/^\s*[a-zA-Z_]+\(([\s\S]*)\)\s*;?\s*$/);
      if (m) {
        json = JSON.parse(m[1]);
      } else {
        json = JSON.parse(text);
      }

      const ec = json.error_code;
      let msg;
      if (ec === 0 || ec === '0') {
        const d = json.data || {};
        const days = d.continue_checkin_days || d.checkin_num || d.daily_num || '?';
        const gold = d.cgold || d.gold || '';
        const point = d.cpoints || d.point || '';
        msg = '签到成功 🎉\n已连续签到 ' + days + ' 天'
            + (gold ? '\n金币 ' + gold : '')
            + (point ? ' / 积分 ' + point : '');
      } else if (json.error_msg) {
        msg = '签到失败：' + json.error_msg;
      } else if (/签到成功|success/i.test(text)) {
        msg = '签到成功 🎉';
      } else {
        msg = '响应：' + text.slice(0, 80);
      }

      $notify('什么值得买签到 (' + mode + ')', '完成', msg);
    } catch (e) {
      const text = typeof data === 'string' ? data : String(data);
      if (/签到成功|success/i.test(text)) {
        $notify('什么值得买签到 (' + mode + ')', '完成', '签到成功 🎉');
      } else {
        $notify('什么值得买签到 (' + mode + ')', '响应异常', text.slice(0, 80));
      }
    }
    $done();
  }

  // ===================== MD5（App 端签名用，blueimp 实现，已用 Node crypto 校验） =====================
  function md5(s) {
    function safeAdd(x, y) {
      var lsw = (x & 0xffff) + (y & 0xffff);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xffff);
    }
    function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
    function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
    function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
    function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
    function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
    function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }
    function binlMD5(x, len) {
      x[len >> 5] |= 0x80 << (len % 32);
      x[(((len + 64) >>> 9) << 4) + 14] = len;
      var i, olda, oldb, oldc, oldd;
      var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
      for (i = 0; i < x.length; i += 16) {
        olda = a; oldb = b; oldc = c; oldd = d;
        a = md5ff(a, b, c, d, x[i+0], 7, -680876936); d = md5ff(d, a, b, c, x[i+1], 12, -389564586); c = md5ff(c, d, a, b, x[i+2], 17, 606105819); b = md5ff(b, c, d, a, x[i+3], 22, -1044525330);
        a = md5ff(a, b, c, d, x[i+4], 7, -176418897); d = md5ff(d, a, b, c, x[i+5], 12, 1200080426); c = md5ff(c, d, a, b, x[i+6], 17, -1473231341); b = md5ff(b, c, d, a, x[i+7], 22, -45705983);
        a = md5ff(a, b, c, d, x[i+8], 7, 1770035416); d = md5ff(d, a, b, c, x[i+9], 12, -1958414417); c = md5ff(c, d, a, b, x[i+10], 17, -42063); b = md5ff(b, c, d, a, x[i+11], 22, -1990404162);
        a = md5ff(a, b, c, d, x[i+12], 7, 1804603682); d = md5ff(d, a, b, c, x[i+13], 12, -40341101); c = md5ff(c, d, a, b, x[i+14], 17, -1502002290); b = md5ff(b, c, d, a, x[i+15], 22, 1236535329);
        a = md5gg(a, b, c, d, x[i+1], 5, -165796510); d = md5gg(d, a, b, c, x[i+6], 9, -1069501632); c = md5gg(c, d, a, b, x[i+11], 14, 643717713); b = md5gg(b, c, d, a, x[i+0], 20, -373897302);
        a = md5gg(a, b, c, d, x[i+5], 5, -701558691); d = md5gg(d, a, b, c, x[i+10], 9, 38016083); c = md5gg(c, d, a, b, x[i+15], 14, -660478335); b = md5gg(b, c, d, a, x[i+4], 20, -405537848);
        a = md5gg(a, b, c, d, x[i+9], 5, 568446438); d = md5gg(d, a, b, c, x[i+14], 9, -1019803690); c = md5gg(c, d, a, b, x[i+3], 14, -187363961); b = md5gg(b, c, d, a, x[i+8], 20, 1163531501);
        a = md5gg(a, b, c, d, x[i+13], 5, -1444681467); d = md5gg(d, a, b, c, x[i+2], 9, -51403784); c = md5gg(c, d, a, b, x[i+7], 14, 1735328473); b = md5gg(b, c, d, a, x[i+12], 20, -1926607734);
        a = md5hh(a, b, c, d, x[i+5], 4, -378558); d = md5hh(d, a, b, c, x[i+8], 11, -2022574463); c = md5hh(c, d, a, b, x[i+11], 16, 1839030562); b = md5hh(b, c, d, a, x[i+14], 23, -35309556);
        a = md5hh(a, b, c, d, x[i+1], 4, -1530992060); d = md5hh(d, a, b, c, x[i+4], 11, 1272893353); c = md5hh(c, d, a, b, x[i+7], 16, -155497632); b = md5hh(b, c, d, a, x[i+10], 23, -1094730640);
        a = md5hh(a, b, c, d, x[i+13], 4, 681279174); d = md5hh(d, a, b, c, x[i+0], 11, -358537222); c = md5hh(c, d, a, b, x[i+3], 16, -722521979); b = md5hh(b, c, d, a, x[i+6], 23, 76029189);
        a = md5hh(a, b, c, d, x[i+9], 4, -640364487); d = md5hh(d, a, b, c, x[i+12], 11, -421815835); c = md5hh(c, d, a, b, x[i+15], 16, 530742520); b = md5hh(b, c, d, a, x[i+2], 23, -995338651);
        a = md5ii(a, b, c, d, x[i+0], 6, -198630844); d = md5ii(d, a, b, c, x[i+7], 10, 1126891415); c = md5ii(c, d, a, b, x[i+14], 15, -1416354905); b = md5ii(b, c, d, a, x[i+5], 21, -57434055);
        a = md5ii(a, b, c, d, x[i+12], 6, 1700485571); d = md5ii(d, a, b, c, x[i+3], 10, -1894986606); c = md5ii(c, d, a, b, x[i+10], 15, -1051523); b = md5ii(b, c, d, a, x[i+1], 21, -2054922799);
        a = md5ii(a, b, c, d, x[i+8], 6, 1873313359); d = md5ii(d, a, b, c, x[i+15], 10, -30611744); c = md5ii(c, d, a, b, x[i+6], 15, -1560198380); b = md5ii(b, c, d, a, x[i+13], 21, 1309151649);
        a = md5ii(a, b, c, d, x[i+4], 6, -145523070); d = md5ii(d, a, b, c, x[i+11], 10, -1120210379); c = md5ii(c, d, a, b, x[i+2], 15, 718787259); b = md5ii(b, c, d, a, x[i+9], 21, -343485551);
        a = safeAdd(a, olda); b = safeAdd(b, oldb); c = safeAdd(c, oldc); d = safeAdd(d, oldd);
      }
      return [a, b, c, d];
    }
    function binl2rstr(input) {
      var i, output = '', length32 = input.length * 32;
      for (i = 0; i < length32; i += 8) output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff);
      return output;
    }
    function rstr2binl(input) {
      var i, output = [];
      output[(input.length >> 2) - 1] = undefined;
      for (i = 0; i < input.length * 8; i += 8) output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32);
      return output;
    }
    function rstr2hex(input) {
      var hexTab = '0123456789abcdef', output = '', x, i;
      for (i = 0; i < input.length; i++) {
        x = input.charCodeAt(i);
        output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f);
      }
      return output;
    }
    function rstrMD5(str) { return binl2rstr(binlMD5(rstr2binl(str), str.length * 8)); }
    function utf8Encode(input) { return unescape(encodeURIComponent(input)); }
    function rawMD5(str) { return rstrMD5(utf8Encode(str)); }
    function hexMD5(str) { return rstr2hex(rawMD5(str)); }
    return hexMD5(s);
  }
})();
