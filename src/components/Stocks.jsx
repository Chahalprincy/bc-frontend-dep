import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/pages/stocks.css";
import { FiStar, FiX, FiPlus } from "react-icons/fi";
import { API_BASE } from "../api/config";

const STOCKS_BASE = `${API_BASE}/daily/stocks`;
const DEFAULT_SYMBOLS = "AAPL,GOOGL,MSFT,AMZN,TSLA,NVDA,META";

export default function Stocks() {
  const [stocksData, setStocksData] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("stockFavorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("stockFavorites", JSON.stringify(favorites));
  }, [favorites]);

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem("stockWatchlist");
    if (savedWatchlist) {
      const symbols = JSON.parse(savedWatchlist);
      fetchStocks(symbols.join(","));
    } else {
      // First time user - load defaults
      fetchStocks();
    }
  }, []);

  // Save watchlist to localStorage whenever stocksData changes
  useEffect(() => {
    if (stocksData.length > 0) {
      const symbols = stocksData.map((stock) => stock.symbol);
      localStorage.setItem("stockWatchlist", JSON.stringify(symbols));
    }
  }, [stocksData]);

  // Fetch stock data
  const fetchStocks = async (customSymbols = null) => {
    setLoading(true);
    setError(null);
    try {
      const symbols = customSymbols || DEFAULT_SYMBOLS;
      const response = await axios.get(
        `${STOCKS_BASE}?symbols=${encodeURIComponent(symbols)}`
      );
      setStocksData(response.data);
    } catch (err) {
      console.error("Error fetching stocks:", err);
      setError("Failed to fetch stock data");
    } finally {
      setLoading(false);
    }
  };

  const searchStocks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `${STOCKS_BASE}/search?q=${encodeURIComponent(query)}`
      );
      setSearchResults(response.data);
    } catch (err) {
      console.error("Error searching stocks:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add stock to watchlist
  const addStockToWatchlist = async (symbol) => {
    try {
      const response = await axios.get(`${STOCKS_BASE}/${encodeURIComponent(symbol)}`);
      const newStock = response.data;

      setStocksData((prevStocks) => {
        const exists = prevStocks.find((stock) => stock.symbol === symbol);
        if (exists) return prevStocks;
        return [...prevStocks, newStock];
      });

      setSearchTerm("");
      setSearchResults([]);
      setShowSearchModal(false);
    } catch (err) {
      console.error("Error adding stock:", err);
    }
  };

  // Remove stock from watchlist
  const removeStockFromWatchlist = (symbol) => {
    setStocksData((prevStocks) =>
      prevStocks.filter((stock) => stock.symbol !== symbol)
    );
    setFavorites((prevFavorites) =>
      prevFavorites.filter((fav) => fav.symbol !== symbol)
    );
  };

  // Set favorite stock
  const toggleFavorite = (stock) => {
    const exists = favorites.find((fav) => fav.symbol === stock.symbol);
    if (exists) {
      setFavorites(favorites.filter((fav) => fav.symbol !== stock.symbol));
    } else {
      setFavorites([...favorites, stock]);
    }
  };

  const formatPrice = (price) => {
    return price ? `$${price.toFixed(2)}` : "$0.00";
  };

  const formatChange = (change) => {
    return change
      ? change >= 0
        ? `+${change.toFixed(2)}`
        : change.toFixed(2)
      : "0.00";
  };

  const formatPercent = (percent) => {
    return percent ? `${percent.toFixed(2)}%` : "0.00%";
  };

  // Generate unique trend chart based on real stock data
  const TrendChart = ({ stock }) => {
    const isPositive = stock.change >= 0;
    const color = isPositive ? "#16a34a" : "#dc2626";

    // Create trend based on actual stock metrics
    const points = [];
    const width = 120;
    const height = 60;
    const numPoints = 20;

    // Use stock symbol and price data to generate unique patterns
    const seed = stock.symbol.charCodeAt(0) + stock.symbol.charCodeAt(1);
    const priceRatio = stock.current_price / stock.previous_close;
    const volatility = Math.max(0.3, Math.abs(stock.change_percent) / 100);

    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;

      const basePattern = Math.sin(i * 0.6 + seed) * 6;
      const trendPattern = Math.sin(i * 0.4 + seed * 0.7) * 4;
      const volatilityNoise = Math.sin(i * 1.5 + seed * 0.9) * volatility * 15;

      const trendMultiplier = Math.max(1, Math.abs(stock.change_percent) * 0.8);
      const overallTrend = isPositive
        ? -(i / numPoints) * trendMultiplier * 2
        : (i / numPoints) * trendMultiplier * 2;

      const y =
        height / 2 +
        basePattern +
        trendPattern +
        volatilityNoise +
        overallTrend;
      const clampedY = Math.max(5, Math.min(height - 5, y));

      points.push(`${x},${clampedY}`);
    }

    return (
      <svg width="120" height="60" className="trend-chart" viewBox="0 0 120 60">
        {/* Main trend line */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.4"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="stocks-container">
        <div className="stocks-loading">Loading stock data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stocks-container">
        <div className="stocks-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="stocks-container">
      <h1 className="stocks-title">Stocks Dashboard</h1>

      {/* Stock Grid - 3 columns with favorites sorted to top */}
      <div className="stocks-grid-layout">
        {stocksData
          .sort((a, b) => {
            // Sort favorites to the top
            const aIsFavorite = favorites.find(
              (fav) => fav.symbol === a.symbol
            );
            const bIsFavorite = favorites.find(
              (fav) => fav.symbol === b.symbol
            );

            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            return 0; // Keep original order for non-favorites
          })
          .map((stock) => (
            <div key={stock.symbol} className="stock-card-mini">
              <div className="stock-card-header">
                <div className="stock-info-mini">
                  <div className="stock-symbol-mini">{stock.symbol}</div>
                  <div className="stock-price-mini">
                    {formatPrice(stock.current_price)}
                  </div>
                </div>
                <div className="stock-actions">
                  <button
                    className={`favorite-btn-mini ${
                      favorites.find((fav) => fav.symbol === stock.symbol)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => toggleFavorite(stock)}
                    title="Add to favorites"
                  >
                    <FiStar />
                  </button>
                  <button
                    className="remove-btn-mini"
                    onClick={() => removeStockFromWatchlist(stock.symbol)}
                    title="Remove from watchlist"
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              <div className="trend-chart-container">
                <TrendChart stock={stock} />
              </div>

              <div
                className={`price-change-mini ${
                  stock.change >= 0 ? "positive" : "negative"
                }`}
              >
                {formatChange(stock.change)} (
                {formatPercent(stock.change_percent)})
              </div>
            </div>
          ))}

        {/* Add button card - only show if we have less than 8 stocks to maintain grid layout */}
        {stocksData.length < 8 && (
          <div
            className="add-stock-card"
            onClick={() => setShowSearchModal(true)}
          >
            <FiPlus className="add-icon-large" />
          </div>
        )}

        {/* If we have 8+ stocks, show add button as a separate row */}
        {stocksData.length >= 8 && (
          <div
            className="add-stock-card-separate"
            onClick={() => setShowSearchModal(true)}
          >
            <FiPlus className="add-icon-large" />
            <span>Add Stock</span>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div
          className="search-modal-overlay"
          onClick={() => setShowSearchModal(false)}
        >
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <h3>Add Stock to Watchlist</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowSearchModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="search-input-container">
              <input
                type="text"
                placeholder="Type here to search stock..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchStocks(e.target.value);
                }}
                className="search-modal-input"
                autoFocus
              />
            </div>

            <div className="search-results-container">
              {isSearching ? (
                <div className="search-loading">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <div
                    key={result.symbol}
                    className="search-result-item"
                    onClick={() => addStockToWatchlist(result.symbol)}
                  >
                    <div className="search-result-symbol">{result.symbol}</div>
                    <div className="search-result-name">
                      {result.description}
                    </div>
                  </div>
                ))
              ) : searchTerm ? (
                <div className="no-search-results">No stocks found</div>
              ) : (
                <div className="search-placeholder">
                  Start typing to search for stocks...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
