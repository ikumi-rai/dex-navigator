import { urlList } from "./core.js"

/**
 * window.TradingViewから現在表示されている範囲の最高値を取得しクリップボードに格納する
 */
export const setTradingViewCommand = () => {
  chrome.commands.onCommand.addListener((command) => {
    if (command !== "trading_view_high_price") return
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs.length) return
      if (!urlList().some((url) => tabs[0].url.startsWith(url))) return

      // windowを見るために関数をページのコンテキストで実行する必要があるが、その場合chrome.runtimeにはアクセスできないため全てこのスコープに書く
      const results = await chrome.scripting.executeScript({
        world: "MAIN",
        target: { tabId: tabs[0].id },
        func: () => {
          /**
           * 渡したオブジェクトの全プロパティを走査して指定した末尾で終わる最初のプロパティの値を返す
           * @param {object} from
           * @param {string} suffix
           */
          const findWithVariablesSuffix = (from, suffix) => {
            const seen = new WeakSet() // 循環参照があった場合に処理をスキップする用

            const search = (obj, path = []) => {
              if (obj === null || typeof obj !== "object" || seen.has(obj)) return
              seen.add(obj)

              for (const [key, value] of Object.entries(obj)) {
                const newPath = path.concat(isNaN(key) ? key : Number(key))
                if (newPath.join(".").endsWith(suffix)) throw value

                if (Array.isArray(value)) {
                  value.forEach((item, index) => {
                    search(item, newPath.concat(index))
                  })
                } else if (typeof value === "object" && value !== null) {
                  search(value, newPath)
                }
              }
            }

            // 再帰から抜けるためにthrowを使う(重い処理なのでスピード優先)
            try {
              search(from)
            } catch (value) {
              return value
            }
            return undefined
          }

          const tvFrames = Array.from(window.frames).filter((frame) => frame.TradingView)
          const tv = tvFrames.length ? tvFrames[0].TradingView : undefined
          const ps = findWithVariablesSuffix(tv?.ChartapiMessagerInstances, "._priceScale")
          const highPrice = ps?.m_priceRange?._maxValue
          alert(`Highest Price: ${highPrice}`)
          return highPrice
        },
      })

      const price = results?.[0]?.result
      if (!price) return

      // クリップボードを扱う関数はコンテントスクリプトのコンテキストで実行する必要がある
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (price) => navigator.clipboard.writeText(price),
        args: [price],
      })
    })
  })
}

// /**
//  * デバッグ時に便利なので残しておく。`hoge.0.fuga`のようなパスを`hoge[0].fuga`に変換する
//  * @param {string[]} path
//  * @returns {string}
//  */
// const format = (path) => {
//   return path.reduce((acc, key) => acc + (typeof key === "number" ? `[${key}]` : `.${key}`), "")
// }
