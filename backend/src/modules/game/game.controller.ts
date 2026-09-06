import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGuessDto } from './dto/create-guess.dto';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  async createGameSession() {
    const gameSession = await this.gameService.createGameSession();
    return gameSession;
  }

  @Post(':gameId/guesses')
  createGuess(
    @Param('gameId') gameId: string,
    @Body() dto: CreateGuessDto
  ) {
    return this.gameService.createGuess(gameId, dto.movieId)
  }

  @Get(':gameId')
  async getGame(
    @Param('gameId') gameId: string 
  ) {
    return this.gameService.findGame(gameId)
  }
}
