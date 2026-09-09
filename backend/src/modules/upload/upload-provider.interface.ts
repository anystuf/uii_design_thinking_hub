export type UploadFileInput = {
  fileName: string;
  mimeType: string;
  size: number;
};

export type UploadedFileReference = {
  fileName: string;
  mimeType: string;
  size: number;
  sharepointItemId: string;
  sharepointUrl: string;
};

export interface UploadProvider {
  uploadFile(input: UploadFileInput): Promise<UploadedFileReference>;
  deleteFile(sharepointItemId: string): Promise<void>;
  generateViewLink(sharepointItemId: string): Promise<string>;
}

export const UPLOAD_PROVIDER = Symbol('UPLOAD_PROVIDER');
