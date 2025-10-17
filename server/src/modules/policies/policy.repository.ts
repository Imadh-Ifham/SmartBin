import { Policy } from './policy.model';
import { PolicyVersion } from './policy.version.model';

export class PolicyRepository {
  async find(query: any) {
    return Policy.find(query).sort({ effectiveDate: -1, createdAt: -1 }).lean();
  }

  async findById(id: string) {
    return Policy.findById(id);
  }

  async create(doc: any) {
    const p = new Policy(doc);
    return p.save();
  }

  async update(policy: any) {
    return policy.save();
  }

  async deleteById(id: string) {
    return Policy.findByIdAndDelete(id);
  }

  async saveVersion(policyId: any, version: number, snapshot: any, changedBy?: any) {
    return PolicyVersion.create({ policyId, version, snapshot, changedBy });
  }
}

export const policyRepository = new PolicyRepository();
