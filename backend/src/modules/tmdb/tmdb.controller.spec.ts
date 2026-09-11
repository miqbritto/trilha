import { Test, TestingModule } from '@nestjs/testing';
import { TmdbController } from './tmdb.controller';
import { TmdbService } from './tmdb.service';

describe('TmdbController', () => {
  let controller: TmdbController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TmdbController],
      providers: [TmdbService],
    }).compile();

    controller = module.get<TmdbController>(TmdbController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
