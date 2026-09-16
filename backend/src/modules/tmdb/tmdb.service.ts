import { HttpService } from '@nestjs/axios';
import { 
    Injectable,
    ServiceUnavailableException
 } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
    TmdbMovieDetails,
    TmdbMovieCredits,
    TmdbMovieSearchResponse
} from "./interfaces/tmdb-movie"

@Injectable()
export class TmdbService {
    private readonly token: string;
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {
        this.token = configService.getOrThrow<string>("TMDB_ACCESS_TOKEN")
    }

    async searchMovie(query: string) {
        try {
            const { data } = await firstValueFrom(
                this.httpService.get<TmdbMovieSearchResponse>(
                    "https://api.themoviedb.org/3/search/movie", {
                        params: {
                            query, 
                            language: "pt-BR",
                            include_adult: false,
                            page: 1,
                        },
                        headers: {
                            Authorization: `Bearer ${this.token}`
                        },
                        timeout: 5000,
                    },
                ),
            );
            
            return data.results;
        } catch {
            throw new ServiceUnavailableException(
                "Busca de filmes indisponível. Tente novamente.",
            );
        }
    }

    async getMovieDetails(movieId: number) {
        try {
            const { data } = await firstValueFrom(
                this.httpService.get<TmdbMovieDetails>(
                    `https://api.themoviedb.org/3/movie/${movieId}`,
                    {
                        params: { language: 'pt-BR', append_to_response: 'credits' },
                        headers: { Authorization: `Bearer ${this.token}` },
                        timeout: 5000,
                    },
                ),
            );
            const directors = data.credits.crew
                .filter(person => person.job === 'Director')
                .map(person => person.name);

            return {
                tmdbId: data.id,
                title: data.title,
                releaseYear: data.release_date && /^\d{4}-\d{2}-\d{2}$/.test(data.release_date)
                    ? Number(data.release_date.slice(0, 4))
                    : null,
                director: directors.length ? [...new Set(directors)].join(', ') : null,
                posterUrl: data.poster_path
                    ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
                    : null,
            };
        } catch {
            throw new ServiceUnavailableException('Não foi possível consultar os dados do filme');
        }
    }

    async getMovieDirector(movieId: number) {
        try {
            const { data } = await firstValueFrom(
                this.httpService.get<TmdbMovieCredits>(
                    `https://api.themoviedb.org/3/movie/${movieId}/credits`,
                    {
                        params: {
                            language: "pt-BR",
                        },
                        headers: {
                            Authorization: `Bearer ${this.token}`
                        },
                        timeout: 5000
                    }
                )
            )

            const directors = data.crew
                .filter(person => person.job === "Director")
                .map(person => person.name);

            return directors.length > 0
            ? [...new Set(directors)].join(', ')
            : null;
        } catch {
            throw new ServiceUnavailableException(
                "Não foi possível consultar a direção do filme"
            )
        }
    }
}

