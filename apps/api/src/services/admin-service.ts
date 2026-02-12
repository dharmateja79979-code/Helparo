import {
  getCommissionConfig,
  listAuditLogs,
  setCommissionConfig,
  setHelperKycStatus,
  suspendHelper
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
