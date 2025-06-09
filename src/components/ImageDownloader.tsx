"use client";

import React, { useState } from "react";
import UrlInput from "./UrlInput";
import ImagePreview from "./ImagePreview";
import DownloadControls from "./DownloadControls";
import { ImageLink } from "@/types/image";

export default function ImageDownloader() {
  const [imageLinks, setImageLinks] = useState<ImageLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/extract-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "画像の抽出に失敗しました");
      }

      if (data.images && Array.isArray(data.images)) {
        setImageLinks(data.images);
      } else {
        throw new Error("無効なレスポンス形式です");
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <p className="text-gray-600 text-center">
          WebページのURLを入力して、画像を一括でダウンロードできます
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <p className="text-blue-600 text-sm">処理中...</p>
              </div>
            </div>
          )}

          {imageLinks.length > 0 && !isLoading && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">
                {imageLinks.length}個の画像を検出しました
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {imageLinks.length > 0 && (
            <>
              <ImagePreview images={imageLinks} />
              <div className="mt-6">
                <DownloadControls images={imageLinks} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
