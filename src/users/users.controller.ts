import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserPayload } from './users.mapper';

@Controller('api/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // 회원가입: POST /api/users
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: CreateUserDto): Promise<{ user: UserPayload }> {
    return await this.users.create(dto);
  }
}
