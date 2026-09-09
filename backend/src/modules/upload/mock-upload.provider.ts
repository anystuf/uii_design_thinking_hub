import { Injectable } from '@nestjs/common';

import { UploadFileInput, UploadedFileReference, UploadProvider } from './upload-provider.interface';

@Injectable()
export class MockUploadProvider implements UploadProvider {
  async uploadFile(input: UploadFileInput): Promise<UploadedFileReference> {
    const sharepointItemId = `mock-${crypto.randomUUID()}`;
    return {
      ...input,
      sharepointItemId,
      sharepointUrl: `https://uii-design-thinking.mock.sharepoint.com/items/${sharepointItemId}`,
    };
  }

  async deleteFile(_sharepointItemId: string): Promise<void> {}

  async generateViewLink(sharepointItemId: string): Promise<string> {
    return `https://uii-design-thinking.mock.sharepoint.com/view/${sharepointItemId}`;
  }
}
