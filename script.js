
const config = {
    API_KEY: "UGWR8WX84CEF40LI",
    API_BASE_URL: "https://www.alphavantage.co/query",
    TRENDING_STOCKS: [
      "AAPL",
      "MSFT",
      "GOOGL",
      "AMZN",
      "META",
      "TSLA",
      "NVDA",
      "JPM",
      "BAC",
      "WMT",
    ],
  };
  
  // fetch the data from Alpha vantage API
  function fetchStockData(symbol) {
    return fetch(
      `${config.API_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${config.API_KEY}`
    )
      .then((response) => {
        if (!response.ok) throw new Error("API request failed");
        return response.json();
      })
      .catch((error) => {
        console.error("Error fetching stock data:", error);
        throw error;
      });
  }
  
  function fetchHistoricalData(symbol) {
    return fetch(
      `${config.API_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${config.API_KEY}`
    )
      .then((response) => {
        if (!response.ok) throw new Error("API request failed");
        return response.json();
      })
      .catch((error) => {
        console.error("Error fetching historical data:", error);
        throw error;
      });
  }
  
  // chartjs Intergration
  let priceChart = null;
  
  function createChart(data) {
    const ctx = document.getElementById("priceChart").getContext("2d");
  
    if (priceChart) {
      priceChart.destroy();
    }
  
    priceChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Stock Price",
            data: data.prices,
            borderColor: "#2563eb",
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    });
  }
  
  // update ON UI
  function updateStockInfo(data) {
    const stockInfo = document.getElementById("stockInfo");
    stockInfo.innerHTML = `
          <h3>${data.symbol}</h3>
          <p>Current Price: $${parseFloat(data.price).toFixed(2)}</p>
          <p class="${data.change >= 0 ? "positive" : "negative"}">
              Change: ${data.change >= 0 ? "+" : ""}${data.change}%
          </p>
      `;
  }
  
  function updateMarketStats(data) {
    const marketStats = document.getElementById("marketStats");
    marketStats.innerHTML = `
          <p>Volume: ${parseInt(data.volume).toLocaleString()}</p>
          <p>High: $${parseFloat(data.high).toFixed(2)}</p>
          <p>Low: $${parseFloat(data.low).toFixed(2)}</p>
      `;
  }
  
  function updateComparisonTable(data) {
    const row = `
          <tr id="stock-${data.symbol}">
              <td>${data.symbol}</td>
              <td>$${parseFloat(data.price).toFixed(2)}</td>
              <td class="${data.change >= 0 ? "positive" : "negative"}">
                  ${data.change >= 0 ? "+" : ""}${data.change}%
              </td>
              <td>${parseInt(data.volume).toLocaleString()}</td>
              <td>
                  <button onclick="removeStock('${data.symbol}')"
                          aria-label="Remove ${data.symbol}">
                      Remove
                  </button>
              </td>
          </tr>
      `;
    document.getElementById("comparisonTable").innerHTML += row;
  }
  
  function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    document.querySelector(".search-container").appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  }
  
  // Main Logic
  const trackedStocks = new Set();
  
  function initializeTrendingStocks() {
    const select = document.getElementById("trendingStocks");
    config.TRENDING_STOCKS.forEach((stock) => {
      const option = document.createElement("option");
      option.value = stock;
      option.textContent = stock;
      select.appendChild(option);
    });
  }
  
  function setupEventListeners() {
    document.getElementById("trendingStocks").addEventListener("change", (e) => {
      if (e.target.value) {
        document.getElementById("stockSymbol").value = e.target.value;
        searchStock();
      }
    });
  
    document.getElementById("stockSymbol").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchStock();
      }
    });
  }
  
  function processStockData(quoteData, historicalData) {
    return {
      symbol: quoteData["Global Quote"]["01. symbol"],
      price: quoteData["Global Quote"]["05. price"],
      change: quoteData["Global Quote"]["10. change percent"],
      volume: quoteData["Global Quote"]["06. volume"],
      high: quoteData["Global Quote"]["03. high"],
      low: quoteData["Global Quote"]["04. low"],
      chartData: {
        labels: Object.keys(historicalData["Time Series (Daily)"]).slice(0, 30),
        prices: Object.values(historicalData["Time Series (Daily)"])
          .slice(0, 30)
          .map((day) => day["4. close"]),
      },
    };
  }
  
  async function searchStock() {
    const symbol = document.getElementById("stockSymbol").value.toUpperCase();
    if (!symbol) {
      showError("Please enter a stock symbol");
      return;
    }
  
    try {
      document.body.classList.add("loading");
  
      const [quoteData, historicalData] = await Promise.all([
        fetchStockData(symbol),
        fetchHistoricalData(symbol),
      ]);
  
      const processedData = processStockData(quoteData, historicalData);
  
      updateStockInfo(processedData);
      updateMarketStats(processedData);
  
      if (!trackedStocks.has(symbol)) {
        trackedStocks.add(symbol);
        updateComparisonTable(processedData);
      }
  
      createChart(processedData.chartData);
    } catch (error) {
      showError("Error fetching stock data. Please try again.");
    } finally {
      document.body.classList.remove("loading");
    }
  }
  
  function removeStock(symbol) {
    trackedStocks.delete(symbol);
    const row = document.getElementById(`stock-${symbol}`);
    if (row) row.remove();
  }
  
  // Initialize the application
  function init() {
    initializeTrendingStocks();
    setupEventListeners();
  }
  
  document.addEventListener("DOMContentLoaded", init);
  