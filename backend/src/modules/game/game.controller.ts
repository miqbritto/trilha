import { Controller, Post } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  async createGameSession() {
    const gameSession = await this.gameService.createGameSession();
    return gameSession;
  }
}
