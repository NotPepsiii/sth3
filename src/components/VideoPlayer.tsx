import { useState, useEffect } from "react";
import { X, Play, Server, Monitor, ListVideo, Layers, AlertTriangle, ExternalLink } from "lucide-react";
import { MediaItem, WatchHistoryItem } from "../types";
import { smartFetch } from "../api";

interface VideoPlayerProps {
  item: MediaItem;
  onClose: () => void;
  onUpdateHistory: (history: WatchHistoryItem) => void;
}

interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
}

export default function VideoPlayer({ item, onClose, onUpdateHistory }: VideoPlayerProps) {
  // Configurable stream servers
  const [selectedServer, setSelectedServer] = useState<"embedmstr" | "vidsrc" | "embedsu">("embedmstr");
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState<boolean>(false);
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  
  const title = item.title || item.name || "Unknown title";
  const imdbId = item.external_ids?.imdb_id || "";
  const tmdbId = item.id;
  const isShow = item.first_air_date !== undefined;

  // Track episode changes to save watch history
  useEffect(() => {
    const historyItem: WatchHistoryItem = {
      mediaId: item.id,
      title: item.title || item.name || "Untitled",
      posterPath: item.poster_path,
      mediaType: isShow ? "tv" : "movie",
      timestamp: Date.now(),
      progressPercent: isShow ? Math.round((currentEpisode / (item.number_of_episodes || 10)) * 100) : 10,
      lastSeason: isShow ? currentSeason : undefined,
      lastEpisode: isShow ? currentEpisode : undefined,
    };
    onUpdateHistory(historyItem);
  }, [currentSeason, currentEpisode, item]);

  // Fetch episodes when season or show changes
  useEffect(() => {
    if (isShow) {
      fetchSeasonEpisodes(currentSeason);
    }
  }, [currentSeason, item]);

  const fetchSeasonEpisodes = async (seasonNum: number) => {
    setLoadingEpisodes(true);
    setEpisodeError(null);
    try {
      const response = await smartFetch(`/api/tv/${tmdbId}/season/${seasonNum}`);
      if (!response.ok) {
        throw new Error("Failed to load episodes.");
      }
      const data = await response.json();
      setEpisodes(data.episodes || []);
    } catch (err: any) {
      console.error("Error fetching season episodes:", err);
      setEpisodeError("Failed to load episodes. Please try switching servers or opening the show in a new tab.");
    } finally {
      setLoadingEpisodes(false);
    }
  };

  // Generate Stream URLs based on selection
  const getEmbedUrl = () => {
    const finalImdb = imdbId || "tt1375666"; // Fallback poster IMDb ID
    
    if (selectedServer === "embedmstr") {
      if (isShow) {
        return `https://embedmaster.link/tv/${tmdbId}/${currentSeason}/${currentEpisode}`;
      } else {
        return `https://embedmaster.link/movie/${tmdbId}`;
      }
    } else if (selectedServer === "vidsrc") {
      if (isShow) {
        return `https://vidsrc.me/embed/tv?imdb=${finalImdb}&season=${currentSeason}&episode=${currentEpisode}`;
      } else {
        return `https://vidsrc.me/embed/movie?imdb=${finalImdb}`;
      }
    } else {
      if (isShow) {
        return `https://embed.su/embed/tv/${tmdbId}/${currentSeason}/${currentEpisode}`;
      } else {
        return `https://embed.su/embed/movie/${tmdbId}`;
      }
    }
  };

  const currentEpisodeName = episodes.find(e => e.episode_number === currentEpisode)?.name;

  return (
    <div className="bg-[#0f0f0f] border-b border-neutral-800 py-8 px-4 md:px-12 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header Block with Control */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase text-[#e50914] tracking-wider font-bold">
                Streaming Player
              </span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {title}
            </h2>
            
            {isShow && (
              <p className="text-xs text-neutral-400 mt-1">
                Now Playing: Season {currentSeason}, Episode {currentEpisode}
                {currentEpisodeName ? ` — “${currentEpisodeName}”` : ""}
              </p>
            )}
          </div>

          <div id="player-headers-actions" className="flex items-center gap-3">
            {/* Server Selection dropdown/buttons */}
            <div className="bg-neutral-850 p-1 rounded-md flex items-center border border-neutral-750">
              <button
                id="btn-server-embedmstr"
                onClick={() => setSelectedServer("embedmstr")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  selectedServer === "embedmstr"
                    ? "bg-[#e50914] text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                Player 1
              </button>
              
              <button
                id="btn-server-vidsrc"
                onClick={() => setSelectedServer("vidsrc")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  selectedServer === "vidsrc"
                    ? "bg-[#e50914] text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Player 2
              </button>

              <button
                id="btn-server-embedsu"
                onClick={() => setSelectedServer("embedsu")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  selectedServer === "embedsu"
                    ? "bg-[#e50914] text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Player 3
              </button>
            </div>

            <a
              id="btn-open-new-tab"
              href={getEmbedUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-all text-xs font-semibold"
              title="Open stream in a clean new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>

            <button
              id="btn-close-theater-node"
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-neutral-800 hover:border-[#e50914] hover:bg-neutral-800/20 text-neutral-400 hover:text-white transition-all duration-200"
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Client alert bar for security/iframe settings */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-md text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold text-white">Streaming Tip</p>
              <p className="text-neutral-400 mt-0.5 max-w-xl">
                If the video player is blocked, blank, or asks you to bypass security/iframes, click the link to load it directly in a new window.
              </p>
            </div>
          </div>
          <a
            href={getEmbedUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-[#e50914] hover:text-white text-xs font-bold rounded shadow transition-all duration-200"
          >
            <ExternalLink className="w-4 h-4" />
            Open Externally
          </a>
        </div>

        {/* Outer Frame with Glowing Shadow Case */}
        <div className="relative aspect-video w-full bg-black rounded-md overflow-hidden border border-neutral-800 shadow-2xl">
          {/* Active Broadcast Frame */}
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full absolute inset-0 bg-neutral-950"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer"
            scrolling="no"
          />
        </div>

        {/* TV Series Episode Drawer and Season Controller */}
        {isShow && (
          <div className="mt-6 bg-[#141414] border border-neutral-800 rounded-md p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ListVideo className="text-[#e50914] w-5 h-5" />
                <h3 className="text-sm font-bold tracking-wider text-neutral-200 uppercase">
                  Episode List
                </h3>
              </div>

              {/* Season Selector */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
                <span className="text-xs text-neutral-500 mr-1">Season</span>
                {Array.from({ length: item.number_of_seasons || 1 }, (_, i) => i + 1).map((sNum) => (
                  <button
                    key={sNum}
                    id={`btn-season-${sNum}`}
                    onClick={() => {
                      setCurrentSeason(sNum);
                      setCurrentEpisode(1);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                      currentSeason === sNum
                        ? "bg-[#e50914] border-[#e50914] text-white"
                        : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-500"
                    }`}
                  >
                    S{sNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Episode Scrolling Container */}
            {loadingEpisodes ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#e50914] border-t-transparent mb-2" />
                <p className="text-xs text-neutral-400">
                  Loading season episodes...
                </p>
              </div>
            ) : episodeError ? (
              <div className="flex items-center justify-center py-8 text-neutral-400 text-xs text-center border border-dashed border-neutral-800 rounded">
                {episodeError}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                {episodes.map((ep) => {
                  const isActive = ep.episode_number === currentEpisode;
                  const epStill = ep.still_path
                    ? `https://image.tmdb.org/t/p/w185${ep.still_path}`
                    : `https://images.unsplash.com/photo-1542204172-e7052809a86e?q=80&w=150&auto=format&fit=crop`;
                  
                  return (
                    <button
                      key={ep.id}
                      id={`btn-episode-${ep.episode_number}`}
                      onClick={() => setCurrentEpisode(ep.episode_number)}
                      className={`flex flex-col text-left p-2.5 rounded border transition-all duration-200 ${
                        isActive
                          ? "bg-neutral-900 border-[#e50914] text-white"
                          : "bg-neutral-950/40 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className="relative shrink-0 w-20 aspect-video rounded overflow-hidden bg-neutral-900">
                          <img
                            src={epStill}
                            alt={ep.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20" />
                          <div className="absolute bottom-1 right-1 text-[9px] bg-black/80 px-1 py-0.5 rounded text-neutral-300">
                            Ep {ep.episode_number}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-semibold line-clamp-1 ${isActive ? "text-[#e50914]" : "text-neutral-200"}`}>
                            {ep.name || `Episode ${ep.episode_number}`}
                          </h4>
                          <span className="block text-[10px] text-neutral-500 mt-0.5">
                            {ep.air_date || ""}
                          </span>
                        </div>
                      </div>
                      
                      {ep.overview && (
                        <p className="text-[10px] text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {ep.overview}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
