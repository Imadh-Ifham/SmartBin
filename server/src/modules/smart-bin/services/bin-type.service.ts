import { binTypeRepository } from "../repositories/bin-type.repository";

export class BinTypeService {
  constructor(private repo = binTypeRepository) {}

  async list() {
    return this.repo.list();
  }

  async get(id: string) {
    return this.repo.get(id);
  }

  async create(payload: { name: string; description?: string }) {
    return this.repo.create(payload);
  }

  async update(id: string, payload: any) {
    return this.repo.update(id, payload);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
}

export const binTypeService = new BinTypeService();
