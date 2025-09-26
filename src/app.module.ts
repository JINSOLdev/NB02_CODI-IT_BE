import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StoreModule } from './store/store.module';
import { CartsModule } from './cart/cart.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [PrismaModule, CartsModule, StoreModule, ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
