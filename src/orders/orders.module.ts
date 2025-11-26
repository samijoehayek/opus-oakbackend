import { Module } from '@nestjs/common';
import { OrdersController, CartController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CartService } from './cart.service';

@Module({
  controllers: [OrdersController, CartController],
  providers: [OrdersService, CartService],
  exports: [OrdersService, CartService],
})
export class OrdersModule {}
