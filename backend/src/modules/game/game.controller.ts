import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Res, StreamableFile, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AudioRangeError } from '../storage/audio-range';
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

  @Get('daily/:challengeId/audio')
  async getChallengeAudio(
    @Param('challengeId', new ParseUUIDPipe()) challengeId: string,
    @Headers('range') range: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const audio = await this.gameService.getChallengeAudio(challengeId, range);
      if (audio.contentRange) {
        response.status(206);
        response.setHeader('Content-Range', audio.contentRange);
      }
      response.once('close', () => audio.stream.destroy());
      const file = new StreamableFile(audio.stream, {
        type: audio.type,
        length: audio.length,
        disposition: `inline; filename="audio.${audio.type === 'audio/wav' ? 'wav' : 'mp3'}"`,
      });
      file.setErrorHandler(() => response.destroy());
      file.setErrorLogger(() => {});
      return file;
    } catch (error) {
      if (error instanceof AudioRangeError) {
        response.setHeader('Content-Range', `bytes */${error.size}`);
      }
      throw error;
    }
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
