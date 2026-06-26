# 自動同步 Markdown 檔案至 GitHub 實作計畫

為了解決本機無法推送到 GitHub 的權限問題（先前 GitHub Connector 回報 403 錯誤，且本機 HTTPS 推送因未設定憑證而遭拒絕），我們將設定本機 Git 透過 SSH 連線到 GitHub。這能讓 AI 在每次更新本地 `.md` 檔案時，自動進行 `git commit` 與 `git push` 同步至 GitHub 儲存庫 `ffyiltu0415/LiveInfo`。

## User Review Required

> [!IMPORTANT]
> 1. **產生 SSH 金鑰**：我們將在您的本機產生一組全新的 SSH 金鑰（ED25519 格式）。
> 2. **新增金鑰至 GitHub**：產生後，您需要手動將公鑰（Public Key）複製並新增至您的 GitHub 帳號設定 ([GitHub SSH Keys 設定頁面](https://github.com/settings/keys))。
> 3. **驗證連線**：新增完成後，我們將驗證連線是否成功，並將遠端 URL 修改為 SSH 格式 (`git@github.com:ffyiltu0415/LiveInfo.git`)。

## Proposed Changes

### 專案設定與自動化流程

#### [MODIFY] [AGENTS.md](file:///Users/linweicheng/Gemini_AntigravityIDE/AGENTS.md)
在專案規則中，新增一條規則：**每次修改本地的 Markdown 檔案（如本規則檔、問題解決紀錄、未解決問題等）後，都必須自動執行 `git commit` 與 `git push` 同步到 GitHub 遠端儲存庫**。

---

## 執行步驟說明

### 第一階段：產生與設定 SSH 金鑰
1. 在本機執行：
   ```bash
   ssh-keygen -t ed25519 -C "ffyiltu0415@gmail.com" -f ~/.ssh/id_ed25519 -N ""
   ```
2. 讀取並顯示公鑰內容：
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
3. 請使用者至 GitHub 設定頁面新增此公鑰。

### 第二階段：驗證連線與變更遠端儲存庫 URL
1. 驗證 SSH 連線：
   ```bash
   ssh -T git@github.com
   ```
2. 將 git remote `origin` 修改為 SSH URL：
   ```bash
   git remote set-url origin git@github.com:ffyiltu0415/LiveInfo.git
   ```

### 第三階段：測試推送
1. 將本機已 commit 的檔案推送到遠端儲存庫：
   ```bash
   git push origin main -u
   ```

---

## Verification Plan

### Automated Tests
- 無，主要為 Git 與 GitHub 連線測試。

### Manual Verification
- 執行 `ssh -T git@github.com` 回傳 `Hi ffyiltu0415! You've successfully authenticated...`。
- 執行 `git push origin main` 成功且無錯誤提示。
- 確認 GitHub 上的儲存庫已同步最新的 `AGENTS.md`、`問題解決紀錄.md`、`未解決.md` 與 `測試網路速度.command`。
