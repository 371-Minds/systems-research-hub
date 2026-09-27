export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  owners?: Array<{ displayName: string; emailAddress?: string }>;
  sourceAccountLabel?: string;
  sourceAccountEmail?: string;
}

export interface DriveSearchOptions {
  folderId?: string;
  query?: string;
  mimeTypeFilter?: "all" | "documents" | "spreadsheets" | "presentations" | "pdfs" | "code";
  pageSize?: number;
}

const MIME_MAPPING: Record<string, string> = {
  documents: "mimeType = 'application/vnd.google-apps.document' or mimeType contains 'text/'",
  spreadsheets: "mimeType = 'application/vnd.google-apps.spreadsheet'",
  presentations: "mimeType = 'application/vnd.google-apps.presentation'",
  pdfs: "mimeType = 'application/pdf'",
  code: "mimeType contains 'json' or mimeType contains 'javascript' or mimeType contains 'markdown' or name contains '.ts' or name contains '.rs' or name contains '.zig' or name contains '.go' or name contains '.odin' or name contains '.py'",
};

export async function listDriveFiles(
  accessToken: string,
  options: DriveSearchOptions = {},
  accountMeta?: { email?: string; label?: string }
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const clauses: string[] = ["trashed = false"];

  if (options.folderId) {
    clauses.push(`'${options.folderId}' in parents`);
  }

  if (options.query && options.query.trim()) {
    const sanitized = options.query.replace(/['\\]/g, "\\$&");
    clauses.push(`(name contains '${sanitized}' or fullText contains '${sanitized}')`);
  }

  if (options.mimeTypeFilter && options.mimeTypeFilter !== "all" && MIME_MAPPING[options.mimeTypeFilter]) {
    clauses.push(`(${MIME_MAPPING[options.mimeTypeFilter]})`);
  }

  const q = encodeURIComponent(clauses.join(" and "));
  const fields = encodeURIComponent("files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink, thumbnailLink, owners(displayName, emailAddress)), nextPageToken");
  const pageSize = options.pageSize || 30;

  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=${pageSize}&orderBy=folder,modifiedTime desc`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const files: DriveFile[] = (data.files || []).map((f: any) => ({
    ...f,
    sourceAccountLabel: accountMeta?.label,
    sourceAccountEmail: accountMeta?.email,
  }));

  return {
    files,
    nextPageToken: data.nextPageToken,
  };
}

export async function fetchFileContentPreview(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<string> {
  // If Google Doc, export as plain text
  if (mimeType === "application/vnd.google-apps.document") {
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    const res = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Could not export Google Doc text.");
    return await res.text();
  }

  // If plain text / markdown / code / json
  if (
    mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("javascript") ||
    mimeType.includes("markdown")
  ) {
    const fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Could not read text media.");
    return await res.text();
  }

  return "Preview not directly displayable for binary/structured file format. You can open it in Google Drive.";
}
