import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: '홍길동',
    description: '사용자 이름',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'test@example.com',
    description: '사용자 이메일 주소',
  })
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password1234',
    description: '비밀번호 (최소 8자 이상)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    example: 'BUYER',
    description: '사용자 타입 (BUYER 또는 SELLER)',
    enum: UserType,
  })
  @IsOptional()
  @IsEnum(UserType, { message: 'type must be BUYER or SELLER' })
  type!: UserType; // 'BUYER' | 'SELLER'
}
