"use client";

import React, { useState } from "react";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      const cleanedUrl = cleanUrl(url.trim());
      onSubmit(cleanedUrl);
    }
  };

  const cleanUrl = (inputUrl: string): string => {
    // view-source: プロトコルを除去
    if (inputUrl.startsWith("view-source:")) {
      return inputUrl.replace("view-source:", "");
    }
    return inputUrl;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);

    // view-source: プロトコルの警告
    if (inputUrl.startsWith("view-source:")) {
      setWarning("view-source: プロトコルは自動的に除去されます");
    } else {
      setWarning(null);
    }
  };

  // フォーカス時に全テキストを選択
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const isValidUrl = (string: string) => {
    try {
      const cleanedString = cleanUrl(string);
      const parsedUrl = new URL(cleanedString);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  const getDisplayUrl = () => {
    return cleanUrl(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">URL入力</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            WebページのURL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={handleUrlChange}
            onFocus={handleFocus}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            disabled={isLoading}
            required
          />

          {warning && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <div className="flex items-start">
                <svg
                  className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-yellow-800">{warning}</p>
                  <p className="text-yellow-700 mt-1">
                    実際のURL:{" "}
                    <code className="bg-yellow-100 px-1 rounded text-xs">
                      {getDisplayUrl()}
                    </code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {url && !isValidUrl(url) && !warning && (
            <p className="mt-1 text-sm text-red-600">
              有効なHTTP/HTTPSのURLを入力してください
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim() || !isValidUrl(url)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              画像を検索中...
            </div>
          ) : (
            "画像を検索"
          )}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600">
        <p className="mb-2">対応形式:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>JPG, PNG, GIF, WebP画像</li>
          <li>SVG画像</li>
          <li>その他のファイル形式</li>
        </ul>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800 text-xs font-medium mb-1">💡 ヒント:</p>
          <ul className="text-blue-700 text-xs space-y-1">
            <li>• ブラウザのアドレスバーからURLをコピー＆ペーストできます</li>
            <li>• view-source: で始まるURLは自動的に修正されます</li>
            <li>• HTTP/HTTPSのURLのみサポートしています</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
