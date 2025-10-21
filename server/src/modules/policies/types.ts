import { Types } from "mongoose";

/**
 * Shared types used across the policies module
 *
 * - ServiceOptions: optional runtime options passed from controllers (e.g., userId,
 *   boolean flags like enforceCompliance).
 * - FeedbackRequest / IssueRequest: shapes expected by controller endpoints that
 *   map directly to service method parameters.
 * - ServiceContext: a lightweight wrapper to represent the current request user
 *   context passed down to services where needed.
 */
export interface ServiceOptions {
  userId?: string;
  enforceCompliance?: boolean;
}

export interface FeedbackRequest {
  stakeholderGroups?: string[];
  message?: string;
}

export interface IssueRequest {
  issue: string;
}

export interface UserContext {
  id?: string;
  _id?: string;
}

export interface ServiceContext {
  user?: UserContext;
}
