import type { Locale, PublicQuestion, SurveyAsset } from '../../../../../../api/participant';
import type { ProfileFieldKey } from '../../../../../../utils/profileFields';
import { AttentionCheckQuestion } from '../questions/AttentionCheckQuestion';
import { ExperienceQuestion } from '../questions/ExperienceQuestion';
import { ImageTagQuestion } from '../imageTag/ImageTagQuestion';
import { MultiSelectQuestion } from '../questions/MultiSelectQuestion';
import { ParticipantImageTagQuestion } from '../imageTag/ParticipantImageTagQuestion';
import { ProfileQuestion } from '../questions/ProfileQuestion';
import { RankingQuestion } from '../questions/RankingQuestion';
import { ScaleQuestion } from '../questions/ScaleQuestion';
import { SingleChoiceQuestion } from '../questions/SingleChoiceQuestion';
import { TextQuestion } from '../questions/TextQuestion';

type QuestionRendererProps = {
  question: PublicQuestion;
  assets: SurveyAsset[];
  assetUrls?: Record<string, string>;
  locale: Locale;
  fallbackLocale: Locale;
  value: unknown;
  error?: string;
  number?: number;
  profileFieldKey?: ProfileFieldKey;
  onChange: (value: unknown) => void;
};

export function QuestionRenderer(props: QuestionRendererProps) {
  switch (props.question.questionType) {
    case 'profile':
      return <ProfileQuestion {...props} />;
    case 'experience':
      return <ExperienceQuestion {...props} />;
    case 'scale':
      return <ScaleQuestion {...props} />;
    case 'single_choice':
      return <SingleChoiceQuestion {...props} />;
    case 'multi_select':
    case 'matrix_multi_select':
      return <MultiSelectQuestion {...props} />;
    case 'ranking':
      return <RankingQuestion {...props} />;
    case 'text':
      return <TextQuestion {...props} />;
    case 'image_tag':
      return <ImageTagQuestion {...props} />;
    case 'participant_image_tag':
      return <ParticipantImageTagQuestion {...props} />;
    case 'attention_check':
      return <AttentionCheckQuestion {...props} />;
    default:
      return <TextQuestion {...props} />;
  }
}
