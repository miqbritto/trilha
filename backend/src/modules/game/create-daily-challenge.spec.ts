import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DailyChallengeEntity } from '../../database/entities/daily-challenge';
import { MusicTrackEntity } from '../../database/entities/musicTrack.entity';
import { TmdbService } from '../tmdb/tmdb.service';
import { GameService } from './game.service';
import { StorageService } from '../storage/storage.service';

describe('GameService.createDailyChallenge', () => {
  const tracks = { findOne: jest.fn() };
  const challenges = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const manager = { query: jest.fn(), getRepository: jest.fn(), transaction: jest.fn() };
  let service: GameService;

  beforeEach(() => {
    jest.resetAllMocks();
    tracks.findOne.mockResolvedValue({ id: 'track' });
    manager.transaction.mockImplementation(callback => callback(manager));
    manager.getRepository.mockReturnValue(challenges);
    challenges.create.mockImplementation(value => value);
    challenges.save.mockImplementation(async value => ({ id: 'challenge', ...value }));
    service = new GameService(
      tracks as unknown as Repository<MusicTrackEntity>,
      { manager } as unknown as Repository<DailyChallengeEntity>,
      {} as TmdbService,
      {} as StorageService,
    );
  });

  it.each([null, { number: 7 }])('assigns the next number with existing challenge %j', async last => {
    challenges.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(last);
    await expect(service.createDailyChallenge('track', '2026-10-01')).resolves.toMatchObject({
      date: '2026-10-01', musicTrackId: 'track', number: (last?.number ?? 0) + 1,
    });
    expect(manager.query).toHaveBeenCalledWith('LOCK TABLE "daily_challenges" IN SHARE ROW EXCLUSIVE MODE');
    expect(manager.query.mock.invocationCallOrder[0]).toBeLessThan(challenges.findOne.mock.invocationCallOrder[0]);
  });

  it('rejects an occupied date without inserting', async () => {
    challenges.findOne.mockResolvedValue({ id: 'existing' });
    await expect(service.createDailyChallenge('track', '2026-10-01')).rejects.toBeInstanceOf(ConflictException);
    expect(challenges.save).not.toHaveBeenCalled();
  });

  it('rejects a missing track', async () => {
    tracks.findOne.mockResolvedValue(null);
    await expect(service.createDailyChallenge('missing', '2026-10-01')).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.transaction).not.toHaveBeenCalled();
  });
});
