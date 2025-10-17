import { Types } from "mongoose";

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
