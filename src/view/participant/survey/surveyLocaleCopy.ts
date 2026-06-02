import type { Locale } from '../../../api/participant';

export type SurveyLocaleCopy = {
  required: string;
  requiredQuestion: string;
  sectionNavigation: string;
  previous: string;
  next: string;
  review: string;
  requiredMissingTitle: string;
  requiredMissingDescription: string;
  sectionProgress: (current: number, total: number) => string;
  answeredCount: (answered: number, total: number) => string;
  score: (score: number) => string;
  unanswered: string;
  selectedCount: (selected: number) => string;
  minMaxSelections: (min: number, max: number) => string;
  maxSelections: (max: number) => string;
  minSelections: (min: number) => string;
  selectAllThatApply: string;
  otherTextLabel: string;
  otherTextPlaceholder: string;
  scaleLowLabel: string;
  scaleHighLabel: string;
  lowScoreRequired: string;
  lowScoreOptional: string;
  lowScoreTextPlaceholder: string;
  rankInstruction: string;
  rankLabel: (rank: number) => string;
  experienceReasonLabel: string;
  opinionTypeLabel: string;
  draftTitle: string;
  draftSavedAt: (updatedAt: string) => string;
  draftSavedFallback: string;
  restart: string;
  continueDraft: string;
  imageTagInstruction: string;
  imageMissing: string;
  imageLoadError: string;
  imageAlt: string;
  editLocationLabel: (index: number) => string;
  imagePreparing: string;
  dragNewPinLabel: string;
  imageTagDialogNewTitle: string;
  imageTagDialogEditTitle: (index: number) => string;
  imageTagTextRequiredError: string;
  imageTagDialogDescription: string;
  imageTagCategory: string;
  imageTagReason: string;
  imageTagReasonOptional: string;
  imageTagReasonPlaceholder: string;
  imageTagReasonOptionalPlaceholder: string;
  delete: string;
  cancel: string;
  save: string;
  uploadImage: string;
  reuploadImage: string;
  participantImageInstruction: string;
  uploadImageLabel: string;
  uploadError: string;
  uploadedImageLoadError: string;
  participantImageAlt: string;
  participantImagePreparing: string;
  participantImageEmpty: string;
  imageOnlyError: string;
  unsupportedImageType: string;
  maxImageSizeError: (maxFileSizeMb: number) => string;
  introEyebrow: string;
  language: string;
  sectionsToComplete: string;
  startFresh: string;
  startFirstSection: string;
  reviewEyebrow: string;
  reviewTitle: string;
  missingRequiredTitle: (missingTotal: number) => string;
  missingRequiredDescription: string;
  allRequiredAnsweredTitle: string;
  allRequiredAnsweredDescription: string;
  sectionsSummaryLabel: string;
  answersSummaryLabel: string;
  imageTagsSummaryLabel: string;
  sectionMissingLabel: (missingCount: number) => string;
  sectionCompleteLabel: string;
  answerSection: string;
  editSection: string;
  submitErrorTitle: string;
  submitErrorDescription: string;
  submitting: string;
  finalSubmit: string;
  completeEyebrow: string;
  completeTitle: string;
  completeDescription: string;
  completeThanksTitle: string;
  completeContactDescription: string;
  serviceFeedbackTitle: string;
  serviceFeedbackLabel: string;
  serviceFeedbackPlaceholder: string;
  serviceFeedbackSubmit: string;
  serviceFeedbackSubmitting: string;
  serviceFeedbackSuccess: string;
  serviceFeedbackError: string;
  backToIntro: string;
};

export function getSurveyLocaleCopy(locale: Locale): SurveyLocaleCopy {
  return locale === 'en' ? enCopy : koCopy;
}

