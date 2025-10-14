import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StoreModule } from './store/store.module';
import { CartsModule } from './cart/cart.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { S3Module } from './s3/s3.module';
import { ConfigModule } from '@nestjs/config';
import { ReviewModule } from './review/review.module';
import { InquiryModule } from './inquiry/inquiry.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    CartsModule,
    S3Module,
    StoreModule,
    UsersModule,
    AuthModule,
    ReviewModule,
    InquiryModule,
    DashboardModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
