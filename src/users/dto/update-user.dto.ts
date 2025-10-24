import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: '수정된이름',
    description: '새로운 이름',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'newPassword123!',
    description: '새 비밀번호',
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    example: 'currentPassword123!',
    description: '현재 비밀번호 (필수)',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/profile.jpg',
    description: '프로필 이미지 URL',
  })
  @IsString()
  @IsOptional()
  image?: string;
}
