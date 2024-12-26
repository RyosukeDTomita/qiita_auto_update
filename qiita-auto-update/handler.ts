import axios from "axios";
import dotenv from "dotenv";
import { APIGatewayProxyEvent } from "aws-lambda";

dotenv.config();
const BASE_URL = "https://qiita.com/api/v2";
const QIITA_ACCESS_TOKEN = process.env.QIITA_ACCESS_TOKEN;

/**
 * 記事情報を取得する
 * @param articleURL - 取得したい記事のURL
 */
async function getArticleInfo(articleURL: string): Promise<{ likesCount: number, stocksCount: number }> {
  const articleId = getArticleIdFromUrl(articleURL);
  try {
    const response = await axios.get(`${BASE_URL}/items/${articleId}`, {
      headers: {
        Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
      },
    });

    const data = response.data;
    const likesCount = data.likes_count; // いいね数
    const stocksCount = data.stocks_count; // ストック数

    return { likesCount, stocksCount };
  } catch (error: unknown) {
    console.error("記事情報の取得に失敗しました:", (error as any).message);
    throw new Error("記事情報の取得に失敗しました");
  }
}

/**
 * URLから記事IDを取得する
 */
function getArticleIdFromUrl(url: string): string {
  const urlArray = url.split("/");
  return urlArray[urlArray.length - 1];
}

/**
 * 記事の内容を取得する
 * @param articleURL - 取得したい記事のURL
 */
async function getArticleContent(articleURL: string): Promise<string> {
  const articleId = getArticleIdFromUrl(articleURL);
  try {
    const response = await axios.get(`${BASE_URL}/items/${articleId}`, {
      headers: {
        Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
      },
    });

    return response.data.body;
  } catch (error: unknown) {
    console.error("記事内容の取得に失敗しました:", (error as any).message);
    throw new Error("記事内容の取得に失敗しました");
  }
}

/**
 * 記事内容からQiitaのURLを抽出する
 * @param content - 記事内容
 */
function extractQiitaUrls(content: string): string[] {
  const urlRegex = /https:\/\/qiita\.com\/[^\s]+/g;
  const urls = content.match(urlRegex) || [];
  return urls.filter(url => !url.includes("advent-calendar"));
}

/**
 * 記事を更新する
 * @param articleURL - 更新したい記事のURL
 * @param updatedContent - 更新後の内容
 */
async function updateArticle(articleURL: string, updatedContent: string): Promise<void> {
  const articleId = getArticleIdFromUrl(articleURL);
  try {
    await axios.patch(`${BASE_URL}/items/${articleId}`, {
      body: updatedContent,
    }, {
      headers: {
        Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
      },
    });
  } catch (error: unknown) {
    console.error("記事の更新に失敗しました:", (error as any).message);
    throw new Error("記事の更新に失敗しました");
  }
}

/**
 * AWS Lambdaのエントリーポイント
 * @param event - AWS Lambdaのイベント
 * @returns - Lambdaのレスポンス
 */
export const run = async (event: APIGatewayProxyEvent) => {
  console.log("Lambda function executed", event);
  const articleURL = "https://qiita.com/sigma_devsecops/items/af7ea7f1b29a3d23117b";
  try {
    const content = await getArticleContent(articleURL);
    const qiitaUrls = extractQiitaUrls(content);

    for (const url of qiitaUrls) {
      const { likesCount, stocksCount } = await getArticleInfo(url);
      const likeStockInfo = `\n\nいいね数: ${likesCount}\nストック数: ${stocksCount}\n`;

      if (content.includes(url)) {
        const regex = new RegExp(`(${url}\\s*\\n)(いいね数: \\d+\\nストック数: \\d+\\n)?`);
        content = content.replace(regex, `$1${likeStockInfo}`);
      } else {
        content += `\n${url}${likeStockInfo}`;
      }
    }

    await updateArticle(articleURL, content);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Success" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: (error as any).message }),
    };
  }
};
