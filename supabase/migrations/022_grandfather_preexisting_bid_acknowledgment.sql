-- Grandfathers bid_versions rows that existed BEFORE migration 021 introduced
-- the acknowledgment concept. Those rows have acknowledgment_affirmed=false
-- purely because the column didn't exist and no checkbox was ever shown to
-- the contractor at submission time -- not because anyone declined to
-- acknowledge anything. Without this, award_project_bid's new eligibility
-- check incorrectly blocks awarding any bid submitted before 021, including
-- already-legitimate bids sitting on projects whose deadline has passed and
-- are simply waiting for the client to award.
--
-- Safe to run exactly once: this is a plain UPDATE, not a trigger or rule --
-- it only touches rows that exist at the moment it runs. Any bid_versions
-- row inserted after this migration completes already goes through the
-- trigger from 021 and is stamped correctly (true only if genuinely
-- affirmed), so this can never re-grandfather a future incomplete insert.
--
-- Rows are stamped as acknowledged against each project's CURRENT
-- information_revision_number at migration time (i.e. eligible as of now),
-- with information_acknowledged_at backfilled from the bid version's own
-- submission time for audit-trail honesty.

UPDATE public.bid_versions bv
SET acknowledgment_affirmed = true,
    acknowledged_information_revision = p.information_revision_number,
    information_acknowledged_at = COALESCE(bv.submitted_at, bv.created_at)
FROM public.bids b
JOIN public.projects p ON p.id = b.project_id
WHERE bv.bid_id = b.id
  AND bv.acknowledgment_affirmed = false
  AND bv.information_acknowledged_at IS NULL;
