// AMDC fallback approach: https://github.com/ddgksf2013/Scripts/blob/master/amdc.js
// Scope the mock to the shared dispatch endpoint and supported app user agents.
(() => {
  const url = $request.url || "";
  const dispatch = /^https?:\/\/amdc\.m\.taobao\.com(?::(?:80|443))?\/amdc\/mobileDispatch\/?(?:\?|$)/i;
  const headers = $request.headers || {};
  const uaKey = Object.keys(headers).find(key => key.toLowerCase() === "user-agent");
  const rawUA = uaKey ? String(headers[uaKey]) : "";
  let ua = rawUA;
  try {
    ua = decodeURIComponent(rawUA);
  } catch (_) {
    // An invalid percent escape should not prevent checking literal tokens.
  }
  const supportedApp = /(?:^|[\s(;])(?:AMap|Goofish|Taobao|淘宝|闲鱼)(?=$|[\s/;)])/i;
  if (!dispatch.test(url) || !supportedApp.test(ua)) {
    $done({});
    return;
  }
  $done({
    response: {
      status: 200,
      headers: {"Content-Type": "application/json; charset=utf-8"},
      body: "{}"
    }
  });
})();
