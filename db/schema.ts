import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  customerName: text('customer_name').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull(),
  country: text('country').notNull(),
  size: text('size').notNull(),
  shipping: text('shipping').notNull(),
  totalCents: integer('total_cents').notNull(),
  status: text('status').notNull(),
  invoiceNumber: text('invoice_number'),
  trackingNumber: text('tracking_number'),
  shippedAt: text('shipped_at'),
  canceledAt: text('canceled_at'),
}, (table) => [index('idx_orders_created_at').on(table.createdAt)])

export const pageViews = sqliteTable('page_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  day: text('day').notNull(),
  path: text('path').notNull(),
  visitorId: text('visitor_id').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('idx_page_views_day_path_visitor').on(table.day, table.path, table.visitorId),
  index('idx_page_views_day').on(table.day),
])

export const shopSettings = sqliteTable('shop_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const notificationLog = sqliteTable('notification_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: text('order_id').notNull(),
  channel: text('channel').notNull(),
  event: text('event').notNull(),
  recipient: text('recipient').notNull(),
  status: text('status').notNull(),
  detail: text('detail'),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_notification_order').on(table.orderId)])
