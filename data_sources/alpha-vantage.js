const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const ResearchRepository = require('../utils/research-repository');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', 'config', '.env') });

class AlphaVantageCollector {
  constructor(config = {}) {
    this.repository = config.repository || new ResearchRepository();
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('Alpha Vantage API key not found in environment variables');
    }
    
    this.baseUrl = 'https://www.alphavantage.co/query';
  }
  
  /**
   * Get daily time series data for a stock
   * @param {string} symbol - Stock ticker symbol
   * @param {boolean} full - Whether to get full history (true) or compact (false)
   */
  async getDailyTimeSeries(symbol, full = false) {
    try {
      console.log(`Fetching daily time series for ${symbol}...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol,
          outputsize: full ? 'full' : 'compact',
          apikey: this.apiKey
        }
      });
      
      // Check for error response
      if (response.data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${response.data['Error Message']}`);
      }
      
      // Process the data
      const timeSeriesData = response.data['Time Series (Daily)'];
      
      if (!timeSeriesData) {
        throw new Error('No time series data found in the response');
      }
      
      // Convert to array format for easier processing
      const processedData = Object.entries(timeSeriesData).map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'], 10)
      }));
      
      // Sort by date (newest first)
      processedData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Save to repository
      const filePath = this.repository.storeMarketData(
        symbol,
        'equities',
        processedData,
        {
          source: 'alpha_vantage',
          endpoint: 'daily',
          full: full,
          fetched_at: new Date().toISOString()
        }
      );
      
      console.log(`Saved ${processedData.length} data points for ${symbol} to ${filePath}`);
      
      return {
        symbol,
        data: processedData,
        path: filePath
      };
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get intraday time series data
   * @param {string} symbol - Stock ticker symbol
   * @param {string} interval - Time interval (1min, 5min, 15min, 30min, 60min)
   */
  async getIntradayTimeSeries(symbol, interval = '5min') {
    try {
      console.log(`Fetching ${interval} intraday data for ${symbol}...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_INTRADAY',
          symbol,
          interval,
          outputsize: 'full',
          apikey: this.apiKey
        }
      });
      
      // Check for error response
      if (response.data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${response.data['Error Message']}`);
      }
      
      // Process the data
      const timeSeriesKey = `Time Series (${interval})`;
      const timeSeriesData = response.data[timeSeriesKey];
      
      if (!timeSeriesData) {
        throw new Error('No time series data found in the response');
      }
      
      // Convert to array format
      const processedData = Object.entries(timeSeriesData).map(([datetime, values]) => ({
        datetime,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'], 10)
      }));
      
      // Sort by datetime (newest first)
      processedData.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
      
      // Save to repository
      const filePath = this.repository.storeMarketData(
        symbol,
        'equities',
        processedData,
        {
          source: 'alpha_vantage',
          endpoint: 'intraday',
          interval,
          fetched_at: new Date().toISOString()
        }
      );
      
      console.log(`Saved ${processedData.length} intraday data points for ${symbol} to ${filePath}`);
      
      return {
        symbol,
        data: processedData,
        path: filePath
      };
    } catch (error) {
      console.error(`Error fetching intraday data for ${symbol}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get company overview data
   * @param {string} symbol - Stock ticker symbol
   */
  async getCompanyOverview(symbol) {
    try {
      console.log(`Fetching company overview for ${symbol}...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'OVERVIEW',
          symbol,
          apikey: this.apiKey
        }
      });
      
      // Check for error or empty response
      if (response.data['Error Message'] || Object.keys(response.data).length === 0) {
        throw new Error(`Alpha Vantage API error or no data found for ${symbol}`);
      }
      
      // Save to repository
      const filePath = this.repository.storeFundamental(
        symbol,
        'company_overview',
        response.data,
        {
          source: 'alpha_vantage',
          fetched_at: new Date().toISOString()
        }
      );
      
      console.log(`Saved company overview for ${symbol} to ${filePath}`);
      
      return {
        symbol,
        data: response.data,
        path: filePath
      };
    } catch (error) {
      console.error(`Error fetching company overview for ${symbol}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get income statement data
   * @param {string} symbol - Stock ticker symbol
   */
  async getIncomeStatement(symbol) {
    try {
      console.log(`Fetching income statement for ${symbol}...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'INCOME_STATEMENT',
          symbol,
          apikey: this.apiKey
        }
      });
      
      // Check for error response
      if (response.data['Error Message'] || !response.data.annualReports) {
        throw new Error(`Alpha Vantage API error or no income statement found for ${symbol}`);
      }
      
      // Save to repository
      const filePath = this.repository.storeFundamental(
        symbol,
        'income_statement',
        response.data,
        {
          source: 'alpha_vantage',
          fetched_at: new Date().toISOString()
        }
      );
      
      console.log(`Saved income statement for ${symbol} to ${filePath}`);
      
      return {
        symbol,
        annual: response.data.annualReports,
        quarterly: response.data.quarterlyReports,
        path: filePath
      };
    } catch (error) {
      console.error(`Error fetching income statement for ${symbol}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get balance sheet data
   * @param {string} symbol - Stock ticker symbol
   */
  async getBalanceSheet(symbol) {
    try {
      console.log(`Fetching balance sheet for ${symbol}...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'BALANCE_SHEET',
          symbol,
          apikey: this.apiKey
        }
      });
      
      // Check for error response
      if (response.data['Error Message'] || !response.data.annualReports) {
        throw new Error(`Alpha Vantage API error or no balance sheet found for ${symbol}`);
      }
      
      // Save to repository
      const filePath = this.repository.storeFundamental(
        symbol,
        'balance_sheet',
        response.data,
        {
          source: 'alpha_vantage',
          fetched_at: new Date().toISOString()
        }
      );
      
      console.log(`Saved balance sheet for ${symbol} to ${filePath}`);
      
      return {
        symbol,
        annual: response.data.annualReports,
        quarterly: response.data.quarterlyReports,
        path: filePath
      };
    } catch (error) {
      console.error(`Error fetching balance sheet for ${symbol}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get cash flow data
   * @param {string} symbol - Stock ticker symbol
   */
  async getCashFlow(symbol) {
    try {
      console.log(`Fetching cash flow for ${symbol}...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'CASH_FLOW',
          symbol,
          apikey: this.apiKey
        }
      });
      
      // Check for error response
      if (response.data['Error Message'] || !response.data.annualReports) {
        throw new Error(`Alpha Vantage API error or no cash flow data found for ${symbol}`);
      }
      
      // Save to repository
      const filePath = this.repository.storeFundamental(
        symbol,
        'cash_flow',
        response.data,
        {
          source: 'alpha_vantage',
          fetched_at: new Date().toISOString()
        }
      );
      
      console.log(`Saved cash flow for ${symbol} to ${filePath}`);
      
      return {
        symbol,
        annual: response.data.annualReports,
        quarterly: response.data.quarterlyReports,
        path: filePath
      };
    } catch (error) {
      console.error(`Error fetching cash flow for ${symbol}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get technical indicator data
   * @param {string} symbol - Stock ticker symbol
   * @param {string} indicator - Indicator function name
   * @param {string} interval - Time interval
   * @param {number} timePeriod - Time period
   */
  async getTechnicalIndicator(symbol, indicator, interval = 'daily', timePeriod = 14) {
    try {
      console.log(`Fetching ${indicator} for ${symbol}...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: indicator,
          symbol,
          interval,
          time_period: timePeriod,
          series_type: 'close',
          apikey: this.apiKey
        }
      });
      
      // Check for error response
      if (response.data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${response.data['Error Message']}`);
      }
      
      // Get the technical indicator data
      const indicatorKey = `Technical Analysis: ${indicator}`;
      const indicatorData = response.data[indicatorKey];
      
      if (!indicatorData) {
        throw new Error(`No ${indicator} data found in the response`);
      }
      
      // Convert to array format
      const processedData = Object.entries(indicatorData).map(([date, values]) => ({
        date,
        ...Object.entries(values).reduce((acc, [key, value]) => {
          acc[key] = parseFloat(value);
          return acc;
        }, {})
      }));
      
      // Sort by date
      processedData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Save to repository
      const filePath = this.repository.storeTechnicalAnalysis(
        symbol,
        indicator.toLowerCase(),
        processedData,
        {
          source: 'alpha_vantage',
          indicator,
          interval,
          time_period: timePeriod,
          fetched_at: new Date().toISOString()
        }
      );
      
      console.log(`Saved ${indicator} data for ${symbol} to ${filePath}`);
      
      return {
        symbol,
        indicator,
        data: processedData,
        path: filePath
      };
    } catch (error) {
      console.error(`Error fetching ${indicator} for ${symbol}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Collect comprehensive data for a stock
   * @param {string} symbol - Stock ticker symbol
   */
  async collectComprehensiveData(symbol) {
    console.log(`Collecting comprehensive data for ${symbol}...`);
    
    const results = {
      market_data: null,
      fundamentals: {},
      technicals: {}
    };
    
    try {
      // Get daily time series data
      results.market_data = await this.getDailyTimeSeries(symbol, true);
      
      // Add delay to avoid hitting API rate limits (Alpha Vantage has 5 calls per minute for free tier)
      await new Promise(resolve => setTimeout(resolve, 13000));
      
      // Get fundamentals
      results.fundamentals.overview = await this.getCompanyOverview(symbol);
      await new Promise(resolve => setTimeout(resolve, 13000));
      
      results.fundamentals.income = await this.getIncomeStatement(symbol);
      await new Promise(resolve => setTimeout(resolve, 13000));
      
      results.fundamentals.balance = await this.getBalanceSheet(symbol);
      await new Promise(resolve => setTimeout(resolve, 13000));
      
      results.fundamentals.cash_flow = await this.getCashFlow(symbol);
      await new Promise(resolve => setTimeout(resolve, 13000));
      
      // Get technical indicators
      results.technicals.rsi = await this.getTechnicalIndicator(symbol, 'RSI', 'daily', 14);
      await new Promise(resolve => setTimeout(resolve, 13000));
      
      results.technicals.macd = await this.getTechnicalIndicator(symbol, 'MACD', 'daily');
      await new Promise(resolve => setTimeout(resolve, 13000));
      
      results.technicals.bbands = await this.getTechnicalIndicator(symbol, 'BBANDS', 'daily', 20);
      
      // Create a summary report
      this.repository.storeResearch(
        `${symbol} - Comprehensive Data Collection`,
        'reports',
        {
          symbol,
          timestamp: new Date().toISOString(),
          data_sources: {
            market_data: results.market_data?.path,
            fundamentals: Object.entries(results.fundamentals).reduce((acc, [key, value]) => {
              acc[key] = value?.path;
              return acc;
            }, {}),
            technicals: Object.entries(results.technicals).reduce((acc, [key, value]) => {
              acc[key] = value?.path;
              return acc;
            }, {})
          }
        },
        {
          source: 'alpha_vantage',
          data_collection: true,
          symbol
        }
      );
      
      // Generate a due diligence report
      const report = this.repository.generateDueDiligenceReport(symbol);
      console.log(`Generated due diligence report for ${symbol}: ${report.path}`);
      
      return {
        symbol,
        results,
        report: report.path
      };
    } catch (error) {
      console.error(`Error during comprehensive data collection for ${symbol}:`, error.message);
      throw error;
    }
  }
}

module.exports = AlphaVantageCollector;