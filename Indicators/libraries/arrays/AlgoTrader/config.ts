export const config = {
  newsParser: {
    sources: [
      {
        name: "CryptoNews",
        rssUrl: "https://cryptonews.com/rss",
        weight: 0.8
      }
    ]
  },
  riskManager: {
    maxLeverage: {
      conservative: 2,
      moderate: 5,
      aggressive: 10
    },
    marginRiskPercentage: {
      conservative: 2,
      moderate: 5,
      aggressive: 10
    },
    stopLossPercentage: {
      conservative: 1,
      moderate: 2.5,
      aggressive: 5
    },
    signalConfidenceThreshold: 0.7,
    defaultThreshold: "conservative"
  },
  platform: {
    apiUrl: "https://api.example.com",
    apiKey: "YOUR_API_KEY",
    placeOrder: "v1/orders"
  },
  priorityManager: {
    ocrThreshold: 0.7,
    predictionThreshold: 0.8,
    signalWeightThreshold: 5
  },
  tournament: {
    rebalancePeriod: 3600000,
    maxWeightDelta: 0.05,
    initialWeight: 0.2,
    minWeight: 0.05,
    adjustmentFactor: 0.8,
    enableRebalancing: true,
    simulationMode: true,
    performanceDecayFactor: 0.9
  },
  paths: {
    "utils/*": ["utils/*"]
  }
};