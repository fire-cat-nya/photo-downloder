"use client";

import React, { useState, useEffect } from "react";
import { ImageLink, DownloadRange } from "@/types/image";

interface DownloadControlsProps {
  images: ImageLink[];
}

export default function DownloadControls({ images }: DownloadControlsProps) {
  const [downloadRange, setDownloadRange] = useState<DownloadRange>({
    start: 1,
    end: Math.min(images.length, 20),
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [supportsFSAPI, setSupportsFSAPI] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [diskSpace, setDiskSpace] = useState<{
    available: number;
    total: number;
  } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [lastFolderHandle, setLastFolderHandle] = useState<any>(null);

  useEffect(() => {
    // File System Access APIのサポートを確認
    setSupportsFSAPI("showDirectoryPicker" in window);

    // ディスク容量を取得
    checkDiskSpace();
  }, []);

  const checkDiskSpace = async () => {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota && estimate.usage) {
          const available = estimate.quota - estimate.usage;
          setDiskSpace({
            available: available,
            total: estimate.quota,
          });
          console.log("Disk space:", {
            available: formatBytes(available),
            total: formatBytes(estimate.quota),
          });
        } else {
          console.warn("Disk space estimate not available");
          // フォールバック: 仮の値を設定（実際の制限は無効化）
          setDiskSpace({
            available: 10 * 1024 * 1024 * 1024, // 10GB
            total: 100 * 1024 * 1024 * 1024, // 100GB
          });
        }
      } else {
        console.warn("Storage API not supported");
        // フォールバック: 仮の値を設定（実際の制限は無効化）
        setDiskSpace({
          available: 10 * 1024 * 1024 * 1024, // 10GB
          total: 100 * 1024 * 1024 * 1024, // 100GB
        });
      }
    } catch (error) {
      console.error("ディスク容量の取得に失敗:", error);
      // エラー時も仮の値を設定
      setDiskSpace({
        available: 10 * 1024 * 1024 * 1024, // 10GB
        total: 100 * 1024 * 1024 * 1024, // 100GB
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const checkDiskSpaceBeforeDownload = () => {
    if (diskSpace && diskSpace.available < 1024 * 1024 * 1024) {
      // 1GB
      alert(
        `ディスク容量が不足しています。\n利用可能容量: ${formatBytes(
          diskSpace.available
        )}\n最低必要容量: 1GB`
      );
      return false;
    }
    return true;
  };

  const checkFirstTimeUsage = () => {
    try {
      const hasSeenNotice = localStorage.getItem("downloader-notice-seen");
      return !hasSeenNotice;
    } catch (error) {
      console.warn("localStorage not available:", error);
      return false; // localStorageが使えない場合は表示しない
    }
  };

  const markNoticeAsSeen = () => {
    try {
      localStorage.setItem("downloader-notice-seen", "true");
    } catch (error) {
      console.warn("Could not save notice status:", error);
    }
  };

  const handleDownload = async () => {
    const imagesToDownload = images.slice(
      downloadRange.start - 1,
      downloadRange.end
    );

    if (imagesToDownload.length === 0) {
      alert("ダウンロードする画像がありません。");
      return;
    }

    // ディスク容量チェック
    if (!checkDiskSpaceBeforeDownload()) {
      return;
    }

    // File System Access APIサポートチェック
    if (!supportsFSAPI) {
      alert(
        "このブラウザはフォルダ選択機能をサポートしていません。\n\n対応ブラウザをご使用ください：\n• Google Chrome 86以降\n• Microsoft Edge 86以降\n• その他のChromiumベースブラウザ"
      );
      return;
    }

    // 初回利用時のみ注意事項を表示
    if (checkFirstTimeUsage()) {
      setShowNoticeModal(true);
      return;
    }

    // 確認モーダルを表示
    setShowConfirmModal(true);
  };

  const handleNoticeAccepted = () => {
    setShowNoticeModal(false);
    markNoticeAsSeen();
    // 注意事項承認後、確認モーダルを表示
    setShowConfirmModal(true);
  };

  const handleNoticeRejected = () => {
    setShowNoticeModal(false);
    // 注意事項を承認しない場合は処理を中止
  };

  const handleConfirmDownload = async () => {
    setShowConfirmModal(false);

    const imagesToDownload = images.slice(
      downloadRange.start - 1,
      downloadRange.end
    );

    try {
      let directoryHandle = null;

      // フォルダ選択ダイアログを表示
      try {
        setStatusMessage("保存先フォルダを選択してください...");

        // 前回のフォルダハンドルが利用可能かチェック
        let startOptions: any = {
          mode: "readwrite",
        };

        // 前回選択したフォルダがある場合、それを起点として使用を試みる
        if (lastFolderHandle) {
          try {
            // フォルダハンドルがまだ有効かテスト
            const permission = await lastFolderHandle.queryPermission({
              mode: "readwrite",
            });
            if (permission === "granted" || permission === "prompt") {
              startOptions.startIn = lastFolderHandle;
            }
          } catch (error) {
            console.log("前回のフォルダハンドルは無効です:", error);
            // フォールバック: downloadsフォルダから開始
            startOptions.startIn = "downloads";
          }
        } else {
          startOptions.startIn = "downloads";
        }

        directoryHandle = await (window as any).showDirectoryPicker(
          startOptions
        );

        // 選択されたフォルダハンドルを記憶
        setLastFolderHandle(directoryHandle);

        setStatusMessage(""); // フォルダ選択完了後にステータスクリア
      } catch (error) {
        setStatusMessage(""); // エラー時もステータスクリア

        if ((error as any).name === "AbortError") {
          // ユーザーがキャンセルした場合は完全に終了
          console.log("ユーザーがフォルダ選択をキャンセルしました");
          return;
        } else {
          console.error("フォルダ選択エラー:", error);
          alert("フォルダ選択中にエラーが発生しました。");
          return;
        }
      }

      // ここでやっとダウンロード状態を開始
      setIsDownloading(true);
      setDownloadProgress(0);
      setStatusMessage("ダウンロード準備中...");

      // フォルダに直接保存
      await downloadToFolder(imagesToDownload, directoryHandle);
    } catch (error) {
      console.error("handleDownload error:", error);
      alert("処理中にエラーが発生しました。");
    } finally {
      // 最終的にリセット
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
        setStatusMessage("");
      }, 3000);
    }
  };

  const handleCancelDownload = () => {
    setShowConfirmModal(false);
  };

  const downloadToFolder = async (
    imagesToDownload: ImageLink[],
    directoryHandle: any
  ) => {
    setStatusMessage("フォルダにダウンロード中...");

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < imagesToDownload.length; i++) {
      const image = imagesToDownload[i];

      try {
        // ダウンロード中にディスク容量を再チェック
        await checkDiskSpace();
        if (diskSpace && diskSpace.available < 1024 * 1024 * 1024) {
          alert(
            `ディスク容量が不足したため、ダウンロードを中止します。\n残り容量: ${formatBytes(
              diskSpace.available
            )}`
          );
          break;
        }

        setStatusMessage(
          `フォルダにダウンロード中: ${i + 1}/${
            imagesToDownload.length
          } - ${image.url.split("/").pop()?.substring(0, 30)}...`
        );

        // 画像を取得
        const response = await fetch(image.url, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept:
              "image/webp,image/apng,image/jpeg,image/png,image/svg+xml,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,ja;q=0.8",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          mode: "cors",
          referrerPolicy: "no-referrer",
        });

        if (!response.ok) {
          // レスポンス内容をログに出力（デバッグ用）
          const responseText = await response.text();
          console.error(`HTTP Error for ${image.url}:`, {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get("content-type"),
            responseText: responseText.substring(0, 200), // 最初の200文字のみ
          });
          throw new Error(
            `HTTP ${response.status}: ${
              response.statusText
            } - ${responseText.substring(0, 100)}`
          );
        }

        // Content-Typeをチェック
        const contentType = response.headers.get("content-type") || "";
        if (
          !contentType.startsWith("image/") &&
          !contentType.includes("application/octet-stream")
        ) {
          console.warn(
            `Unexpected content type for ${image.url}: ${contentType}`
          );
          // HTMLページやJSONエラーが返された場合の処理
          const responseText = await response.text();
          console.error("Response content:", responseText.substring(0, 200));
          throw new Error(
            `Expected image but got ${contentType}: ${responseText.substring(
              0,
              100
            )}`
          );
        }

        const blob = await response.blob();

        // ファイル名を生成
        const url = new URL(image.url);
        const pathParts = url.pathname.split("/");
        const originalName =
          pathParts[pathParts.length - 1] || `image_${downloadRange.start + i}`;

        let fileName = originalName;
        if (!fileName.includes(".")) {
          fileName = `${fileName}.${image.type}`;
        }

        // 連番プレフィックスを追加
        const paddedIndex = String(downloadRange.start + i).padStart(3, "0");
        fileName = `${paddedIndex}_${fileName}`;

        // ファイルを選択したフォルダに保存
        const fileHandle = await directoryHandle.getFileHandle(fileName, {
          create: true,
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        successCount++;

        // プログレス更新
        const progress = ((i + 1) / imagesToDownload.length) * 100;
        setDownloadProgress(progress);

        // 短い間隔を空ける
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to download ${image.url}:`, error);
        errorCount++;
      }
    }

    setStatusMessage(
      `ダウンロード完了: 成功 ${successCount}件, 失敗 ${errorCount}件`
    );

    if (successCount > 0) {
      alert(
        `フォルダへのダウンロードが完了しました！\n成功: ${successCount}件\n失敗: ${errorCount}件`
      );
    } else {
      alert("すべてのダウンロードに失敗しました。");
    }
  };

  const handleRangeChange = (field: "start" | "end", value: number) => {
    setDownloadRange((prev) => {
      const newRange = { ...prev, [field]: value };

      if (newRange.start > newRange.end) {
        if (field === "start") {
          newRange.end = newRange.start;
        } else {
          newRange.start = newRange.end;
        }
      }

      return newRange;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        ダウンロード設定
      </h2>

      <div className="space-y-4">
        {/* ディスク容量表示 */}
        {diskSpace && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">ディスク容量:</span>
              <span
                className={`font-bold ${
                  diskSpace.available < 1024 * 1024 * 1024
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                利用可能: {formatBytes(diskSpace.available)}
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  diskSpace.available < 1024 * 1024 * 1024
                    ? "bg-red-500"
                    : "bg-green-500"
                }`}
                style={{
                  width: `${(diskSpace.available / diskSpace.total) * 100}%`,
                }}
              ></div>
            </div>
            {diskSpace.available < 1024 * 1024 * 1024 && (
              <p className="text-red-600 text-xs mt-1">
                ⚠️ 容量不足: 最低1GB必要です
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-800">
            検出された画像数
          </span>
          <span className="text-lg font-bold text-blue-600">
            {images.length} 件
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開始番号
            </label>
            <input
              type="number"
              min="1"
              max={images.length}
              value={downloadRange.start}
              onChange={(e) =>
                handleRangeChange("start", parseInt(e.target.value) || 1)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isDownloading || statusMessage !== ""}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              終了番号
            </label>
            <input
              type="number"
              min="1"
              max={images.length}
              value={downloadRange.end}
              onChange={(e) =>
                handleRangeChange(
                  "end",
                  parseInt(e.target.value) || images.length
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isDownloading || statusMessage !== ""}
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          ダウンロード予定: {downloadRange.end - downloadRange.start + 1} 件
        </div>

        {/* ステータスメッセージ */}
        {statusMessage && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">{statusMessage}</p>
          </div>
        )}

        {/* プログレスバー */}
        {isDownloading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>進行状況</span>
              <span>{Math.round(downloadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* ダウンロードボタン */}
        <div className="space-y-2">
          <button
            onClick={handleDownload}
            disabled={
              isDownloading ||
              images.length === 0 ||
              (diskSpace !== null && diskSpace.available < 1024 * 1024 * 1024)
            }
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
          >
            {statusMessage === "保存先フォルダを選択してください..." ? (
              "📁 フォルダ選択中..."
            ) : isDownloading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ダウンロード中...
              </div>
            ) : (
              `📁 フォルダを選んで一括ダウンロード`
            )}
          </button>
        </div>

        {/* 使用方法の説明 */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-semibold mb-2">💡 使用方法:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>上記で範囲を指定（No.□□～No.□□）</li>
            <li>「フォルダを選んで一括ダウンロード」をクリック</li>
            <li>保存先フォルダを選択</li>
            <li>指定範囲の画像が選択したフォルダに一括保存されます</li>
            <li>ファイル名は連番付きで整理されます（例: 001_image.jpg）</li>
          </ol>
        </div>

        {/* 対応ブラウザの説明 */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="font-semibold mb-2 text-blue-800">🌐 対応ブラウザ:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-blue-700">
            <li>Google Chrome 86以降</li>
            <li>Microsoft Edge 86以降</li>
            <li>その他のChromiumベースブラウザ</li>
          </ul>
          <p className="mt-2 text-blue-600 text-xs">
            ※ 対応ブラウザ以外では、フォルダ選択機能が利用できません
          </p>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>⚠️ 注意事項:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              ドライブの空き容量が1GB未満の場合、ダウンロードは実行されません
            </li>
            <li>
              ダウンロード中に空き容量が1GB未満になった場合、自動的に中止されます
            </li>
            <li>
              大量の画像をダウンロードする場合は時間がかかる場合があります
            </li>
          </ul>
        </div>
      </div>

      {/* 注意事項モーダル（初回のみ） */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center">
                <span className="text-2xl mr-2">📌</span>
                使用上の注意事項
              </h3>

              <div className="space-y-4 text-sm">
                <p className="text-gray-800 font-medium">
                  このツールは{" "}
                  <strong className="text-red-600">
                    強力なダウンロード機能
                  </strong>{" "}
                  を備えているため、
                  <strong className="text-red-600">
                    使用に際しては以下の事項を必ず遵守してください。
                  </strong>
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-bold text-green-800 mb-2 flex items-center">
                    <span className="mr-2">✅</span>許可される利用例
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-green-700 ml-4">
                    <li>
                      クライアントから発注を受けた WEB
                      サイトのデザイン案（ワイヤーフレーム／カンプ／プロトタイプ）制作時に、
                      <strong>一時的な仮素材</strong>として画像を収集する。
                    </li>
                    <li>
                      クライアントが後日正式な画像素材を用意するまでの、
                      <strong>緊急的な代替素材の確保</strong>。
                    </li>
                    <li>
                      フリー素材サイト（利用規約に反しない範囲）やパブリックドメインの画像のダウンロード。
                    </li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-bold text-red-800 mb-2 flex items-center">
                    <span className="mr-2">❌</span>禁止事項
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-red-700 ml-4">
                    <li>
                      ダウンロードした画像を{" "}
                      <strong>
                        本番公開用の WEB サイト、商用印刷物、配布物、SNS
                        投稿等に無断で使用すること
                      </strong>
                      。
                    </li>
                    <li>
                      アイドル写真、映画・アニメの画像、商用製品写真、著作権・肖像権のある画像などを{" "}
                      <strong>
                        私的なコレクション目的や不正利用目的でダウンロードすること
                      </strong>
                      。
                    </li>
                    <li>
                      他者の権利を侵害する形でダウンロードした画像を利用、再配布すること。
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
                    <span className="mr-2">⚠️</span>免責事項
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 ml-4">
                    <li>
                      本ツールはあくまでツールとして提供されているものであり、
                      <strong>
                        ダウンロード対象サイトの利用規約や法律に違反しないことはユーザー自身の責任
                      </strong>
                      で確認・遵守してください。
                    </li>
                    <li>
                      本ツールの利用によって生じたいかなるトラブル・損害についても、開発者は一切責任を負いません。
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleNoticeRejected}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  同意しない（キャンセル）
                </button>
                <button
                  onClick={handleNoticeAccepted}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  上記に同意してダウンロードに進む
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 確認モーダル */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ダウンロード開始確認
              </h3>

              <div className="space-y-3 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>対象画像数:</strong>{" "}
                    {downloadRange.end - downloadRange.start + 1}件
                  </p>
                  <p className="text-blue-800 text-sm">
                    <strong>範囲:</strong> No.{downloadRange.start} ～ No.
                    {downloadRange.end}
                  </p>
                </div>

                <p className="text-gray-700 text-sm">
                  次の画面で保存先フォルダを選択します。
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDownload}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmDownload}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  ダウンロード開始
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
