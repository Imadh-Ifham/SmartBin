import mongoose, { Types } from "mongoose";
import { BinType } from "../models/bin-type.model";
import { binTypeRepository } from "../repositories/bin-type.repository";
import { binTypeService } from "../services/bin-type.service";

// Use Jest for unit tests. These tests mock Mongoose interactions so they run fast
// and don't require a live MongoDB instance.

describe("BinType module — model, repository, service", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Model: BinType schema", () => {
    test("should have expected schema paths", () => {
      const paths = BinType.schema.paths;
      expect(paths).toHaveProperty("name");
      expect(paths).toHaveProperty("description");
      const namePath = BinType.schema.paths["name"];
      expect(namePath).toBeDefined();
      expect(namePath && namePath.options).toBeDefined();
      expect(namePath && (namePath.options as any).required).toBe(true);
    });
  });

  describe("Repository: BinTypeRepository", () => {
    test("list() should call BinType.find and return result", async () => {
      const fake = [{ name: "Plastic" }];
      const findMock = jest
        .spyOn(BinType, "find")
        .mockReturnValueOnce({ sort: () => Promise.resolve(fake) } as any);

      const res = await binTypeRepository.list();
      expect(findMock).toHaveBeenCalled();
      expect(res).toEqual(fake);
    });

    test("get() should return null for invalid id", async () => {
      const res = await binTypeRepository.get("not-an-id");
      expect(res).toBeNull();
    });

    test("get() should call findById for valid id", async () => {
      const id = new Types.ObjectId().toHexString();
      const fake = { _id: id, name: "Glass" } as any;
      const findByIdMock = jest
        .spyOn(BinType, "findById")
        .mockResolvedValueOnce(fake as any);

      const res = await binTypeRepository.get(id);
      expect(findByIdMock).toHaveBeenCalledWith(id);
      expect(res).toEqual(fake);
    });

    test("create() should instantiate BinType and call save()", async () => {
      const payload = { name: "Metal", description: "Metal waste" };
      const saveMock = jest
        .spyOn((BinType as any).prototype, "save")
        .mockResolvedValueOnce({ _id: "1", ...payload } as any);

      const res = await binTypeRepository.create(payload as any);
      expect(saveMock).toHaveBeenCalled();
      expect(res).toEqual({ _id: "1", ...payload });
    });

    test("update() returns null for invalid id", async () => {
      const res = await binTypeRepository.update("bad-id", { name: "X" });
      expect(res).toBeNull();
    });

    test("update() calls findByIdAndUpdate for valid id", async () => {
      const id = new Types.ObjectId().toHexString();
      const payload = { name: "Paper" };
      const fake = { _id: id, ...payload } as any;
      const mock = jest
        .spyOn(BinType, "findByIdAndUpdate")
        .mockResolvedValueOnce(fake as any);

      const res = await binTypeRepository.update(id, payload);
      expect(mock).toHaveBeenCalledWith(id, payload, { new: true });
      expect(res).toEqual(fake);
    });

    test("delete() returns null for invalid id", async () => {
      const res = await binTypeRepository.delete("bad-id");
      expect(res).toBeNull();
    });

    test("delete() calls findByIdAndDelete for valid id", async () => {
      const id = new Types.ObjectId().toHexString();
      const fake = { _id: id, name: "E-Waste" } as any;
      const mock = jest
        .spyOn(BinType, "findByIdAndDelete")
        .mockResolvedValueOnce(fake as any);

      const res = await binTypeRepository.delete(id);
      expect(mock).toHaveBeenCalledWith(id);
      expect(res).toEqual(fake);
    });
  });

  describe("Service: BinTypeService", () => {
    test("list() should forward to repository", async () => {
      const fake = [{ name: "Plastic" }];
      const spy = jest
        .spyOn((binTypeService as any).repo, "list")
        .mockResolvedValueOnce(fake as any);

      const res = await binTypeService.list();
      expect(spy).toHaveBeenCalled();
      expect(res).toEqual(fake);
    });

    test("get() should forward to repository", async () => {
      const id = new Types.ObjectId().toHexString();
      const fake = { _id: id, name: "Glass" } as any;
      const spy = jest
        .spyOn((binTypeService as any).repo, "get")
        .mockResolvedValueOnce(fake as any);

      const res = await binTypeService.get(id);
      expect(spy).toHaveBeenCalledWith(id);
      expect(res).toEqual(fake);
    });

    test("create() should call repository.create", async () => {
      const payload = { name: "Metal" };
      const fake = { _id: "1", ...payload } as any;
      const spy = jest
        .spyOn((binTypeService as any).repo, "create")
        .mockResolvedValueOnce(fake as any);

      const res = await binTypeService.create(payload as any);
      expect(spy).toHaveBeenCalledWith(payload);
      expect(res).toEqual(fake);
    });

    test("update() should call repository.update", async () => {
      const id = new Types.ObjectId().toHexString();
      const payload = { description: "Updated" };
      const fake = { _id: id, name: "Paper", ...payload } as any;
      const spy = jest
        .spyOn((binTypeService as any).repo, "update")
        .mockResolvedValueOnce(fake as any);

      const res = await binTypeService.update(id, payload);
      expect(spy).toHaveBeenCalledWith(id, payload);
      expect(res).toEqual(fake);
    });

    test("delete() should call repository.delete", async () => {
      const id = new Types.ObjectId().toHexString();
      const fake = { _id: id, name: "E-Waste" } as any;
      const spy = jest
        .spyOn((binTypeService as any).repo, "delete")
        .mockResolvedValueOnce(fake as any);

      const res = await binTypeService.delete(id);
      expect(spy).toHaveBeenCalledWith(id);
      expect(res).toEqual(fake);
    });
  });
});
