import axios from "axios";
import dotenv from "dotenv";
// import { APIGatewayProxyEvent } from "aws-lambda";

dotenv.config();
const BASE_URL = "https://qiita.com/api/v2";
const QIITA_ACCESS_TOKEN = process.env.QIITA_ACCESS_TOKEN;


/**
 * 記事URLからいいね数とストック数を取得する
 * @param articleURL - 取得したい記事のURL
 * @returns - いいね数とストック数
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
    console.log(`記事: ${articleURL}, いいね数: ${likesCount}, ストック数: ${stocksCount}`);

    return { likesCount, stocksCount };
  } catch (error: unknown) {
    console.error("記事情報の取得に失敗しました:", (error as any).message);
    throw new Error("記事情報の取得に失敗しました");
  }
}

/**
 * URLから記事IDをパース
 */
function getArticleIdFromUrl(url: string): string {
  const urlArray = url.split("/");
  return urlArray[urlArray.length - 1];
}

/**
 * 記事の内容を取得する。
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
 * 記事のタイトルを取得する。
 * @param articleURL - 取得したい記事のURL
 */
async function getArticleTitle(articleURL: string): Promise<string> {
  const articleId = getArticleIdFromUrl(articleURL);
  try {
    const response = await axios.get(`${BASE_URL}/items/${articleId}`, {
      headers: {
        Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
      },
    });

    return response.data.title;
  } catch (error: unknown) {
    console.error("記事タイトルの取得に失敗しました:", (error as any).message);
    throw new Error("記事タイトルの取得に失敗しました");
  }
}

/**
 * 記事内容からadvent-calendarのURLを除いたQiitaのURLを抽出する
 * @param content - 記事内容
 * @returns - 抽出したQiitaのURLの配列
 */
function extractQiitaUrls(content: string): string[] {
  const urlRegex = /https:\/\/qiita\.com\/[^\s]+/g;
  const urls = content.match(urlRegex) || [];
  return urls.filter(url => !url.includes("advent-calendar"));
}

/**
 * 記事をのいいね数とストック数の値を更新する。
 * @param articleURL - 更新したい記事のURL
 * @param updatedContent - 更新後の内容
 */
async function updateArticle(articleURL: string, updatedContent: string): Promise<void> {
  const articleId = getArticleIdFromUrl(articleURL);
  console.log("更新後の内容:", updatedContent);
  try {
    // NOTE: 記事のタイトルがないと更新に失敗するため，タイトルを取得
    const articleTitle = await getArticleTitle(articleURL);

    await axios.patch(`${BASE_URL}/items/${articleId}`, {
      title: articleTitle,
      body: updatedContent,
    }, {
      headers: {
        Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
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
// NOTE: 特にイベント情報は使っていないのでany型に戻した
export const run = async (event: any) => {
  console.log("Lambda function executed", event);
  const updateURL = "https://qiita.com/sigma_devsecops/items/59af6d7f45397217ddd2"; // FIXME: 任意の記事URLに変更
  try {
    // 記事の内容を取得し，QiitaのURLを抽出
    let content = await getArticleContent(updateURL);
    const qiitaUrls = extractQiitaUrls(content);

    // 各QiitaのURLに対していいね数とストック数を取得し，記事内容を更新
    for (const url of qiitaUrls) {
      const { likesCount, stocksCount } = await getArticleInfo(url);
      const likeStockInfo = `いいね数: ${likesCount},ストック数: ${stocksCount}\n`;

      if (content.includes(url)) {
        const regex = new RegExp(`(${url}\\s*\\n)(いいね数: \\d+,ストック数: \\d+\\n)?`);
        content = content.replace(regex, `$1${likeStockInfo}`);
      }
    }

    await updateArticle(updateURL, content);

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

// ローカルから実行するための設定
if (require.main === module) {
  (async () => {
    const result = await run({});
    console.log("Lambda Execution Result:", result);
  })();
}

