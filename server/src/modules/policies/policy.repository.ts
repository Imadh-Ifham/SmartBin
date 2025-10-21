import { Policy } from './policy.model';
import { PolicyVersion } from './policy.version.model';

/**
 * PolicyRepository
 *
 * Data-access layer encapsulating all Mongoose operations for policies and policy versions.
 * This class implements the Repository Pattern: higher-level code (services) depend on
 * this abstraction rather than directly calling Mongoose. This helps with testability
 * (you can mock policyRepository in unit tests) and keeps DB concerns isolated.
 *
 * Methods return either raw Mongoose documents or lean results (for list/find operations).
 * - find(query): returns an array of policies matching the query, sorted by effectiveDate
 *   and createdAt. Uses .lean() to return plain JS objects for read-mostly operations.
 * - findById(id): returns a Mongoose document for the given id (used when updates are applied
 *   directly to the document and saved).
 * - create(doc): instantiate and save a new Policy document.
 * - update(policy): save changes to an existing document (expects a Mongoose doc instance).
 * - deleteById(id): remove a policy by id.
 * - saveVersion(policyId, version, snapshot, changedBy): persist a PolicyVersion entry for
 *   versioning/audit purposes.
 *
 * SOLID notes:
 * - Single Responsibility: this class only handles persistence.
 * - Dependency Inversion: services depend on this high-level abstraction instead of Mongoose
 *   calls inline, which makes it easier to substitute different data stores or mocks.
 */
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
