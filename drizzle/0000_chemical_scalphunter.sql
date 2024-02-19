CREATE TABLE `comprobantes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`type` text NOT NULL,
	`issuerName` text NOT NULL,
	`amount` integer NOT NULL
);
