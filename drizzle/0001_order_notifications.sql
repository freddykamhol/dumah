ALTER TABLE `orders` ADD `invoice_number` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking_number` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD `shipped_at` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD `canceled_at` text;
--> statement-breakpoint
CREATE TABLE `shop_settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification_log` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` text NOT NULL,
  `channel` text NOT NULL,
  `event` text NOT NULL,
  `recipient` text NOT NULL,
  `status` text NOT NULL,
  `detail` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notification_order` ON `notification_log` (`order_id`);
