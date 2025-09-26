import { IsString, IsOptional } from 'class-validator';

export class UpdateStoreDto {
  @IsString() @IsOptional() name: string;
  @IsString() @IsOptional() address: string;
  @IsString() @IsOptional() detailAddress: string;
  @IsString() @IsOptional() phoneNumber: string;
  @IsString() @IsOptional() content: string;
  @IsString() @IsOptional() image?: string | null;
}
