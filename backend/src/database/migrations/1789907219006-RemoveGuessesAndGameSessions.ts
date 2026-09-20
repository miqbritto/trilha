import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveGuessesAndGameSessions1789907219006 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "guesses"`);
        await queryRunner.query(`DROP TABLE "game_sessions"`);
        await queryRunner.query(
            `DROP TYPE "public"."game_sessions_status_enum"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."game_sessions_status_enum"
            AS ENUM ('in_progress', 'finished', 'lost', 'won')
        `);

        await queryRunner.query(`
            CREATE TABLE "game_sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "status" "public"."game_sessions_status_enum" NOT NULL,
                "score" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "finished_at" timestamptz,
                "music_track_id" uuid NOT NULL,
                CONSTRAINT "PK_e25fa82d55744e55000c3288fdc"
                    PRIMARY KEY ("id"),
                CONSTRAINT "FK_1ad343de34ca3f213564db848b7"
                    FOREIGN KEY ("music_track_id")
                    REFERENCES "music_tracks" ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "guesses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "attempt_number" integer NOT NULL,
                "revealed_seconds" integer NOT NULL,
                "is_correct" boolean NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "game_session_id" uuid NOT NULL,
                "guessed_movie_id" uuid NOT NULL,
                CONSTRAINT "PK_1a19fb88ca0703498ae15592764"
                    PRIMARY KEY ("id"),
                CONSTRAINT "FK_f2803be25f5f507c0cda14dc86f"
                    FOREIGN KEY ("game_session_id")
                    REFERENCES "game_sessions" ("id"),
                CONSTRAINT "FK_063aa5641a60610a78f5607d2e1"
                    FOREIGN KEY ("guessed_movie_id")
                    REFERENCES "movies" ("id")
            )
        `);
    }

}
