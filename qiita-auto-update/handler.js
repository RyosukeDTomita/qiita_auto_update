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
exports.getArticleInfo = getArticleInfo;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const BASE_URL = "https://qiita.com/api/v2";
const QIITA_ACCESS_TOKEN = process.env.QIITA_ACCESS_TOKEN;
/**
 * 記事情報を取得する
 * @param articleURL - 取得したい記事のURL
 */
function getArticleInfo(articleURL) {
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
            const articleUrl = data.url; // 記事のURL
            console.log(`記事タイトル: ${data.title}`);
            console.log(`記事URL: ${articleUrl}`);
            console.log(`いいね数: ${likesCount}`);
            console.log(`ストック数: ${stocksCount}`);
        }
        catch (error) {
            console.error("記事情報の取得に失敗しました:", error.message);
            throw new Error("記事情報の取得に失敗しました");
        }
    });
}
/**
 * URLから記事IDを取得する
 */
function getArticleIdFromUrl(url) {
    const urlArray = url.split("/");
    return urlArray[urlArray.length - 1];
}
/**
 * AWS Lambdaのエントリーポイント
 * @param event - AWS Lambdaのイベント
 * @returns - Lambdaのレスポンス
 */
const run = (event) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Lambda function executed", event);
    const articleUris = [
        "https://qiita.com/sigma_devsecops/items/af7ea7f1b29a3d23117b",
        "https://qiita.com/sigma_devsecops/items/94b94e3e994d60ec4c1d",
    ];
    try {
        for (const url of articleUris) {
            yield getArticleInfo(url);
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Success" }),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message }),
        };
    }
});
exports.run = run;
