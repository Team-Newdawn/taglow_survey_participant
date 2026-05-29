import type { Locale, PublicQuestion, SurveyAsset } from '../../../../api/participant';
import { AttentionCheckQuestion } from './AttentionCheckQuestion';
import { ExperienceQuestion } from './ExperienceQuestion';
import { ImageTagQuestion } from './ImageTagQuestion';
import { MultiSelectQuestion } from './MultiSelectQuestion';
import { ParticipantImageTagQuestion } from './ParticipantImageTagQuestion';
import { ProfileQuestion } from './ProfileQuestion';
import { RankingQuestion } from './RankingQuestion';
import { ScaleQuestion } from './ScaleQuestion';
import { SingleChoiceQuestion } from './SingleChoiceQuestion';
import { TextQuestion } from './TextQuestion';

type QuestionRendererProps = {
  question: PublicQuestion;
  assets: SurveyAsset[];
  locale: Locale;
  fallbackLocale: Locale;
  value: unknown;
  error?: string;
  number?: number;
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
