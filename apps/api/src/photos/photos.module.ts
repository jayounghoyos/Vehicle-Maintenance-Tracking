import { Global, Module } from '@nestjs/common';

import { PhotoStorage } from './photo-storage.service';

/** Global for the same reason the tenant module is: anything that shows
 *  a picture needs it, and importing it everywhere would be noise. */
@Global()
@Module({
  providers: [PhotoStorage],
  exports: [PhotoStorage],
})
export class PhotosModule {}
