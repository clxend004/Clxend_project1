import { convertImageFileToJpeg } from "./fileUtils";

// jsdom doesn't implement canvas rendering or Image loading by
// default. These tests stub just enough of the browser APIs
// convertImageFileToJpeg relies on to verify its control flow
// (success path, and that it produces a JPEG-typed File) without
// needing a real browser.
describe("convertImageFileToJpeg", () => {
  let originalCreateObjectURL;
  let originalRevokeObjectURL;

  beforeEach(() => {
    originalCreateObjectURL = global.URL.createObjectURL;
    originalRevokeObjectURL = global.URL.revokeObjectURL;

    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = jest.fn();

    // Stub canvas methods used by the helper.
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      fillStyle: "",
      fillRect: jest.fn(),
      drawImage: jest.fn(),
    }));

    HTMLCanvasElement.prototype.toBlob = jest.fn(function (callback) {
      callback(new Blob(["fake-jpeg-bytes"], { type: "image/jpeg" }));
    });
  });

  afterEach(() => {
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  test("converts a PNG file to a JPEG-typed File with a .jpg name", async () => {
    const pngFile = new File(["fake-png-bytes"], "document.png", {
      type: "image/png",
    });

    // Trigger the stubbed Image's onload manually, since jsdom
    // doesn't actually decode image bytes.
    const originalImage = global.Image;
    global.Image = class {
      set src(_) {
        this.naturalWidth = 800;
        this.naturalHeight = 600;
        setTimeout(() => this.onload && this.onload(), 0);
      }
    };

    const result = await convertImageFileToJpeg(pngFile);

    expect(result.type).toBe("image/jpeg");
    expect(result.name).toBe("document.jpg");

    global.Image = originalImage;
  });

  test("rejects when the image fails to load", async () => {
    const badFile = new File(["not-an-image"], "broken.png", {
      type: "image/png",
    });

    const originalImage = global.Image;
    global.Image = class {
      set src(_) {
        setTimeout(() => this.onerror && this.onerror(), 0);
      }
    };

    await expect(convertImageFileToJpeg(badFile)).rejects.toThrow(
      /could not read/i
    );

    global.Image = originalImage;
  });
});