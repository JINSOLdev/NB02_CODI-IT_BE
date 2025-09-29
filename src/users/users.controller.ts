import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserPayload } from './users.mapper';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto/update-user.dto';
import type { RequestWithUser } from '../auth/auth.types';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 회원가입: POST /api/users
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: CreateUserDto): Promise<{ user: UserPayload }> {
    return this.usersService.create(dto);
  }

  // 내 정보 조회: GET /api/users/me
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@Req() req: RequestWithUser): Promise<UserPayload> {
    return this.usersService.getMe(req.user.userId);
  }

  // 내 정보 수정 (현재 비밀번호 필수): PATCH /api/users/me
  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateMe(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateUserDto,
  ): Promise<UserPayload> {
    return this.usersService.updateMe(req.user.userId, dto);
  }

  // 내 관심 스토어 조회: GET /api/users/me/likes
  @UseGuards(AuthGuard('jwt'))
  @Get('me/likes')
  getMyLikes(@Req() req: RequestWithUser) {
    return this.usersService.getMyLikes(req.user.userId);
  }
}
