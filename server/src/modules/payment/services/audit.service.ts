export class AuditService {
  async log(entry: {
    actorId: string;
    action: string;
    entityId?: string;
    entityType?: string;
    details?: any;
  }) {
    // Replace with real logger/persistence in production
    console.info("[AUDIT]", { ...entry, ts: new Date().toISOString() });
  }
}
