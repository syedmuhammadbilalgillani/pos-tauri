import { apiClient } from "@/lib/tan-stack/api-helper";
import { loadAuthSession } from "@/lib/tan-stack/auth/storage";

export type Brand = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  cuisineType: string | null;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListBrandsResponse = { items: Brand[]; nextCursor: string | null };

export type CreateBrandInput = {
  name: string;
  slug?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  cuisineType?: string | null;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isActive?: boolean;
};

export type UpdateBrandInput = Partial<CreateBrandInput>;

export function requireTenantId(): string {
  const tenantId = loadAuthSession()?.user?.tenantId;
  
  if (!tenantId) throw new Error("Missing tenantId in auth session");
  return tenantId;
}

function tenantHeaders(tenantId: string): HeadersInit {
  // Backend expects lowercase header names (Express normalizes)
  return { "x-tenant-id": tenantId };
}

export async function listBrandsRequest(params?: {
  q?: string;
  isActive?: boolean;
  limit?: number;
  cursor?: string;
}): Promise<ListBrandsResponse> {
  const tenantId = requireTenantId();
  const res = await apiClient.get<ListBrandsResponse>("/brands", {
    params,
    headers: tenantHeaders(tenantId),
  });
  return res.data;
}

export async function getBrandByIdRequest(id: string): Promise<Brand> {
  const tenantId = requireTenantId();
  const res = await apiClient.get<Brand>(`/brands/${id}`, {
    headers: tenantHeaders(tenantId),
  });
  return res.data;
}

export async function createBrandRequest(input: CreateBrandInput): Promise<Brand> {
  const tenantId = requireTenantId();
  const res = await apiClient.post<Brand>("/brands", input, {
    headers: tenantHeaders(tenantId),
  });
  return res.data;
}

export async function updateBrandRequest(args: {
  id: string;
  input: UpdateBrandInput;
}): Promise<Brand> {
  const tenantId = requireTenantId();
  const res = await apiClient.patch<Brand>(`/brands/${args.id}`, args.input, {
    headers: tenantHeaders(tenantId),
  });
  return res.data;
}

export async function deactivateBrandRequest(id: string): Promise<Brand> {
  const tenantId = requireTenantId();
  const res = await apiClient.delete<Brand>(`/brands/${id}`, {
    headers: tenantHeaders(tenantId),
  });
  return res.data;
}

export async function deleteBrandRequest(id: string): Promise<Brand> {
  const tenantId = requireTenantId();
  const res = await apiClient.delete<Brand>(`/brands/delete/${id}`, {
    headers: tenantHeaders(tenantId),
  });
  return res.data;
}