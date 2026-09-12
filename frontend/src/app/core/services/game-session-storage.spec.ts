import { TestBed } from '@angular/core/testing';
import { GameSessionStorage } from './game-session-storage';

describe('GameSessionStorage', () => {
  let service: GameSessionStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameSessionStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
