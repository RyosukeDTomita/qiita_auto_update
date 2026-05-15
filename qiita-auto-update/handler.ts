import dotenv from "dotenv";

const BASE_URL = "https://qiita.com/api/v2";


/**
 * .envから環境変数を取得する
 */
function getEnv() {
  dotenv.config();
  const TARGET_URL = process.env.TARGET_URI;
  if (!TARGET_URL) {
    throw new Error("NO TARGET_URI in .env");
  }
  const QIITA_ACCESS_TOKEN = process.env.QIITA_ACCESS_TOKEN;
  if (!QIITA_ACCESS_TOKEN) {
    throw new Error("NO QIITA_ACCESS_TOKEN in .env");
  }
  return { TARGET_URL, QIITA_ACCESS_TOKEN };
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
async function getArticleContent(QIITA_ACCESS_TOKEN:string, articleURL: string): Promise<string> {
  const articleId = getArticleIdFromUrl(articleURL);
  try {
    const response = await fetch(`${BASE_URL}/items/${articleId}`, {
      headers: {
        Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as any;
    return data.body;
  } catch (error: unknown) {
    console.error("記事内容の取得に失敗しました:", (error as any).message);
    throw new Error("記事内容の取得に失敗しました");
  }
}


/**
 * 
 *
 *  記事内容からadvent-calendarのURLを除いたQiitaのURLを抽出する
 * @param content - 記事内容
 * @returns - 抽出したQiitaのURLの配列
 */
function extractQiitaUrls(content: string): string[] {
  const urlRegex = /https:\/\/qiita\.com\/[^\s]+/g;
  const urls = content.match(urlRegex) || [];
  return urls.filter(url => !url.includes("advent-calendar"));
}


/**
 * 記事URLからviews，いいね数及びストック数を取得する
 * @param articleURL - 取得したい記事のURL
 * @returns - views，いいね数，ストック数
 */
async function getArticleInfo(QIITA_ACCESS_TOKEN:string, articleURL: string): Promise<{ pageViewsCount: number, likesCount: number, stocksCount: number }> {
  const articleId = getArticleIdFromUrl(articleURL);
  try {
    const response = await fetch(`${BASE_URL}/items/${articleId}`, {
      headers: {
        Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as any;
    const likesCount = data.likes_count; // いいね数
    const stocksCount = data.stocks_count; // ストック数
    const pageViewsCount = data.page_views_count; // PV数
    console.log(`記事: ${articleURL}, いいね数: ${likesCount}, ストック数: ${stocksCount}, PV数: ${pageViewsCount}`);

    return {pageViewsCount, likesCount, stocksCount };
  } catch (error: unknown) {
    console.error("記事情報の取得に失敗しました:", (error as any).message);
    throw new Error("記事情報の取得に失敗しました");
  }
}


/**
 * 記事のタイトルを取得する。
 * @param articleURL - 取得したい記事のURL
 */
async function getArticleTitle(QIITA_ACCESS_TOKEN:string, articleURL: string): Promise<string> {
  const articleId = getArticleIdFromUrl(articleURL);
  try {
    const response = await fetch(`${BASE_URL}/items/${articleId}`, {
      headers: {
        Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as any;
    return data.title;
  } catch (error: unknown) {
    console.error("記事タイトルの取得に失敗しました:", (error as any).message);
    throw new Error("記事タイトルの取得に失敗しました");
  }
}


/**
 * 記事をのviews，いいね数，ストック数の値を更新する。
 * @param articleURL - 更新したい記事のURL
 * @param updatedContent - 更新後の内容
 */
async function updateArticle(QIITA_ACCESS_TOKEN: string, articleURL: string, updatedContent: string): Promise<void> {
  const articleId = getArticleIdFromUrl(articleURL);
  console.log("更新後の内容:", updatedContent);
  try {
    // NOTE: 記事のタイトルがないと更新に失敗するため，タイトルを取得
    const articleTitle = await getArticleTitle(QIITA_ACCESS_TOKEN, articleURL);

    const patchResponse = await fetch(`${BASE_URL}/items/${articleId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: articleTitle, body: updatedContent }),
    });
    if (!patchResponse.ok) throw new Error(`HTTP ${patchResponse.status}`);
  } catch (error: unknown) {
    console.error("記事の更新に失敗しました:", (error as any).message);
    throw new Error("記事の更新に失敗しました");
  }
}


/**
 * TARGET_URLに記載された伸びた記事の一覧が記載された記事からQiitaのURLのみを抽出する。
 * @param QIITA_ACCESS_TOKEN - QiitaのアクセストークN
 * @param TARGET_URL - 処理対象の記事URL
 * @returns - 抽出したQiitaのURLの配列と記事内容
 */
async function getQiitaUrlsFromArticle(QIITA_ACCESS_TOKEN: string, TARGET_URL: string): Promise<{urls: string[], content: string}> {
  const content = await getArticleContent(QIITA_ACCESS_TOKEN, TARGET_URL);
  const urls = extractQiitaUrls(content);
  return { urls, content };
}


/**
 * AWS Lambdaのエントリーポイント
 * @param event - AWS Lambdaのイベント
 * @returns - Lambdaのレスポンス
 */
export const run = async (event: any) => {
  const { TARGET_URL, QIITA_ACCESS_TOKEN } = getEnv();

  // TARGET_URLの記事内容を取得し，QiitaのURLを抽出
  const { urls: qiitaUrls,  content: originalContent } = await getQiitaUrlsFromArticle(QIITA_ACCESS_TOKEN, TARGET_URL);
  let updateContent = originalContent

  // 各QiitaのURLに対していいね数とストック数を取得し，記事内容を更新
  for (const url of qiitaUrls) {
    const { pageViewsCount, likesCount, stocksCount } = await getArticleInfo(QIITA_ACCESS_TOKEN, url);
    const viewsLikeStockInfo = `views: ${pageViewsCount},いいね数: ${likesCount},ストック数: ${stocksCount}\n`;
    if (updateContent.includes(url)) {
      const regex = new RegExp(`(${url}\\s*\\n)(views: \\d+,いいね数: \\d+,ストック数: \\d+\\n)?`);
      updateContent = updateContent.replace(regex, `$1${viewsLikeStockInfo}`);
    }
  }
  await updateArticle(QIITA_ACCESS_TOKEN, TARGET_URL, updateContent);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Success" }),
  };
};


// ローカルから実行する用
if (require.main === module) {
  (async () => { const result = await run({});
    console.log("Lambda Execution Result:", result);
  })();
}

