import { setContextMenu, setContextMenuScript } from "./context_menu.js"
import { setTradingViewCommand } from "./tv.js"

chrome.runtime.onInstalled.addListener(setContextMenu)
setContextMenuScript()
setTradingViewCommand()
