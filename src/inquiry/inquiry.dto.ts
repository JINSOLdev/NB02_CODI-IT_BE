import { AnswerStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
  IsString,
  MinLength,
} from 'class-validator';

export class GetInquiriesDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 16;

  @IsOptional()
  @IsEnum(AnswerStatus)
  status?: AnswerStatus;
}

export class UpdateInquiryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsBoolean()
  isSecret: boolean;
}

export class ReplyContentDto {
  @IsString()
  @MinLength(1)
  content: string;
}
