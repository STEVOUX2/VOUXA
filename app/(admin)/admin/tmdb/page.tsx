import { createClient } from "@/lib/supabase/server";
import { FilmIcon } from "lucide-react";
import { TmdbClient } from "./TmdbClient";

export const metadata = {
  title: "TMDB Curation | Admin | VOUXA",
};

export default async function AdminTmdbPage() {
  const supabase = await createClient();

  // Fetch settings for homepage config
  const { data: settings } = await supabase
    .from("vouxa_settings")
    .select("homepage_config")
    .eq("id", 1)
    .single();

  const config = settings?.homepage_config || {
    sections: [
      { id: "hero", title: "Hero", type: "trending/all/day", active: true },
      { id: "trending", title: "Trending", type: "trending/all/day", active: true },
      { id: "top_rated", title: "Top Rated", type: "movie/top_rated", active: true },
      { id: "new_releases", title: "New Releases", type: "movie/now_playing", active: true },
      { id: "comedy", title: "Comedy", type: "discover/movie?with_genres=35", active: true },
      { id: "popular", title: "Popular", type: "movie/popular", active: true }
    ]
  };

  return (
    <div style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '1200px', margin: '0 auto', padding: '100px 32px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '50%' }}>
          <FilmIcon size={32} className="text-purple-500" />
        </div>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F2F2F0', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            TMDB Curation
          </h1>
          <p style={{ color: '#7E7E7E', fontSize: '16px', margin: 0, fontWeight: 500 }}>
            Customize your homepage layout and movie categories.
          </p>
        </div>
      </div>

      <TmdbClient initialConfig={config} />
    </div>
  );
}
