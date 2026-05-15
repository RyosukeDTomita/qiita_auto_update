import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const BASE_URL = "https://qiita.com/api/v2";
const PER_PAGE = 100;

interface QiitaArticle {
  id: string;
  title: string;
  url: string;
  likes_count: number;
}

function getEnv() {
  dotenv.config({ path: path.join(__dirname, ".env") });
  const QIITA_ACCESS_TOKEN = process.env.QIITA_ACCESS_TOKEN;
  if (!QIITA_ACCESS_TOKEN) {
    throw new Error("NO QIITA_ACCESS_TOKEN in .env");
  }
  const QIITA_USER_ID = process.env.QIITA_USER_ID;
  if (!QIITA_USER_ID) {
    throw new Error("NO QIITA_USER_ID in .env");
  }
  return { QIITA_ACCESS_TOKEN, QIITA_USER_ID };
}

/**
 * 指定ユーザの全記事を取得する (ページング対応)
 */
async function fetchUserArticles(
  QIITA_ACCESS_TOKEN: string,
  userId: string
): Promise<QiitaArticle[]> {
  const articles: QiitaArticle[] = [];
  let page = 1;
  while (true) {
    const response = await axios.get(`${BASE_URL}/users/${userId}/items`, {
      params: { page, per_page: PER_PAGE },
      headers: { Authorization: `Bearer ${QIITA_ACCESS_TOKEN}` },
    });
    const items: QiitaArticle[] = response.data;
    if (items.length === 0) break;
    for (const item of items) {
      articles.push({
        id: item.id,
        title: item.title,
        url: item.url,
        likes_count: item.likes_count,
      });
    }
    if (items.length < PER_PAGE) break;
    page++;
  }
  return articles;
}

async function main() {
  const { QIITA_ACCESS_TOKEN, QIITA_USER_ID } = getEnv();
  const articles = await fetchUserArticles(QIITA_ACCESS_TOKEN, QIITA_USER_ID);

  // いいね数の多い順にソート
  articles.sort((a, b) => b.likes_count - a.likes_count);

  const lines: string[] = [];
  for (const article of articles) {
    console.log(`likes:${article.likes_count}\t${article.url}\t${article.title}`);
    lines.push(`${article.url} ${article.likes_count}`);
  }

  const outputPath = path.join(__dirname, "lgtm.txt");
  fs.writeFileSync(outputPath, lines.join("\n") + "\n");
  console.log(`\n${articles.length}件の記事を ${outputPath} に保存しました`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
