export class RedistributionRecommendationDto {
  id: string;
  sourceHubId: string;
  sourceHubName: string;
  destinationHubId: string;
  destinationHubName: string;
  vehicleIds: string[];
  vehicleDetails: Array<{
    id: string;
    code: string;
    name: string;
    batteryLevel: number;
  }>;
  reason: string;
  estimatedDistance: number;
  status: string;
}

export class ApproveRedistributionDto {
  planId: string;
}

export class RejectRedistributionDto {
  planId: string;
  reason?: string;
}

export class RedistributionResponseDto {
  message: string;
  planId: string;
  status: string;
}

export class GetRedistributionRecommendationResponseDto {
  recommendation: RedistributionRecommendationDto | null;
  available: boolean;
  message: string;
}
