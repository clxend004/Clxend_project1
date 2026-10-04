// Converts a base64 data URI (e.g. a selfie captured from <canvas>)
// into a Blob, so it can be attached to a multipart/form-data
// request as a real file instead of being sent as a giant base64
// string inside a JSON body.
export function dataUrlToBlob(dataUrl) {
  const [header, base64Data] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const byteString = atob(base64Data);
  const byteArray = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([byteArray], { type: mimeType });
}

// =========================================================
// IMAGE FORMAT NORMALIZATION
//
// The identity verification service only accepts JPEG (per
// docs/IDENTITY_API_INTEGRATION.md). Rather than forcing every
// user to already have a .jpg file — many phone cameras save
// as PNG or WEBP — this converts any browser-renderable raster
// image to JPEG client-side using a canvas, before it's ever
// uploaded. This keeps the "always send JPEG" contract with
// the backend/identity service while not making it the user's
// problem.
//
// Does NOT handle PDF or HEIC — see the note in
// docs/IDENTITY_API_INTEGRATION.md for why those need a
// different approach (server-side conversion), not a
// client-side one.
// =========================================================

export function convertImageFileToJpeg(file, quality = 0.92) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        // JPEG has no alpha channel — flatten onto white first,
        // so a transparent PNG doesn't turn black on conversion.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);

            if (!blob) {
              reject(new Error("Could not convert image to JPEG."));
              return;
            }

            const convertedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, "") + ".jpg",
              { type: "image/jpeg" }
            );

            resolve(convertedFile);
          },
          "image/jpeg",
          quality
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read this image file."));
    };

    img.src = objectUrl;
  });
}