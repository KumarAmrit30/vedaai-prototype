import apiClient from "@/lib/api/axios";
import type {
  BillingProfile,
  BillingProfileResponse,
  Plan,
  PlanCatalogResponse,
} from "@/types/billing";

export async function fetchPlanCatalog(): Promise<Plan[]> {
  const response = await apiClient.get<PlanCatalogResponse>("/billing/plans");
  return response.data.data;
}

export async function fetchCurrentPlan(): Promise<BillingProfile> {
  const response = await apiClient.get<BillingProfileResponse>(
    "/billing/current-plan",
  );
  return response.data.data;
}
