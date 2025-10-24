import { IsInt, IsString, IsNotEmpty, Min, MinLength, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1, { message: '리뷰 평점은 최소 1점 이상이어야 합니다.' })
  @Max(5, { message: '리뷰 평점은 최대 5점 이하이어야 합니다.' })
  rating: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: '리뷰 내용은 최소 10자 이상이어야 합니다.' })
  content: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1, { message: '리뷰 평점은 최소 1점 이상이어야 합니다.' })
  @Max(5, { message: '리뷰 평점은 최대 5점 이하이어야 합니다.' })
  rating?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: '리뷰 내용은 최소 10자 이상이어야 합니다.' })
  content?: string;
}