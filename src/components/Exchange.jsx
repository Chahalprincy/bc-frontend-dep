import { useEffect, useState } from "react";
import "../styles/pages/exchange.css";

const BASE_RATES_URL = "http://localhost:3000/daily/exchange";
const CODES_URL = "http://localhost:3000/daily/exchange/currency-codes";

export default function Exchange() {
  const [rates, setRates] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [amount, setAmount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [filter, setFilter] = useState(
    () => localStorage.getItem("currencyFilter") || ""
  );

  // Favourites state
  const [favourites, setFavourites] = useState(() => {
    const saved = localStorage.getItem("favourites");
    return saved ? JSON.parse(saved) : [];
  });

  // Save filter & favourites
  useEffect(() => {
    localStorage.setItem("currencyFilter", filter);
  }, [filter]);

  useEffect(() => {
    localStorage.setItem("favourites", JSON.stringify(favourites));
  }, [favourites]);

  // Fetch rates and currency codes
  useEffect(() => {
    async function fetchData() {
      try {
        const [ratesRes, codesRes] = await Promise.all([
          fetch(BASE_RATES_URL),
          fetch(CODES_URL),
        ]);

        if (!ratesRes.ok) throw new Error("Failed to fetch exchange rates");
        if (!codesRes.ok) throw new Error("Failed to fetch currency codes");

        const ratesData = await ratesRes.json();
        const codesData = await codesRes.json();

        setRates(ratesData);

        // Map codes to include names
        const options = Array.from(
          new Set(
            ratesData
              .map((r) => r.base_currency)
              .concat(ratesData.map((r) => r.currency_code))
          )
        ).map((code) => {
          const found = codesData.find((c) => c.currency_code === code);
          return { code, name: found ? found.currency_name : code };
        });

        setCurrencyOptions(options);

        // Default selections
        setFromCurrency(ratesData[0]?.base_currency || "USD");
        setToCurrency(ratesData[0]?.currency_code || "EUR");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <p className="exchange-loading">Loading rates...</p>;
  if (error) return <p className="exchange-error">{error}</p>;

  // Convert function
  const convert = (amount, from, to) => {
    if (!rates.length) return 0;
    const fromRate = rates.find(
      (r) => r.currency_code === from || r.base_currency === from
    );
    const toRate = rates.find(
      (r) => r.currency_code === to || r.base_currency === to
    );
    if (!fromRate || !toRate) return 0;

    const baseAmount =
      from === fromRate.base_currency
        ? amount
        : amount / fromRate.exchange_rate;
    const converted =
      to === toRate.base_currency
        ? baseAmount
        : baseAmount * toRate.exchange_rate;
    return converted.toFixed(2);
  };

  // Favourites
  const addFavourite = (code) => {
    if (!favourites.includes(code)) setFavourites([...favourites, code]);
  };
  const removeFavourite = (code) => {
    setFavourites(favourites.filter((c) => c !== code));
  };

  // Helper to get currency name
  const getCurrencyName = (code) => {
    const found = currencyOptions.find((c) => c.code === code);
    return found ? found.name : code;
  };

  return (
    <div className="exchange-container">
      {/* Converter */}
      <div className="converter">
        <h1 style={{ marginTop: "20px" }}>Currency Converter</h1>
        <div className="converter-row">
          <input
            className="converter-input"
            type="number"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
          >
            {currencyOptions.map(({ code, name }) => (
              <option key={code} value={code}>
                {code} - {name}
              </option>
            ))}
          </select>
        </div>
        <div className="equals">=</div>
        <div className="converter-row">
          <input
            className="converter-input"
            type="number"
            value={amount ? convert(amount, fromCurrency, toCurrency) : ""}
            readOnly
          />
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
          >
            {currencyOptions.map(({ code, name }) => (
              <option key={code} value={code}>
                {code} - {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Favourites Table */}
      {favourites.length > 0 && (
        <>
          <h2 className="exchange-title">⭐ Favorite Currencies</h2>
          <table className="exchange-table">
            <thead>
              <tr>
                <th>Currency</th>
                <th>Name</th>
                <th>Rate</th>
                <th>Base</th>
                <th>Last Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rates
                .filter((r) => favourites.includes(r.currency_code))
                .map((rate) => (
                  <tr key={rate.currency_code}>
                    <td>{rate.currency_code}</td>
                    <td>{getCurrencyName(rate.currency_code)}</td>
                    <td>{rate.exchange_rate}</td>
                    <td>{rate.base_currency}</td>
                    <td>{new Date(rate.last_updated).toLocaleString()}</td>
                    <td>
                      <button
                        onClick={() => removeFavourite(rate.currency_code)}
                      >
                        ❌ Remove
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}

      {/* Main Table */}
      <h2 className="exchange-title">Exchange Rates Table</h2>
      <input
        type="text"
        placeholder="Filter by code or name..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="filter-input"
      />

      <div className="exchange-table-wrapper">
        <table className="exchange-table">
          <thead>
            <tr>
              <th>Currency</th>
              <th>Name</th>
              <th>Rate</th>
              <th>Base</th>
              <th>Last Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rates
              .filter((r) => {
                const name = getCurrencyName(r.currency_code);
                const query = filter.toLowerCase();
                return (
                  r.currency_code.toLowerCase().includes(query) ||
                  name.toLowerCase().includes(query) ||
                  r.base_currency.toLowerCase().includes(query)
                );
              })
              .map((rate) => (
                <tr key={rate.currency_code}>
                  <td>{rate.currency_code}</td>
                  <td>{getCurrencyName(rate.currency_code)}</td>
                  <td>{rate.exchange_rate}</td>
                  <td>{rate.base_currency}</td>
                  <td>{new Date(rate.last_updated).toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => {
                        addFavourite(rate.currency_code);
                        setFilter(""); // clear filter when favoriting
                      }}
                    >
                      ⭐ Favorite
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
