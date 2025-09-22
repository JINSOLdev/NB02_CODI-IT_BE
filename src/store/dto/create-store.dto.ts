import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStoreDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() address: string;
  @IsString() @IsNotEmpty() detailAddress: string;
  @IsString() @IsNotEmpty() phoneNumber: string;
  @IsString() @IsNotEmpty() content: string;
  @IsOptional() @IsString() image?: string;
}
