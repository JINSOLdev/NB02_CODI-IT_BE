import { AnswerStatus } from "@prisma/client";
import { IsOptional, IsEnum, IsInt, Min } from "class-validator";

export class GetInquiriesDto {
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsInt()
  @Min(1)
  pageSize: number = 16;

  @IsOptional()
  @IsEnum(AnswerStatus)
  status?: AnswerStatus;
}