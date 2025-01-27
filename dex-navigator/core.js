export const USDC_CA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export const SOL_CA = "So11111111111111111111111111111111111111112"

export const SELECTION_MENU_ITEM_SUFFIX = "_selection"

/**
 * @param {string} id UI(コンテキストメニュー項目とポップアップのボタン)に付与されるID
 * @param {string} name UIに表示される名前
 * @param {string} url トークンページからパスを1つ削ったURL
 * @param {(ca: string) => string} path トークンページのURLを組み立てる際にCAを加工する関数
 */
const App = (id, name, url, path) => {
  return {
    id,
    name,
    url,
    createTokenPageUrl: (ca) => url + (path ? path(ca) : ca),
  }
}

export const apps = {
  dex_screener: App("dex_screener", "DEX Screener", "https://dexscreener.com/solana/"),
  gmgn: App("gmgn", "GMGN", "https://gmgn.ai/sol/token/"),
  ape_pro: App("ape_pro", "Ape Pro", "https://ape.pro/solana/"),
  photon: App("photon", "Photon", "https://photon-sol.tinyastro.io/en/lp/"),
  pump_fun: App("pump_fun", "Pump Fun", "https://pump.fun/coin/"),
  raydium_sol: App(
    "raydium_sol",
    "Raydium - SOL",
    "https://raydium.io/",
    (ca) => `swap/?inputMint=sol&outputMint=${ca}`,
  ),
  raydium_usdc: App(
    "raydium_usdc",
    "Raydium - USDC",
    "https://raydium.io/",
    (ca) => `swap/?inputMint=${USDC_CA}&outputMint=${ca}`,
  ),
  jupiter_sol: App("jupiter_sol", "Jupiter - SOL", "https://jup.ag/", (ca) => `swap/SOL-${ca}`),
  jupiter_usdc: App("jupiter_usdc", "Jupiter - USDC", "https://jup.ag/", (ca) => `swap/USDC-${ca}`),
}

/**
 * @param {string} path
 * @returns {Node | null}
 */
const getElementByXPath = (path) => {
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    .singleNodeValue
}

/**
 * @param {string} url
 * @returns {URL}
 */
const Url = (url) => {
  return URL.parse(url)
}

/**
 * 分析系のサイトは必ずしもURLの末尾がCAとは限らないのでUIからCAを取得する
 * @param {string} url
 * @returns {string | undefined}
 */
export const getCaFromUi = (url) => {
  if (!URL.canParse(url)) return
  try {
    switch (Url(url).origin) {
      // DEX Screener
      case Url(apps.dex_screener.url).origin: {
        const solScanBtn = getElementByXPath(".//a[starts-with(@href,'https://solscan.io/token')]")
        return Url(solScanBtn.getAttribute("href")).pathname.split("/").pop()
      }
      // GMGN
      case Url(apps.gmgn.url).origin: {
        const solScanBtn = getElementByXPath(".//a[starts-with(@href,'https://solscan.io/token')]")
        return Url(solScanBtn.getAttribute("href")).pathname.split("/").pop()
      }
      // Ape Pro
      case Url(apps.ape_pro.url).origin: {
        const twitterBtn = getElementByXPath(".//a[starts-with(@href,'https://x.com/search')]")
        return Url(twitterBtn.getAttribute("href")).searchParams.get("q")
      }
      // Photon
      case Url(apps.photon.url).origin: {
        const mainArea = getElementByXPath(".//div[@data-show-token-address]")
        return mainArea.getAttribute("data-show-token-address")
      }
      // Pump Fun
      case Url(apps.pump_fun.url).origin: {
        return Url(url).pathname.split("/").pop()
      }
      // Raydium
      case Url(apps.raydium_sol.url).origin: {
        const queryParams = Url(url).searchParams
        const input = queryParams.get("inputMint")
        const output = queryParams.get("outputMint")
        return [USDC_CA, SOL_CA, "sol"].includes(input) ? output : input
      }
      // Jupiter
      case Url(apps.jupiter_sol.url).origin: {
        const apeProBtnPath = ".//a[starts-with(@href,'https://ape.pro/solana')]"
        const apeProBtn1 = getElementByXPath(`(${apeProBtnPath})[1]`)
        const apeProBtn2 = getElementByXPath(`(${apeProBtnPath})[2]`)
        const ca1 = Url(apeProBtn1.getAttribute("href")).pathname.split("/").pop()
        const ca2 = Url(apeProBtn2.getAttribute("href")).pathname.split("/").pop()
        return [USDC_CA, SOL_CA].includes(ca1) ? ca2 : ca1
      }
      default:
        return
    }
  } catch {
    console.error("[Dex Navigator] Error has occurred.")
    return
  }
}
