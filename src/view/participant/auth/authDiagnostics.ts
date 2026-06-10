// Capture why Google sign-in failed for a participant.
//
// Real-world failures (some users only, regular browsers) usually leave one of
// two traces that normally disappear before anyone can read them:
//   1. An OAuth error returned by Google/Supabase in the redirect URL hash or
//      query. Supabase's `detectSessionInUrl` consumes the hash on client init,
//      and our access guard then bounces the user to `/login`, so the reason is
//      gone before the UI renders.
//   2. The browser blocking localStorage/cookies, so the session can never be
//      persisted even when sign-in succeeds (infinite return-to-login loop).
//
// We snapshot both as early as possible at app entry, log them, and stash the
// result so the login page can show the participant (and us, via screenshot) a
// concrete reason instead of a silent bounce.

export type OAuthErrorInfo = Readonly<{
  error: string;
  errorCode: string | null;
  errorDescription: string | null;
  source: 'hash' | 'query';
}>;

export type BrowserStorageProbe = Readonly<{
  localStorageAvailable: boolean;
  cookieEnabled: boolean;
}>;

export type AuthDiagnosticsReport = Readonly<{
  capturedAt: string;
  href: string;
  userAgent: string;
  embedded: boolean;
  oauthError: OAuthErrorInfo | null;
  storage: BrowserStorageProbe;
}>;

export type FrameEscapeResult = 'escaped' | 'blocked' | 'not-embedded';

type LocationLike = Readonly<{ href: string; search: string; hash: string }>;
type NavigatorLike = Readonly<{ userAgent: string; cookieEnabled: boolean }>;
type FrameContext = Readonly<{ self?: unknown; top?: unknown }>;
type WindowLike = FrameContext &
  Readonly<{
    location: LocationLike;
    navigator: NavigatorLike;
    localStorage?: Pick<Storage, 'setItem' | 'removeItem'>;
    sessionStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  }>;

const STASH_KEY = 'taglow.auth.lastDiagnostics';
const STORAGE_PROBE_KEY = '__taglow_storage_probe__';
const LOG_PREFIX = '[taglow-auth]';

// Survives the in-app /intro -> /login redirect (same JS context); sessionStorage
// is only a backup in case the page is reloaded between capture and display.
let lastReport: AuthDiagnosticsReport | null = null;

export function readOAuthError(search: string, hash: string): OAuthErrorInfo | null {
  const fromHash = parseOAuthErrorParams(stripLeading(hash, '#'));
  if (fromHash) {
    return { ...fromHash, source: 'hash' };
  }

  const fromQuery = parseOAuthErrorParams(stripLeading(search, '?'));
  if (fromQuery) {
    return { ...fromQuery, source: 'query' };
  }

  return null;
}

export function probeBrowserStorage(win: WindowLike): BrowserStorageProbe {
  return {
    localStorageAvailable: testLocalStorage(win),
    cookieEnabled: Boolean(win.navigator?.cookieEnabled),
  };
}

// Are we running inside an iframe (e.g. embedded in the school portal)? Google
// OAuth refuses to run framed, so this is a hard blocker, not a warning.
export function isEmbeddedContext(win: FrameContext): boolean {
  try {
    if (win.top == null || win.self == null) {
      return false;
    }

    return win.self !== win.top;
  } catch {
    // A cross-origin parent can make `top` access throw — that means we are framed.
    return true;
  }
}

export function buildAuthDiagnosticsReport(win: WindowLike, capturedAt: string): AuthDiagnosticsReport {
  return {
    capturedAt,
    href: win.location.href,
    userAgent: win.navigator.userAgent,
    embedded: isEmbeddedContext(win),
    oauthError: readOAuthError(win.location.search, win.location.hash),
    storage: probeBrowserStorage(win),
  };
}

export function hasReportableProblem(report: AuthDiagnosticsReport): boolean {
  return (
    report.embedded ||
    report.oauthError !== null ||
    !report.storage.localStorageAvailable ||
    !report.storage.cookieEnabled
  );
}

// Break out of an embedding iframe by navigating the top window to our own URL,
// turning the embedded view into a real top-level page where OAuth can run.
// Returns 'blocked' when a sandboxed iframe forbids top navigation.
export function escapeEmbeddedContext(): FrameEscapeResult {
  if (typeof window === 'undefined' || !isEmbeddedContext(window)) {
    return 'not-embedded';
  }

  try {
    // Cross-origin top navigation (write) is permitted; reading top.location is not.
    window.top!.location.href = window.location.href;
    return 'escaped';
  } catch {
    return 'blocked';
  }
}

export type AuthDiagnosticsMessage = Readonly<{
  title: string;
  body: string;
  code: string | null;
}>;

