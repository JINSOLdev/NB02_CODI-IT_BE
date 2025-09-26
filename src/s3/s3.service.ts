import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new InternalServerErrorException(
        'AWS credentials are not properly configured',
      );
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const ext = path.extname(file.originalname);
    const key = `upload/${Date.now()}${ext}`;

    try { 
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.configService.get<string>('AWS_BUCKET_NAME'),
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
    } catch (error) {
      console.error('File upload failed:', error);
      throw new InternalServerErrorException('File upload failed');
    }

    return {
      message: '업로드 성공',
      url: `https://s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${this.configService.get<string>('AWS_BUCKET_NAME')}/${key}`,
      key: key,
    };
  }
}
