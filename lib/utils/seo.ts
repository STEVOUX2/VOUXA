import { Metadata } from 'next';

const SITE_NAME = 'VOUXA';
const SITE_DESCRIPTION = 'Where Cinema Meets Digital Luxury — Premium movie streaming with thousands of titles.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export function generateMetadata({
  title,
  description,
  image,
  path = '',
}: {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
}): Metadata {
  const fullTitle = title ? title : `${SITE_NAME} — Where Cinema Meets Digital Luxury`;
  const fullDescription = description || SITE_DESCRIPTION;
  const url = `${SITE_URL}${path}`;

  return {
    title: fullTitle,
    description: fullDescription,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: SITE_NAME,
      type: 'website',
      ...(image && { images: [{ url: image, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      ...(image && { images: [image] }),
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateMovieJsonLd(movie: {
  title: string;
  overview?: string | null;
  poster_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  genres?: string[];
  runtime?: number | null;
  director?: string;
  actors?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: movie.overview || '',
    image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    datePublished: movie.release_date || undefined,
    aggregateRating: movie.vote_average ? {
      '@type': 'AggregateRating',
      ratingValue: movie.vote_average,
      bestRating: 10,
    } : undefined,
    genre: movie.genres || [],
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    director: movie.director ? {
      '@type': 'Person',
      name: movie.director,
    } : undefined,
    actor: movie.actors?.map(name => ({
      '@type': 'Person',
      name,
    })) || [],
  };
}

export function generateTvSeriesJsonLd(tv: {
  title: string;
  overview?: string | null;
  poster_path?: string | null;
  first_air_date?: string | null;
  vote_average?: number | null;
  genres?: string[];
  director?: string;
  actors?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: tv.title,
    description: tv.overview || '',
    image: tv.poster_path ? `https://image.tmdb.org/t/p/w500${tv.poster_path}` : undefined,
    startDate: tv.first_air_date || undefined,
    aggregateRating: tv.vote_average ? {
      '@type': 'AggregateRating',
      ratingValue: tv.vote_average,
      bestRating: 10,
    } : undefined,
    genre: tv.genres || [],
    director: tv.director ? {
      '@type': 'Person',
      name: tv.director,
    } : undefined,
    actor: tv.actors?.map(name => ({
      '@type': 'Person',
      name,
    })) || [],
  };
}

export function generateWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

export function generatePersonJsonLd(user: {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.displayName || user.username,
    alternateName: user.username,
    image: user.avatarUrl || undefined,
    url: `${SITE_URL}/u/${user.username}`
  };
}
