import { apps } from "./core.js"

document.addEventListener("DOMContentLoaded", async () => {
  const navigate = (event) => {
    const buttonId = event.target.id
    const ca = document.getElementById("clipboard-content").value
    open(apps[buttonId].createTokenPageUrl(ca))
  }

  const createButtonElm = (app) => {
    const button = document.createElement("button")
    button.id = app.id
    button.textContent = app.name
    button.addEventListener("click", navigate)
    const img = document.createElement("img")
    img.src = `images/${app.id}.png`
    button.prepend(img)
    return button
  }

  const buttonArea = document.getElementById("navigation-area")
  Object.values(apps).forEach((app) => buttonArea.append(createButtonElm(app)))

  window.addEventListener("focus", async () => {
    const cbTextBox = document.getElementById("clipboard-content")
    const cbContent = await navigator.clipboard.readText()
    cbTextBox.value = cbContent.trim() || "Clipboard content is not text."
  })
})
