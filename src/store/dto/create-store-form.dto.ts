import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreFormDto {
  @ApiProperty({ description: '스토어명' })
  storeName: string;

  @ApiProperty({ description: '기본 주소', name: 'address.basic' })
  'address.basic': string;

  @ApiProperty({ description: '상세 주소(선택)', name: 'address.detail' })
  'address.detail'?: string;

  @ApiProperty({ description: '전화번호' })
  phoneNumber: string;

  @ApiProperty({ description: '스토어 설명' })
  description: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '대표 이미지 파일(선택)',
  })
  image?: any;
}
