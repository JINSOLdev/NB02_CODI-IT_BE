import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import type { RequestWithCookies, RequestWithUser } from './auth.types';
import {
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
  clearRefreshCookie,
} from './cookie.util';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // 로그인: POST /api/auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.auth.login(
      dto.email,
      dto.password,
    );
    setRefreshCookie(res, refreshToken);
    return { user, accessToken };
  }

  // 토큰 재발급: POST /api/auth/refresh
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rt = req.cookies[REFRESH_COOKIE_NAME];
    if (!rt) throw new BadRequestException('Refresh token cookie missing');

    const { accessToken, refreshToken: newRT } = await this.auth.refresh(rt);
    setRefreshCookie(res, newRT); // 새 RT로 교체 저장
    return { accessToken };
  }

  // 로그아웃: POST /api/auth/logout
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(String(req.user.userId));
    clearRefreshCookie(res);
    return { message: '성공적으로 로그아웃되었습니다.' };
  }
}
