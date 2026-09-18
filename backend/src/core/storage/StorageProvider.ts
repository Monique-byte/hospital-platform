export interface SaveFileInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface SavedFile {
  storagePath: string;
  sizeBytes: number;
}

/**
 * Abstracao de armazenamento de arquivos. A implementacao atual e
 * local (LocalStorageProvider), mas a arquitetura permite trocar para
 * MinIO, S3 ou outro provedor cloud no futuro sem alterar
 * repository/service/controller do modulo Documentos - eles dependem
 * apenas desta interface.
 */
export interface StorageProvider {
  save(input: SaveFileInput): Promise<SavedFile>;
  getReadStream(storagePath: string): NodeJS.ReadableStream;
  delete(storagePath: string): Promise<void>;
}