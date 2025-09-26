import type { Response, CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken' as const;

export const getRefreshCookieOptions = (): CookieOptions => {
  const days = Number(process.env.REFRESH_EXPIRES_DAYS ?? 7);

  const sameSite: CookieOptions['sameSite'] = 'lax';
  const secure = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite,
    secure,
    path: '/',
    maxAge: days * 24 * 60 * 60 * 1000,
  };
};

export const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions());
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
};
