import { useState, useEffect } from "react";
import useQuery from "../../api/useQuery";
import LocationSearch from "./LocationSearch";
import WeatherHUD from "./WeatherHud";
import SavedLocationsBar from "./SavedLocationsBar";
import useSavedLocations from "../../hooks/useSavedLocations";
import "../../styles/pages/weather/weather-page.css";
import "../../styles/pages/weather/weather-hud.css";
import "../../styles/pages/weather/saved-locations.css";
import { API_BASE } from "../../api/config";


const WMO = {
  0:"sun",1:"sun",2:"cloudSun",3:"cloud",
  45:"fog",48:"fog",
  51:"drizzle",53:"drizzle",55:"drizzle",
  56:"sleet",57:"sleet",
  61:"rain",63:"rain",65:"rain",
  66:"sleet",67:"sleet",
  71:"snow",73:"snow",75:"snow",77:"snow",
  80:"rain",81:"rain",82:"rain",
  85:"snow",86:"snow",
  95:"storm",96:"storm",99:"storm",
};
const codeToIcon = (c) => WMO[c] || "cloud";

const buildWeatherUrl = (params) => {
  const u = new URL("/daily/weather", API_BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.searchParams.set(k, v);
  });
  return u.toString();
};

function moodFromData(dataset) {
  const curIcon = codeToIcon(dataset?.current?.weather_code);

  const hourlyW = dataset?.hourly?.weather_code || [];
  const hourlyT = dataset?.hourly?.time || [];
  if (!hourlyW.length || !hourlyT.length) return curIcon;

  // find the index around "now"
  const now = new Date();
  let idx = hourlyT.findIndex(t => new Date(t) > now);
  if (idx === -1) idx = hourlyT.length - 1;
  idx = Math.max(0, idx - 1);

  // look ahead a few hours
  const windowIcons = hourlyW.slice(idx, idx + 4).map(codeToIcon);

  const has = (set) => windowIcons.some(x => set.includes(x));

  // Priority: snow/sleet > storm/rain/drizzle > fog > cloud/sun
  if (has(["snow","sleet"]))  return "snow";
  if (has(["storm","rain","drizzle"])) return "rain";
  if (has(["fog"]))           return "fog";

  // otherwise use current
  return curIcon;
}

export default function UserWeather() {
  // Keep your navbar height handling
  useEffect(() => {
    const nav = document.querySelector(".navbar");
    if (!nav) return;
    const set = () =>
      document.documentElement.style.setProperty("--nav-h", `${nav.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(nav);
    window.addEventListener("resize", set);
    return () => {
      window.removeEventListener("resize", set);
      ro.disconnect();
    };
  }, []);

  const [units] = useState("imperial");

  const { data: savedData, loading: loadingSaved, error: errorSaved } =
    useQuery(`/daily/weather?units=${units}`, "weather");

  const [place, setPlace] = useState(null);
  const [data, setData] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState("");

  const saved = useSavedLocations();

  const tFrom = (j) => j?.current?.temperature_2m ?? j?.current?.temperature;
  useEffect(() => {
    let stop = false;
    const FRESH_MS = 30 * 60 * 1000; // 30 min

    (async () => {
      for (const x of saved.items) {
        // skip if temp is fresh
        if (x.t && Date.now() - (x.tUpdatedAt || 0) < FRESH_MS) continue;

        try {
          const r = await fetch(
            buildWeatherUrl({ lat: x.lat, lon: x.lon, units }),
            { headers: { Accept: "application/json" } }
          );
          if (!r.ok) continue;
          const j = await r.json();
          const t = tFrom(j);
          if (!stop && Number.isFinite(t)) {
            saved.updateTemp(x.id, Math.round(t));
          }
        } catch {
          /* ignore individual failures */
        }
      }
    })();
    return () => { stop = true; };
    }, [saved.items.length]);
  const activeId = place ? saved.idOf(place) : null;

  async function handleSelect(p) {
    setPlace(p);
    setLoadingSearch(true);
    setErrorSearch("");
    setData(null);
    try {
      const res = await fetch(
        buildWeatherUrl({ lat: p.latitude, lon: p.longitude, units }),
        { headers: { Accept: "application/json" } }
      );
      
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);

      const id = saved.idOf(p);
      const tNow = tFrom(json);
      if (id && Number.isFinite(tNow)) {
        saved.updateTemp(id, Math.round(tNow));
      }
    } catch (e) {
      setErrorSearch(e.message || "Failed to load weather");
    } finally {
      setLoadingSearch(false);
    }
    
  }

  const activeData = place ? data : savedData;
  const title = place
    ? `Weather — ${place.name}${place.admin1 ? `, ${place.admin1}` : ""}, ${place.country}`
    : "Weather — My location";

  // Decide the page mood from current weather (fallback to "cloud")
  const cond = moodFromData(activeData);

  return (
    
      <div className={`wx wx--${cond || "cloud"} wx--force-anim`}>
        {/* Animated background layers (fixed, behind everything) */}
        <div className="wx-bg" aria-hidden>
          <div className="wx-bg__gradient" />
          <div className="wx-bg__clouds" />
          <div className="wx-bg__rain" />
          <div className="wx-bg__snow" />
          <div className="wx-bg__flash" />
          <div className="wx-bg__fog" />
        </div>
    

      {/* FIXED header */}
      <header className="wx__header">
        <h1 className="wx__title">Weather</h1>
        <div className="wx__actions">
          <LocationSearch onSelect={handleSelect} />

          {place && !saved.items.some(x => x.id === saved.idOf(place)) && (
          <button
            className="wx__save-btn"
            onClick={() => saved.add(place)}
          >
          Save
          </button>
          )}
        </div>
      </header>

      {/* <div className="wx__spacer" aria-hidden="true" /> */}

      <SavedLocationsBar
        items={saved.items}
        activeId={activeId}
        onAdd={() => place && saved.add(place)}
        onSelect={(loc) => handleSelect({ name: loc.name, admin1: loc.admin1, country: loc.country, latitude: loc.lat, longitude: loc.lon })}
        onRemove={saved.remove}
        onDefault={saved.makeDefault}
      />

      <main className="wx__content">
        {/* Loading / error states */}
        {!place && loadingSaved && <p className="wx__status">Loading...</p>}
        {!place && errorSaved && <p className="wx__error">{String(errorSaved)}</p>}
        {place && loadingSearch && <p className="wx__status">Loading...</p>}
        {place && errorSearch && <p className="wx__error">{errorSearch}</p>}

        {/* Hint */}
        {!activeData && !(loadingSaved || loadingSearch) && (
          <p className="wx__hint">Search a city to see the forecast.</p>
        )}

        {/* Widget (you can force a theme or let it auto) */}
        {activeData && (
          <WeatherHUD
            data={activeData}
            units={units}
            title={title}
          />
        )}

        {/* Reset */}
        {place && (
          <p className="wx__hint" style={{ textAlign: "center", marginTop: 12 }}>
            <button
              className="linklike"
              onClick={() => { setPlace(null); setData(null); }}
            >
              Reset to my saved location
            </button>
          </p>
        )}
      </main>
    </div>
  );
}