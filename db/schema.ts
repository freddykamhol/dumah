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
