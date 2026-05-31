import { useQuery } from '@tanstack/react-query';

import { useParticipantApiController } from '../controller/participantApiControllerProvider';
import type { SurveyAsset } from '../model/asset';
import { participantQueryKeys } from './queryKeys';

const SIGNED_ASSET_URL_STALE_TIME_MS = 50 * 60 * 1000;
const SIGNED_ASSET_URL_GC_TIME_MS = 60 * 60 * 1000;

export function useAssetUrlsQuery(assets: SurveyAsset[]) {
  const controller = useParticipantApiController();
  const assetIds = assets.map((asset) => asset.id);

  return useQuery({
    queryKey: participantQueryKeys.assetUrls(assetIds),
    queryFn: () => controller.getAssetUrls(assets),
    enabled: assets.length > 0,
    staleTime: SIGNED_ASSET_URL_STALE_TIME_MS,
    gcTime: SIGNED_ASSET_URL_GC_TIME_MS,
  });
}
