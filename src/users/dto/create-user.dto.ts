import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { UserType } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  // 평문 비밀번호만 받습니다. (해시는 서버에서 생성)
  @MinLength(8)
  password!: string;

  @IsEnum(UserType, { message: 'type must be BUYER or SELLER' })
  type!: UserType; // 'BUYER' | 'SELLER'
}
