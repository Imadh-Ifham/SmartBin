import WasteCollectionModel, {
  WasteCollectionDoc,
} from "../models/waste-collection.model";

/**
 * Repository layer for Waste Collection operations.
 * Handles direct database interaction via Mongoose.
 */
export class WasteCollectionRepository {
  /**
   * Creates a new waste collection record in the database.
   *
   * @param data - Waste collection payload containing bin code, waste types, etc.
   * @returns The saved WasteCollection document.
   */
  async create(data: Partial<WasteCollectionDoc>): Promise<WasteCollectionDoc> {
    const doc = new WasteCollectionModel(data);
    return await doc.save();
  }
}
