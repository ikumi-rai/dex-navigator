document.addEventListener("DOMContentLoaded", async () => {
  const USDC_CA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

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

  const navigate = (event) => {
    const buttonId = event.target.id
    const ca = document.getElementById("clipboard-content").value
    let path = ""
    switch (buttonId) {
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
    const fromIdToUrl = Object.fromEntries(Object.values(apps).map((app) => [app.id, app.url]))
    open(fromIdToUrl[buttonId] + path)
  }

  const buttonArea = document.getElementById("button-area")
  Object.values(apps).forEach((app) => {
    const button = document.createElement("button")
    button.id = app.id
    button.textContent = app.name
    button.addEventListener("click", navigate)
    buttonArea.append(button)
  })

  window.addEventListener("focus", async () => {
    const cbTextBox = document.getElementById("clipboard-content")
    const cbContent = await navigator.clipboard.readText()
    cbTextBox.value = cbContent || "Clipboard content is not text."
  })
})
