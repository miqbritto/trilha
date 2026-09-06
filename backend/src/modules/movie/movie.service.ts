import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieEntity } from 'src/database/entities/movie.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MovieService {
    constructor(
        @InjectRepository(MovieEntity)
        private readonly movieRepo: Repository<MovieEntity>
    ) {}

    async searchMovies(search: string) {
        if(!search || search.trim().length < 2) {
            return [];
        }

        return this.movieRepo
            .createQueryBuilder('movie')
            .where('movie.title ILIKE :search', {
                search: `%${search}%`
            })
            .orderBy('movie.title', 'ASC')
            .take(10)
            .getMany();
    }

}
