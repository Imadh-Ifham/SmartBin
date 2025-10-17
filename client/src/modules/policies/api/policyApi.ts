import { PolicyService } from '../../services/PolicyService';
import type { Policy } from '../types';

export interface PolicyListParams {
  q?: string;
  category?: string;
  ministry?: string;
  status?: string;
  complianceStatus?: string;
}

export const getPolicies = (params?: PolicyListParams) => PolicyService.getAll(params);
export const getPolicyById = (id: string) => PolicyService.getById(id);
export const createPolicy = (payload: Partial<Policy>) => PolicyService.create(payload);
export const updatePolicy = (id: string, payload: Partial<Policy>) => PolicyService.update(id, payload);
export const approvePolicy = (id: string) => PolicyService.approve(id);
export const deletePolicy = (id: string) => PolicyService.remove(id);
export const markIssue = (id: string, issue: string) => PolicyService.markIssue(id, issue);
export const getPolicyVersions = (id: string) => PolicyService.getVersions(id);
export const getPolicyAudit = (id: string) => PolicyService.getAudit(id);
export const requestPolicyFeedback = (id: string, payload: { stakeholderGroups?: string[]; message?: string }) => PolicyService.requestFeedback(id, payload);

export const PolicyAPI = {
  getAll: getPolicies,
  getById: getPolicyById,
  create: createPolicy,
  update: updatePolicy,
  approve: approvePolicy,
  getVersions: getPolicyVersions,
  getAudit: getPolicyAudit,
  requestFeedback: requestPolicyFeedback,
  markIssue,
  remove: deletePolicy,
};