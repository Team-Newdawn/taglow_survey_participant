alter table public.responses
  add column if not exists participant_device_id text;

create unique index if not exists uniq_submitted_response_per_device
on public.responses (survey_id, participant_device_id)
where status = 'submitted' and participant_device_id is not null;

create index if not exists idx_responses_device_survey
on public.responses (participant_device_id, survey_id, status)
where participant_device_id is not null;

drop function if exists public.get_participant_survey_access(text);

create or replace function public.get_participant_survey_access(
  p_public_identifier text,
  p_device_id text default null
)
returns jsonb
language plpgsql
stable
set search_path to 'public', 'auth'
as $function$
declare
  v_public_identifier text := nullif(btrim(p_public_identifier), '');
  v_device_id text := nullif(btrim(p_device_id), '');
  v_auth_user_id uuid := auth.uid();
  v_auth_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_survey public.surveys%rowtype;
  v_sections jsonb := '[]'::jsonb;
  v_questions jsonb := '[]'::jsonb;
  v_assets jsonb := '[]'::jsonb;
  v_response_id uuid;
  v_submitted_at timestamptz;
  v_base_result jsonb;
begin
  if v_auth_user_id is null or v_auth_email = '' then
    return jsonb_build_object('status', 'unauthenticated', 'deviceChecked', v_device_id is not null);
  end if;

  select *
  into v_survey
  from public.surveys
  where public_slug = v_public_identifier
     or public_code = v_public_identifier
  limit 1;

  if not found then
    return jsonb_build_object('status', 'survey_not_found', 'deviceChecked', v_device_id is not null);
  end if;

  select coalesce(jsonb_agg(to_jsonb(section_row) order by section_row.order_index), '[]'::jsonb)
  into v_sections
  from public.survey_sections as section_row
  where section_row.survey_id = v_survey.id;

  select coalesce(jsonb_agg(to_jsonb(question_row) order by question_row.order_index), '[]'::jsonb)
  into v_questions
  from public.questions as question_row
  where question_row.survey_id = v_survey.id;

  select coalesce(jsonb_agg(to_jsonb(asset_row) order by asset_row.created_at), '[]'::jsonb)
  into v_assets
  from public.survey_assets as asset_row
  where asset_row.survey_id = v_survey.id;

  v_base_result := jsonb_build_object(
    'survey', to_jsonb(v_survey),
    'sections', v_sections,
    'questions', v_questions,
    'assets', v_assets,
    'session', jsonb_build_object(
      'userId', v_auth_user_id::text,
      'email', v_auth_email
    ),
    'deviceChecked', v_device_id is not null
  );

  if v_survey.status <> 'published' then
    return v_base_result || jsonb_build_object('status', 'survey_closed');
  end if;

  select response_row.id, response_row.submitted_at
  into v_response_id, v_submitted_at
  from public.responses as response_row
  where response_row.survey_id = v_survey.id
    and response_row.status = 'submitted'
    and (
      response_row.participant_user_id = v_auth_user_id
      or (v_device_id is not null and response_row.participant_device_id = v_device_id)
    )
  order by response_row.submitted_at desc nulls last
  limit 1;

  if v_response_id is not null then
    return v_base_result || jsonb_build_object(
      'status', 'already_submitted',
      'responseId', v_response_id::text,
      'submittedAt', v_submitted_at
    );
  end if;

  return v_base_result || jsonb_build_object('status', 'allowed');
end;
$function$;

grant execute on function public.get_participant_survey_access(text, text) to authenticated;
