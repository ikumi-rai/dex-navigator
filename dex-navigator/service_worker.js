import { apps, SELECTION_MENU_ITEM_SUFFIX } from "./core.js"

/*global chrome*/

/**
 * コンテキストメニューを追加する条件は
 * appsに含まれるURLを開いている状態 or テキストを選択した状態
 */
chrome.runtime.onInstalled.addListener(() => {
  const createMenuItem = (optionalParams) => {
    return (id, title) => {
      return chrome.contextMenus.create({
        id,
        title,
        ...optionalParams,
      })
    }
  }

  // appsに含まれるURLを開いている状態のコンテキストメニュー
  const allUrlPatterns = [...new Set(Object.values(apps).map((app) => app.url + "*"))]
  const createTargetPageMenuItem = createMenuItem({ documentUrlPatterns: allUrlPatterns })
  const TargetPageParentMenu = createTargetPageMenuItem("dex_navigator", "Dex Navigator")
  const createTargetPageChildMenuItem = createMenuItem({
    documentUrlPatterns: allUrlPatterns,
    parentId: TargetPageParentMenu,
  })

  // テキストを選択した状態のコンテキストメニュー
  const contexts = ["selection"]
  const createSelectionMenuItem = createMenuItem({ contexts })
  const selectionParentMenu = createSelectionMenuItem(
    "dex_navigator" + SELECTION_MENU_ITEM_SUFFIX,
    "Dex Navigator",
  )
  const createSelectionChildMenuItem = createMenuItem({
    contexts,
    parentId: selectionParentMenu,
  })

  // それぞれのメニューに子メニューを追加
  Object.values(apps).forEach((app) => {
    createTargetPageChildMenuItem(app.id, app.name)
    createSelectionChildMenuItem(app.id + SELECTION_MENU_ITEM_SUFFIX, app.name)
  })
})

/**
 * コンテキストメニューをクリックした際の動作の登録
 * Service Workerが停止しているのでcore.jsは再度読み込む必要がある
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const navigate = async (pageUrl, menuItemId) => {
    const core = await import(chrome.runtime.getURL("core.js"))
    const { apps, getCaFromUi, SELECTION_MENU_ITEM_SUFFIX } = core

    const isSelectionMenu = menuItemId.endsWith(SELECTION_MENU_ITEM_SUFFIX)
    const appId = isSelectionMenu
      ? menuItemId.slice(0, -SELECTION_MENU_ITEM_SUFFIX.length)
      : menuItemId

    // コンテキストメニュー全体に対するイベントリスナーなので他のメニューに配慮して早めに抜ける
    const allIds = Object.keys(apps)
    if (!allIds.includes(appId)) return

    const ca = isSelectionMenu ? window.getSelection().toString().trim() : getCaFromUi(pageUrl)
    if (!ca) return
    console.info(`[Dex Navigator] CA: ${ca}`)

    // 新しいタブで開く
    open(apps[appId].createTokenPageUrl(ca))
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: navigate,
    args: [info.pageUrl, info.menuItemId],
  })
})
