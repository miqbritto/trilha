import { 
    Injectable,
    BadRequestException
} from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';

export interface MovieSuggestion {
    tmdbId: number;
    title: string;
    releaseYear: number | null;
    director: string | null;
}

@Injectable()
export class MovieService {
    constructor(
        private readonly tmdbService: TmdbService
    ) {}

    async searchMovies(search: unknown) {
        if (search === undefined) {
            return [];
        }

        if ( typeof search !== "string") {
            throw new BadRequestException(
                "O parâmetro deve ser um texto",
            );
        }

        const query = search.trim();

        if (query.length < 2 ) {
            return [];
        }

        if (query.length > 30) {
            throw new BadRequestException(
                "A busca deve ter no máximo 30 caracteres",
            );
        }

        const movies = await this.tmdbService.searchMovie(query);

        return movies.slice(0, 10).map((movie): MovieSuggestion => {
                return {
                tmdbId: movie.id,
                title: movie.title,
                releaseYear:
                    movie.release_date &&
                    /^\d{4}-\d{2}-\d{2}$/.test(movie.release_date)
                    ? Number(movie.release_date.slice(0, 4))
                    : null,
                director: null,
                };
            });
    }

    async getDirector(tmdbId: number): Promise<{ director: string | null }> {
        if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) {
            throw new BadRequestException('ID de filme inválido');
        }

        return { director: await this.tmdbService.getMovieDirector(tmdbId) };
    }

}
