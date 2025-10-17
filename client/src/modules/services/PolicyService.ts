
import axiosInstance from '../../config/axiosInstance';
import type { AxiosInstance } from 'axios';
import type { Policy } from '../policies/types';

export interface PolicyListParams {
  q?: string;
  category?: string;
  ministry?: string;
  status?: string;
  complianceStatus?: string;
}

export class PolicyServiceClass {
  private base = '/policies';
  private http: AxiosInstance;

  constructor(http: AxiosInstance = axiosInstance) {
    this.http = http;
    // attempt to set token from common storage locations so the service works
    // immediately after login without requiring a hook in every component
    try {
      const token =
        typeof window !== 'undefined' && localStorage.getItem('token')
          ? localStorage.getItem('token')
          : null;
      if (token) this.setAuthToken(token);
    } catch (err) {
      // ignore storage access errors in environments where localStorage is not available
      // (SSR or tests)
    }
  }

  // minimal headers type to avoid `no-explicit-any` lint error while keeping runtime flexibility
  // axios headers may be nested by method (common, get, post...), so we support an index signature
  private getHeaders(): Record<string, string | undefined> {
    // axios.defaults.headers can be typed differently across axios versions
    // we treat it as an indexable record of optional strings for runtime manipulation
    const defaults = (this.http.defaults as unknown) as { headers?: Record<string, unknown> };
    const headers = defaults?.headers ?? {};
    // convert any unknown values to string | undefined when possible
    const result: Record<string, string | undefined> = {};
    Object.keys(headers).forEach((k) => {
      const v = (headers as Record<string, unknown>)[k];
      result[k] = typeof v === 'string' ? v : undefined;
    });
    return result;
  }

  setAuthToken(token?: string | null) {
    // axios defaults.headers can be a complex object depending on axios version.
    const headers = this.getHeaders();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (headers && headers.Authorization) {
      delete headers.Authorization;
    }
    // assign back (use unknown to satisfy TypeScript while preserving runtime shape)
    (this.http.defaults as unknown as { headers?: Record<string, unknown> }).headers = headers;
  }

  async getAll(params?: PolicyListParams): Promise<unknown> {
    const res = await this.http.get(this.base, { params });
    // backend may return either an array or an object { policies: [...] }
    return res.data?.policies ?? res.data;
  }

  async getById(id: string): Promise<Policy | unknown> {
    const res = await this.http.get(`${this.base}/${id}`);
    return res.data?.policy ?? res.data;
  }

  async getVersions(id: string): Promise<unknown> {
    const res = await this.http.get(`${this.base}/${id}/versions`);
    // expect { count, versions }
    return res.data?.versions ?? res.data;
  }

  async getAudit(id: string): Promise<unknown> {
    const res = await this.http.get(`${this.base}/${id}/audit`);
    // expect { count, audit }
    return res.data?.audit ?? res.data;
  }

  async create(payload: Partial<Policy>): Promise<Policy | unknown> {
    console.log('[PolicyService] Creating policy with payload:', payload);
    console.log('[PolicyService] Current axios headers:', (this.http.defaults as any).headers);
    const res = await this.http.post(this.base, payload);
    console.log('[PolicyService] Create response:', res);
    return res.data?.policy ?? res.data;
  }

  async update(id: string, payload: Partial<Policy>): Promise<Policy | unknown> {
    const res = await this.http.put(`${this.base}/${id}`, payload);
    return res.data?.policy ?? res.data;
  }

  async approve(id: string): Promise<Policy | unknown> {
    const res = await this.http.post(`${this.base}/${id}/approve`);
    return res.data?.policy ?? res.data;
  }

  async requestFeedback(id: string, payload: { stakeholderGroups?: string[]; message?: string }): Promise<unknown> {
    const res = await this.http.post(`${this.base}/${id}/feedbackRequest`, payload);
    return res.data;
  }

  async remove(id: string): Promise<boolean> {
    const res = await this.http.delete(`${this.base}/${id}`);
    // backend may return deleted document or a message; return data when present, else true
    return (res.data as any) ?? true;
  }

  async markIssue(id: string, issue: string): Promise<Policy | unknown> {
    const res = await this.http.post(`${this.base}/${id}/issue`, { issue });
    return res.data?.policy ?? res.data;
  }

  /**
   * Batch approve multiple policies
   */
  async bulkApprove(ids: string[]): Promise<{ successful: number; failed: number }> {
    const results = await Promise.allSettled(
      ids.map(id => this.approve(id))
    );
    return {
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }

  /**
   * Batch delete multiple policies
   */
  async bulkDelete(ids: string[]): Promise<{ successful: number; failed: number }> {
    const results = await Promise.allSettled(
      ids.map(id => this.remove(id))
    );
    return {
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }

  /**
   * Get multiple policies by IDs
   */
  async getMultiple(ids: string[]): Promise<(Policy | unknown)[]> {
    const results = await Promise.allSettled(
      ids.map(id => this.getById(id))
    );
    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<Policy | unknown>).value);
  }
}

export const PolicyService = new PolicyServiceClass();
