let diskStorageArgs;
let multerArgs;

jest.mock("multer", () => {
  const multerMock = jest.fn((args) => {
    multerArgs = args;
    return "multerInstance";
  });
  multerMock.diskStorage = jest.fn((args) => {
    diskStorageArgs = args;
    return "diskStorageInstance";
  });
  return multerMock;
});

const uploadMiddleware = require("../uploadMiddleware");

describe("uploadMiddleware", () => {
  describe("diskStorage", () => {
    it("should set destination to uploads/doctors", () => {
      const cb = jest.fn();
      diskStorageArgs.destination({}, {}, cb);
      expect(cb).toHaveBeenCalledWith(null, "uploads/doctors");
    });

    it("should set filename correctly", () => {
      const cb = jest.fn();
      const file = { originalname: "my test file.jpg" };
      
      const realDateNow = Date.now.bind(global.Date);
      const dateNowStub = jest.fn(() => 12345);
      global.Date.now = dateNowStub;

      diskStorageArgs.filename({}, file, cb);

      expect(cb).toHaveBeenCalledWith(null, "12345-my-test-file.jpg");

      global.Date.now = realDateNow;
    });
  });

  describe("fileFilter", () => {
    it("should accept image files", () => {
      const cb = jest.fn();
      const file = { mimetype: "image/png" };

      multerArgs.fileFilter({}, file, cb);

      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should reject non-image files with an Error", () => {
      const cb = jest.fn();
      const file = { mimetype: "application/pdf" };

      multerArgs.fileFilter({}, file, cb);

      expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
      expect(cb.mock.calls[0][0].message).toBe("Only image files are allowed");
    });
  });

  describe("multer limits", () => {
    it("should have fileSize limit of 2MB", () => {
      expect(multerArgs.limits).toEqual({ fileSize: 2 * 1024 * 1024 });
    });
  });
});
