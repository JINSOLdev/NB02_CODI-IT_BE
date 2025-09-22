import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const CUID_REGEX = /^c[0-9a-z]{24}$/;

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const v = value?.trim();
    if (!v || !CUID_REGEX.test(v)) {
      throw new BadRequestException('유효하지 않은 CUID 형식입니다.');
    }
    return v;
  }
}
