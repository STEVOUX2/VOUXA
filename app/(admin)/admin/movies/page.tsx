import MovieTable from "@/components/admin/MovieTable";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Manage Movies | VOUXA Admin",
};

export default async function MoviesPage() {
  const supabase = await createClient();
  
  const { count } = await supabase
    .from("movies")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-vtext">
            Movie Library
          </h1>
          <p className="text-vtext-muted">
            Manage your collection of {count?.toLocaleString() || 0} movies.
          </p>
        </div>
      </div>

      <MovieTable />
    </div>
  );
}
