import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "画像URLが必要です" }, { status: 400 });
    }

    // URLの妥当性チェック
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: "無効なURLです" }, { status: 400 });
    }

    // 画像を取得
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 30000,
    });

    // Content-Typeを取得
    const contentType =
      response.headers["content-type"] || "application/octet-stream";

    // レスポンスを返す
    return new NextResponse(response.data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "attachment",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error downloading image:", error);
    return NextResponse.json(
      { error: "画像のダウンロード中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
