import { setContextMenu, setContextMenuScript } from "./context_menu.js"

chrome.runtime.onInstalled.addListener(setContextMenu)
setContextMenuScript()
