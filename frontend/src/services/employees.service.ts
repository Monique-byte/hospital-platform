import { api } from "./api";
import {
  PaginatedResult,
  EmployeePublic,
  EmployeeProfileResponse,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  UpdateOrganizationPayload,
  EmployeeStatus,
} from "@/types";

export interface DirectoryFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  sectorId?: string;
  unitId?: string;
  positionId?: string;
}

export const EmployeesService = {
  async listDirectory(filters: DirectoryFilters) {
    const { data } = await api.get<PaginatedResult<EmployeePublic>>(
      "/funcionarios",
      { params: filters }
    );
    return data;
  },

  async getProfile(id: string) {
    const { data } = await api.get<EmployeeProfileResponse>(
      `/funcionarios/${id}`
    );
    return data;
  },

  async create(payload: CreateEmployeePayload) {
    const { data } = await api.post<{ employee: EmployeePublic }>(
      "/funcionarios",
      payload
    );
    return data.employee;
  },

  async update(id: string, payload: UpdateEmployeePayload) {
    const { data } = await api.patch<{ employee: EmployeePublic }>(
      `/funcionarios/${id}`,
      payload
    );
    return data.employee;
  },

  async updateStatus(id: string, status: EmployeeStatus) {
    const { data } = await api.patch<{ employee: EmployeePublic }>(
      `/funcionarios/${id}/status`,
      { status }
    );
    return data.employee;
  },

  async updateOrganization(
    id: string,
    payload: UpdateOrganizationPayload
  ) {
    const { data } = await api.patch<{ employee: EmployeePublic }>(
      `/funcionarios/${id}/organizacao`,
      payload
    );
    return data.employee;
  },
};