const koCopy: SurveyLocaleCopy = {
  required: '필수',
  requiredQuestion: '필수 문항입니다.',
  sectionNavigation: '섹션 이동',
  previous: '이전',
  next: '다음',
  review: '검토하기',
  requiredMissingTitle: '필수 문항을 먼저 답해주세요.',
  requiredMissingDescription: '응답하지 않은 문항을 확인한 뒤 다음 섹션으로 이동할 수 있습니다.',
  sectionProgress: (current, total) => `${current}/${total}섹션`,
  answeredCount: (answered, total) => `${answered}/${total}개 응답`,
  score: (score) => `${score}점`,
  unanswered: '미응답',
  selectedCount: (selected) => `${selected}개 선택됨`,
  minMaxSelections: (min, max) => `${min}개 이상, 최대 ${max}개 선택`,
  maxSelections: (max) => `최대 ${max}개 선택`,
  minSelections: (min) => `${min}개 이상 선택`,
  selectAllThatApply: '해당하는 항목을 모두 선택해주세요.',
  otherTextLabel: '기타 내용',
  otherTextPlaceholder: '기타 내용을 적어주세요.',
  scaleLowLabel: '1 매우 낮음',
  scaleHighLabel: '5 매우 높음',
  lowScoreRequired: '낮은 점수를 준 이유를 선택해주세요.',
  lowScoreOptional: '필요하면 이유를 남겨주세요.',
  lowScoreTextPlaceholder: '한 문장으로 더 적어주세요.',
  rankInstruction: '가장 중요한 것부터 선택해주세요.',
  rankLabel: (rank) => `${rank}순위`,
  experienceReasonLabel: '이유를 간단히 선택하거나 적어주세요.',
  opinionTypeLabel: '의견 유형',
  draftTitle: '이전에 작성하던 응답이 있습니다.',
  draftSavedAt: (updatedAt) => `${updatedAt}에 저장되었습니다.`,
  draftSavedFallback: '같은 브라우저에서 저장된 응답입니다.',
  restart: '처음부터',
  continueDraft: '이어서 작성',
  imageTagInstruction: '사진에서 불편하거나 개선이 필요한 위치를 선택해주세요.',
  imageMissing: '연결된 이미지를 찾을 수 없습니다.',
  imageLoadError: '이미지를 불러오지 못했습니다. 다시 시도해주세요.',
  imageAlt: '위치를 선택할 시설 이미지',
  editLocationLabel: (index) => `${index}번 위치 수정`,
  imagePreparing: '이미지를 준비하고 있습니다.',
  dragNewPinLabel: '새 위치 스티커를 이미지로 드래그',
  imageTagDialogNewTitle: '위치 내용 입력',
  imageTagDialogEditTitle: (index) => `${index}번 위치 수정`,
  imageTagTextRequiredError: '이유를 짧게 적어주세요.',
  imageTagDialogDescription: '선택한 위치에 남길 내용을 입력해주세요.',
  imageTagCategory: '카테고리',
  imageTagReason: '이유',
  imageTagReasonOptional: '이유 (선택)',
  imageTagReasonPlaceholder: '어떤 부분인지 짧게 적어주세요.',
  imageTagReasonOptionalPlaceholder: '필요하면 추가 설명을 적어주세요.',
  delete: '삭제',
  cancel: '취소',
  save: '저장',
  uploadImage: '사진 업로드',
  reuploadImage: '사진 다시 업로드',
  participantImageInstruction: '사진을 올린 뒤, 건의할 위치를 선택해주세요.',
  uploadImageLabel: '사진 업로드',
  uploadError: '사진을 업로드하지 못했습니다. 다시 시도해주세요.',
  uploadedImageLoadError: '업로드한 사진을 불러오지 못했습니다.',
  participantImageAlt: '참여자가 올린 위치 선택 사진',
  participantImagePreparing: '사진을 준비하고 있습니다.',
  participantImageEmpty: '사진을 올리면 위치를 선택할 수 있습니다.',
  imageOnlyError: '이미지 파일만 업로드할 수 있습니다.',
  unsupportedImageType: '허용된 이미지 형식이 아닙니다.',
  maxImageSizeError: (maxFileSizeMb) => `${maxFileSizeMb}MB 이하의 이미지만 업로드할 수 있습니다.`,
  introEyebrow: '설문 안내',
  language: '언어',
  sectionsToComplete: '진행할 섹션',
  startFresh: '새로 시작하기',
  startFirstSection: '첫 섹션으로 이동',
  reviewEyebrow: '제출 전 검토',
  reviewTitle: '응답 내용을 확인해주세요.',
  missingRequiredTitle: (missingTotal) => `${missingTotal}개의 필수 문항이 남아 있습니다.`,
  missingRequiredDescription: '누락된 섹션으로 이동해 답변을 완료해주세요.',
  allRequiredAnsweredTitle: '필수 문항을 모두 답했습니다.',
  allRequiredAnsweredDescription: '제출 후에는 이 화면에서 수정할 수 없습니다.',
  sectionsSummaryLabel: '섹션',
  answersSummaryLabel: '응답',
  imageTagsSummaryLabel: '위치 표시',
  sectionMissingLabel: (missingCount) => `${missingCount}개 문항이 남아 있습니다.`,
  sectionCompleteLabel: '완료되었습니다.',
  answerSection: '답변하기',
  editSection: '수정',
  submitErrorTitle: '제출하지 못했습니다.',
  submitErrorDescription: '네트워크 상태를 확인한 뒤 다시 시도해주세요. 작성 중인 응답은 유지됩니다.',
  submitting: '제출 중',
  finalSubmit: '최종 제출',
  completeEyebrow: '제출 완료',
  completeTitle: '응답이 제출되었습니다.',
  completeDescription: '남겨주신 의견은 개선 우선순위와 보고 자료를 만드는 데 활용됩니다.',
  completeThanksTitle: '참여해주셔서 감사합니다.',
  completeContactDescription: '제출 내용 수정이 필요한 경우 담당자에게 문의해주세요.',
  serviceFeedbackTitle: 'Taglow 설문 서비스를 개선하기 위한 아이디어를 제공해주세요. 필수 항목이 아니니, 자유롭게 작성해주세요.',
  serviceFeedbackLabel: '개선 아이디어',
  serviceFeedbackPlaceholder: '사용하면서 아쉬웠던 점이나 더 좋아질 수 있는 아이디어를 적어주세요.',
  serviceFeedbackSubmit: '아이디어 보내기',
  serviceFeedbackSubmitting: '보내는 중',
  serviceFeedbackSuccess: '아이디어가 전달되었습니다.',
  serviceFeedbackError: '아이디어를 보내지 못했습니다. 잠시 후 다시 시도해주세요.',
  backToIntro: '설문 첫 화면으로',
};

