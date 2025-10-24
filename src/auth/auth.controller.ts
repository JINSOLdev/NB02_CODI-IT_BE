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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // 로그인: POST /api/auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '이메일과 비밀번호로 로그인합니다.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          role: 'BUYER',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 또는 비밀번호 오류' })
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
  @ApiOperation({
    summary: '토큰 재발급',
    description: 'Refresh Token 쿠키를 사용하여 Access Token을 재발급합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '재발급 성공',
    schema: { example: { accessToken: 'new-access-token...' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Refresh Token이 없거나 유효하지 않음',
  })
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
  @ApiOperation({
    summary: '로그아웃',
    description:
      '현재 로그인한 사용자를 로그아웃하고 Refresh Token 쿠키를 삭제합니다.',
  })
  @ApiBearerAuth() // JWT 인증 필요 표시
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
    schema: { example: { message: '성공적으로 로그아웃되었습니다.' } },
  })
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(String(req.user.userId));
    clearRefreshCookie(res);
    return { message: '성공적으로 로그아웃되었습니다.' };
  }
}
