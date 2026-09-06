import { Controller, Get, Query } from '@nestjs/common';
import { MovieService } from './movie.service';

@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  searchMovies(@Query('search') search: string) {
    return this.movieService.searchMovies(search);
  }
}
