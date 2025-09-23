import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class StoreDetailDto {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() userId: string;
  @IsString() @IsNotEmpty() address: string;
  @IsString() @IsNotEmpty() detailAddress: string;
  @IsString() @IsNotEmpty() phoneNumber: string;
  @IsString() @IsNotEmpty() content: string;
  @IsString() @IsNotEmpty() image?: string;
  @IsNumber() @IsNotEmpty() favoriteCount: number;
  @IsDate() @IsNotEmpty() createdAt: Date;
  @IsDate() @IsNotEmpty() updatedAt: Date;
}
