import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDailyChallenge1789135758139 implements MigrationInterface {
    name = 'AddDailyChallenge1789135758139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "daily_challenges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "music_track_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_93d2fa0aae72790f6653398745e" UNIQUE ("date"), CONSTRAINT "PK_bdffde6b0cd1b5933043dc38ae1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."game_sessions_status_enum" RENAME TO "game_sessions_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."game_sessions_status_enum" AS ENUM('in_progress', 'lost', 'won')`);
        await queryRunner.query(`ALTER TABLE "game_sessions" ALTER COLUMN "status" TYPE "public"."game_sessions_status_enum" USING "status"::text::"public"."game_sessions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."game_sessions_status_enum_old"`);
        // Interpret existing timestamps using the database session's time zone.
        await queryRunner.query(`ALTER TABLE "game_sessions" ALTER COLUMN "finished_at" TYPE TIMESTAMP WITH TIME ZONE USING "finished_at" AT TIME ZONE current_setting('TimeZone')`);
        await queryRunner.query(`ALTER TABLE "daily_challenges" ADD CONSTRAINT "FK_6c1cab9deb761a8d012723e633a" FOREIGN KEY ("music_track_id") REFERENCES "music_tracks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "daily_challenges" DROP CONSTRAINT "FK_6c1cab9deb761a8d012723e633a"`);
        await queryRunner.query(`ALTER TABLE "game_sessions" ALTER COLUMN "finished_at" TYPE TIMESTAMP USING "finished_at" AT TIME ZONE current_setting('TimeZone')`);
        await queryRunner.query(`ALTER TYPE "public"."game_sessions_status_enum" RENAME TO "game_sessions_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."game_sessions_status_enum" AS ENUM('in_progress', 'finished', 'lost', 'won')`);
        await queryRunner.query(`ALTER TABLE "game_sessions" ALTER COLUMN "status" TYPE "public"."game_sessions_status_enum" USING "status"::text::"public"."game_sessions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."game_sessions_status_enum_old"`);
        await queryRunner.query(`DROP TABLE "daily_challenges"`);
    }

}
