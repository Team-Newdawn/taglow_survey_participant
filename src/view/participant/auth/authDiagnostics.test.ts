import { describe, expect, it } from 'vitest';

import {
  buildAuthDiagnosticsReport,
  describeAuthDiagnostics,
  hasReportableProblem,
  isEmbeddedContext,
  probeBrowserStorage,
  readOAuthError,
} from './authDiagnostics';

function makeWindow(overrides: {
  href?: string;
  search?: string;
  hash?: string;
  userAgent?: string;
  cookieEnabled?: boolean;
  localStorage?: Pick<Storage, 'setItem' | 'removeItem'> | undefined;
  embedded?: boolean;
}) {
  const win = {
    location: {
      href: overrides.href ?? 'https://taglow.newdawn.co.kr/survey/abc/intro',
      search: overrides.search ?? '',
      hash: overrides.hash ?? '',
    },
    navigator: {
      userAgent: overrides.userAgent ?? 'Mozilla/5.0',
      cookieEnabled: overrides.cookieEnabled ?? true,
    },
    localStorage:
      'localStorage' in overrides
        ? overrides.localStorage
        : { setItem: () => undefined, removeItem: () => undefined },
  } as {
    location: { href: string; search: string; hash: string };
    navigator: { userAgent: string; cookieEnabled: boolean };
    localStorage?: Pick<Storage, 'setItem' | 'removeItem'>;
    self?: unknown;
    top?: unknown;
  };

  win.self = win;
  win.top = overrides.embedded ? { name: 'top' } : win;
  return win;
}

describe('readOAuthError', () => {
  it('reads an error returned in the URL hash', () => {
    const result = readOAuthError(
      '',
      '#error=server_error&error_code=500&error_description=Database+error+saving+new+user',
    );

    expect(result).toEqual({
      error: 'server_error',
      errorCode: '500',
      errorDescription: 'Database error saving new user',
      source: 'hash',
    });
  });

  it('reads an error returned in the query string', () => {
    const result = readOAuthError('?error=access_denied&error_description=User+cancelled', '');

    expect(result).toEqual({
      error: 'access_denied',
      errorCode: null,
      errorDescription: 'User cancelled',
      source: 'query',
    });
  });

  it('prefers the hash when both carry an error', () => {
    const result = readOAuthError('?error=query_error', '#error=hash_error');
    expect(result?.error).toBe('hash_error');
    expect(result?.source).toBe('hash');
  });

  it('returns null when no error param is present', () => {
    expect(readOAuthError('?code=abc123', '#access_token=xyz')).toBeNull();
  });
});

describe('probeBrowserStorage', () => {
  it('reports localStorage as available when read/write succeeds', () => {
    expect(probeBrowserStorage(makeWindow({})).localStorageAvailable).toBe(true);
  });

  it('reports localStorage as unavailable when writing throws', () => {
    const blocked = makeWindow({
      localStorage: {
        setItem: () => {
          throw new Error('blocked');
        },
        removeItem: () => undefined,
      },
    });

    expect(probeBrowserStorage(blocked).localStorageAvailable).toBe(false);
  });

  it('reports localStorage as unavailable when it is missing entirely', () => {
    expect(probeBrowserStorage(makeWindow({ localStorage: undefined })).localStorageAvailable).toBe(false);
  });

  it('reflects navigator.cookieEnabled', () => {
    expect(probeBrowserStorage(makeWindow({ cookieEnabled: false })).cookieEnabled).toBe(false);
  });
});

describe('isEmbeddedContext', () => {
  it('is false when self and top are the same window', () => {
    expect(isEmbeddedContext(makeWindow({}))).toBe(false);
  });

  it('is true when running inside a frame', () => {
    expect(isEmbeddedContext(makeWindow({ embedded: true }))).toBe(true);
  });

  it('treats a cross-origin top that throws on access as embedded', () => {
    const framed = {
      get self() {
        return framed;
      },
      get top() {
        throw new Error('cross-origin');
      },
    };

    expect(isEmbeddedContext(framed)).toBe(true);
  });
});

describe('hasReportableProblem', () => {
  it('is false for a clean load', () => {
    const report = buildAuthDiagnosticsReport(makeWindow({}), '2026-06-10T00:00:00.000Z');
    expect(hasReportableProblem(report)).toBe(false);
  });

  it('is true when an OAuth error is present', () => {
    const report = buildAuthDiagnosticsReport(makeWindow({ hash: '#error=server_error' }), '2026-06-10T00:00:00.000Z');
    expect(hasReportableProblem(report)).toBe(true);
  });

  it('is true when storage is blocked', () => {
    const report = buildAuthDiagnosticsReport(makeWindow({ localStorage: undefined }), '2026-06-10T00:00:00.000Z');
    expect(hasReportableProblem(report)).toBe(true);
  });

  it('is true when embedded in a frame', () => {
    const report = buildAuthDiagnosticsReport(makeWindow({ embedded: true }), '2026-06-10T00:00:00.000Z');
    expect(hasReportableProblem(report)).toBe(true);
  });
});

describe('describeAuthDiagnostics', () => {
  it('explains an embedded frame above every other problem', () => {
    const report = buildAuthDiagnosticsReport(
      makeWindow({ embedded: true, localStorage: undefined, hash: '#error=server_error' }),
      '2026-06-10T00:00:00.000Z',
    );

    const message = describeAuthDiagnostics(report, 'ko');
    expect(message?.code).toBe('embedded');
    expect(message?.body).toContain('새 창');
  });

  it('explains a blocked storage problem before any OAuth error', () => {
    const report = buildAuthDiagnosticsReport(
      makeWindow({ localStorage: undefined, hash: '#error=server_error' }),
      '2026-06-10T00:00:00.000Z',
    );

    const message = describeAuthDiagnostics(report, 'ko');
    expect(message?.code).toBe('storage-blocked');
    expect(message?.body).toContain('쿠키');
  });

  it('treats access_denied as a cancellation', () => {
    const report = buildAuthDiagnosticsReport(makeWindow({ hash: '#error=access_denied' }), '2026-06-10T00:00:00.000Z');
    const message = describeAuthDiagnostics(report, 'ko');
    expect(message?.body).toContain('취소');
    expect(message?.code).toBe('access_denied');
  });

  it('exposes the raw error code for support on a generic failure', () => {
    const report = buildAuthDiagnosticsReport(
      makeWindow({ hash: '#error=server_error&error_code=500' }),
      '2026-06-10T00:00:00.000Z',
    );

    const message = describeAuthDiagnostics(report, 'en');
    expect(message?.code).toBe('server_error / 500');
  });

  it('returns null when there is nothing to report', () => {
    const report = buildAuthDiagnosticsReport(makeWindow({}), '2026-06-10T00:00:00.000Z');
    expect(describeAuthDiagnostics(report, 'ko')).toBeNull();
  });
});
