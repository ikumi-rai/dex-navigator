export const USDC_CA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export const SOL_CA = "So11111111111111111111111111111111111111112"

/**
 * @param {string} id UI(コンテキストメニュー項目とポップアップのボタン)に付与されるID
 * @param {string} name UIに表示される名前
 * @param {string} url トークンページからパスを1つ削ったURL
 * @param {(ca: string) => string | Promise<string>} path トークンページのURLを組み立てる際にCAを加工する関数
 * @param {(url: string=) => string} ca UIからCAを取得する関数(一部URLから取得するものあり)
 */
const App = (id, name, url, path, ca) => {
  /** @type {(ca: string) => Promise<string>} */
  const createTokenPageUrl = async (ca) => {
    return url + (path ? await path(ca) : ca)
  }

  /** @type {(url: string=) => string | undefined} */
  const getCaFromUi = (url) => {
    if (!URL.canParse(url)) return
    try {
      return ca(url)
    } catch {
      console.warn("[Dex Navigator] Failed to get CA from UI.")
      return
    }
  }

  return {
    id,
    name,
    url,
    createTokenPageUrl,
    getCaFromUi,
  }
}

// prettier-ignore
const apps = [
  // DEX Screener
  App("dex_screener", "DEX Screener", "https://dexscreener.com/solana/",
    undefined,
    () => {
      const solScanBtn = getElementByXPath(".//a[starts-with(@href,'https://solscan.io/token')]")
      return Url(solScanBtn.getAttribute("href")).pathname.split("/").pop()
    }
  ),
  // GMGN
  App("gmgn", "GMGN", "https://gmgn.ai/sol/token/",
    undefined,
    () => {
      const solScanBtn = getElementByXPath(".//a[starts-with(@href,'https://solscan.io/token')]")
      return Url(solScanBtn.getAttribute("href")).pathname.split("/").pop()
    }
  ),
  // Ape Pro
  App("ape_pro", "Ape Pro", "https://ape.pro/solana/",
    undefined,
    () => {
      const twitterBtn = getElementByXPath(".//a[starts-with(@href,'https://x.com/search')]")
      return Url(twitterBtn.getAttribute("href")).searchParams.get("q")
    }
  ),
  // Photon
  App("photon", "Photon", "https://photon-sol.tinyastro.io/en/lp/",
    undefined,
    () => {
      const mainArea = getElementByXPath(".//div[@data-show-token-address]")
      return mainArea.getAttribute("data-show-token-address")
    }
  ),
  // Pump Fun
  App("pump_fun", "Pump Fun", "https://pump.fun/coin/",
    undefined,
    (url) => {
      return Url(url).pathname.split("/").pop()
    }
  ),
  // Raydium
  App("raydium_sol", "Raydium - SOL", "https://raydium.io/",
    (ca) => `swap/?inputMint=sol&outputMint=${ca}`,
    (url) => {
      const queryParams = Url(url).searchParams
      const input = queryParams.get("inputMint")
      const output = queryParams.get("outputMint")
      return [USDC_CA, SOL_CA, "sol"].includes(input) ? output : input
    },
  ),
  App("raydium_usdc", "Raydium - USDC", "https://raydium.io/",
    (ca) => `swap/?inputMint=${USDC_CA}&outputMint=${ca}`,
    undefined
  ),
  // Jupiter
  App("jupiter_sol", "Jupiter - SOL", "https://jup.ag/",
    (ca) => `swap/SOL-${ca}`,
    () => {
      const apeProBtnPath = ".//a[starts-with(@href,'https://ape.pro/solana')]"
      const apeProBtn1 = getElementByXPath(`(${apeProBtnPath})[1]`)
      const apeProBtn2 = getElementByXPath(`(${apeProBtnPath})[2]`)
      const ca1 = Url(apeProBtn1.getAttribute("href")).pathname.split("/").pop()
      const ca2 = Url(apeProBtn2.getAttribute("href")).pathname.split("/").pop()
      return [USDC_CA, SOL_CA].includes(ca1) ? ca2 : ca1
    },
  ),
  App("jupiter_usdc", "Jupiter - USDC", "https://jup.ag/",
    (ca) => `swap/USDC-${ca}`,
  ),
  // Solscan
  App("sol_scan", "Solscan", "https://solscan.io/token/",
    undefined,
    (url) => {
      return Url(url).pathname.split("/").pop()
    }
  ),
  // DEXTools
  App("dex_tools", "DEXTools", "https://www.dextools.io/app/en/solana/pair-explorer/",
    undefined,
    () => {
      const solScanBtn = getElementByXPath(".//a[starts-with(@href,'https://solscan.io/token')]")
      return Url(solScanBtn.getAttribute("href")).pathname.split("/").pop()
    },
  ),
  // Twitter
  App("twitter_ca", "Twitter - CA", "https://x.com/search?",
    (ca) => `q=${ca}`,
    (url) => {
      const queryParams = Url(url).searchParams
      return decodeURIComponent(queryParams.get("q"))
    },
  ),
  App("twitter_ticker", "Twitter - Ticker", "https://x.com/search?",
    async (ca) => `q=${encodeURIComponent("$")}${await getTickerFromCa(ca)}`,
  ),
  // Vector
  App("vector", "Vector", "https://vec.fun/token/SOLANA:",
    (ca) => `${ca}?ref=takmolts`,
  )
]

/**
 * 指定したIDに対応するAppを返す
 * @overload
 * @param {string} id
 * @returns {ReturnType<typeof App>}
 * @overload
 * @param {string[]} ids
 * @returns {ReturnType<typeof App>[]}
 * @overload
 * @returns {ReturnType<typeof App>[]}
 */
export const getAppFromId = (id) => {
  if (id == null) return apps
  if (typeof id === "string") return apps.filter((app) => app.id === id)[0]
  // Appの並びを渡されたid順に直す
  const appsMap = Object.fromEntries(apps.map((app) => [app.id, app]))
  return id.map((id) => appsMap[id])
}

/**
 * 指定したURLとoriginが一致するAppを返す
 * @param {string} url
 * @returns {ReturnType<typeof App>}
 */
export const getAppFromUrl = (url) => {
  return apps.filter((app) => Url(app.url).origin === Url(url).origin)[0]
}

/** ID一覧 */
export const idList = () => apps.map((app) => app.id)

/** URL一覧 */
export const urlList = () => [...new Set(apps.map((app) => app.url))]

/**
 * @param {string} ca
 * @returns {Promise<string | undefined>}
 */
const getTickerFromCa = async (ca) => {
  try {
    const res = await fetch(`https://api-v3.raydium.io/mint/ids?mints=${ca}`)
    const body = await res.json()
    return body.data[0].symbol
  } catch {
    console.warn("[Dex Navigator] Failed to get ticker from Raydium api.")
    return
  }
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

const STORAGE_KEY_SETTINGS = "settings"

/**
 * chrome.storage.localのラッパー
 * @overload
 * @param {"get"} operation
 * @returns {Promise<string[]>}
 * @overload
 * @param {"set"} operation
 * @param {string[]} data
 * @returns {Promise<unknown>}
 * @overload
 * @param {"remove"} operation
 * @returns {Promise<unknown>}
 */
export const operateSettings = async (operation, data) => {
  switch (operation) {
    case "get": {
      const ret = await chrome.storage.local.get(STORAGE_KEY_SETTINGS)
      return ret[STORAGE_KEY_SETTINGS]
    }
    case "set":
      return chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: data })
    case "remove":
      return chrome.storage.local.remove(STORAGE_KEY_SETTINGS)
  }
}
