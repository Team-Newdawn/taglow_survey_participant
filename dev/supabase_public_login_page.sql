-- Public, pre-auth payload for the participant login page.
-- Exposes only survey-level login settings and assets explicitly marked for login page use.

create or replace function public.get_public_survey_login_page(p_public_identifier text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_public_identifier text := nullif(btrim(p_public_identifier), '');
  v_survey public.surveys%rowtype;
  v_login_settings jsonb := '{}'::jsonb;
  v_login_asset_refs text[] := array[]::text[];
  v_assets jsonb := '[]'::jsonb;
begin
  if v_public_identifier is null then
    return jsonb_build_object('status', 'survey_not_found');
  end if;

  select survey_row.*
  into v_survey
  from public.surveys as survey_row
  where survey_row.status in ('published', 'closed')
    and (survey_row.public_slug = v_public_identifier or survey_row.public_code = v_public_identifier)
  limit 1;

  if not found then
    return jsonb_build_object('status', 'survey_not_found');
  end if;

  v_login_settings := coalesce(
    v_survey.settings -> 'participantLogin',
    v_survey.settings -> 'participant_login',
    '{}'::jsonb
  );
  v_login_asset_refs := array_remove(
    array[
      v_login_settings ->> 'topImageAssetId',
      v_login_settings ->> 'top_image_asset_id',
      v_login_settings ->> 'topImageId',
      v_login_settings ->> 'top_image_id',
      v_login_settings ->> 'topAssetId',
      v_login_settings ->> 'top_asset_id',
      v_login_settings -> 'topImage' ->> 'assetId',
      v_login_settings -> 'topImage' ->> 'asset_id',
      v_login_settings -> 'topImage' ->> 'assetID',
      v_login_settings -> 'topImage' ->> 'id',
      v_login_settings -> 'topImage' ->> 'storagePath',
      v_login_settings -> 'topImage' ->> 'storage_path',
      v_login_settings -> 'topImage' ->> 'path',
      v_login_settings -> 'top_image' ->> 'assetId',
      v_login_settings -> 'top_image' ->> 'asset_id',
      v_login_settings -> 'top_image' ->> 'id',
      v_login_settings -> 'top_image' ->> 'storagePath',
      v_login_settings -> 'top_image' ->> 'storage_path',
      v_login_settings ->> 'bottomImageAssetId',
      v_login_settings ->> 'bottom_image_asset_id',
      v_login_settings ->> 'bottomImageId',
      v_login_settings ->> 'bottom_image_id',
      v_login_settings ->> 'bottomAssetId',
      v_login_settings ->> 'bottom_asset_id',
      v_login_settings -> 'bottomImage' ->> 'assetId',
      v_login_settings -> 'bottomImage' ->> 'asset_id',
      v_login_settings -> 'bottomImage' ->> 'assetID',
      v_login_settings -> 'bottomImage' ->> 'id',
      v_login_settings -> 'bottomImage' ->> 'storagePath',
      v_login_settings -> 'bottomImage' ->> 'storage_path',
      v_login_settings -> 'bottomImage' ->> 'path',
      v_login_settings -> 'bottom_image' ->> 'assetId',
      v_login_settings -> 'bottom_image' ->> 'asset_id',
      v_login_settings -> 'bottom_image' ->> 'id',
      v_login_settings -> 'bottom_image' ->> 'storagePath',
      v_login_settings -> 'bottom_image' ->> 'storage_path'
    ],
    null
  );

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
  where asset_row.survey_id = v_survey.id
    and asset_row.asset_type = 'image'
    and (
      asset_row.id::text = any (v_login_asset_refs)
      or asset_row.storage_path = any (v_login_asset_refs)
      or lower(
        replace(
          coalesce(
            asset_row.metadata ->> 'role',
            asset_row.metadata ->> 'slot',
            asset_row.metadata ->> 'position',
            asset_row.metadata ->> 'purpose',
            asset_row.metadata ->> 'loginPageSlot',
            asset_row.metadata ->> 'login_page_slot',
            ''
          ),
          '-',
          '_'
        )
      ) = any (
        array[
          'login_top',
          'login_top_image',
          'login_header',
          'login_header_image',
          'participant_login_top',
          'participant_login_top_image',
          'top',
          'top_image',
          'login_bottom',
          'login_bottom_image',
          'login_footer',
          'login_footer_image',
          'participant_login_bottom',
          'participant_login_bottom_image',
          'bottom',
          'bottom_image'
        ]
      )
    );

  return jsonb_build_object(
    'status', v_survey.status,
    'survey', jsonb_build_object(
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
    ),
    'sections', '[]'::jsonb,
    'questions', '[]'::jsonb,
    'assets', v_assets
  );
end;
$function$;

grant execute on function public.get_public_survey_login_page(text) to anon, authenticated;

drop policy if exists "anon can read published login survey asset objects" on storage.objects;

create policy "anon can read published login survey asset objects"
  on storage.objects
  for select
  to anon
  using (
    bucket_id = 'survey-assets'
    and exists (
      select 1
      from public.survey_assets as asset_row
      join public.surveys as survey_row on survey_row.id = asset_row.survey_id
      where asset_row.storage_bucket = objects.bucket_id
        and asset_row.storage_path = objects.name
        and asset_row.asset_type = 'image'
        and survey_row.status = 'published'
        and (
          lower(
            replace(
              coalesce(
                asset_row.metadata ->> 'role',
                asset_row.metadata ->> 'slot',
                asset_row.metadata ->> 'position',
                asset_row.metadata ->> 'purpose',
                asset_row.metadata ->> 'loginPageSlot',
                asset_row.metadata ->> 'login_page_slot',
                ''
              ),
              '-',
              '_'
            )
          ) = any (
            array[
              'login_top',
              'login_top_image',
              'login_header',
              'login_header_image',
              'participant_login_top',
              'participant_login_top_image',
              'top',
              'top_image',
              'login_bottom',
              'login_bottom_image',
              'login_footer',
              'login_footer_image',
              'participant_login_bottom',
              'participant_login_bottom_image',
              'bottom',
              'bottom_image'
            ]
          )
          or asset_row.id::text in (
            select ref.value
            from public.surveys as login_survey
            cross join lateral jsonb_array_elements_text(
              jsonb_build_array(
                login_survey.settings -> 'participantLogin' ->> 'topImageAssetId',
                login_survey.settings -> 'participantLogin' ->> 'top_image_asset_id',
                login_survey.settings -> 'participantLogin' -> 'topImage' ->> 'assetId',
                login_survey.settings -> 'participantLogin' -> 'topImage' ->> 'asset_id',
                login_survey.settings -> 'participantLogin' -> 'topImage' ->> 'id',
                login_survey.settings -> 'participantLogin' ->> 'bottomImageAssetId',
                login_survey.settings -> 'participantLogin' ->> 'bottom_image_asset_id',
                login_survey.settings -> 'participantLogin' -> 'bottomImage' ->> 'assetId',
                login_survey.settings -> 'participantLogin' -> 'bottomImage' ->> 'asset_id',
                login_survey.settings -> 'participantLogin' -> 'bottomImage' ->> 'id'
              )
            ) as ref(value)
            where login_survey.id = survey_row.id
              and ref.value is not null
          )
          or asset_row.storage_path in (
            select ref.value
            from public.surveys as login_survey
            cross join lateral jsonb_array_elements_text(
              jsonb_build_array(
                login_survey.settings -> 'participantLogin' -> 'topImage' ->> 'storagePath',
                login_survey.settings -> 'participantLogin' -> 'topImage' ->> 'storage_path',
                login_survey.settings -> 'participantLogin' -> 'topImage' ->> 'path',
                login_survey.settings -> 'participantLogin' -> 'bottomImage' ->> 'storagePath',
                login_survey.settings -> 'participantLogin' -> 'bottomImage' ->> 'storage_path',
                login_survey.settings -> 'participantLogin' -> 'bottomImage' ->> 'path'
              )
            ) as ref(value)
            where login_survey.id = survey_row.id
              and ref.value is not null
          )
        )
    )
  );
