import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export type TxLike = PrismaService | Prisma.TransactionClient;
