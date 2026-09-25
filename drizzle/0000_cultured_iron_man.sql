CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`customer_name` text NOT NULL,
	`email` text NOT NULL,
	`address` text NOT NULL,
	`country` text NOT NULL,
	`size` text NOT NULL,
	`shipping` text NOT NULL,
	`total_cents` integer NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_orders_created_at` ON `orders` (`created_at`);--> statement-breakpoint
CREATE TABLE `page_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day` text NOT NULL,
	`path` text NOT NULL,
	`visitor_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_page_views_day_path_visitor` ON `page_views` (`day`,`path`,`visitor_id`);--> statement-breakpoint
CREATE INDEX `idx_page_views_day` ON `page_views` (`day`);