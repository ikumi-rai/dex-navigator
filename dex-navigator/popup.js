import { apps } from "./core.js"

document.addEventListener("DOMContentLoaded", async () => {
  const navigate = (event) => {
    const buttonId = event.target.id
    const ca = document.getElementById("clipboard_content").value
    open(apps[buttonId].createTokenPageUrl(ca))
  }

  const buttonArea = document.getElementById("button-area")
  Object.values(apps).forEach((app) => {
    const button = document.createElement("button")
    button.id = app.id
    button.textContent = app.name
    button.addEventListener("click", navigate)
    const img = document.createElement("img")
    img.src = `images/${app.id}.png`
    button.prepend(img)
    buttonArea.append(button)
  })

  window.addEventListener("focus", async () => {
    const cbTextBox = document.getElementById("clipboard_content")
    const cbContent = await navigator.clipboard.readText()
    cbTextBox.value = cbContent || "Clipboard content is not text."
  })
})
