import { FileImage, FileText, FileSpreadsheet, FileArchive, File as FileIcon, LucideIcon } from "lucide-react";

export function getFileKindIcon(mimeType: string): LucideIcon {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return FileArchive;
  return FileIcon;
}