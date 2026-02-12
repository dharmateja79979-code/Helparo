import {
  createCategoryAdmin,
  createSubscriptionPlanAdmin,
  createZoneAdmin,
  getCommissionConfig,
  listCategoriesAdmin,
  listAuditLogs,
  listSubscriptionPlansAdmin,
  listZonesAdmin,
  setCommissionConfig,
  setHelperKycStatus,
  suspendHelper,
  updateCategoryAdmin,
  updateSubscriptionPlanAdmin,
  updateZoneAdmin
} from "../repositories/admin-repository.js";
import { NotFoundError } from "../lib/errors.js";

export const approveHelper = async (helperId: string) => {
  const result = await setHelperKycStatus(helperId, "approved", true);
  if (!result) throw new NotFoundError("Helper profile not found");
  return result;
};

export const rejectHelper = async (helperId: string) => {
  const result = await setHelperKycStatus(helperId, "rejected", false);
  if (!result) throw new NotFoundError("Helper profile not found");
  return result;
};

export const suspendHelperByAdmin = async (helperId: string) => {
  const result = await suspendHelper(helperId);
  if (!result) throw new NotFoundError("Helper profile not found");
  return result;
};

export const listAuditLogsForAdmin = async (limit = 100) => listAuditLogs(limit);

export const getCommissionConfigForAdmin = async () => getCommissionConfig();

export const updateCommissionConfigForAdmin = async (defaultPercent: number) =>
  setCommissionConfig(defaultPercent);

export const listCategoriesForAdmin = async () => listCategoriesAdmin();

export const createCategoryForAdmin = async (input: {
  name: string;
  description?: string;
  iconKey?: string;
  isActive?: boolean;
}) => createCategoryAdmin(input);

export const updateCategoryForAdmin = async (
  id: string,
  input: {
    name?: string;
    description?: string;
    iconKey?: string;
    isActive?: boolean;
  }
) => {
  const row = await updateCategoryAdmin(id, input);
  if (!row) throw new NotFoundError("Category not found");
  return row;
};

export const listZonesForAdmin = async () => listZonesAdmin();

export const createZoneForAdmin = async (input: {
  name: string;
  city: string;
  country: string;
  polygon?: unknown;
  isActive?: boolean;
}) => createZoneAdmin(input);

export const updateZoneForAdmin = async (
  id: string,
  input: {
    name?: string;
    city?: string;
    country?: string;
    polygon?: unknown;
    isActive?: boolean;
  }
) => {
  const row = await updateZoneAdmin(id, input);
  if (!row) throw new NotFoundError("Zone not found");
  return row;
};

export const listSubscriptionPlansForAdmin = async () => listSubscriptionPlansAdmin();

export const createSubscriptionPlanForAdmin = async (input: {
  code: string;
  name: string;
  monthlyPrice: number;
  features: string[];
  isActive?: boolean;
}) => createSubscriptionPlanAdmin(input);

export const updateSubscriptionPlanForAdmin = async (
  id: string,
  input: {
    name?: string;
    monthlyPrice?: number;
    features?: string[];
    isActive?: boolean;
  }
) => {
  const row = await updateSubscriptionPlanAdmin(id, input);
  if (!row) throw new NotFoundError("Subscription plan not found");
  return row;
};
