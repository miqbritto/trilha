import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../admin-auth/admin-api-key.guard';
import { GameService } from './game.service';
import { CreateGuessDto } from './dto/create-guess.dto';
import { CheckDailyGuessDto } from './dto/check-daily-guesses.dto';
import { CreateDailyChallengeDto } from './dto/create-daily-challenge.dto';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}


  @Get("daily")
  getDailyChallenge() {
    return this.gameService.getDailyChallenge()
  }

  @Get("daily/:challengeId")
  getChallenge(
    @Param("challengeId") challengeId: string
  ) {
    return this.gameService.getChallenge(challengeId);
  }

  @Get("history")
  getChallengeHistory() {
    return this.gameService.getChallengeHistory()
  }

  @Get('admin/challenges')
  @UseGuards(AdminApiKeyGuard)
  getStudioChallenges() {
    return this.gameService.getStudioChallenges();
  }

  @Get("free")
  getFreeChallenge() {
    return this.gameService.getFreeChallenge()
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

  @Post('daily')
  @UseGuards(AdminApiKeyGuard)
  createDailyChallenge(
    @Body() dto: CreateDailyChallengeDto
  ) {
    return this.gameService.createDailyChallenge(dto.musicTrackId, dto.date)
  }
}
