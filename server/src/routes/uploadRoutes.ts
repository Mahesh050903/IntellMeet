import { Router, Request, Response, NextFunction } from 'express';
import { CloudinaryService } from '../services/storage/cloudinaryService.js';

const router = Router();

router.post('/image', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image, folder } = req.body;
    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: image (base64 data URL or remote image URL required)',
      });
    }

    const uploadResult = await CloudinaryService.uploadImage(
      image,
      folder || 'intellmeet/uploads'
    );

    if (!uploadResult) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload image to Cloudinary. Please ensure Cloudinary environment credentials are configured.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to Cloudinary',
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
