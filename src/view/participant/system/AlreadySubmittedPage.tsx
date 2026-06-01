import { useParams } from 'react-router-dom';

import { SystemStatePage } from './SystemStatePage';
import './css/AlreadySubmittedPage.css';

export function AlreadySubmittedPage() {
  const { publicSlug = '' } = useParams();

  return (
    <SystemStatePage
      eyebrow="제출 완료"
      title="이미 제출한 설문입니다."
      description="이 계정 또는 이 기기에서 이미 제출된 설문입니다. 제출 내용 수정이 필요한 경우 담당자에게 문의해주세요."
      actionHref={`/survey/${publicSlug}`}
      actionLabel="첫 화면으로"
    />
  );
}
