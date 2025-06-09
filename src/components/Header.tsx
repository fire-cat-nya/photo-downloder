"use client";

import React, { useState } from "react";

export default function Header() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const handleDisclaimerClick = () => {
    setShowDisclaimer(true);
  };

  const handleCloseDisclaimer = () => {
    setShowDisclaimer(false);
  };

  return (
    <>
      <header className="flex justify-between items-center p-4 h-16 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">
          画像一括ダウンローダー
        </h1>

        <button
          onClick={handleDisclaimerClick}
          className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors border border-blue-300"
        >
          📋 免責・注意事項
        </button>
      </header>

      {/* 免責事項モーダル */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                免責・注意事項
              </h2>
              <button
                onClick={handleCloseDisclaimer}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-semibold">
                  ※ **利用開始前に注意事項を必ずご確認ください。**
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  📌 使用上の注意事項
                </h3>
                <p className="text-gray-700">
                  このツールは **強力なダウンロード機能**
                  を備えているため、**使用に際しては以下の事項を必ず遵守してください。**
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-semibold text-green-700 flex items-center">
                  ✅ 許可される利用例
                </h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>
                    クライアントから発注を受けた WEB
                    サイトのデザイン案（ワイヤーフレーム／カンプ／プロトタイプ）制作時に、**一時的な仮素材**として画像を収集する。
                  </li>
                  <li>
                    クライアントが後日正式な画像素材を用意するまでの、**緊急的な代替素材の確保**。
                  </li>
                  <li>
                    フリー素材サイト（利用規約に反しない範囲）やパブリックドメインの画像のダウンロード。
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-semibold text-red-700 flex items-center">
                  ❌ 禁止事項
                </h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>
                    ダウンロードした画像を **本番公開用の WEB
                    サイト、商用印刷物、配布物、SNS
                    投稿等に無断で使用すること**。
                  </li>
                  <li>
                    アイドル写真、映画・アニメの画像、商用製品写真、著作権・肖像権のある画像などを
                    **私的なコレクション目的や不正利用目的でダウンロードすること**。
                  </li>
                  <li>
                    他者の権利を侵害する形でダウンロードした画像を利用、再配布すること。
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800 flex items-center">
                  ⚠️ 免責事項
                </h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>
                    本ツールはあくまでツールとして提供されているものであり、**ダウンロード対象サイトの利用規約や法律に違反しないことはユーザー自身の責任**で確認・遵守してください。
                  </li>
                  <li>
                    本ツールの利用によって生じたいかなるトラブル・損害についても、開発者は一切責任を負いません。
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h4 className="text-md font-semibold text-gray-800 flex items-center">
                  📄 LICENSE
                </h4>
                <p className="text-gray-700">
                  This project is licensed under the MIT License.
                </p>
                <p className="text-gray-700">
                  See the [LICENSE](./LICENSE) file for details.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800">
                  重要な補足事項
                </h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>
                    本リポジトリのソースコードは MIT
                    ライセンスにより自由に利用・改変・配布可能です。
                  </li>
                  <li>
                    ただし、**本ツールを利用して取得したコンテンツ（画像など）の利用については、各
                    WEB サイトの著作権・利用規約・法令を必ず遵守してください。**
                  </li>
                  <li>
                    取得したコンテンツの利用により発生した問題に関して、本リポジトリの作者は一切の責任を負いません。**利用は自己責任で行ってください。**
                  </li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-4 border-t">
              <button
                onClick={handleCloseDisclaimer}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                理解しました・閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
