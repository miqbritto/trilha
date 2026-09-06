import { MigrationInterface, QueryRunner } from "typeorm";

export class MadeFinishedAtNullabe1788711349286
    implements MigrationInterface
{
    name = 'MadeFinishedAtNullabe1788711349286';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."game_sessions_status_enum"
            AS ENUM('in_progress', 'finished', 'lost', 'won')
        `);

        await queryRunner.query(`
            ALTER TABLE "game_sessions"
            ALTER COLUMN "status"
            TYPE "public"."game_sessions_status_enum"
            USING "status"::text::"public"."game_sessions_status_enum"
        `);

        await queryRunner.query(`
            ALTER TABLE "game_sessions"
            ALTER COLUMN "finished_at" DROP DEFAULT
        `);

        await queryRunner.query(`
            ALTER TABLE "game_sessions"
            ALTER COLUMN "finished_at" DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "game_sessions"
            ALTER COLUMN "status"
            TYPE character varying
            USING "status"::text
        `);

        await queryRunner.query(`
            DROP TYPE "public"."game_sessions_status_enum"
        `);

        await queryRunner.query(`
            ALTER TABLE "game_sessions"
            ALTER COLUMN "finished_at"
            SET DEFAULT now()
        `);

        await queryRunner.query(`
            ALTER TABLE "game_sessions"
            ALTER COLUMN "finished_at"
            SET NOT NULL
        `);
    }
}