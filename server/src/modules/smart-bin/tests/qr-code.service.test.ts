// Mock cloudinary before importing the service so the module uses the mock
const mockUploadStream = jest.fn();
jest.mock("../../../config/cloudinary", () => {
  const { Writable } = require("stream");
  return {
    uploader: {
      upload_stream: (opts: any, cb: any) => {
        // return a real writable stream so Readable.pipe(uploadStream) works
        const writable = new Writable({
          write(chunk: any, encoding: any, callback: any) {
            // drop data
            callback();
          },
        });
        writable.on("finish", () =>
          cb(null, {
            url: "http://cdn/test.png",
            secure_url: "https://cdn/test.png",
          })
        );
        mockUploadStream(opts, cb);
        return writable as any;
      },
    },
  };
});

import { QRCodeService } from "../services/qr-code.service";

describe("QRCodeService.create (cloudinary path)", () => {
  afterEach(() => jest.restoreAllMocks());

  test("generates QR, uploads via cloudinary and saves document", async () => {
    const fakeDataUrl = "data:image/png;base64,AAA";

    const mockRepo = {
      findByCode: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((doc: any) =>
          Promise.resolve({ _id: "1", ...doc })
        ),
    } as any;

    const mockGenerator = {
      toDataURL: jest.fn().mockResolvedValue(fakeDataUrl),
    };

    const svc = new QRCodeService(mockRepo as any, mockGenerator as any);

    const payload = {
      userId: "u1",
      address: "addr",
      province: "Western Province",
      city: "Kalutara",
    } as any;
    const res = await svc.create(payload);

    expect(mockGenerator.toDataURL).toHaveBeenCalled();
    expect(mockRepo.create).toHaveBeenCalled();
    expect(res).toHaveProperty("_id");
    expect(res.qrUrl).toBe("https://cdn/test.png");
  });

  test("throws when required fields missing", async () => {
    const svc = new QRCodeService({} as any);
    await expect(svc.create({} as any)).rejects.toThrow("userId is required");
    await expect(svc.create({ userId: "u" } as any)).rejects.toThrow(
      "address is required"
    );
    await expect(
      svc.create({ userId: "u", address: "a" } as any)
    ).rejects.toThrow("province is required");
  });
});
