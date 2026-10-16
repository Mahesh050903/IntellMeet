import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export class CloudinaryService {
  private static configured = false;

  public static init(): void {
    if (this.configured) return;

    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL,
      });
      this.configured = true;
      return;
    }

    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;

    if (cloud_name && api_key && api_secret) {
      cloudinary.config({
        cloud_name,
        api_key,
        api_secret,
        secure: true,
      });
      this.configured = true;
    }
  }

  public static isConfigured(): boolean {
    this.init();
    return Boolean(
      process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    );
  }

  /**
   * Upload an image (base64 data URL, remote URL, or local path) to Cloudinary
   */
  public static async uploadImage(
    fileOrBase64: string,
    folder: string = 'intellmeet/avatars'
  ): Promise<{ url: string; publicId: string } | null> {
    try {
      this.init();
      if (!this.isConfigured()) {
        console.warn('[CloudinaryService] Credentials not found in environment');
        return null;
      }

      const result: UploadApiResponse = await cloudinary.uploader.upload(fileOrBase64, {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('[CloudinaryService] Image upload failed:', error);
      return null;
    }
  }

  /**
   * Delete an image from Cloudinary by public ID
   */
  public static async deleteImage(publicId: string): Promise<boolean> {
    try {
      this.init();
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('[CloudinaryService] Image deletion failed:', error);
      return false;
    }
  }
}
