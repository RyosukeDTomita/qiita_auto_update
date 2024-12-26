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
async function getArticleInfo(articleURL: string): Promise<void> {
  const articleId =  getArticleIdFromUrl(articleURL);
  try {
    const response = await axios.get(`${BASE_URL}/items/${articleId}`, {
      headers: {
        Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
      },
    });

    const data = response.data;
    const likesCount = data.likes_count; // いいね数
    const stocksCount = data.stocks_count; // ストック数
    const articleUrl = data.url; // 記事のURL

    console.log(`記事タイトル: ${data.title}`);
    console.log(`記事URL: ${articleUrl}`);
    console.log(`いいね数: ${likesCount}`);
    console.log(`ストック数: ${stocksCount}`);
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
 * AWS Lambdaのエントリーポイント
 * @param event - AWS Lambdaのイベント
 * @returns - Lambdaのレスポンス
 */
export const run = async (event: APIGatewayProxyEvent) => {
  console.log("Lambda function executed", event);
  const articleUris = [
    "https://qiita.com/sigma_devsecops/items/af7ea7f1b29a3d23117b",
    "https://qiita.com/sigma_devsecops/items/94b94e3e994d60ec4c1d",
  ];
  try {
    for (const url of articleUris) {
      await getArticleInfo(url);
    }
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
    // Qiitaに結果を出力
    // const outID = "c31cbc788579348d0ac1";
export { getArticleInfo };
