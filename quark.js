var WidgetMetadata = {
  id: "javday_pro_final_mak",
  title: "JAVDay_ovo",
  description: "简易的javday模块",
  author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
  site: "https://javday.app",
  version: "1.0.2",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    // 1. 搜索模块 (保持不变)
    {
      title: "搜索视频",
      description: "搜索JAVDay视频库",
      requiresWebView: false,
      functionName: "search",
      cacheDuration: 3600,
      params: [
        {
          name: "keyword",
          title: "女優/番號/關鍵字搜索…",
          type: "input",
          value: "",
          description: "女優/番號/關鍵字搜索…",
        },
        { 
          name: "page", 
          title: "页码", 
          type: "page", 
          description: "搜索结果页码" 
        }
      ]
    },

    // 2. 榜单模块 (合并：最新更新、人气系列、新作上市)
    {
      title: "榜单",
      description: "最新、热门及新作榜单",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "url",
          title: "选择榜单",
          type: "enumeration",
          value: "https://javday.app/label/new/",
          enumOptions: [
            { title: "🆕 最新更新", value: "https://javday.app/label/new/" },
            { title: "🔥 人气系列", value: "https://javday.app/label/hot/" },
            { title: "💿 新作上市", value: "https://javday.app/category/new-release/" }
          ]
        },
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          value: "new",
          enumOptions: [
            { title: "最新上架", value: "new" },
            { title: "人气最高", value: "popular" }
          ],
          description: "针对新作上市等分类有效"
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    },

    // 3. 类型选择模块 (合并：有码、无码、流出、杏吧)
    {
      title: "类型选择",
      description: "有码、无码、流出及杏吧",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "url",
          title: "选择类型",
          type: "enumeration",
          value: "https://javday.app/category/uncensored/",
          enumOptions: [
            { title: "🔞 无码视频", value: "https://javday.app/category/uncensored/" },
            { title: "🛡️ 有码视频", value: "https://javday.app/category/censored/" },
            { title: "💦 无码流出", value: "https://javday.app/category/uncensored-leaked/" },
            { title: "🎱 杏吧视频", value: "https://javday.app/category/sex8/" }
          ]
        },
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          value: "new",
          enumOptions: [
            { title: "最新上架", value: "new" },
            { title: "人气最高", value: "popular" }
          ]
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    },

    // 4. 国产模块 (合并：玩偶、国产AV、以及所有国产厂商)
    {
      title: "国产",
      description: "玩偶姐姐、国产AV及各大厂商",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "url",
          title: "选择分类/厂商",
          type: "enumeration",
          value: "https://javday.app/category/hongkongdoll/",
          enumOptions: [
            // 原有的玩偶和国产AV
            { title: "👯 玩偶姐姐", value: "https://javday.app/category/hongkongdoll/" },
            { title: "🇨🇳 国产 AV", value: "https://javday.app/category/chinese-av/" },
            // 以下为原厂商列表合并进来
            { title: "麻豆传媒", value: "https://javday.app/index.php/category/madou/" }, 
            { title: "果冻传媒", value: "https://javday.app/index.php/category/91zhipianchang/" }, 
            { title: "天美传媒", value: "https://javday.app/index.php/category/timi/" }, 
            { title: "星空无限", value: "https://javday.app/index.php/category/xingkong/" }, 
            { title: "皇家华人", value: "https://javday.app/index.php/category/royalasianstudio/" }, 
            { title: "蜜桃影像", value: "https://javday.app/index.php/category/mtgw/" }, 
            { title: "精东影业", value: "https://javday.app/index.php/category/jdav/" }, 
            { title: "台湾 AV", value: "https://javday.app/index.php/category/twav/" }, 
            { title: "JVID", value: "https://javday.app/index.php/category/jvid/" }, 
            { title: "萝莉社", value: "https://javday.app/index.php/category/luolisheus/" }, 
            { title: "糖心VLOG", value: "https://javday.app/index.php/category/txvlog/" }, 
            { title: "Psychoporn TW", value: "https://javday.app/index.php/category/psychoporn-tw/" } 
          ]
        },
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          value: "new",
          enumOptions: [
            { title: "最新上架", value: "new" },
            { title: "人气最高", value: "popular" }
          ]
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    }
  ]
};

