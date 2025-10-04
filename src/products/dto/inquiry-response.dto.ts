import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateInquiryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  @IsOptional()
  isSecret?: boolean = false;
}
