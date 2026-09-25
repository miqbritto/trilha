import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../admin-auth/admin-api-key.guard';
import { CreateMovieDto } from './dto/create-movie.dto';
import { MovieService } from './movie.service';

@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Post()
  @UseGuards(AdminApiKeyGuard)
  create(@Body() dto: CreateMovieDto) {
    return this.movieService.create(dto);
  }

  @Get(':tmdbId/director')
  getDirector(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.movieService.getDirector(tmdbId);
  }

  @Get()
  searchMovies(@Query('search') search: unknown) {
    return this.movieService.searchMovies(search);
  }

  @Get("options")
  getMovies(@Query('search') search: string) {
    return this.movieService.getMovies(search)
  }
}
