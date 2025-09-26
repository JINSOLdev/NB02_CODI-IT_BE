/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import type { Request, Response } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // 쿠키 옵션 (HttpOnly RT)
  private cookieOptions() {
    const days = Number(process.env.REFRESH_EXPIRES_DAYS ?? 7);
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: days * 24 * 60 * 60 * 1000,
    };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, this.cookieOptions());
  }

  // 로그인: POST /api/auth/login
  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.auth.login(
      dto.email,
      dto.password,
    );
    this.setRefreshCookie(res, refreshToken);
    return { user, accessToken };
  }

  // 토큰 재발급: POST /api/auth/refresh
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rt = req.cookies?.refreshToken as string | undefined;
    if (!rt) throw new BadRequestException('Refresh token cookie missing');

    const { accessToken, refreshToken: newRT } = await this.auth.refresh(rt);

    this.setRefreshCookie(res, newRT); // 새 RT로 교체 저장
    return { accessToken };
  }

  // 로그아웃: POST /api/auth/logout
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.user.userId);
    res.clearCookie('refreshToken', this.cookieOptions());
    return { message: '성공적으로 로그아웃되었습니다.' };
  }
}
