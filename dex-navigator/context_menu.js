import { getAppFromId, getAppFromUrl, idList, urlList, operateSettings } from "./core.js"

const SELECTION_MENU_ITEM_SUFFIX = "_selection"

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
  const settings = await operateSettings("get")
  const selectedApps = getAppFromId(settings)

  // appsに含まれるURLを開いている状態のコンテキストメニュー
  const allUrlPatterns = urlList().map((url) => url + "*")
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
  selectedApps.forEach((app) => {
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
  const isSelectionMenu = menuItemId.endsWith(SELECTION_MENU_ITEM_SUFFIX)
  const appId = isSelectionMenu
    ? menuItemId.slice(0, -SELECTION_MENU_ITEM_SUFFIX.length)
    : menuItemId

  // コンテキストメニュー全体に対するイベントリスナーなので他のメニューに配慮して早めに抜ける
  if (!idList().includes(appId)) return

  const ca = isSelectionMenu
    ? window.getSelection().toString().trim()
    : getAppFromUrl(pageUrl).getCaFromUi(pageUrl)
  if (!ca) return
  console.info(`[Dex Navigator] CA: ${ca}`)

  // 新しいタブで開く
  open(await getAppFromId(appId).createTokenPageUrl(ca))
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
