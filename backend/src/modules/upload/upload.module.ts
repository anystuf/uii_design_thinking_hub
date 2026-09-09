import { Module } from '@nestjs/common';

import { MockUploadProvider } from './mock-upload.provider';
import { SharePointService } from './sharepoint.service';
import { UPLOAD_PROVIDER } from './upload-provider.interface';

@Module({
  providers: [
    MockUploadProvider,
    { provide: UPLOAD_PROVIDER, useExisting: MockUploadProvider },
    SharePointService,
  ],
  exports: [SharePointService],
})
export class UploadModule {}
