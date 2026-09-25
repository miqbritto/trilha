import { 
    Injectable,
    BadRequestException
} from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import { ILike, Like, Repository } from 'typeorm';
import { MovieEntity } from 'src/database/entities/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { title } from 'process';
import { MovieOption } from './interfaces/movie-option';
import { CreateMovieDto } from './dto/create-movie.dto';

export interface MovieSuggestion {
    tmdbId: number;
    title: string;
    releaseYear: number | null;
    director: string | null;
    posterUrl: string | null;
}

@Injectable()
export class MovieService {
    constructor(
        private readonly tmdbService: TmdbService,

        @InjectRepository(MovieEntity)
        private readonly movieRepo: Repository<MovieEntity>
    ) {}

    async create(dto: CreateMovieDto): Promise<MovieEntity> {
        const existing = await this.movieRepo.findOneBy({ tmdbId: dto.tmdbId });
        if (existing) return existing;

        const details = await this.tmdbService.getMovieDetails(dto.tmdbId);
        const movie = this.movieRepo.create({
            tmdbId: details.tmdbId,
            title: details.title,
            quote: dto.quote?.trim() ?? '',
        });
        try {
            return await this.movieRepo.save(movie);
        } catch (error) {
            // Another request may have registered the same TMDB movie concurrently.
            if ((error as { driverError?: { code?: string } }).driverError?.code === '23505') {
                const registered = await this.movieRepo.findOneBy({ tmdbId: dto.tmdbId });
                if (registered) return registered;
            }
            throw error;
        }
    }

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
                posterUrl: movie.poster_path
                    ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                    : null,
                };
            });
    }

    async getDirector(tmdbId: number): Promise<{ director: string | null }> {
        if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) {
            throw new BadRequestException('ID de filme inválido');
        }

        return { director: await this.tmdbService.getMovieDirector(tmdbId) };
    }

    async getMovies(search: string): Promise<MovieOption[]> {
        
        if (search === undefined ){
            return [];
        }

        const query = search.trim();

        if (!query) return [];

        const movies = await this.movieRepo.find({
            select: { id: true, title: true },
            where: { title: ILike(`%${query}%`)},
            take: 10,
            order: { title: 'ASC' }
        })

        return movies.map((movie): MovieOption => {
            return {
                id: movie.id,
                title: movie.title,
            }
        })
        
    }

}
