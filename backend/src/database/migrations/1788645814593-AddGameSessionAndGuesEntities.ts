import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGameSessionAndGuesEntities1788645814593 implements MigrationInterface {
    name = 'AddGameSessionAndGuesEntities1788645814593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "guesses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attempt_number" integer NOT NULL, "revealed_seconds" integer NOT NULL, "is_correct" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "game_session_id" uuid NOT NULL, "guessed_movie_id" uuid NOT NULL, CONSTRAINT "PK_1a19fb88ca0703498ae15592764" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "game_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying NOT NULL, "score" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "finished_at" TIMESTAMP NOT NULL DEFAULT now(), "music_track_id" uuid NOT NULL, CONSTRAINT "PK_e25fa82d55744e55000c3288fdc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "guesses" ADD CONSTRAINT "FK_063aa5641a60610a78f5607d2e1" FOREIGN KEY ("guessed_movie_id") REFERENCES "movies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "guesses" ADD CONSTRAINT "FK_f2803be25f5f507c0cda14dc86f" FOREIGN KEY ("game_session_id") REFERENCES "game_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_sessions" ADD CONSTRAINT "FK_1ad343de34ca3f213564db848b7" FOREIGN KEY ("music_track_id") REFERENCES "music_tracks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_sessions" DROP CONSTRAINT "FK_1ad343de34ca3f213564db848b7"`);
        await queryRunner.query(`ALTER TABLE "guesses" DROP CONSTRAINT "FK_f2803be25f5f507c0cda14dc86f"`);
        await queryRunner.query(`ALTER TABLE "guesses" DROP CONSTRAINT "FK_063aa5641a60610a78f5607d2e1"`);
        await queryRunner.query(`DROP TABLE "game_sessions"`);
        await queryRunner.query(`DROP TABLE "guesses"`);
    }

}
