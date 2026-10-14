export interface FbEpisode {
  episodeNumber: number
  title: string
  streamlink: string
}

export interface Movie {
  id: number | string
  title: string
  type: 'MOVIES' | 'TV SERIES' | 'ANIMATION'
  rating: number
  genres: string[]
  date: string
  color: string
  image?: string
  streamlink?: string
  isTrending?: boolean
  episodes?: FbEpisode[]
  category?: string
  year?: number
  createdAt?: string
}

export const allMovies: Movie[] = []
export const movies: Movie[] = []
export const series: Movie[] = []
export const animation: Movie[] = []
