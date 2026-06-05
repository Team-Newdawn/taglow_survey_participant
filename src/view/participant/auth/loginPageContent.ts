import type { Locale, LocalizedText, PublicSurvey, SurveyAsset } from '../../../api/participant';

export type LoginPageImage = Readonly<{
  url?: string;
  asset?: SurveyAsset;
  alt: string;
}>;

export type LoginPageContent = Readonly<{
  title?: string;
  paragraphs: string[];
  topImage?: LoginPageImage;
  bottomImage?: LoginPageImage;
}>;

const TOP_IMAGE_ROLES = new Set([
  'login_top',
  'login_top_image',
  'login-header',
  'login_header',
  'login_header_image',
  'participant_login_top',
  'participant_login_top_image',
  'top',
  'top_image',
]);

const BOTTOM_IMAGE_ROLES = new Set([
  'login_bottom',
  'login_bottom_image',
  'login-footer',
  'login_footer',
  'login_footer_image',
  'participant_login_bottom',
  'participant_login_bottom_image',
  'bottom',
  'bottom_image',
]);

export function getLoginPageContent(survey: PublicSurvey | undefined, locale: Locale): LoginPageContent {
  if (!survey) {
    return { paragraphs: [] };
  }

  const settings = parseRecord(survey.settings) ?? {};
  const loginSettings =
    parseRecord(settings.participantLogin) ||
    parseRecord(settings.participant_login) ||
    parseRecord(settings.loginPage) ||
    parseRecord(settings.login_page) ||
    parseRecord(settings.participantLoginPage) ||
    parseRecord(settings.participant_login_page) ||
    parseRecord(settings.login) ||
    {};

  const title = readLocalizedValue(
    loginSettings.headline ??
      loginSettings.bodyTitle ??
      loginSettings.body_title ??
      loginSettings.bodyHeading ??
      loginSettings.body_heading ??
      loginSettings.bodyHeadline ??
      loginSettings.body_headline ??
      loginSettings.bodyTopText ??
      loginSettings.body_top_text ??
      loginSettings.bodyTopPhrase ??
      loginSettings.body_top_phrase ??
      loginSettings.mainTitle ??
      loginSettings.main_title ??
      loginSettings.title ??
      loginSettings.heading ??
      settings.loginTitle ??
      settings.login_title,
    locale,
  );
  const paragraphs = readParagraphs(loginSettings, settings, locale);

  return {
    ...(title ? { title } : {}),
    paragraphs,
    topImage: readConfiguredImage(loginSettings, settings, survey.assets, locale, 'top') ?? readAssetImage(survey.assets, locale, 'top'),
    bottomImage: readConfiguredImage(loginSettings, settings, survey.assets, locale, 'bottom') ?? readAssetImage(survey.assets, locale, 'bottom'),
  };
}

export function getLoginPageImageAssets(content: LoginPageContent): SurveyAsset[] {
  return [content.topImage?.asset, content.bottomImage?.asset].filter((asset): asset is SurveyAsset => Boolean(asset));
}

function readParagraphs(loginSettings: Record<string, unknown>, rootSettings: Record<string, unknown>, locale: Locale): string[] {
  const candidates = [
    loginSettings.descriptionParagraphs,
    loginSettings.description_paragraphs,
    loginSettings.bodyParagraphs,
    loginSettings.body_paragraphs,
    loginSettings.paragraphs,
    loginSettings.descriptions,
    loginSettings.body,
    loginSettings.description,
    rootSettings.loginDescriptionParagraphs,
    rootSettings.login_description_paragraphs,
  ];

  for (const candidate of candidates) {
    const paragraphs = normalizeParagraphs(candidate, locale);
    if (paragraphs.length > 0) {
      return paragraphs;
    }
  }

  return [
    readLocalizedValue(loginSettings.description1 ?? loginSettings.description_1 ?? rootSettings.loginDescription1, locale),
    readLocalizedValue(loginSettings.description2 ?? loginSettings.description_2 ?? rootSettings.loginDescription2, locale),
    readLocalizedValue(loginSettings.bodyParagraph1 ?? loginSettings.body_paragraph_1, locale),
    readLocalizedValue(loginSettings.bodyParagraph2 ?? loginSettings.body_paragraph_2, locale),
  ].filter((paragraph): paragraph is string => Boolean(paragraph));
}

function normalizeParagraphs(value: unknown, locale: Locale): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => readLocalizedValue(item, locale)).filter((paragraph): paragraph is string => Boolean(paragraph));
  }

  const localized = readLocalizedValue(value, locale);
  return localized ? [localized] : [];
}

