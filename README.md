# APP NAME

![un license](https://img.shields.io/github/license/RyosukeDTomita/qiita_auto_update)

## INDEX

- [ABOUT](#about)
- [ENVIRONMENT](#environment)
- [PREPARING](#preparing)
- [HOW TO USE](#how-to-use)

---

## ABOUT

---

## ENVIRONMENT

- Node.js v22.11.0

<details>
<summary>自分用メモなので折りたたんでおく</summary>

- Node.jsのインストール

```shell
# 現在のLTS: Jobのv22.11.0を指定
nvm ls-remote 
nvm install v22.11.0
```

- ライブラリのインストール

```shell
npm init -y
npm install --save-dev typescript
npm install --save-dev @types/node
npm install axios
npm install dotenv
npx tsc --init
```

- VSCodeでビルドタスクを.vscode/tasks.jsonの作成(Ctrl + Shift + Bしておくとtsファイル保存時に自動でビルドされる)
- ACCESS_TOKENを.envファイルから読み込むようにする
  - .envファイルの作成
  - serverless-dotenv-pluginのインストール

</details>

---

## PREPARING

---

## HOW TO USE

---
