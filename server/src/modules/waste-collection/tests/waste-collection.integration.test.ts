import request from "supertest";
import express from "express";
import bodyParser from "body-parser";
import { createWasteCollection } from "../controllers/waste-collection.controller";
import { WasteCollectionService } from "../services/waste-collection.service";

jest.mock("../services/waste-collection.service");

const app = express();
app.use(bodyParser.json());
app.post("/api/waste-collections", createWasteCollection);

describe("WasteCollection Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 if code is missing", async () => {
    const res = await request(app).post("/api/waste-collections").send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/code/);
  });

  it("returns 201 and all fields on success", async () => {
    (
      WasteCollectionService.prototype.createByCode as jest.Mock
    ).mockResolvedValue({
      doc: { _id: "wcid", code: "abc" },
      qr: { _id: "qrid" },
      bins: [{ _id: "b1", currentWeight: 10 }],
    });
    const res = await request(app)
      .post("/api/waste-collections")
      .send({ code: "abc" });
    expect(res.status).toBe(201);
    expect(res.body.item).toBeDefined();
  });

  it("returns 400 on service error", async () => {
    (
      WasteCollectionService.prototype.createByCode as jest.Mock
    ).mockRejectedValue(new Error("fail"));
    const res = await request(app)
      .post("/api/waste-collections")
      .send({ code: "abc" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/fail/);
  });
});
