import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() storeName: string;
  @ApiProperty() phoneNumber: string;
  @ApiProperty() description: string;
  @ApiPropertyOptional() address: { basic: string; detail?: string };
  @ApiProperty() image?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
