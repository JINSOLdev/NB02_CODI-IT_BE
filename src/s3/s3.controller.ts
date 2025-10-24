import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3.service';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

export const imageFileFilter = (
  req,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
    return callback(
      new BadRequestException('Only image files are allowed!'),
      false,
    );
  }
  callback(null, true);
};

@Controller('api/s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @ApiOperation({ summary: '이미지 업로드' })
  @ApiBody({
    description: '이미지 업로드',
    required: true,
    type: File,
  })
  @ApiResponse({
    status: 200,
    description: '이미지 업로드 성공',
  })
  @ApiResponse({
    status: 400,
    description: '이미지 업로드 실패',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 1024 * 1024 * 10, // 파일 크기 제한 10MB
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const result = await this.s3Service.uploadFile(file);
    return result;
  }
}
