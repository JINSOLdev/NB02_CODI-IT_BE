import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '로그인할 사용자 이메일 주소',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'securePassword123!',
    description: '사용자 비밀번호',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
