-- Foundation only: do not apply to Production until a D1 binding is approved.
PRAGMA foreign_keys = ON;
CREATE TABLE donation_designations (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('general', 'cause', 'project')),
  name TEXT NOT NULL,
  cause_id TEXT REFERENCES donation_designations(id),
  CHECK ((kind = 'project' AND cause_id IS NOT NULL) OR (kind <> 'project' AND cause_id IS NULL))
);
CREATE TRIGGER designation_parent_insert BEFORE INSERT ON donation_designations
WHEN NEW.kind = 'project' AND NOT EXISTS (SELECT 1 FROM donation_designations WHERE id = NEW.cause_id AND kind = 'cause')
BEGIN SELECT RAISE(ABORT, 'Project parent must be a cause'); END;
CREATE TRIGGER designation_identity_immutable BEFORE UPDATE ON donation_designations
WHEN NEW.id <> OLD.id OR NEW.kind <> OLD.kind OR NEW.cause_id IS NOT OLD.cause_id
BEGIN SELECT RAISE(ABORT, 'Designation identity is immutable'); END;
INSERT INTO donation_designations (id, kind, name) VALUES
 ('general-support', 'general', 'General Support'),
 ('human-rights-dignity', 'cause', 'Human Rights & Dignity'),
 ('humanitarian-assistance', 'cause', 'Humanitarian Assistance and Relief'),
 ('animal-welfare', 'cause', 'Animal Welfare'),
 ('environmental-conservation', 'cause', 'Environmental Conservation and Sustainability');
INSERT INTO donation_designations (id, kind, name, cause_id) VALUES
 ('voices-for-dignity', 'project', 'Voices for Dignity', 'human-rights-dignity');
CREATE TABLE donations (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  designation_id TEXT NOT NULL REFERENCES donation_designations(id),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  amount_cents INTEGER NOT NULL CHECK (typeof(amount_cents) = 'integer' AND amount_cents BETWEEN 100 AND 1000000),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'partially_refunded', 'refunded', 'failed', 'cancelled')),
  checkout_reference TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (provider, checkout_reference)
);
CREATE TRIGGER donation_identity_immutable BEFORE UPDATE ON donations
WHEN NEW.id <> OLD.id OR NEW.request_id <> OLD.request_id OR NEW.designation_id <> OLD.designation_id OR NEW.provider <> OLD.provider OR NEW.amount_cents <> OLD.amount_cents OR NEW.currency <> OLD.currency OR NEW.created_at <> OLD.created_at
BEGIN SELECT RAISE(ABORT, 'Donation identity is immutable'); END;
-- Reserved for future signature-verified webhook reconciliation; no current writer.
CREATE TABLE donation_events (
  id INTEGER PRIMARY KEY,
  donation_id TEXT NOT NULL REFERENCES donations(id),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  UNIQUE (provider, provider_event_id)
);
CREATE TRIGGER event_provider_matches BEFORE INSERT ON donation_events
WHEN NOT EXISTS (SELECT 1 FROM donations WHERE id = NEW.donation_id AND provider = NEW.provider)
BEGIN SELECT RAISE(ABORT, 'Event provider mismatch'); END;
CREATE TRIGGER events_no_update BEFORE UPDATE ON donation_events BEGIN SELECT RAISE(ABORT, 'Events are append-only'); END;
CREATE TRIGGER events_no_delete BEFORE DELETE ON donation_events BEGIN SELECT RAISE(ABORT, 'Events are append-only'); END;
CREATE INDEX donations_by_designation ON donations(designation_id, created_at);
CREATE INDEX donations_by_status ON donations(status, created_at);
