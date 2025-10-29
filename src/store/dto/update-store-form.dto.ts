import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBooleanString } from 'class-validator';

export class UpdateStoreFormDto {
  @ApiPropertyOptional({ description: '스토어명' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '기본 주소', name: 'address.basic' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: '상세 주소(선택)',
    name: 'address.detail',
  })
  @IsOptional()
  @IsString()
  detailAddress?: string;

  @ApiPropertyOptional({ description: '전화번호' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: '스토어 설명' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '대표 이미지 파일(선택)' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: '이미지 제거' })
  @IsOptional()
  @IsBooleanString()
  removeImage?: string;
}
