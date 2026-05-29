import { Route, Routes } from 'react-router-dom';

import { ParticipantLoginPage } from '../view/participant/auth/ParticipantLoginPage';
import { SurveyCompletePage } from '../view/participant/survey/SurveyCompletePage';
import { SurveyEntryPage } from '../view/participant/survey/SurveyEntryPage';
import { SurveyIntroPage } from '../view/participant/survey/SurveyIntroPage';
import { SurveyReviewPage } from '../view/participant/survey/SurveyReviewPage';
import { SurveySectionPage } from '../view/participant/survey/SurveySectionPage';
import { AccessDeniedPage } from '../view/participant/system/AccessDeniedPage';
import { AlreadySubmittedPage } from '../view/participant/system/AlreadySubmittedPage';
import { SurveyClosedPage } from '../view/participant/system/SurveyClosedPage';
import { SurveyNotFoundPage } from '../view/participant/system/SurveyNotFoundPage';
import { RequireParticipantAccess, RequirePublishedSurvey } from './routeGuards';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SurveyNotFoundPage />} />
      <Route path="/demo" element={<SurveyNotFoundPage />} />
      <Route path="/demo/*" element={<SurveyNotFoundPage />} />
      <Route path="/survey/demo" element={<SurveyNotFoundPage />} />
      <Route path="/survey/demo/login" element={<SurveyNotFoundPage />} />
      <Route path="/survey/demo/intro" element={<SurveyNotFoundPage />} />
      <Route path="/survey/demo/sections/:sectionKey" element={<SurveyNotFoundPage />} />
      <Route path="/survey/demo/review" element={<SurveyNotFoundPage />} />
      <Route path="/survey/demo/complete" element={<SurveyNotFoundPage />} />
      <Route path="/survey/demo/closed" element={<SurveyNotFoundPage />} />
      <Route path="/survey/demo/already-submitted" element={<SurveyNotFoundPage />} />
      <Route path="/survey/demo/access-denied" element={<SurveyNotFoundPage />} />
      <Route path="/survey/demo/not-found" element={<SurveyNotFoundPage />} />
      <Route path="/survey/demo/*" element={<SurveyNotFoundPage />} />
      <Route path="/survey/:publicSlug" element={<SurveyEntryPage />} />
      <Route path="/survey/:publicSlug/login" element={<ParticipantLoginPage />} />
      <Route
        path="/survey/:publicSlug/intro"
        element={
          <RequireParticipantAccess>
            <SurveyIntroPage />
          </RequireParticipantAccess>
        }
      />
      <Route
        path="/survey/:publicSlug/sections/:sectionKey"
        element={
          <RequireParticipantAccess>
            <SurveySectionPage />
          </RequireParticipantAccess>
        }
      />
      <Route
        path="/survey/:publicSlug/review"
        element={
          <RequireParticipantAccess>
            <SurveyReviewPage />
          </RequireParticipantAccess>
        }
      />
      <Route path="/survey/:publicSlug/complete" element={<SurveyCompletePage />} />
      <Route path="/survey/:publicSlug/closed" element={<SurveyClosedPage />} />
      <Route path="/survey/:publicSlug/already-submitted" element={<AlreadySubmittedPage />} />
      <Route path="/survey/:publicSlug/access-denied" element={<AccessDeniedPage />} />
      <Route path="/survey/:publicSlug/not-found" element={<SurveyNotFoundPage />} />
      <Route path="*" element={<SurveyNotFoundPage />} />
    </Routes>
  );
}
