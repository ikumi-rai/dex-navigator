/*global chrome*/

chrome.runtime.onInstalled.addListener(() => {
  /**
   * @param {string} id コンテキストメニュー項目に付与されるID
   * @param {string} name メニューの表示名
   * @param {string} url メニューを表示するサイトのURL(指定のないサイトを開いている時はメニューにDex Navigatorが表示されない)
   */
  const App = (id, name, url) => {
    return { id, name, url }
  }

  const apps = {
    DexScreener: App("dex_screener", "DEX Screener", "https://dexscreener.com/solana/"),
    GMGN: App("gmgn", "GMGN", "https://gmgn.ai/sol/token/"),
    ApePro: App("ape_pro", "Ape Pro", "https://ape.pro/solana/"),
    Photon: App("photon", "Photon", "https://photon-sol.tinyastro.io/en/lp/"),
    PumpFun: App("pump_fun", "Pump Fun", "https://pump.fun/coin/"),
    RaydiumSOL: App("raydium_sol", "Raydium - SOL", "https://raydium.io/"),
    RaydiumUSDC: App("raydium_usdc", "Raydium - USDC", "https://raydium.io/"),
    JupiterSOL: App("jupiter_sol", "Jupiter - SOL", "https://jup.ag/"),
    JupiterUSDC: App("jupiter_usdc", "Jupiter - USDC", "https://jup.ag/"),
  }

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

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      // MEMO: ここで渡したい関数や関数の内部で使用する値などを外のスコープで宣言すると関数が実行されないことがあったため全て内部に記述する
      func: (from, to, apps) => {
        console.info("Dex Navigator is Running...")
        // コンテキストメニュー全体に対するイベントリスナーなので他のメニューに配慮して早めに抜ける
        if (!URL.canParse(from)) return
        const targets = Object.values(apps).map((app) => app.id)
        if (!targets.includes(to)) return

        // 色々定義
        const USDC_CA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        const SOL_CA = "So11111111111111111111111111111111111111112"
        const getElementByXPath = (path) =>
          document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
            .singleNodeValue
        const Url = (url) => URL.parse(url)

        // 今開いているページからコントラクトアドレスを取得
        let ca = ""
        try {
          switch (Url(from).origin) {
            case Url(apps.DexScreener.url).origin: {
              const solScanBtn = getElementByXPath(
                ".//a[starts-with(@href,'https://solscan.io/token')]",
              )
              ca = Url(solScanBtn.getAttribute("href")).pathname.split("/").pop()
              break
            }
            case Url(apps.GMGN.url).origin: {
              const solScanBtn = getElementByXPath(
                ".//a[starts-with(@href,'https://solscan.io/token')]",
              )
              ca = Url(solScanBtn.getAttribute("href")).pathname.split("/").pop()
              break
            }
            case Url(apps.ApePro.url).origin: {
              const twitterBtn = getElementByXPath(
                ".//a[starts-with(@href,'https://x.com/search')]",
              )
              ca = Url(twitterBtn.getAttribute("href")).searchParams.get("q")
              break
            }
            case Url(apps.Photon.url).origin: {
              const mainArea = getElementByXPath(".//div[@data-show-token-address]")
              ca = mainArea.getAttribute("data-show-token-address")
              break
            }
            case Url(apps.PumpFun.url).origin: {
              ca = Url(from).pathname.split("/").pop()
              break
            }
            case Url(apps.RaydiumSOL.url).origin: {
              const queryParams = Url(from).searchParams
              const input = queryParams.get("inputMint")
              const output = queryParams.get("outputMint")
              ca = [USDC_CA, SOL_CA, "sol"].includes(input) ? output : input
              break
            }
            case Url(apps.JupiterSOL.url).origin: {
              const apeProBtn = getElementByXPath(
                ".//a[starts-with(@href,'https://ape.pro/solana')]",
              )
              ca = Url(apeProBtn.getAttribute("href")).pathname.split("/").pop()
              break
            }
            default:
              return
          }
        } catch {
          console.error("[Dex Navigator] Error has occurred.")
          return
        }
        if (!ca) return
        console.info(`[Dex Navigator] CA: ${ca}`)

        // DEXを開く場合はURLを加工
        let path = ""
        switch (to) {
          case apps.RaydiumSOL.id: {
            path = `swap/?inputMint=sol&outputMint=${ca}`
            break
          }
          case apps.RaydiumUSDC.id: {
            path = `swap/?inputMint=${USDC_CA}&outputMint=${ca}`
            break
          }
          case apps.JupiterSOL.id: {
            path = `swap/SOL-${ca}`
            break
          }
          case apps.JupiterUSDC.id: {
            path = `swap/USDC-${ca}`
            break
          }
          default:
            path = ca
        }

        // 新しいタブで開く
        const fromIdToUrl = Object.fromEntries(Object.values(apps).map((app) => [app.id, app.url]))
        open(fromIdToUrl[to] + path)
      },
      args: [info.pageUrl, info.menuItemId, apps],
    })
  })
})
