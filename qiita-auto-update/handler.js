"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
// import { APIGatewayProxyEvent } from "aws-lambda";
const BASE_URL = "https://qiita.com/api/v2";
/**
 * .envから環境変数を取得する
 */
function getEnv() {
    dotenv_1.default.config();
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
function getArticleIdFromUrl(url) {
    const urlArray = url.split("/");
    return urlArray[urlArray.length - 1];
}
/**
 * 記事の内容を取得する。
 * @param articleURL - 取得したい記事のURL
 */
function getArticleContent(QIITA_ACCESS_TOKEN, articleURL) {
    return __awaiter(this, void 0, void 0, function* () {
        const articleId = getArticleIdFromUrl(articleURL);
        try {
            const response = yield axios_1.default.get(`${BASE_URL}/items/${articleId}`, {
                headers: {
                    Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
                },
            });
            return response.data.body;
        }
        catch (error) {
            console.error("記事内容の取得に失敗しました:", error.message);
            throw new Error("記事内容の取得に失敗しました");
        }
    });
}
/**
 *
 * 記事内容からadvent-calendarのURLを除いたQiitaのURLを抽出する
 * @param content - 記事内容
 * @returns - 抽出したQiitaのURLの配列
 */
function extractQiitaUrls(content) {
    const urlRegex = /https:\/\/qiita\.com\/[^\s]+/g;
    const urls = content.match(urlRegex) || [];
    return urls.filter(url => !url.includes("advent-calendar"));
}
/**
 * 記事URLからviews，いいね数及びストック数を取得する
 * @param articleURL - 取得したい記事のURL
 * @returns - views，いいね数，ストック数
 */
function getArticleInfo(QIITA_ACCESS_TOKEN, articleURL) {
    return __awaiter(this, void 0, void 0, function* () {
        const articleId = getArticleIdFromUrl(articleURL);
        try {
            const response = yield axios_1.default.get(`${BASE_URL}/items/${articleId}`, {
                headers: {
                    Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
                },
            });
            const data = response.data;
            const likesCount = data.likes_count; // いいね数
            const stocksCount = data.stocks_count; // ストック数
            const pageViewsCount = data.page_views_count; // PV数
            console.log(`記事: ${articleURL}, いいね数: ${likesCount}, ストック数: ${stocksCount}, PV数: ${pageViewsCount}`);
            return { pageViewsCount, likesCount, stocksCount };
        }
        catch (error) {
            console.error("記事情報の取得に失敗しました:", error.message);
            throw new Error("記事情報の取得に失敗しました");
        }
    });
}
/**
 * 記事のタイトルを取得する。
 * @param articleURL - 取得したい記事のURL
 */
function getArticleTitle(QIITA_ACCESS_TOKEN, articleURL) {
    return __awaiter(this, void 0, void 0, function* () {
        const articleId = getArticleIdFromUrl(articleURL);
        try {
            const response = yield axios_1.default.get(`${BASE_URL}/items/${articleId}`, {
                headers: {
                    Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
                },
            });
            return response.data.title;
        }
        catch (error) {
            console.error("記事タイトルの取得に失敗しました:", error.message);
            throw new Error("記事タイトルの取得に失敗しました");
        }
    });
}
/**
 * 記事をのviews，いいね数，ストック数の値を更新する。
 * @param articleURL - 更新したい記事のURL
 * @param updatedContent - 更新後の内容
 */
function updateArticle(QIITA_ACCESS_TOKEN, articleURL, updatedContent) {
    return __awaiter(this, void 0, void 0, function* () {
        const articleId = getArticleIdFromUrl(articleURL);
        console.log("更新後の内容:", updatedContent);
        try {
            // NOTE: 記事のタイトルがないと更新に失敗するため，タイトルを取得
            const articleTitle = yield getArticleTitle(QIITA_ACCESS_TOKEN, articleURL);
            yield axios_1.default.patch(`${BASE_URL}/items/${articleId}`, {
                title: articleTitle,
                body: updatedContent,
            }, {
                headers: {
                    Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
            });
        }
        catch (error) {
            console.error("記事の更新に失敗しました:", error.message);
            throw new Error("記事の更新に失敗しました");
        }
    });
}
/**
 * AWS Lambdaのエントリーポイント
 * @param event - AWS Lambdaのイベント
 * @returns - Lambdaのレスポンス
 */
// NOTE: 特にイベント情報は使っていないのでany型に戻した
const run = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const { TARGET_URL, QIITA_ACCESS_TOKEN } = getEnv();
    // TARGET_URLの記事内容を取得し，QiitaのURLを抽出
    let content = yield getArticleContent(QIITA_ACCESS_TOKEN, TARGET_URL);
    const qiitaUrls = extractQiitaUrls(content);
    // 各QiitaのURLに対していいね数とストック数を取得し，記事内容を更新
    for (const url of qiitaUrls) {
        const { pageViewsCount, likesCount, stocksCount } = yield getArticleInfo(QIITA_ACCESS_TOKEN, url);
        const viewsLikeStockInfo = `views: ${pageViewsCount},いいね数: ${likesCount},ストック数: ${stocksCount}\n`;
        if (content.includes(url)) {
            const regex = new RegExp(`(${url}\\s*\\n)(views: \\d+,いいね数: \\d+,ストック数: \\d+\\n)?`);
            content = content.replace(regex, `$1${viewsLikeStockInfo}`);
        }
    }
    yield updateArticle(QIITA_ACCESS_TOKEN, TARGET_URL, content);
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Success" }),
    };
});
exports.run = run;
// ローカルから実行するための設定
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield (0, exports.run)({});
        console.log("Lambda Execution Result:", result);
    }))();
}
