import { apiClient } from "@/lib/tan-stack/api-helper";
import { loadPlatformSession } from "@/lib/tan-stack/platform-auth/storage";

export type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPrice: string | null;
  annualPrice: string | null;

  maxLocations: number | null;
  maxBrands: number | null;
  maxUsers: number | null;
  maxTerminals: number | null;
  maxMenuItems: number | null;

  featMultiBranch: boolean;
  featOnlineOrdering: boolean;
  featDeliveryMgmt: boolean;
  featQrOrdering: boolean;
  featKioskOrdering: boolean;
  featWhatsappOrdering: boolean;
  featGroupOrdering: boolean;
  featScheduledOrders: boolean;
  featLoyalty: boolean;
  featWallet: boolean;
  featCrm: boolean;
  featAggregatorSync: boolean;
  featAdvancedAnalytics: boolean;
  featFbrIntegration: boolean;
  featApiAccess: boolean;
  featWhiteLabel: boolean;
  featCustomDomain: boolean;

  trialDays: number;
  isActive: boolean;
  displayOrder: number;
  permissionCap: Record<string, unknown> | null;

  createdAt: string;
  updatedAt: string;
};

export type ListPlansResponse = { items: Plan[] };

export type CreatePlanInput = Omit<Plan, "id" | "createdAt" | "updatedAt">;

export type UpdatePlanInput = Partial<CreatePlanInput>;

function platformApiConfig() {
  const access = loadPlatformSession()?.accessToken;
  if (!access) throw new Error("Platform session missing. Login again.");
  return { token: access, _skipRefresh: true as const };
}

export async function listPlansRequest(params?: {
  q?: string;
  includeInactive?: boolean;
}): Promise<ListPlansResponse> {
  const res = await apiClient.get<ListPlansResponse>("plans", {
    ...platformApiConfig(),
    params,
  });
  return res.data;
}

export async function getPlanByIdRequest(id: string): Promise<Plan> {
  const res = await apiClient.get<Plan>(`plans/${id}`, {
    ...platformApiConfig(),
  });
  return res.data;
}

export async function createPlanRequest(input: CreatePlanInput): Promise<Plan> {
  const res = await apiClient.post<Plan>("plans", input, {
    ...platformApiConfig(),
  });
  return res.data;
}

export async function updatePlanRequest(args: {
  id: string;
  input: UpdatePlanInput;
}): Promise<Plan> {
  const res = await apiClient.patch<Plan>(`plans/${args.id}`, args.input, {
    ...platformApiConfig(),
  });
  return res.data;
}

export async function deletePlanRequest(id: string): Promise<void> {
  await apiClient.delete("plans/" + id, {
    ...platformApiConfig(),
  });
}
