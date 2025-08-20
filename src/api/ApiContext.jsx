import { createContext, useContext, useState } from "react";

import { useAuth } from "../auth/AuthContext";

export const API = (() => {
  let base = "http://localhost:3000";
  try {
    if (import.meta?.env?.VITE_API_URL) base = import.meta.env.VITE_API_URL;
  } catch { /* running in a non-Vite tool */ }
  return base.replace(/\/$/, "");
})();

const ApiContext = createContext();

export function ApiProvider({ children }) {
  const { token } = useAuth();

  /**
   * Makes an API call and parses the response as JSON if possible.
   * Throws an error if anything goes wrong.
   */
  const request = async (resource, options = {}) => {
    // Create headers object
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(API + resource, {
        ...options,
        headers,
      });

      const isJson = /json/.test(response.headers.get("Content-Type"));
      const result = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        throw new Error(result?.message || result || "Something went wrong :(");
      }

      return result;
    } catch (error) {
      console.error("Request failed:", error);
      throw error;
    }
  };

  const [tags, setTags] = useState({});

  const provideTag = (tag, query) => {
    setTags({ ...tags, [tag]: query });
  };

  const invalidateTags = (tagsToInvalidate) => {
    tagsToInvalidate.forEach((tag) => {
      const query = tags[tag];
      if (query) query();
    });
  };

  const value = { request, provideTag, invalidateTags };
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) throw Error("useApi must be used within ApiProvider");
  return context;
}
