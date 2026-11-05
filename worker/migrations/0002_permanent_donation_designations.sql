-- Additive identity guards only. No donation, designation or event rows change.
-- Apply separately after reviewing the intended database; never rerun 0001.
CREATE TRIGGER designation_no_delete BEFORE DELETE ON donation_designations
BEGIN SELECT RAISE(ABORT, 'Registered donation designations are permanent'); END;

CREATE TRIGGER designation_approved_cause_insert BEFORE INSERT ON donation_designations
WHEN NEW.kind = 'cause' AND NEW.id NOT IN (
 'human-rights-dignity', 'humanitarian-assistance',
 'animal-welfare', 'environmental-conservation'
)
BEGIN SELECT RAISE(ABORT, 'Donation cause must be one of the four approved causes'); END;
