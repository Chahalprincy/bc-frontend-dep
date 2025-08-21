import { useState, useEffect } from "react";
import axios from "axios";
import NewsItems from "./NewsItems";
import { FaSearch } from "react-icons/fa";
import "../styles/pages/news.css";
import { API_BASE } from "../api/config";

export default function News() {
  const categories = [
    "Favorites",
    "Business",
    "Technology",
    "Sports",
    "Innovation",
    "Arts",
    "Travel",
    "Earth",
  ];

  const [search, setSearch] = useState("latest");
  const [inputValue, setInputValue] = useState("");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Store favorites whenever changed
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Fetch up to 50 articles
  const fetchArticles = async (searchTerm) => {
    setLoading(true); // trigger loading state first

    // let React render the loading state
    await new Promise((resolve) => setTimeout(resolve, 0));
  
    try {
      const res = await axios.get(`${API_BASE}/daily/news`, {
        params: { q: searchTerm, pageSize: 50 },
      });

      const { articles: newArticles } = res.data;
      setArticles(newArticles.slice(0, 50));
    } catch (error) {
      console.error("Fetch error:", error);
      setArticles([]);
    }

    setLoading(false);
  };

  // Fetch whenever search changes
  useEffect(() => {
    if (search.toLowerCase() === "favorites") {
      setArticles(favorites);
    } else {
      fetchArticles(search);
    }
  }, [search, favorites]);

  // Handle search or category click
  const searchNews = (term) => {
    const trimmed = term.trim();

    if (trimmed.toLowerCase() === "favorites") {
      setSearch("Favorites");
      setArticles(favorites);
      setInputValue("");
    } else {
      setSearch(trimmed === "" ? "latest" : trimmed);
      setInputValue(trimmed === "" ? "" : trimmed);
    }
  };

  // Toggle favorite status
  const toggleFavorite = (article) => {
    const exists = favorites.some((fav) => fav.url === article.url);
    const updated = exists
      ? favorites.filter((fav) => fav.url !== article.url)
      : [...favorites, article];

    setFavorites(updated);

    if (search === "Favorites") {
      setArticles(updated);
    }
  };

  return (
    <div className="news-container h-100vh w-full">
      {/* Navbar */}
      <nav className="search-navbar flex justify-between p-5 bg-black">
        <h4 className="navbar-title text-gray-300 text-4xl">News</h4>
        <div className="bg-white flex justify-center items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") searchNews(inputValue);
            }}
            placeholder="Search news..."
            className="search-input-label w-[300px] h-[30px] bg-white p-2 outline-none"
          />
          <FaSearch
            onClick={() => searchNews(inputValue)}
            className="text-md cursor-pointer"
          />
        </div>
      </nav>

      {/* Categories */}
      <div className="news-categories w-full">
        <div className="category-wrapper">
          {categories.map((cat) => (
            <div
              key={cat}
              className={`category mx-[20px] p-2 cursor-pointer rounded-md ${
                search.toLowerCase() === cat.toLowerCase()
                  ? "bg-gray-700 text-white"
                  : "bg-black text-gray-300"
              }`}
              onClick={() => searchNews(cat)}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="articles-wrapper w-[1200px] mx-auto">
        {loading ? (
          <div className="loading-state text-center text-gray-500 mt-10">
            <p>Loading News...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="empty-state text-center text-gray-500 mt-10">
            <p>No articles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5 mt-[40px]">
            <NewsItems
              articles={articles}
              toggleFavorite={toggleFavorite}
              favorites={favorites}
            />
          </div>
        )}
      </div>
    </div>
  );
}
