const GOOGLE_OAUTH_HANDOFF_PARAM = 'startGoogleOAuth';

export function isLikelyInAppBrowser(userAgent: string): boolean {
  const normalized = userAgent.toLowerCase();
  return [
    'kakaotalk',
    'kakaostory',
    'instagram',
    'fbav',
    'fban',
    'line/',
    'naver',
    'everytimeapp',
    'twitter',
    'micromessenger',
  ].some((token) => normalized.includes(token));
}

export function isAndroidUserAgent(userAgent: string): boolean {
  return userAgent.toLowerCase().includes('android');
}

export function shouldUseAndroidBrowserHandoff(userAgent: string): boolean {
  return isAndroidUserAgent(userAgent) && isLikelyInAppBrowser(userAgent);
}

export function hasGoogleOAuthHandoffParam(search: string): boolean {
  return new URLSearchParams(search).get(GOOGLE_OAUTH_HANDOFF_PARAM) === '1';
}

export function createGoogleOAuthHandoffUrl(currentUrl: URL): URL {
  const handoffUrl = new URL(currentUrl.toString());
  handoffUrl.searchParams.set(GOOGLE_OAUTH_HANDOFF_PARAM, '1');
  return handoffUrl;
}

export function removeGoogleOAuthHandoffParam(currentUrl: URL): URL {
  const cleanUrl = new URL(currentUrl.toString());
  cleanUrl.searchParams.delete(GOOGLE_OAUTH_HANDOFF_PARAM);
  return cleanUrl;
}

export function buildAndroidBrowserIntentUrl(targetUrl: URL): string {
  const scheme = targetUrl.protocol.replace(':', '');
  const pathAndQuery = `${targetUrl.host}${targetUrl.pathname}${targetUrl.search}`;

  return (
    `intent://${pathAndQuery}` +
    `#Intent;scheme=${scheme};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;` +
    `S.browser_fallback_url=${encodeURIComponent(targetUrl.toString())};end`
  );
}
