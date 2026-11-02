/** Based on the Adblock4limbo injection script supplied by the user.
 * Original author: limbopro — https://github.com/limbopro/Adblock4limbo
 * Adapted 2026-11-02 for the three hosts in Adblock.sgmodule.
 * Preserve head attributes; skip non-HTML/errors; prevent duplicate injection.
 */
(() => {
  try {
    const match = /^https?:\/\/(www\.pornhub\.com|cn\.pornhub\.com|www\.xvideos\.com)(?:\/|$)/i.exec($request.url);
    const headers = $response.headers || {};
    const typeKey = Object.keys(headers).find(k => k.toLowerCase() === 'content-type');
    const body = $response.body;
    if (!match || Number($response.status) >= 300 || !/^text\/html(?:\s*;|\s*$)/i.test(headers[typeKey] || '') || typeof body !== 'string' || !/<head\b[^>]*>/i.test(body) || body.includes('data-adblock4limbo="merged"')) return $done({});
    const base = 'https://cdn.jsdelivr.net/gh/limbopro/Adblock4limbo@86bec52a0d06ba663b02e6cf2a1a128642e9ba87';
    const domain = match[1].toLowerCase().endsWith('pornhub.com') ? 'pornhub.com' : 'xvideos.com';
    const scripts = ['Adblock4limbo.user.js', 'Adblock4limbo.function.js', 'elementBlocker.user.js'];
    const injection = '\n<!-- data-adblock4limbo="merged" -->\n' +
      `<link rel="stylesheet" href="${base}/CSS/${domain}.css">\n` +
      scripts.map(name => `<script defer src="${base}/Adguard/${name}"></script>`).join('\n');
    const newHeaders = { ...headers };
    // External resources need to be allowed; keep unrelated isolation/framing policies.
    for (const key of Object.keys(newHeaders)) {
      if (key.toLowerCase() === 'content-security-policy') delete newHeaders[key];
    }
    $done({ headers: newHeaders, body: body.replace(/<head\b[^>]*>/i, tag => tag + injection) });
  } catch (error) {
    console.log('Adblock HTML injection: ' + error);
    $done({});
  }
})();
