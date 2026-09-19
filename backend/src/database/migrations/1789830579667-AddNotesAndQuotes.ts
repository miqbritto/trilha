import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotesAndQuotes1789830579667 implements MigrationInterface {
    name = 'AddNotesAndQuotes1789830579667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "music_tracks" ADD "note" character varying`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "quote" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "quote"`);
        await queryRunner.query(`ALTER TABLE "music_tracks" DROP COLUMN "note"`);
    }

}
