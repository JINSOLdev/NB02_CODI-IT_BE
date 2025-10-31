import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateInquiryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  @IsOptional()
  isSecret?: boolean;
}
