import { Inject, Injectable } from '@nestjs/common';

import { UPLOAD_PROVIDER, UploadProvider } from './upload-provider.interface';

@Injectable()
export class SharePointService {
  constructor(@Inject(UPLOAD_PROVIDER) private readonly provider: UploadProvider) {}

  uploadFile(...args: Parameters<UploadProvider['uploadFile']>) {
    return this.provider.uploadFile(...args);
  }

  deleteFile(...args: Parameters<UploadProvider['deleteFile']>) {
    return this.provider.deleteFile(...args);
  }

  generateViewLink(...args: Parameters<UploadProvider['generateViewLink']>) {
    return this.provider.generateViewLink(...args);
  }
}
