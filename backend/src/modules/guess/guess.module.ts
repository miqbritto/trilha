import { Module } from '@nestjs/common';
import { GuessService } from './guess.service';
import { GuessController } from './guess.controller';

@Module({
  controllers: [GuessController],
  providers: [GuessService],
})
export class GuessModule {}