// Calm, participant-facing reason plus a small machine code for support screenshots.
export function describeAuthDiagnostics(
  report: AuthDiagnosticsReport,
  locale: 'ko' | 'en',
): AuthDiagnosticsMessage | null {
  const ko = locale === 'ko';

  if (report.embedded) {
    return {
      title: ko ? '학교 포털 안에서는 로그인할 수 없어요.' : "Sign-in doesn't work inside the school portal.",
      body: ko
        ? '이 설문이 다른 사이트 화면 안에 들어가 있어 Google 로그인이 차단됩니다. 아래 버튼으로 새 창에서 열어 다시 시도해주세요.'
        : 'This survey is embedded inside another site, so Google sign-in is blocked. Open it in a new window with the button below and try again.',
      code: 'embedded',
    };
  }

  if (!report.storage.localStorageAvailable || !report.storage.cookieEnabled) {
    return {
      title: ko ? '로그인 정보를 저장할 수 없어요.' : "We can't save your sign-in.",
      body: ko
        ? '브라우저가 쿠키나 저장소를 차단하고 있어요. 추적 방지나 쿠키 차단을 끄거나 다른 브라우저로 다시 시도해주세요.'
        : 'Your browser is blocking cookies or storage. Turn off tracking prevention or cookie blocking, or try another browser.',
      code: report.storage.localStorageAvailable ? 'cookies-blocked' : 'storage-blocked',
    };
  }

  const oauthError = report.oauthError;
  if (!oauthError) {
    return null;
  }

  if (oauthError.error === 'access_denied') {
    return {
      title: ko ? '로그인이 완료되지 않았어요.' : "Sign-in didn't complete.",
      body: ko ? '로그인이 취소되었습니다. 다시 시도해주세요.' : 'Sign-in was cancelled. Please try again.',
      code: formatErrorCode(oauthError),
    };
  }

  return {
    title: ko ? '로그인을 완료하지 못했어요.' : "Sign-in didn't complete.",
    body: ko
      ? '로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요. 계속 반복되면 아래 코드를 알려주세요.'
      : 'Something went wrong while signing in. Please try again shortly. If it keeps happening, share the code below.',
    code: formatErrorCode(oauthError),
  };
}

function formatErrorCode(oauthError: OAuthErrorInfo): string {
  return [oauthError.error, oauthError.errorCode].filter(Boolean).join(' / ');
}

// Called once at app entry, before Supabase/react-router can clear the URL.
export function recordAuthDiagnosticsFromWindow(): AuthDiagnosticsReport | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const report = buildAuthDiagnosticsReport(window, new Date().toISOString());
  if (!hasReportableProblem(report)) {
    return null;
  }

  lastReport = report;
  logAuthDiagnostics(report);
  trySaveStash(window, report);
  return report;
}

export function readLastAuthDiagnostics(): AuthDiagnosticsReport | null {
  if (lastReport) {
    return lastReport;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  lastReport = tryReadStash(window);
  return lastReport;
}

export function clearAuthDiagnostics(): void {
  lastReport = null;
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage?.removeItem(STASH_KEY);
  } catch {
    // Ignore storage failures; the in-memory copy is already cleared.
  }
}

export function logAuthDiagnostics(report: AuthDiagnosticsReport): void {
  if (typeof console === 'undefined') {
    return;
  }

  console.warn(`${LOG_PREFIX} sign-in diagnostics`, {
    capturedAt: report.capturedAt,
    href: report.href,
    userAgent: report.userAgent,
    oauthError: report.oauthError,
    storage: report.storage,
  });
}

function parseOAuthErrorParams(raw: string): Omit<OAuthErrorInfo, 'source'> | null {
  if (!raw) {
    return null;
  }

  const params = new URLSearchParams(raw);
  const error = params.get('error');
  if (!error) {
    return null;
  }

  return {
    error,
    errorCode: params.get('error_code'),
    errorDescription: normalizeDescription(params.get('error_description')),
  };
}

function stripLeading(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function normalizeDescription(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function testLocalStorage(win: WindowLike): boolean {
  try {
    const store = win.localStorage;
    if (!store) {
      return false;
    }

    store.setItem(STORAGE_PROBE_KEY, '1');
    store.removeItem(STORAGE_PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

function trySaveStash(win: WindowLike, report: AuthDiagnosticsReport): void {
  try {
    win.sessionStorage?.setItem(STASH_KEY, JSON.stringify(report));
  } catch {
    // Ignore; the in-memory copy survives the same-tab redirect.
  }
}

function tryReadStash(win: WindowLike): AuthDiagnosticsReport | null {
  try {
    const raw = win.sessionStorage?.getItem(STASH_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthDiagnosticsReport;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
