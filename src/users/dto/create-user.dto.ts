import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { UserType } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsEnum(UserType, { message: 'type must be BUYER or SELLER' })
  type!: UserType; // 'BUYER' | 'SELLER'
}