function readConfiguredImage(
  loginSettings: Record<string, unknown>,
  rootSettings: Record<string, unknown>,
  assets: SurveyAsset[],
  locale: Locale,
  position: 'top' | 'bottom',
): LoginPageImage | undefined {
  const imageSettings = parseRecord(loginSettings.images) || parseRecord(rootSettings.loginImages) || parseRecord(rootSettings.login_images) || {};
  const value =
    imageSettings[position] ??
    loginSettings[`${position}Image`] ??
    loginSettings[`${position}_image`] ??
    rootSettings[`login${capitalize(position)}Image`] ??
    rootSettings[`login_${position}_image`];
  const image = parseImageValue(value, assets, locale, position);

  if (image) {
    return image;
  }

  const url =
    readString(loginSettings[`${position}ImageUrl`]) ??
    readString(loginSettings[`${position}_image_url`]) ??
    readString(rootSettings[`login${capitalize(position)}ImageUrl`]) ??
    readString(rootSettings[`login_${position}_image_url`]);
  const assetId =
    readString(loginSettings[`${position}ImageAssetId`]) ??
    readString(loginSettings[`${position}_image_asset_id`]) ??
    readString(loginSettings[`${position}ImageId`]) ??
    readString(loginSettings[`${position}_image_id`]) ??
    readString(loginSettings[`${position}AssetId`]) ??
    readString(loginSettings[`${position}_asset_id`]) ??
    readString(rootSettings[`login${capitalize(position)}ImageAssetId`]) ??
    readString(rootSettings[`login_${position}_image_asset_id`]);
  const asset = assetId ? findAssetByReference(assets, assetId) : undefined;

  if (!url && !asset) {
    return undefined;
  }

  return {
    ...(url ? { url } : {}),
    ...(asset ? { asset } : {}),
    alt: readImageAlt(value, locale) ?? defaultImageAlt(position),
  };
}

function parseImageValue(value: unknown, assets: SurveyAsset[], locale: Locale, position: 'top' | 'bottom'): LoginPageImage | undefined {
  if (typeof value === 'string') {
    const asset = findAssetByReference(assets, value);
    return asset ? { asset, alt: readAssetAlt(asset, locale) ?? defaultImageAlt(position) } : { url: value, alt: '' };
  }

  const record = parseRecord(value);
  if (!record) {
    return undefined;
  }

  const url = readString(record.url) ?? readString(record.src) ?? readString(record.href);
  const assetReference =
    readString(record.assetId) ??
    readString(record.asset_id) ??
    readString(record.assetID) ??
    readString(record.id) ??
    readString(record.storagePath) ??
    readString(record.storage_path) ??
    readString(record.path);
  const asset = assetReference ? findAssetByReference(assets, assetReference) : undefined;

  if (!url && !asset) {
    return undefined;
  }

  return {
    ...(url ? { url } : {}),
    ...(asset ? { asset } : {}),
    alt: readImageAlt(record, locale) ?? (asset ? readAssetAlt(asset, locale) : undefined) ?? '',
  };
}

function findAssetByReference(assets: SurveyAsset[], reference: string): SurveyAsset | undefined {
  return assets.find((candidate) => candidate.id === reference || candidate.storagePath === reference);
}

function readAssetImage(assets: SurveyAsset[], locale: Locale, position: 'top' | 'bottom'): LoginPageImage | undefined {
  const roles = position === 'top' ? TOP_IMAGE_ROLES : BOTTOM_IMAGE_ROLES;
  const asset = assets.find((candidate) => {
    const metadata = candidate.metadata;
    const role = normalizeRole(
      readString(metadata.role) ??
        readString(metadata.slot) ??
        readString(metadata.position) ??
        readString(metadata.purpose) ??
        readString(metadata.loginPageSlot) ??
        readString(metadata.login_page_slot),
    );
    return candidate.assetType === 'image' && role ? roles.has(role) : false;
  });

  return asset
    ? {
        asset,
        alt: readAssetAlt(asset, locale) ?? defaultImageAlt(position),
      }
    : undefined;
}

function readAssetAlt(asset: SurveyAsset, locale: Locale): string | undefined {
  return readImageAlt(asset.metadata, locale);
}

function readImageAlt(value: unknown, locale: Locale): string | undefined {
  const record = parseRecord(value);
  if (!record) {
    return undefined;
  }

  return (
    readLocalizedValue(record.alt, locale) ??
    readLocalizedValue(record.altText, locale) ??
    readLocalizedValue(record.alt_text, locale) ??
    readLocalizedValue(record.label, locale)
  );
}

function readLocalizedValue(value: unknown, locale: Locale): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const record = parseRecord(value);
  if (!record) {
    return undefined;
  }

  return readStrictLocalizedText(record as LocalizedText, locale) || undefined;
}

function readStrictLocalizedText(text: LocalizedText, locale: Locale): string {
  const localized = text[locale];
  if (typeof localized === 'string' && localized.trim()) {
    return localized.trim();
  }

  if (locale === 'ko') {
    return typeof text.en === 'string' ? text.en.trim() : '';
  }

  return '';
}

function parseRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeRole(value: string | undefined): string | undefined {
  return value?.trim().toLowerCase().replaceAll('-', '_');
}

function defaultImageAlt(position: 'top' | 'bottom'): string {
  return position === 'top' ? 'Login page top image' : 'Login page bottom image';
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
