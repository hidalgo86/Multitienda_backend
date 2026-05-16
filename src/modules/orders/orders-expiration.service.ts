import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { OrdersService } from './orders.service';

const ORDER_EXPIRATION_CHECK_INTERVAL_MS = 15 * 60 * 1000;

@Injectable()
export class OrdersExpirationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersExpirationService.name);
  private interval?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly ordersService: OrdersService) {}

  onModuleInit(): void {
    void this.cancelExpiredOrders();
    this.interval = setInterval(() => {
      void this.cancelExpiredOrders();
    }, ORDER_EXPIRATION_CHECK_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private async cancelExpiredOrders(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const cancelledCount =
        await this.ordersService.cancelExpiredPendingOrders();

      if (cancelledCount > 0) {
        this.logger.log(
          `Pedidos vencidos cancelados automaticamente: ${cancelledCount}`,
        );
      }
    } catch (error) {
      this.logger.error('Error al cancelar pedidos vencidos', error);
    } finally {
      this.running = false;
    }
  }
}
