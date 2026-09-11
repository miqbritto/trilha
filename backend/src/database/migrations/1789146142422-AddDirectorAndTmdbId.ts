import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDirectorAndTmdbId1789146142422 implements MigrationInterface {
    name = 'AddDirectorAndTmdbId1789146142422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movies" ADD "tmdb_id" integer`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "director" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "director"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "tmdb_id"`);
    }

}
