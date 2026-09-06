import { Controller } from '@nestjs/common';
import { GuessService } from './guess.service';

@Controller('guess')
export class GuessController {
  constructor(private readonly guessService: GuessService) {}
}
