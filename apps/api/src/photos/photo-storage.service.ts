import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

/**
 * The only file that knows where an image lives.
 *
 * Everything else holds a storage key and asks here for a URL, so moving
 * to S3 or to the database later is a change to this file and nothing
 * else. That is also what data_model.dbml means by storage_key.
 */
@Injectable()
export class PhotoStorage {
  private readonly logger = new Logger(PhotoStorage.name);
  private readonly configured: boolean;

  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
    this.configured = Boolean(cloudName && apiKey && apiSecret);

    // missing credentials are not a reason to refuse to boot: a
    // teammate who never uploads a photo should still be able to run
    // everything else, and be told plainly if they try
    if (!this.configured) {
      this.logger.warn('No Cloudinary credentials: photo upload is switched off');
      return;
    }
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  }

  /** Foldered per organization, so an asset can be traced back to the
   *  client it belongs to without opening the database. */
  async upload(file: Buffer, organizationId: number): Promise<string> {
    this.requireCredentials();
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: `mts/org-${organizationId}`, resource_type: 'image' },
          (error, uploaded) =>
            error || !uploaded
              ? reject(error ?? new Error('Upload failed'))
              : resolve(uploaded),
        )
        .end(file);
    });
    return result.public_id;
  }

  /** Failure is logged, not thrown: the row already points somewhere
   *  else, and a leftover file is better than a request that reports an
   *  error for work that succeeded. */
  async remove(storageKey: string): Promise<void> {
    if (!this.configured) return;
    try {
      await cloudinary.uploader.destroy(storageKey);
    } catch (error) {
      this.logger.warn(`Could not delete ${storageKey}: ${String(error)}`);
    }
  }

  /** Sized on delivery rather than on upload, so the table asks for a
   *  thumbnail and the profile asks for the big one from the same file. */
  url(storageKey: string | null, width: number): string | null {
    if (!storageKey || !this.configured) return null;
    return cloudinary.url(storageKey, {
      secure: true,
      width,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });
  }

  private requireCredentials(): void {
    if (this.configured) return;
    throw new ServiceUnavailableException(
      'Photo storage is not configured on this server',
    );
  }
}
