import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { StorageProvider, SaveFileInput, SavedFile } from "./StorageProvider";

const STORAGE_ROOT = path.resolve(process.cwd(), "storage", "publication-images");

/**
 * Instancia SEPARADA de StorageProvider para imagens de destaque de
 * Publicacoes - pasta propria ("storage/publication-images"), distinta
 * de "storage/documents" (usada pelo modulo Documentos). Imagens de
 * Publicacao sao conteudo PUBLICO (servido sem autenticacao), diferente
 * de Documentos (sempre autenticado) - por isso precisam de rota de
 * serving propria, nunca compartilhar a mesma pasta/rota de Documentos.
 */
export class PublicationImageStorageProvider implements StorageProvider {
  constructor() {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }

  async save({ buffer, fileName }: SaveFileInput): Promise<SavedFile> {
    const storedName = `${randomUUID()}-${fileName}`;
    await fs.promises.writeFile(path.join(STORAGE_ROOT, storedName), buffer);
    return { storagePath: storedName, sizeBytes: buffer.length };
  }

  getReadStream(storagePath: string): NodeJS.ReadableStream {
    return fs.createReadStream(path.join(STORAGE_ROOT, storagePath));
  }

  async delete(storagePath: string): Promise<void> {
    await fs.promises.unlink(path.join(STORAGE_ROOT, storagePath)).catch(() => undefined);
  }
}

export const publicationImageStorageProvider = new PublicationImageStorageProvider();
export const PUBLICATION_IMAGES_STORAGE_ROOT = STORAGE_ROOT;