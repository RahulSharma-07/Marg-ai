-- =============================================================================
-- Marg AI — Helper Functions & Stored Procedures
-- =============================================================================

-- ---------------------------------------------------------------------------
-- increment_topics_completed
-- Safely increments the topics_completed counter on the progress table.
-- Called from the topic complete/PATCH routes to keep the counter in sync.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_topics_completed(
  p_user_id    uuid,
  p_roadmap_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.progress
  SET
    topics_completed = topics_completed + 1,
    last_activity_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id
    AND roadmap_id = p_roadmap_id;
END;
$$;

-- Grant execute to authenticated users (RLS on the table still protects rows)
GRANT EXECUTE ON FUNCTION public.increment_topics_completed(uuid, uuid)
  TO authenticated;
