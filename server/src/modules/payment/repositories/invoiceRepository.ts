import { InvoiceModel, IInvoice } from "../models/invoiceModel";

export class InvoiceRepository {
  async create(data: Partial<IInvoice>) {
    return await InvoiceModel.create(data);
  }

  async findByResident(residentId: string) {
    return await InvoiceModel.find({ residentId }).exec();
  }

  async findById(id: string) {
    return await InvoiceModel.findById(id).exec();
  }

  async updateStatus(id: string, status: IInvoice["status"]) {
    return await InvoiceModel.findByIdAndUpdate(id, { status }, { new: true });
  }
}
