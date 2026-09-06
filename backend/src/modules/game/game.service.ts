import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameSessionsEntity } from 'src/database/entities/gameSession.entity';
import { MusicTrackEntity } from 'src/database/entities/musicTrack.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GameService {

    constructor(
         @InjectRepository(GameSessionsEntity)
         private  gameSessionsRepository: Repository<GameSessionsEntity>,

         @InjectRepository(MusicTrackEntity)
         private  musicTrackRepository: Repository<MusicTrackEntity>
    ) {}

    async createGameSession(): Promise<GameSessionsEntity> {
        const musicTrack = await this.musicTrackRepository.createQueryBuilder('musicTrack')
            .orderBy('RANDOM()')
            .getOne();

        const gameSession = this.gameSessionsRepository.create({
            musicTrackId: musicTrack?.id,
            status: 'in_progress',
            score: 0,
        });

        return this.gameSessionsRepository.save(gameSession);
    }

    

}
