export interface ImageLink {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  size?: number;
  type: "jpg" | "png" | "gif" | "webp" | "svg" | "other";
}

export interface DownloadRange {
  start: number;
  end: number;
}

export interface DownloadProgress {
  current: number;
  total: number;
  isDownloading: boolean;
}
