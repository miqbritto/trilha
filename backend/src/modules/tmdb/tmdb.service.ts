import { HttpService } from '@nestjs/axios';
import { 
    Injectable,
    ServiceUnavailableException
 } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
    TmdbMovie,
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

