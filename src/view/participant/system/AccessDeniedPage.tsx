import { useParams } from 'react-router-dom';

import { SystemStatePage } from './SystemStatePage';
import './css/AccessDeniedPage.css';

export function AccessDeniedPage() {
  const { publicSlug = '' } = useParams();

  return (
    <SystemStatePage
      eyebrow="접근 제한"
      title="이 설문에 접근할 수 없습니다."
      description="로그인 상태를 확인한 뒤 다시 시도해주세요."
      actionHref={`/survey/${publicSlug}/login`}
      actionLabel="다시 로그인하기"
    />
  );
}
