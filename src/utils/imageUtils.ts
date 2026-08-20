/**
 * Image Utilities for Device Photo Gallery & Camera Upload
 * Converts files directly to compressed Data URLs for instant preview & persistence
 */

export async function processDeviceImage(file: File, maxDimension = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Tệp đã chọn không phải là hình ảnh.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh từ thiết bị.'));
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return reject(new Error('Lỗi tải dữ liệu ảnh.'));

      // If file is small (< 300KB) and not huge, resolve directly
      if (file.size < 300 * 1024) {
        return resolve(result);
      }

      // Downscale high-resolution phone camera photos to keep performance snappy
      const img = new Image();
      img.onerror = () => resolve(result); // Fallback to raw data url
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(result);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}
