import { useEffect, useState } from "react";
import { DocumentsService } from "@/services/documents.service";

/**
 * Busca (via Axios autenticado, nunca via <img src> direto) o Blob de
 * uma versao cujo mimeType comeca com "image/" e expoe uma object URL
 * para preview. Revoga a URL ao trocar de versao/desmontar, evitando
 * vazamento de memoria.
 */
export function useDocumentPreviewUrl(documentId?: string, versionId?: string, mimeType?: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId || !versionId || !mimeType?.startsWith("image/")) {
      setUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;

    DocumentsService.download(documentId, versionId).then(({ blob }) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, versionId, mimeType]);

  return url;
}