-- DETwal support ticket storage. Run in Cloudflare D1 Console for detwal-db.
CREATE TABLE IF NOT EXISTS support_tickets (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 email TEXT NOT NULL,
 customer_name TEXT,
 subject TEXT NOT NULL,
 message TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'open',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS support_replies (
 id TEXT PRIMARY KEY,
 ticket_id TEXT NOT NULL REFERENCES support_tickets(id),
 sender_role TEXT NOT NULL CHECK(sender_role IN ('admin','user')),
 sender_email TEXT NOT NULL,
 message TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
