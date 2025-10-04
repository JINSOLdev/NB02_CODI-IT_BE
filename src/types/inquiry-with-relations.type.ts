import { AnswerStatus } from '@prisma/client';

export interface InquiryWithRelations {
  id: string;
  title: string;
  content: string;
  status: AnswerStatus;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  productId: string;
  user: {
    id: string;
    nickname: string;
  };
  reply: {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      nickname: string;
    };
  }[];
}
