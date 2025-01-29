import { getApps, getCaFromUi, STORAGE_KEY_SETTINGS, SELECTION_MENU_ITEM_SUFFIX } from "./core.js"

/**
 * chrome.contextMenus.create()のカリー化
 */
const createMenuItem = (optionalParams) => {
  return (id, title) => {
    return chrome.contextMenus.create({
      id,
      title,
      ...optionalParams,
    })
  }
}

/**
 * appsに含まれるURLを開いている状態 or テキストを選択した状態
 * のコンテキストメニューにDEX Navigatorを追加する
 */
export const setContextMenu = async () => {
  const settings = (await chrome.storage.local.get(STORAGE_KEY_SETTINGS))[STORAGE_KEY_SETTINGS]
  const allApps = getApps()
  const selectedApps = getApps(settings)

  // appsに含まれるURLを開いている状態のコンテキストメニュー
  const allUrlPatterns = [...new Set(Object.values(allApps).map((app) => app.url + "*"))]
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
  Object.values(selectedApps).forEach((app) => {
    createTargetPageChildMenuItem(app.id, app.name)
    createSelectionChildMenuItem(app.id + SELECTION_MENU_ITEM_SUFFIX, app.name)
  })
}

/**
 * 現在開いているページもしくは選択中のテキストからCAを取得し指定したサイトのトークンページに移動する
 * @param {string} pageUrl
 * @param {string} menuItemId
 * @returns {void}
 */
export const navigate = async (pageUrl, menuItemId) => {
  const allApps = getApps()

  const isSelectionMenu = menuItemId.endsWith(SELECTION_MENU_ITEM_SUFFIX)
  const appId = isSelectionMenu
    ? menuItemId.slice(0, -SELECTION_MENU_ITEM_SUFFIX.length)
    : menuItemId

  // コンテキストメニュー全体に対するイベントリスナーなので他のメニューに配慮して早めに抜ける
  const allIds = Object.keys(allApps)
  if (!allIds.includes(appId)) return

  const ca = isSelectionMenu ? window.getSelection().toString().trim() : getCaFromUi(pageUrl)
  if (!ca) return
  console.info(`[Dex Navigator] CA: ${ca}`)

  // 新しいタブで開く
  open(allApps[appId].createTokenPageUrl(ca))
}

/**
 * コンテキストメニューがクリックされた際にnavigate()をContent Scriptとしてタブ内で実行させる
 */
export const setContextMenuScript = () => {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      // Service Workerが時間経過で停止し全ての変数が失われるため、スクリプトをロードするだけのラッパーを挟む
      func: async (pageUrl, menuItemId) => {
        const { navigate } = await import(chrome.runtime.getURL("context_menu.js"))
        navigate(pageUrl, menuItemId)
      },
      args: [info.pageUrl, info.menuItemId],
    })
  })
}
