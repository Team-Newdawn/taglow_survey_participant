-- Reduce participant hot-path payload size and preserve device duplicate protection.

drop index if exists public.idx_surveys_public_slug_unique;
drop index if exists public.idx_surveys_public_slug;

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
  v_survey_json jsonb;
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

  select
    survey_row.id,
    survey_row.title,
    survey_row.description,
    survey_row.status,
    survey_row.public_slug,
    survey_row.version_group_id,
    survey_row.version_number,
    survey_row.parent_survey_id,
    survey_row.is_latest_version,
    survey_row.settings,
    survey_row.published_at,
    survey_row.closed_at,
    survey_row.public_code,
    survey_row.description_en
  into
    v_survey.id,
    v_survey.title,
    v_survey.description,
    v_survey.status,
    v_survey.public_slug,
    v_survey.version_group_id,
    v_survey.version_number,
    v_survey.parent_survey_id,
    v_survey.is_latest_version,
    v_survey.settings,
    v_survey.published_at,
    v_survey.closed_at,
    v_survey.public_code,
    v_survey.description_en
  from public.surveys as survey_row
  where survey_row.public_slug = v_public_identifier
     or survey_row.public_code = v_public_identifier
  limit 1;

  if not found then
    return jsonb_build_object('status', 'survey_not_found', 'deviceChecked', v_device_id is not null);
  end if;

  v_survey_json := jsonb_build_object(
    'id', v_survey.id,
    'title', v_survey.title,
    'description', v_survey.description,
    'description_en', v_survey.description_en,
    'status', v_survey.status,
    'public_slug', v_survey.public_slug,
    'public_code', v_survey.public_code,
    'version_group_id', v_survey.version_group_id,
    'version_number', v_survey.version_number,
    'parent_survey_id', v_survey.parent_survey_id,
    'is_latest_version', v_survey.is_latest_version,
    'settings', coalesce(v_survey.settings, '{}'::jsonb),
    'published_at', v_survey.published_at,
    'closed_at', v_survey.closed_at
  );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', section_row.id,
        'survey_id', section_row.survey_id,
        'section_key', section_row.section_key,
        'title_ko', section_row.title_ko,
        'title_en', section_row.title_en,
        'description_ko', section_row.description_ko,
        'description_en', section_row.description_en,
        'order_index', section_row.order_index,
        'section_type', section_row.section_type,
        'settings', coalesce(section_row.settings, '{}'::jsonb)
      )
      order by section_row.order_index
    ),
    '[]'::jsonb
  )
  into v_sections
  from public.survey_sections as section_row
  where section_row.survey_id = v_survey.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', question_row.id,
        'survey_id', question_row.survey_id,
        'section_id', question_row.section_id,
        'question_key', question_row.question_key,
        'question_type', question_row.question_type,
        'title_ko', question_row.title_ko,
        'title_en', question_row.title_en,
        'description_ko', question_row.description_ko,
        'description_en', question_row.description_en,
        'order_index', question_row.order_index,
        'is_required', question_row.is_required,
        'metric_type', question_row.metric_type,
        'topic_key', question_row.topic_key,
        'space_key', question_row.space_key,
        'config', coalesce(question_row.config, '{}'::jsonb),
        'validation', coalesce(question_row.validation, '{}'::jsonb)
      )
      order by question_row.order_index
    ),
    '[]'::jsonb
  )
  into v_questions
  from public.questions as question_row
  where question_row.survey_id = v_survey.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', asset_row.id,
        'survey_id', asset_row.survey_id,
        'section_id', asset_row.section_id,
        'question_id', asset_row.question_id,
        'asset_type', asset_row.asset_type,
        'storage_bucket', asset_row.storage_bucket,
        'storage_path', asset_row.storage_path,
        'metadata', coalesce(asset_row.metadata, '{}'::jsonb)
      )
      order by asset_row.created_at
    ),
    '[]'::jsonb
  )
  into v_assets
  from public.survey_assets as asset_row
  where asset_row.survey_id = v_survey.id;

  v_base_result := jsonb_build_object(
    'survey', v_survey_json,
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

create or replace function public.submit_survey_response(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'private', 'public'
as $function$
declare
  v_response_payload jsonb := coalesce(payload -> 'response', '{}'::jsonb);
  v_answers_payload jsonb := coalesce(payload -> 'answers', '[]'::jsonb);
  v_auth_user_id uuid := auth.uid();
  v_auth_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_survey_id uuid := nullif(v_response_payload ->> 'survey_id', '')::uuid;
  v_participant_device_id text := nullif(btrim(v_response_payload ->> 'participant_device_id'), '');
  v_client_submission_id text := nullif(payload ->> 'clientSubmissionId', '');
  v_existing public.responses%rowtype;
  v_response_id uuid;
  v_submitted_at timestamptz;
  v_answer_count integer;
  v_inserted_answer_count integer;
  v_required_missing integer;
  v_invalid_asset_count integer;
  v_results jsonb;
  v_passed boolean;
begin
  if v_auth_user_id is null or v_auth_email = '' then
    raise exception 'Authentication is required to submit a survey response.'
      using errcode = '28000';
  end if;

  if v_survey_id is null then
    raise exception 'Survey id is required.'
      using errcode = '22023';
  end if;

  if jsonb_typeof(v_answers_payload) is distinct from 'array' then
    raise exception 'Answers must be an array.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.surveys s
    where s.id = v_survey_id
      and s.status = 'published'
      and s.is_latest_version = true
  ) then
    raise exception 'Survey is not open for responses.'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_survey_id::text), hashtext(v_auth_user_id::text));

  select *
  into v_existing
  from public.responses r
  where r.survey_id = v_survey_id
    and r.status = 'submitted'
    and (
      r.participant_user_id = v_auth_user_id
      or (v_participant_device_id is not null and r.participant_device_id = v_participant_device_id)
    )
  order by r.submitted_at desc nulls last, r.created_at desc
  limit 1;

  if found then
    if v_client_submission_id is not null and v_existing.client_submission_id = v_client_submission_id then
      return jsonb_build_object(
        'responseId', v_existing.id::text,
        'submittedAt', v_existing.submitted_at,
        'alreadySubmitted', true
      );
    end if;

    raise exception 'A submitted response already exists for this survey.'
      using errcode = '23505';
  end if;

  select count(*)::integer
  into v_answer_count
  from jsonb_array_elements(v_answers_payload) answer;

  with answer_rows as (
    select
      answer,
      nullif(answer ->> 'question_id', '')::uuid as question_id,
      nullif(answer ->> 'asset_id', '')::uuid as asset_id
    from jsonb_array_elements(v_answers_payload) answer
  )
  select count(*)::integer
  into v_required_missing
  from public.questions q
  where q.survey_id = v_survey_id
    and q.is_required = true
    and q.question_type not in ('display', 'intro')
    and not exists (
      select 1
      from answer_rows ar
      where ar.question_id = q.id
    );

  if coalesce(v_required_missing, 0) > 0 then
    raise exception 'Required answers are missing.'
      using errcode = '23502';
  end if;

  with answer_rows as (
    select nullif(answer ->> 'asset_id', '')::uuid as asset_id
    from jsonb_array_elements(v_answers_payload) answer
    where nullif(answer ->> 'asset_id', '') is not null
  )
  select count(*)::integer
  into v_invalid_asset_count
  from answer_rows ar
  where not exists (
    select 1
    from public.survey_assets sa
    where sa.id = ar.asset_id
      and sa.survey_id = v_survey_id
  );

  if coalesce(v_invalid_asset_count, 0) > 0 then
    raise exception 'One or more assets do not belong to this survey.'
      using errcode = '23503';
  end if;

  insert into public.responses (
    survey_id,
    participant_user_id,
    participant_device_id,
    participant_email,
    status,
    locale,
    gender,
    semester_group,
    department,
    rc,
    dormitory,
    room_type,
    dorm_experience,
    profile_json,
    raw_payload,
    client_submission_id,
    started_at,
    submitted_at
  )
  values (
    v_survey_id,
    v_auth_user_id,
    v_participant_device_id,
    v_auth_email,
    'submitted',
    coalesce(nullif(v_response_payload ->> 'locale', ''), 'ko'),
    nullif(v_response_payload ->> 'gender', ''),
    nullif(v_response_payload ->> 'semester_group', ''),
    nullif(v_response_payload ->> 'department', ''),
    nullif(v_response_payload ->> 'rc', ''),
    nullif(v_response_payload ->> 'dormitory', ''),
    nullif(v_response_payload ->> 'room_type', ''),
    nullif(v_response_payload ->> 'dorm_experience', ''),
    coalesce(v_response_payload -> 'profile_json', '{}'::jsonb),
    coalesce(v_response_payload -> 'raw_payload', payload -> 'rawPayload', '{}'::jsonb),
    v_client_submission_id,
    nullif(v_response_payload ->> 'started_at', '')::timestamptz,
    now()
  )
  returning id, submitted_at into v_response_id, v_submitted_at;

  with answer_rows as (
    select
      answer,
      nullif(answer ->> 'question_id', '')::uuid as question_id,
      nullif(answer ->> 'asset_id', '')::uuid as asset_id
    from jsonb_array_elements(v_answers_payload) answer
  ),
  inserted as (
    insert into public.answers (
      survey_id,
      response_id,
      section_id,
      question_id,
      asset_id,
      answer_type,
      metric_type,
      topic_key,
      space_key,
      score_value,
      text_value,
      choice_value,
      x_ratio,
      y_ratio,
      tag_type,
      severity,
      value_json
    )
    select
      v_survey_id,
      v_response_id,
      q.section_id,
      q.id,
      ar.asset_id,
      coalesce(nullif(ar.answer ->> 'answer_type', ''), q.question_type),
      coalesce(nullif(ar.answer ->> 'metric_type', ''), q.metric_type, 'none'),
      coalesce(nullif(ar.answer ->> 'topic_key', ''), q.topic_key),
      coalesce(nullif(ar.answer ->> 'space_key', ''), q.space_key),
      nullif(ar.answer ->> 'score_value', '')::numeric,
      nullif(ar.answer ->> 'text_value', ''),
      nullif(ar.answer ->> 'choice_value', ''),
      nullif(ar.answer ->> 'x_ratio', '')::numeric,
      nullif(ar.answer ->> 'y_ratio', '')::numeric,
      nullif(ar.answer ->> 'tag_type', ''),
      nullif(ar.answer ->> 'severity', '')::smallint,
      coalesce(ar.answer -> 'value_json', '{}'::jsonb)
    from answer_rows ar
    join public.questions q on q.id = ar.question_id and q.survey_id = v_survey_id
    returning 1
  )
  select count(*)::integer
  into v_inserted_answer_count
  from inserted;

  if v_inserted_answer_count <> v_answer_count then
    raise exception 'One or more answers do not belong to this survey.'
      using errcode = '23503';
  end if;

  v_results := private.analysis_compute_attention_results(v_response_id);
  v_passed := private.analysis_passed_from_results(v_results);

  update public.responses
  set
    passed_attention_check = v_passed,
    attention_check_results = v_results
  where id = v_response_id;

  perform private.upsert_analysis_facts_for_response(v_response_id);

  return jsonb_build_object(
    'responseId', v_response_id::text,
    'submittedAt', v_submitted_at,
    'alreadySubmitted', false,
    'passedAttentionCheck', v_passed
  );
end;
$function$;

revoke execute on function public.submit_survey_response(jsonb) from anon;
grant execute on function public.submit_survey_response(jsonb) to authenticated;
