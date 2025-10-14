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
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { UserPayload } from './users.mapper';
import type { RequestWithUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 회원가입: POST /api/users
  @Post()
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: CreateUserDto): Promise<{ user: UserPayload }> {
    return this.usersService.create(dto);
  }

  // 내 정보 조회: GET /api/users/me
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@CurrentUser() user: RequestWithUser['user']): Promise<UserPayload> {
    return this.usersService.getMe(user.userId);
  }

  // 내 정보 수정 (현재 비밀번호 필수): PATCH /api/users/me
  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateMe(
    @CurrentUser() user: RequestWithUser['user'],
    @Body() dto: UpdateUserDto,
  ): Promise<UserPayload> {
    return this.usersService.updateMe(user.userId, dto);
  }

  // 내 관심 스토어 조회: GET /api/users/me/likes
  @UseGuards(AuthGuard('jwt'))
  @Get('me/likes')
  getMyLikes(
    @CurrentUser() user: RequestWithUser['user'],
  ): Promise<Awaited<ReturnType<UsersService['getMyLikes']>>> {
    return this.usersService.getMyLikes(user.userId);
  }

  // 회원 탈퇴: DELETE /api/users/delete
  @UseGuards(AuthGuard('jwt'))
  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  async deleteMe(
    @CurrentUser() user: RequestWithUser['user'],
  ): Promise<{ message: string }> {
    await this.usersService.deleteMe(user.userId);
    return { message: '회원 탈퇴가 완료되었습니다.' };
  }
}
