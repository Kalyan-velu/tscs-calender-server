ALTER TABLE "event" ALTER COLUMN "scheduled_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "student" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "student" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "batch" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "batch" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "recurrence_pattern" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "recurrence_end_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_event_scheduled_at" ON "event" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_event_group_id" ON "event" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_event_batch_batch_id" ON "event_batch" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_student_batch_id" ON "student" USING btree ("batch_id");