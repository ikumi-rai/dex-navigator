import { getApps } from "../core.js"
import { setContextMenu } from "../context_menu.js"

document.addEventListener("DOMContentLoaded", async () => {
  // クリップボードの中身を取得してテキストボックスに入力
  // クリップボードの取得はフォーカスがあたっていないと失敗する
  window.addEventListener("focus", async () => {
    const cbTextBox = document.getElementById("clipboard-content")
    const cbContent = await navigator.clipboard.readText()
    cbTextBox.value = cbContent.trim() || "Clipboard content is not text."
  })

  const settings = (await chrome.storage.local.get("settings")).settings
  const apps = getApps(settings)

  // 各サイトに移動するボタンをメイン画面に配置
  const buttonArea = document.getElementById("navigation-area")
  const navigate = (event) => {
    const buttonId = event.target.id
    const ca = document.getElementById("clipboard-content").value
    open(apps[buttonId].createTokenPageUrl(ca))
  }
  Object.values(apps).forEach((app) => {
    const button = document.createElement("button")
    button.id = app.id
    button.textContent = app.name
    button.addEventListener("click", navigate)
    const img = document.createElement("img")
    img.src = `../images/${app.id}.png`
    button.prepend(img)
    buttonArea.append(button)
  })

  // 設定画面に関するスクリプト等を設定
  const settingsTextBox = document.getElementById("settings")
  settingsTextBox.value = Object.keys(apps).join("\n")
  const modal = document.getElementById("modal")
  let temporarySettings = ""
  document.getElementById("settings-btn").addEventListener("click", () => {
    temporarySettings = settingsTextBox.value
    modal.classList.add("visible")
  })
  document.getElementById("save-btn").addEventListener("click", () => {
    const newSettings = settingsTextBox.value
      .split("\n")
      .filter((stg) => stg)
      .map((stg) => stg.trim())
    chrome.storage.local.set({ settings: newSettings })
    settingsTextBox.value = newSettings.join("\n")
    chrome.contextMenus.removeAll(setContextMenu)
    modal.classList.remove("visible")
  })
  document.getElementById("back-btn").addEventListener("click", () => {
    settingsTextBox.value = temporarySettings
    temporarySettings = ""
    modal.classList.remove("visible")
  })
})
