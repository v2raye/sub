/** Ad-only HTML styling for Surge, 2026-11-02.
 * Narrow ad selectors informed by limbopro/Adblock4limbo site CSS.
 * No browser scripts, external resources, storage, navigation or feedback.
 */
(() => {
  try {
    const match = /^https?:\/\/(www\.pornhub\.com|cn\.pornhub\.com|www\.xvideos\.com)(?:\/|$)/i.exec($request.url);
    const headers = $response.headers || {};
    const typeKey = Object.keys(headers).find(k => k.toLowerCase() === 'content-type');
    const body = $response.body;
    if (!match || Number($response.status) >= 300 || !/^text\/html(?:\s*;|\s*$)/i.test(headers[typeKey] || '') || typeof body !== 'string' || !/<head\b[^>]*>/i.test(body) || body.includes('id="surge-ad-only-style"')) return $done({});
    const selectors = match[1].toLowerCase() === 'www.xvideos.com'
      ? ['#ad-footer', '#video-sponsor-links', '.player-video.xv-cams-block', '.thumb-ad', '.video-ad']
      : ['.clearfix.watchpageAd', 'ins.adsbytrafficjunky', '.tjLinksWrapper', '.topAdContainter', '.adWrapper', '.adContainer', '.ad-link', '.ad_title', '#customSkinCTA', 'a[href^="https://ads.trafficjunky.net/"]', 'a[href^="http://ads.trafficjunky.net/"]'];
    const injection = '\n<style id="surge-ad-only-style">' + selectors.join(',') + '{display:none!important;pointer-events:none!important}</style>\n';
    const newHeaders = { ...headers };
    // Permit this inline stylesheet on these HTML pages only.
    for (const key of Object.keys(newHeaders)) {
      if (key.toLowerCase() === 'content-security-policy') delete newHeaders[key];
    }
    $done({ headers: newHeaders, body: body.replace(/<head\b[^>]*>/i, tag => tag + injection) });
  } catch (error) {
    console.log('Ad-only HTML styling: ' + error);
    $done({});
  }
})();
