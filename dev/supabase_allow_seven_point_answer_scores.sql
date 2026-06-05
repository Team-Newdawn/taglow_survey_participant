-- Published imported surveys can contain 7-point scale questions.
-- Keep answer storage broad enough for those score values.

alter table public.answers
  drop constraint if exists answers_score_value_check;

alter table public.answers
  add constraint answers_score_value_check
  check (
    score_value is null
    or (score_value >= 1 and score_value <= 7)
  );
