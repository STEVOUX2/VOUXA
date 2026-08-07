"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/validation";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { Movie } from "@/lib/supabase/types";

export default function MovieTable() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deletingMovie, setDeletingMovie] = useState<string | null>(null);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/movies?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setMovies(data.movies || []);
        setTotalPages(Math.ceil((data.total || 0) / 20));
      }
    } catch (err) {
      console.error("Failed to fetch movies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMovies();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, page]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/movies/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMovies(movies.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete movie", err);
    } finally {
      setDeletingMovie(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie) return;

    try {
      const res = await fetch(`/api/admin/movies/${editingMovie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingMovie.title,
          overview: editingMovie.overview,
        }),
      });
      
      if (res.ok) {
        setMovies(movies.map(m => m.id === editingMovie.id ? editingMovie : m));
        setEditingMovie(null);
      }
    } catch (err) {
      console.error("Failed to update movie", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-vtext-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Search movies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-vborder rounded-xl text-vtext focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-vborder rounded-2xl overflow-hidden shadow-lg shadow-black/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background/50 border-b border-vborder text-vtext-muted">
              <tr>
                <th className="px-6 py-4 font-medium">Movie</th>
                <th className="px-6 py-4 font-medium">TMDB ID</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Added</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vborder/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-surface-light rounded-md"></div>
                        <div className="h-4 w-32 bg-surface-light rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-surface-light rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-surface-light rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-surface-light rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-8 w-16 bg-surface-light rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : movies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-vtext-muted">
                    No movies found. {search && "Try a different search."}
                  </td>
                </tr>
              ) : (
                movies.map((movie) => (
                  <tr key={movie.id} className="hover:bg-surface-light/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-14 rounded-md overflow-hidden bg-background">
                          {movie.poster_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                              alt={movie.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-light text-vtext-muted">
                              <FilmIcon className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="font-medium text-vtext truncate max-w-[200px]">
                          {movie.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-vtext-muted">
                      {movie.tmdb_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-primary">
                        <StarIcon className="w-3.5 h-3.5 fill-primary" />
                        <span>{movie.vote_average?.toFixed(1) || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-vtext-muted">
                      {formatDate(movie.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingMovie(movie)}
                          className="p-2 text-vtext-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingMovie(movie.id)}
                          className="p-2 text-vtext-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-vborder flex items-center justify-between">
            <span className="text-sm text-vtext-muted">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-vborder hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-vborder hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingMovie && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setEditingMovie(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-vborder rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-vborder flex justify-between items-center">
                  <h3 className="font-display text-xl font-semibold">Edit Movie</h3>
                  <button onClick={() => setEditingMovie(null)} className="text-vtext-muted hover:text-vtext">
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpdate} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-vtext-muted mb-1">Title</label>
                    <input
                      type="text"
                      value={editingMovie.title}
                      onChange={(e) => setEditingMovie({ ...editingMovie, title: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-vborder rounded-xl focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-vtext-muted mb-1">Overview</label>
                    <textarea
                      value={editingMovie.overview || ""}
                      onChange={(e) => setEditingMovie({ ...editingMovie, overview: e.target.value })}
                      className="w-full h-32 px-4 py-2 bg-background border border-vborder rounded-xl focus:border-primary outline-none resize-none"
                    />
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingMovie(null)}
                      className="px-4 py-2 rounded-xl text-vtext-muted hover:bg-surface-light transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-background font-medium rounded-xl hover:bg-primary-hover transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingMovie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-vborder rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium mb-2">Delete Movie?</h3>
              <p className="text-vtext-muted text-sm mb-6">
                This action cannot be undone. This will permanently remove the movie from your database.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeletingMovie(null)}
                  className="px-4 py-2 rounded-xl border border-vborder hover:bg-surface-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingMovie)}
                  className="px-4 py-2 bg-danger text-white rounded-xl hover:bg-danger/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 3v18" />
      <path d="M3 7.5h4" />
      <path d="M3 12h18" />
      <path d="M3 16.5h4" />
      <path d="M17 3v18" />
      <path d="M17 7.5h4" />
      <path d="M17 16.5h4" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
