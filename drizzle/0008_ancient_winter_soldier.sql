CREATE INDEX "idx_financial_reports_active_approved" ON "financial_reports" USING btree ("active","approved_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_verifications_expires_at" ON "verifications" USING btree ("expires_at");