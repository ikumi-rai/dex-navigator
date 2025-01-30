import { getAppFromId, idList, operateSettings } from "../core.js"
import { setContextMenu } from "../context_menu.js"

document.addEventListener("DOMContentLoaded", async () => {
  // クリップボードの中身を取得してテキストボックスに入力
  // クリップボードの取得はフォーカスがあたっていないと失敗する
  window.addEventListener("focus", async () => {
    const cbTextBox = document.getElementById("clipboard-content")
    const cbContent = await navigator.clipboard.readText()
    cbTextBox.value = cbContent.trim() || "Clipboard content is not text."
  })

  const settings = await operateSettings("get")
  const apps = getAppFromId(settings)

  // 各サイトに移動するボタンをメイン画面に配置
  const buttonArea = document.getElementById("navigation-area")
  const navigate = async (event) => {
    const buttonId = event.target.id
    const ca = document.getElementById("clipboard-content").value
    open(await getAppFromId(buttonId).createTokenPageUrl(ca))
  }
  apps.forEach((app) => {
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
  settingsTextBox.value = apps.map((app) => app.id).join("\n")
  const modal = document.getElementById("modal")
  let temporarySettings = ""
  document.getElementById("settings-btn").addEventListener("click", () => {
    temporarySettings = settingsTextBox.value
    modal.classList.add("visible")
  })
  document.getElementById("save-btn").addEventListener("click", async () => {
    const newSettings = [
      ...new Set(
        settingsTextBox.value
          .split("\n")
          .filter((stg) => stg)
          .map((stg) => stg.trim()),
      ),
    ] // 行で分割 → 空行削除 → 空白削除 → 重複削除
    await operateSettings(
      newSettings.length && newSettings.join() !== idList().join() ? "set" : "remove",
      newSettings,
    )
    settingsTextBox.value = newSettings.join("\n")
    chrome.contextMenus.removeAll().then(setContextMenu)
    modal.classList.remove("visible")
  })
  document.getElementById("back-btn").addEventListener("click", () => {
    settingsTextBox.value = temporarySettings
    temporarySettings = ""
    modal.classList.remove("visible")
  })
})
