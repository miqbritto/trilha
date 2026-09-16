import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGuessDto } from './dto/create-guess.dto';
import { CheckDailyGuessDto } from './dto/check-daily-guesses.dto';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  async createGameSession() {
    const gameSession = await this.gameService.createGameSession();
    return gameSession;
  }

  

  @Get("daily")
  getDailyChallenge() {
    return this.gameService.getDailyChallenge()
  }

  @Get("free")
  getFreeChallenge() {
    return this.gameService.getFreeChallenge()
  }

  @Get(':gameId')
  async getGame(
    @Param('gameId') gameId: string 
  ) {
    return this.gameService.findGame(gameId)
  }

  @Post("guesses")
  async checkGuess(
    @Body() dto: CheckDailyGuessDto
  ) {
    return this.gameService.checkGuess(dto.challengeId, dto.tmdbId)
  }

  @Get("daily/:challengeId/result")
  getDailyResult(
    @Param("challengeId") challengeId: string
  ) {
    return this.gameService.getDailyResult(challengeId);
  }

  
}
