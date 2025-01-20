import { apps } from "./core.js"

/*global chrome*/

// 拡張機能の登録/更新時にコンテキストメニューを追加
chrome.runtime.onInstalled.addListener(() => {
  const createMenuItem = (id, title, parent) => {
    const options = {
      id,
      title,
      documentUrlPatterns: [...new Set(Object.values(apps).map((app) => app.url + "*"))],
    }
    if (parent) options.parentId = parent
    return chrome.contextMenus.create(options)
  }

  const parent = createMenuItem("dex_navigator", "Dex Navigator")
  Object.values(apps).forEach((app) => createMenuItem(app.id, app.name, parent))
})

// コンテキストメニューをクリックした際の動作を登録
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const navigate = async (from, to) => {
    const core = await import(chrome.runtime.getURL("core.js"))
    const { apps, getCaFromUi } = core

    // コンテキストメニュー全体に対するイベントリスナーなので他のメニューに配慮して早めに抜ける
    if (!URL.canParse(from)) return
    const allId = Object.keys(apps)
    if (!allId.includes(to)) return

    // 今開いているページからコントラクトアドレスを取得
    const ca = getCaFromUi(from)
    if (!ca) return
    console.info(`[Dex Navigator] CA: ${ca}`)

    // 新しいタブで開く
    open(apps[to].createTokenPageUrl(ca))
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: navigate,
    args: [info.pageUrl, info.menuItemId],
  })
})