// =================================================================
// 以下代码 100% 复制自原版 JAVDay.js，未做任何修改
// =================================================================

const JAVDAY_LOG_PREFIX = "ForwardWidget: JAVDay -";
const JAVDAY_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36";

function extractCategoryId(url) {
  const match = url.match(/\/([^/]+)\/?$/);
  if (match && match[1]) {
    return match[1].replace(/\/+$/, '');
  }
  
  const parts = url.split('/').filter(part => part.length > 0);
  return parts[parts.length - 1] || url.split('/').slice(-2, -1)[0] || 'unknown';
}

function buildPageUrl(baseUrl, sortBy, page) {
  const categoryId = extractCategoryId(baseUrl);
  
  const cleanBaseUrl = baseUrl.replace(/index\.php\//g, '');
  
  let path;
  if (sortBy === "popular") {
    path = `/fiter/by/hits/id/${categoryId}`;
  } else {
    path = cleanBaseUrl.includes('label/') 
      ? cleanBaseUrl.replace(/\/page\/\d+\/?$/, '')
      : `/category/${categoryId}`;
  }
  
  if (page > 1) {
    return `${path}/page/${page}/`;
  }
  
  return `${path}/`;
}

function getFullUrl(path) {
  if (path.startsWith("http")) return path;
  
  return `https://javday.app${path}`;
}

function getCoverImgSrc($item) {
  const coverElement = $item.find(".videoBox-cover");
  const styleAttr = coverElement.attr("style");
  
  if (styleAttr) {
    const match = styleAttr.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    if (match && match[1]) {
      const extractedUrl = match[1];
      
      if (extractedUrl.startsWith("//")) {
        return `https:${extractedUrl}`;
      } 
      
      if (extractedUrl.startsWith("http")) {
        return extractedUrl;
      }
      
      return `https://javday.app${extractedUrl.startsWith("/") ? "" : "/"}${extractedUrl}`;
    }
  }
  return "";
}

function extractVideoUrlFromDPlayerScript(scriptContent) {
  if (!scriptContent) return null;
  
  const regexes = [
    /video\s*:\s*{\s*[^}]*url\s*:\s*['"]([^'"]+)['"]/,
    /url\s*:\s*['"]([^'"]+\.m3u8[^'"]*)['"]/
  ];
  
  for (const regex of regexes) {
    const match = scriptContent.match(regex);
    if (match && match[1]) return match[1];
  }
  
  return null;
}

async function loadPage(params = {}) {
  const baseUrl = params.url;
  const sortBy = params.sort_by || "new";
  const page = parseInt(params.page, 10) || 1;
  
  const pagePath = buildPageUrl(baseUrl, sortBy, page);
  const targetUrl = getFullUrl(pagePath);

  try {
    const response = await Widget.http.get(targetUrl, {
      headers: {
        "User-Agent": JAVDAY_USER_AGENT,
        Referer: "https://javday.app/",
      },
    });

    if (!response?.data) {
      throw new Error("无法获取页面内容");
    }

    const $ = Widget.html.load(response.data);
    const videoItems = [];

    $(".video-wrapper .videoBox").each((index, element) => {
      const $item = $(element);
      let link = $item.attr("href");
      const title = $item.find(".videoBox-info .title").text().trim();
      const imgSrc = getCoverImgSrc($item);

      if (!link || !title) return;
      
      if (!link.startsWith("http")) {
        link = link.startsWith("//") 
          ? `https:${link}`
          : `https://javday.app${link.startsWith("/") ? "" : "/"}${link}`;
      }

      link = link.replace(/([^:]\/)\/+/g, '$1');

      videoItems.push({
        id: `${index}|${link}`,
        type: "url",
        title: title,
        imgSrc: imgSrc,
        backdropPath: imgSrc,
        link: link,
        description: `来自JAVDay | 排序:${sortBy === "new" ? "最新上架" : "人气最高"}`,
        mediaType: "movie",
      });
    });
    
    return videoItems;
  } catch (error) {
    console.error(`${JAVDAY_LOG_PREFIX} 获取视频失败: ${error.message}`);
    throw error;
  }
}

async function search(params = {}) {
  const keyword = params.keyword || "";
  const page = parseInt(params.page, 10) || 1;
  
  if (!keyword) {
    throw new Error("请输入搜索关键词");
  }

  let searchUrl;
  if (page === 1) {
    searchUrl = `https://javday.app/search/?wd=${keyword}`;
  } else {
    searchUrl = `https://javday.app/search/page/${page}/wd/${keyword}/`;
  }

  try {
    const response = await Widget.http.get(searchUrl, {
      headers: {
        "User-Agent": JAVDAY_USER_AGENT,
        Referer: "https://javday.app/",
      },
    });

    if (!response?.data) {
      throw new Error("无法获取搜索结果");
    }

    const $ = Widget.html.load(response.data);
    const videoItems = [];

    $(".video-wrapper .videoBox").each((index, element) => {
      const $item = $(element);
      let link = $item.attr("href");
      const title = $item.find(".videoBox-info .title").text().trim();
      const imgSrc = getCoverImgSrc($item);

      if (!link || !title) return;
      
      if (!link.startsWith("http")) {
        link = link.startsWith("//") 
          ? `https:${link}`
          : `https://javday.app${link.startsWith("/") ? "" : "/"}${link}`;
      }

      link = link.replace(/([^:]\/)\/+/g, '$1');

      videoItems.push({
        id: `${index}|${link}`,
        type: "url",
        title: title,
        imgSrc: imgSrc,
        backdropPath: imgSrc,
        link: link,
        description: `搜索: ${params.keyword}`,
        mediaType: "movie",
      });
    });
    
    return videoItems;
  } catch (error) {
    console.error(`${JAVDAY_LOG_PREFIX} 搜索失败: ${error.message}`);
    throw error;
  }
}

async function loadDetail(link) {
  
  try {
    const response = await Widget.http.get(link, {
      headers: {
        "User-Agent": JAVDAY_USER_AGENT,
        Referer: link,
      },
    });

    if (!response?.data) {
      throw new Error("无法获取详情页内容");
    }

    const $ = Widget.html.load(response.data);
    
    const dplayerScript = Array.from($("script"))
      .find(el => {
        const scriptContent = $(el).html();
        return scriptContent && scriptContent.includes("new DPlayer");
      });
    
    if (dplayerScript) {
      const scriptContent = $(dplayerScript).html();
      const videoUrl = extractVideoUrlFromDPlayerScript(scriptContent);
      if (videoUrl) {
        return {
          id: link,
          type: "url",
          videoUrl: videoUrl,
          customHeaders: {
            Referer: link,
            "User-Agent": JAVDAY_USER_AGENT,
          },
        };
      }
    }
    
    const videoSrc = $("video#J_prismPlayer").attr("src") || 
                   $("source[src*='.m3u8']").attr("src") ||
                   $("video source").attr("src");
    
    if (videoSrc) {
      return {
        id: link,
        type: "url",
        videoUrl: videoSrc,
        customHeaders: {
          Referer: link,
            "User-Agent": JAVDAY_USER_AGENT,
          },
        };
      }
      
      const scriptSources = Array.from($("script"))
      .map(el => $(el).html())
      .find(content => content && content.includes(".m3u8"));
    
    if (scriptSources) {
      const m3u8Match = scriptSources.match(/['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/);
      if (m3u8Match && m3u8Match[1]) {
        return {
          id: link,
          type: "url",
          videoUrl: m3u8Match[1],
          customHeaders: {
            Referer: link,
            "User-Agent": JAVDAY_USER_AGENT,
          },
        };
      }
    }

    const playerVideo = $("video[src]").attr("src") || 
                      $("iframe[src*='player']").attr("src");
    
    if (playerVideo) {
      return {
        id: link,
        type: "url",
        videoUrl: playerVideo,
        customHeaders: {
          Referer: link,
          "User-Agent": JAVDAY_USER_AGENT,
        },
      };
    }

    throw new Error("无法找到视频源");
  } catch (error) {
    console.error(`${JAVDAY_LOG_PREFIX} 加载详情失败: ${error.message}`);
    throw error;
  }
}