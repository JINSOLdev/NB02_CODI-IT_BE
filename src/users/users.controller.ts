import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { UserPayload } from './users.mapper';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 회원가입: POST /api/users
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '회원가입',
    description: '새로운 사용자를 등록합니다.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    schema: {
      example: {
        user: {
          id: 'u123',
          email: 'test@example.com',
          name: '홍길동',
          type: 'BUYER',
          points: '0',
          image: null,
          grade: { id: 'GREEN', name: 'GREEN', rate: 0.01, minAmount: 0 },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '중복 이메일 또는 유효성 검증 실패',
  })
  signup(@Body() dto: CreateUserDto): Promise<{ user: UserPayload }> {
    return this.usersService.create(dto);
  }

  // 내 정보 조회: GET /api/users/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: '내 정보 조회',
    description: '현재 로그인한 사용자의 정보를 조회합니다.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '내 정보 조회 성공',
    schema: {
      example: {
        id: 'u1',
        email: 'test@example.com',
        name: '홍길동',
        type: 'BUYER',
        points: 1000,
        image: null,
        grade: { id: 'GREEN', name: 'GREEN', rate: 0.01, minAmount: 0 },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  getMe(@CurrentUser() user: AuthUser): Promise<UserPayload> {
    return this.usersService.getMe(user.userId);
  }

  // 내 정보 수정 (현재 비밀번호 필수): PATCH /api/users/me
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({
    summary: '내 정보 수정',
    description: '로그인한 사용자의 정보를 수정합니다.',
  })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: '정보 수정 성공',
    schema: {
      example: {
        id: 'u1',
        email: 'test@example.com',
        name: '수정된이름',
        type: 'BUYER',
        points: 1000,
        image: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: '유효성/현재 비밀번호 오류' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateUserDto,
  ): Promise<UserPayload> {
    return this.usersService.updateMe(user.userId, dto);
  }

  // 내 관심 스토어 조회: GET /api/users/me/likes
  @UseGuards(JwtAuthGuard)
  @Get('me/likes')
  @ApiOperation({
    summary: '관심 스토어 조회',
    description: '내가 찜한 스토어 목록을 조회합니다.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '관심 스토어 목록 조회 성공',
    schema: {
      example: [
        {
          id: 'store_1',
          name: '코디잇 스토어',
          ownerId: 'u9',
          likedAt: '2025-10-17T10:00:00Z',
        },
        {
          id: 'store_2',
          name: '브리아아 패션샵',
          ownerId: 'u3',
          likedAt: '2025-10-17T10:05:00Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  getMyLikes(@CurrentUser() user: AuthUser) {
    return this.usersService.getMyLikes(user.userId);
  }

  // 회원 탈퇴: DELETE /api/users/delete
  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '회원 탈퇴',
    description: '현재 로그인한 사용자의 계정을 삭제합니다.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '회원 탈퇴 성공',
    schema: { example: { message: '회원 탈퇴가 완료되었습니다.' } },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async deleteMe(@CurrentUser() user: AuthUser): Promise<{ message: string }> {
    await this.usersService.deleteMe(user.userId);
    return { message: '회원 탈퇴가 완료되었습니다.' };
  }
}
