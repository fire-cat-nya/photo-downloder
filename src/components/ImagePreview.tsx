"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ImageLink } from "@/types/image";

interface ImagePreviewProps {
  images: ImageLink[];
}

interface ImageState {
  [key: string]: {
    useProxy: boolean;
    isError: boolean;
  };
}

export default function ImagePreview({ images }: ImagePreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [imageStates, setImageStates] = useState<ImageState>({});

  const imagesPerPage = 20;
  const totalPages = Math.ceil(images.length / imagesPerPage);

  const startIndex = currentPage * imagesPerPage;
  const endIndex = Math.min(startIndex + imagesPerPage, images.length);
  const displayImages = images.slice(startIndex, endIndex);

  // キーボードイベントハンドラ
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          setCurrentPage((prev) => Math.max(0, prev - 1));
          break;
        case "ArrowRight":
        case "PageDown":
          event.preventDefault();
          setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
          break;
        case "Home":
          event.preventDefault();
          setCurrentPage(0);
          break;
        case "End":
          event.preventDefault();
          setCurrentPage(totalPages - 1);
          break;
      }
    },
    [totalPages]
  );

  // キーボードイベントリスナーの追加/削除
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case "jpg":
      case "jpeg":
        return "🖼️";
      case "png":
        return "🖼️";
      case "gif":
        return "🎞️";
      case "svg":
        return "🎨";
      case "webp":
        return "🌈";
      default:
        return "📄";
    }
  };

  const handleImageError = (imageUrl: string, index: number) => {
    const globalIndex = startIndex + index;
    const key = `${globalIndex}-${imageUrl}`;
    const currentState = imageStates[key] || {
      useProxy: false,
      isError: false,
    };

    if (!currentState.useProxy) {
      // まずAPIプロキシ経由で試す
      setImageStates((prev) => ({
        ...prev,
        [key]: { useProxy: true, isError: false },
      }));
    } else {
      // APIプロキシでも失敗した場合はエラー表示
      setImageStates((prev) => ({
        ...prev,
        [key]: { useProxy: true, isError: true },
      }));
    }
  };

  const getImageSrc = (imageUrl: string, index: number) => {
    const globalIndex = startIndex + index;
    const key = `${globalIndex}-${imageUrl}`;
    const state = imageStates[key];

    if (state?.useProxy) {
      return `/api/download-image?url=${encodeURIComponent(imageUrl)}`;
    }
    return imageUrl;
  };

  const renderImageItem = (
    image: ImageLink,
    index: number,
    actualIndex: number
  ) => {
    const globalIndex = startIndex + actualIndex;
    const key = `${globalIndex}-${image.url}`;
    const state = imageStates[key];

    return (
      <div
        key={globalIndex}
        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
      >
        <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded z-10">
          {globalIndex + 1}
        </div>
        <div className="absolute top-1 right-1 text-lg z-10">
          {getImageTypeIcon(image.type)}
        </div>

        {/* プロキシ使用中の表示 */}
        {state?.useProxy && !state?.isError && (
          <div className="absolute top-1 left-8 bg-blue-500 bg-opacity-75 text-white text-xs px-1 rounded z-10">
            プロキシ
          </div>
        )}

        {image.type !== "other" && !state?.isError ? (
          <Image
            src={getImageSrc(image.url, actualIndex)}
            alt={image.alt || `Image ${globalIndex + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => handleImageError(image.url, actualIndex)}
            unoptimized={state?.useProxy || image.type === "svg"} // プロキシ経由またはSVGの場合は最適化無効
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              {state?.isError ? (
                <>
                  <div className="text-2xl mb-1">❌</div>
                  <div className="text-xs">読み込み失敗</div>
                  <div className="text-xs mt-1 px-1 bg-red-100 rounded">
                    {image.type}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl mb-1">📄</div>
                  <div className="text-xs">ファイル</div>
                  <div className="text-xs mt-1 px-1 bg-gray-200 rounded">
                    {image.type}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 画像情報のツールチップ */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 opacity-0 hover:opacity-100 transition-opacity">
          <div className="truncate" title={image.url}>
            {image.url.split("/").pop()?.split("?")[0] || "Unknown"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">画像プレビュー</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {startIndex + 1}-{endIndex} / {images.length} 件表示
          </span>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded"></div>
              <span>プロキシ経由</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded"></div>
              <span>読み込み失敗</span>
            </div>
          </div>
        </div>
      </div>

      {/* ページネーション情報とキーボードヒント */}
      {totalPages > 1 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-800">
                ページ {currentPage + 1} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
                >
                  ← 前
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                  }
                  disabled={currentPage === totalPages - 1}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
                >
                  次 →
                </button>
              </div>
            </div>
            <div className="text-xs text-blue-700">
              キーボード: ←→/PageUp/PageDown で切り替え、Home/End で最初/最後
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* 右列: 前半10個 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            No.{startIndex + 1}-{Math.min(startIndex + 10, endIndex)}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {displayImages
              .slice(0, 10)
              .map((image, index) => renderImageItem(image, index, index))}
          </div>
        </div>

        {/* 左列: 後半10個 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            No.{Math.min(startIndex + 11, endIndex)}-{endIndex}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {displayImages
              .slice(10, 20)
              .map((image, index) => renderImageItem(image, index, index + 10))}
          </div>
        </div>
      </div>

      {/* 画像読み込み状況の統計 */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-medium">直接読み込み</div>
              <div className="text-lg font-bold text-blue-600">
                {
                  Object.values(imageStates).filter(
                    (state) => !state.useProxy && !state.isError
                  ).length
                }
              </div>
            </div>
            <div>
              <div className="font-medium">プロキシ経由</div>
              <div className="text-lg font-bold text-orange-600">
                {
                  Object.values(imageStates).filter(
                    (state) => state.useProxy && !state.isError
                  ).length
                }
              </div>
            </div>
            <div>
              <div className="font-medium">読み込み失敗</div>
              <div className="text-lg font-bold text-red-600">
                {
                  Object.values(imageStates).filter((state) => state.isError)
                    .length
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ページ移動のショートカット表示（複数ページある場合のみ） */}
      {totalPages > 1 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-600 text-center">
            ページ移動: <kbd className="px-1 bg-gray-300 rounded">←</kbd>{" "}
            <kbd className="px-1 bg-gray-300 rounded">→</kbd>
            <kbd className="px-1 bg-gray-300 rounded">PageUp</kbd>{" "}
            <kbd className="px-1 bg-gray-300 rounded">PageDown</kbd>
            <kbd className="px-1 bg-gray-300 rounded">Home</kbd>{" "}
            <kbd className="px-1 bg-gray-300 rounded">End</kbd>
          </div>
        </div>
      )}
    </div>
  );
}
