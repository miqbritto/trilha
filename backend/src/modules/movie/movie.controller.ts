import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MovieService } from './movie.service';

@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get(':tmdbId/director')
  getDirector(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.movieService.getDirector(tmdbId);
  }

  @Get()
  searchMovies(@Query('search') search: unknown) {
    return this.movieService.searchMovies(search);
  }
}
