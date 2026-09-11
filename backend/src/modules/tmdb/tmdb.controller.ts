import { Controller, Get, Param, Query } from '@nestjs/common';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get()
  async searchMovies(
    @Query("search") search: string
  ) {
    return this.tmdbService.searchMovie(search);
  }
}
