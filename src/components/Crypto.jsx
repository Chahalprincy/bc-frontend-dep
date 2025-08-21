// import axios from "axios";
// import { useState, useEffect } from "react";
// import "../styles/pages/crypto.css";
// import { FiArrowUpRight, FiArrowDown } from "react-icons/fi";

// function Crypto() {
//   const [data, setData] = useState([]);
//   const [favorites, setFavorites] = useState([]);
//   const [filter, setFilter] = useState("");

//   const URL = "http://localhost:3000/daily/crypto";

//   // Fetch crypto data
//   useEffect(() => {
//     axios
//       .get(URL)
//       .then((response) => setData(response.data))
//       .catch((err) => console.log(err));
//   }, []);

//   // Load favorites from localStorage on mount
//   useEffect(() => {
//     const savedFavorites = localStorage.getItem("favorites");
//     if (savedFavorites) {
//       setFavorites(JSON.parse(savedFavorites));
//     }
//   }, []);

//   // Save favorites to localStorage whenever they change
//   useEffect(() => {
//     localStorage.setItem("favorites", JSON.stringify(favorites));
//   }, [favorites]);

//   // Toggle favorite
//   const toggleFavorite = (crypto) => {
//     const exists = favorites.find((fav) => fav.id === crypto.id);
//     if (exists) {
//       setFavorites(favorites.filter((fav) => fav.id !== crypto.id));
//     } else {
//       setFavorites([...favorites, crypto]);
//     }
//   };

//   const filteredData = data.filter((crypto) =>
//     crypto.name.toLowerCase().includes(filter.toLowerCase())
//   );

//   return (
//     <div className="crypto">
//       {/* Favorites Table */}
//       <div className="favorites">
//         <h3>⭐ Favorite Cryptos</h3>
//         {favorites.length === 0 ? (
//           <p>No favorites yet. Click "☆ Favorite" on a crypto card.</p>
//         ) : (
//           <table>
//             <thead>
//               <tr>
//                 <th>Crypto</th>
//                 <th>Price</th>
//                 <th>24h Change</th>
//                 <th>Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {favorites.map((fav) => (
//                 <tr key={fav.id}>
//                   <td>
//                     <img
//                       src={fav.image}
//                       alt={fav.name}
//                       width="20"
//                       style={{ marginRight: "6px" }}
//                     />
//                     {fav.name}
//                   </td>
//                   <td>${fav.current_price.toLocaleString()}</td>
//                   <td
//                     className={
//                       fav.price_change_percentage_24h < 0 ? "red" : "green"
//                     }
//                   >
//                     {fav.price_change_percentage_24h.toFixed(2)}%
//                   </td>
//                   <td>
//                     <button
//                       className="remove-btn"
//                       onClick={() => toggleFavorite(fav)}
//                     >
//                       Remove
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Filter Input */}
//       <div className="filter">
//         <input
//           type="text"
//           placeholder="Filter by crypto name..."
//           value={filter}
//           onChange={(e) => setFilter(e.target.value)}
//         />
//       </div>

//       {/* Crypto Cards */}
//       <div className="right">
//         {filteredData.map((crypto) => (
//           <div className="card" key={crypto.id}>
//             <div className="top">
//               <img src={crypto.image} alt={crypto.name} />
//             </div>
//             <div className="card-body">
//               <h5>{crypto.name}</h5>
//               <p>${crypto.current_price.toLocaleString()}</p>
//             </div>

//             {/* Price change with arrow */}
//             <div
//               className={`change ${
//                 crypto.price_change_percentage_24h < 0 ? "red" : "green"
//               }`}
//             >
//               {crypto.price_change_percentage_24h < 0 ? (
//                 <FiArrowDown className="arrow" />
//               ) : (
//                 <FiArrowUpRight className="arrow" />
//               )}
//               <span>{crypto.price_change_percentage_24h.toFixed(2)}%</span>
//             </div>

//             {/* Favorite button */}
//             <button
//               className="fav-btn"
//               onClick={() => {
//                 toggleFavorite(crypto);
//                 setFilter(""); // clear filter when favoriting
//               }}
//             >
//               {favorites.find((fav) => fav.id === crypto.id)
//                 ? "★ Remove"
//                 : "☆ Favorite"}
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default Crypto;
import axios from "axios";
import { useState, useEffect } from "react";
import "../styles/pages/crypto.css";
import { FiArrowUpRight, FiArrowDown } from "react-icons/fi";
import { API_BASE } from "../api/config";

function Crypto() {
  const [data, setData] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true); // 👈 loading state

  const URL = `${API_BASE}/daily/crypto`;
  
  // Fetch crypto data
  useEffect(() => {
    axios
      .get(URL)
      .then((response) => setData(response.data))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false)); // 👈 set loading to false when done
  }, []);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Toggle favorite
  const toggleFavorite = (crypto) => {
    const exists = favorites.find((fav) => fav.id === crypto.id);
    if (exists) {
      setFavorites(favorites.filter((fav) => fav.id !== crypto.id));
    } else {
      setFavorites([...favorites, crypto]);
    }
  };

  const filteredData = data.filter((crypto) =>
    crypto.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="crypto">
      {/* Favorites Table */}
      <div className="favorites">
        <h3>⭐ Favorite Cryptos</h3>
        {favorites.length === 0 ? (
          <p>No favorites yet. Click "☆ Favorite" on a crypto card.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Crypto</th>
                <th>Price</th>
                <th>24h Change</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {favorites.map((fav) => (
                <tr key={fav.id}>
                  <td>
                    <img
                      src={fav.image}
                      alt={fav.name}
                      width="20"
                      style={{ marginRight: "6px" }}
                    />
                    {fav.name}
                  </td>
                  <td>${fav.current_price.toLocaleString()}</td>
                  <td
                    className={
                      fav.price_change_percentage_24h < 0 ? "red" : "green"
                    }
                  >
                    {fav.price_change_percentage_24h.toFixed(2)}%
                  </td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => toggleFavorite(fav)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Filter Input */}
      <div className="filter">
        <input
          type="text"
          placeholder="Filter by crypto name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Crypto Cards */}
      <div className="right">
        {loading ? (
          <p className="crypto-loading">Loading crypto data...</p>
        ) : (
          filteredData.map((crypto) => (
            <div className="card" key={crypto.id}>
              <div className="top">
                <img src={crypto.image} alt={crypto.name} />
              </div>
              <div className="card-body">
                <h5>{crypto.name}</h5>
                <p>${crypto.current_price.toLocaleString()}</p>
              </div>

              {/* Price change with arrow */}
              <div
                className={`change ${
                  crypto.price_change_percentage_24h < 0 ? "red" : "green"
                }`}
              >
                {crypto.price_change_percentage_24h < 0 ? (
                  <FiArrowDown className="arrow" />
                ) : (
                  <FiArrowUpRight className="arrow" />
                )}
                <span>{crypto.price_change_percentage_24h.toFixed(2)}%</span>
              </div>

              {/* Favorite button */}
              <button
                className="fav-btn"
                onClick={() => {
                  toggleFavorite(crypto);
                  setFilter(""); // clear filter when favoriting
                }}
              >
                {favorites.find((fav) => fav.id === crypto.id)
                  ? "★ Remove"
                  : "☆ Favorite"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Crypto;
