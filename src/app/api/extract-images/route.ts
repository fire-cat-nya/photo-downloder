import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URLが必要です" }, { status: 400 });
    }

    // URLの妥当性チェック
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json({ error: "無効なURLです" }, { status: 400 });
    }

    // Webページを取得
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const images: any[] = [];

    // img要素から画像URLを抽出
    $("img").each((_, element) => {
      const src = $(element).attr("src");
      const alt = $(element).attr("alt") || "";

      if (src) {
        let imageUrl = src;

        // 相対URLを絶対URLに変換
        if (src.startsWith("//")) {
          imageUrl = `https:${src}`;
        } else if (src.startsWith("/")) {
          const baseUrl = new URL(url);
          imageUrl = `${baseUrl.protocol}//${baseUrl.host}${src}`;
        } else if (!src.startsWith("http")) {
          const baseUrl = new URL(url);
          imageUrl = new URL(src, baseUrl.href).href;
        }

        // 画像タイプを判定
        const getImageType = (url: string) => {
          const extension = url.split(".").pop()?.toLowerCase().split("?")[0];
          switch (extension) {
            case "jpg":
            case "jpeg":
              return "jpg";
            case "png":
              return "png";
            case "gif":
              return "gif";
            case "webp":
              return "webp";
            case "svg":
              return "svg";
            default:
              return "other";
          }
        };

        images.push({
          url: imageUrl,
          alt,
          type: getImageType(imageUrl),
        });
      }
    });

    // aタグのhref属性から画像リンクを抽出
    $("a").each((_, element) => {
      const href = $(element).attr("href");

      if (href) {
        let linkUrl = href;

        // 相対URLを絶対URLに変換
        if (href.startsWith("//")) {
          linkUrl = `https:${href}`;
        } else if (href.startsWith("/")) {
          const baseUrl = new URL(url);
          linkUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`;
        } else if (!href.startsWith("http")) {
          const baseUrl = new URL(url);
          linkUrl = new URL(href, baseUrl.href).href;
        }

        // 画像ファイルかどうかをチェック
        const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
        const extension = linkUrl.split(".").pop()?.toLowerCase().split("?")[0];

        if (extension && imageExtensions.includes(extension)) {
          const getFileType = (url: string) => {
            const ext = url.split(".").pop()?.toLowerCase().split("?")[0];
            switch (ext) {
              case "jpg":
              case "jpeg":
                return "jpg";
              case "png":
                return "png";
              case "gif":
                return "gif";
              case "webp":
                return "webp";
              case "svg":
                return "svg";
              default:
                return "other";
            }
          };

          images.push({
            url: linkUrl,
            alt: $(element).text().trim() || "",
            type: getFileType(linkUrl),
          });
        }
      }
    });

    // 重複を除去
    const uniqueImages = images.filter(
      (image, index, self) =>
        index === self.findIndex((t) => t.url === image.url)
    );

    return NextResponse.json({
      images: uniqueImages,
      total: uniqueImages.length,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
