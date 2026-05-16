export enum AuditAction {
  LoginSuccess = 'login_success',
  LoginFailed = 'login_failed',
  Logout = 'logout',
  UserCreated = 'user_created',
  PasswordChanged = 'password_changed',
  UserRoleChanged = 'user_role_changed',
  UserStatusChanged = 'user_status_changed',
  OrderCreated = 'order_created',
  OrderPaid = 'order_paid',
  OrderPaymentReverted = 'order_payment_reverted',
  OrderCancelled = 'order_cancelled',
  ProductCreated = 'product_created',
  ProductUpdated = 'product_updated',
  ProductPriceChanged = 'product_price_changed',
  ProductStockChanged = 'product_stock_changed',
}

export enum AuditEntityType {
  Auth = 'Auth',
  User = 'User',
  Order = 'Order',
  Product = 'Product',
}

export const IMPORTANT_AUDIT_ACTIONS = new Set<string>(
  Object.values(AuditAction),
);