const enCopy: SurveyLocaleCopy = {
  required: 'Required',
  requiredQuestion: 'This question is required.',
  sectionNavigation: 'Section navigation',
  previous: 'Previous',
  next: 'Next',
  review: 'Review',
  requiredMissingTitle: 'Please answer the required questions first.',
  requiredMissingDescription: 'Check the unanswered questions before moving to the next section.',
  sectionProgress: (current, total) => `${current}/${total} sections`,
  answeredCount: (answered, total) => `${answered}/${total} answered`,
  score: (score) => `${score} pts`,
  unanswered: 'Not answered',
  selectedCount: (selected) => `${selected} selected`,
  minMaxSelections: (min, max) => `Select at least ${min}, up to ${max}`,
  maxSelections: (max) => `Select up to ${max}`,
  minSelections: (min) => `Select at least ${min}`,
  selectAllThatApply: 'Select all that apply.',
  otherTextLabel: 'Other details',
  otherTextPlaceholder: 'Please add details.',
  scaleLowLabel: '1 Very low',
  scaleHighLabel: '5 Very high',
  lowScoreRequired: 'Please select why you gave a low score.',
  lowScoreOptional: 'Add a reason if needed.',
  lowScoreTextPlaceholder: 'Add one more sentence.',
  rankInstruction: 'Select the most important items first.',
  rankLabel: (rank) => `Rank ${rank}`,
  experienceReasonLabel: 'Briefly choose or enter a reason.',
  opinionTypeLabel: 'Opinion type',
  draftTitle: 'You have a saved draft.',
  draftSavedAt: (updatedAt) => `Saved at ${updatedAt}.`,
  draftSavedFallback: 'This response was saved in the same browser.',
  restart: 'Start over',
  continueDraft: 'Continue',
  imageTagInstruction: 'Select spots in the image that were uncomfortable or need improvement.',
  imageMissing: 'The linked image could not be found.',
  imageLoadError: 'Could not load the image. Please try again.',
  imageAlt: 'Facility image for choosing a location',
  editLocationLabel: (index) => `Edit location ${index}`,
  imagePreparing: 'Preparing the image.',
  dragNewPinLabel: 'Drag a new location marker onto the image',
  imageTagDialogNewTitle: 'Add location details',
  imageTagDialogEditTitle: (index) => `Edit location ${index}`,
  imageTagTextRequiredError: 'Please briefly describe the reason.',
  imageTagDialogDescription: 'Enter the note you want to leave for the selected location.',
  imageTagCategory: 'Category',
  imageTagReason: 'Reason',
  imageTagReasonOptional: 'Reason (optional)',
  imageTagReasonPlaceholder: 'Briefly describe the issue.',
  imageTagReasonOptionalPlaceholder: 'Add more context if needed.',
  delete: 'Delete',
  cancel: 'Cancel',
  save: 'Save',
  uploadImage: 'Upload photo',
  reuploadImage: 'Upload another photo',
  participantImageInstruction: 'Upload a photo, then select the location you want to mention.',
  uploadImageLabel: 'Upload photo',
  uploadError: 'Could not upload the photo. Please try again.',
  uploadedImageLoadError: 'Could not load the uploaded photo.',
  participantImageAlt: 'Participant-uploaded photo for choosing a location',
  participantImagePreparing: 'Preparing the photo.',
  participantImageEmpty: 'Upload a photo to select a location.',
  imageOnlyError: 'Only image files can be uploaded.',
  unsupportedImageType: 'This image format is not supported.',
  maxImageSizeError: (maxFileSizeMb) => `Please upload an image under ${maxFileSizeMb}MB.`,
  introEyebrow: 'Survey guide',
  language: 'Language',
  sectionsToComplete: 'Sections to complete',
  startFresh: 'Start over',
  startFirstSection: 'Go to first section',
  reviewEyebrow: 'Review before submitting',
  reviewTitle: 'Please review your answers.',
  missingRequiredTitle: (missingTotal) => `${missingTotal} required question${missingTotal === 1 ? '' : 's'} remaining.`,
  missingRequiredDescription: 'Go to the missing sections and complete your answers.',
  allRequiredAnsweredTitle: 'All required questions are answered.',
  allRequiredAnsweredDescription: 'After submitting, you cannot edit your answers on this screen.',
  sectionsSummaryLabel: 'Sections',
  answersSummaryLabel: 'Answers',
  imageTagsSummaryLabel: 'Location tags',
  sectionMissingLabel: (missingCount) => `${missingCount} question${missingCount === 1 ? '' : 's'} remaining.`,
  sectionCompleteLabel: 'Completed.',
  answerSection: 'Answer',
  editSection: 'Edit',
  submitErrorTitle: 'Could not submit.',
  submitErrorDescription: 'Check your network and try again. Your draft is still saved.',
  submitting: 'Submitting',
  finalSubmit: 'Submit',
  completeEyebrow: 'Submitted',
  completeTitle: 'Your response has been submitted.',
  completeDescription: 'Your feedback will be used to prioritize improvements and prepare reports.',
  completeThanksTitle: 'Thank you for participating.',
  completeContactDescription: 'Contact the survey manager if you need to edit your submitted response.',
  serviceFeedbackTitle: 'Share an idea to improve the Taglow survey service.',
  serviceFeedbackLabel: 'Improvement idea',
  serviceFeedbackPlaceholder: 'Tell us what felt inconvenient or what could make the service better.',
  serviceFeedbackSubmit: 'Send idea',
  serviceFeedbackSubmitting: 'Sending',
  serviceFeedbackSuccess: 'Your idea has been sent.',
  serviceFeedbackError: 'Could not send your idea. Please try again shortly.',
  backToIntro: 'Back to survey start',
};
