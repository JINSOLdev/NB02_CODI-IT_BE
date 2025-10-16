import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from '../cart.controller';
import { CartService } from '../cart.service';
import { CartRepository } from '../cart.repository';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PrismaService } from 'src/prisma/prisma.service';
describe('CartController', () => {
  let controller: CartController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [CartService, JwtAuthGuard, CartRepository, PrismaService],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
