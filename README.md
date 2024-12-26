# APP NAME

![un license](https://img.shields.io/github/license/RyosukeDTomita/qiita_auto_update)

## INDEX

- [ABOUT](#about)
- [ENVIRONMENT](#environment)
- [PREPARING](#preparing)
- [HOW TO USE](#how-to-use)

---

## ABOUT

AWS Lambda to hit qiita api to update like and stock number.

[target qiita article](https://qiita.com/sigma_devsecops/items/59af6d7f45397217ddd2)

---

## ENVIRONMENT

- Node.js v22.11.0
- Serverless with AWS Lambda

<details>
<summary>自分用メモなので折りたたんでおく</summary>

- Node.jsのインストール

```shell
# 現在のLTS: Jobのv22.11.0を指定
nvm ls-remote 
nvm install v22.11.0
nvm alias default 22 # default変更
```

- ライブラリのインストール

```shell
npm init -y
npm install --save-dev typescript
npm install --save-dev @types/node
npm install @types/aws-lambda
npm install axios
npm install dotenv
```

- tsconfigの設定

```shell
npx tsc --init
```

```
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs", // node.jsの場合はcommonjsで良さそう
    "moduleResolution": "node",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true, // ファイル名の大文字小文字を厳密にチェック
    "strict": true,
    "skipLibCheck": true, // ライブラリの型チェックをスキップ
    "noEmitOnError": true, // エラーがある場合はコンパイルしない
    "noImplicitAny": true, // 暗黙的なany型の使用を許可しない
  },
  "include": ["qiita-auto-update/handler.ts"],
  "compileOnSave": true
}
```
> [!NOTE]
> `package.json`のtypeも同じくcommonjsにあわせる必要がある。

- VSCodeでビルドタスクを.vscode/tasks.jsonの作成(Ctrl + Shift + Bしておくとtsファイル保存時に自動でビルドされる)
- ACCESS_TOKENを.envファイルから読み込むようにする
  - .envファイルの作成
  - serverless-dotenv-pluginのインストール

</details>

---

## PREPARING

1. set up `serverless`. See [Getting Started](https://www.serverless.com/framework/docs/getting-started)
2. clone this repository

---

## HOW TO USE

1. fix `targetURI` in [./qiita-auto-update/handler.ts](./qiita-auto-update/handler.ts).
2. deploy to aws lambda

```shell
cd qiita-auto-update
sls deploy
```

---
