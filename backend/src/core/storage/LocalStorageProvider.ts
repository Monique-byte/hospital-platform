import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { StorageProvider, SaveFileInput, SavedFile } from "./StorageProvider";

const STORAGE_ROOT = path.resolve(process.cwd(), "storage", "documents");

/**
 * Implementacao local de StorageProvider - grava arquivos em disco sob
 * backend/storage/documents/<uuid>-<nome-original>. Usada enquanto nao
 * ha um NAS/MinIO/S3 configurado. Trocar para outro provedor no futuro
 * significa apenas criar outra classe que implemente StorageProvider e
 * trocar a instancia usada no repository - nenhuma outra camada muda.
 */
export class LocalStorageProvider implements StorageProvider {
  constructor() {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }

  async save({ buffer, fileName }: SaveFileInput): Promise<SavedFile> {
    const storedName = `${randomUUID()}-${fileName}`;
    const fullPath = path.join(STORAGE_ROOT, storedName);
    await fs.promises.writeFile(fullPath, buffer);
    return { storagePath: storedName, sizeBytes: buffer.length };
  }

  getReadStream(storagePath: string): NodeJS.ReadableStream {
    const fullPath = path.join(STORAGE_ROOT, storagePath);
    return fs.createReadStream(fullPath);
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(STORAGE_ROOT, storagePath);
    await fs.promises.unlink(fullPath).catch(() => undefined);
  }
}

export const storageProvider = new LocalStorageProvider();