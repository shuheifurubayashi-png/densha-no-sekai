# でんしゃのせかい

小さい子ども向けの知育Webアプリ。電車を走らせながら、ひらがな・かず・のりものの名前などを
音声付きのミニゲームで楽しく学べる。

## 開発コマンド

```bash
npm run dev       # 開発サーバーを起動
npm run build     # 型チェック＋本番ビルド
npm run preview   # ビルド結果をプレビュー
```

## 音声生成スクリプト

- `node scripts/generate-voice.sh` : macOS の `say` コマンド（Kyoko）で読み上げ音声を生成
- `node scripts/generate-voice-voicevox.mjs` : VOICEVOX エンジン（要事前起動、
  `http://127.0.0.1:50021`）で読み上げ音声を生成。話者はずんだもん（あまあま、speaker id = 1）
- `node scripts/generate-sfx.mjs` : 効果音（SFX）を合成生成

いずれも `public/audio/` 以下に `<name>.m4a` を出力する（再実行可能・上書き）。

## クレジット

音声: VOICEVOX:ずんだもん
