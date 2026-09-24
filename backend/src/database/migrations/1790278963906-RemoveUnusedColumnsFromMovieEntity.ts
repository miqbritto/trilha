import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUnusedColumnsFromMovieEntity1790278963906 implements MigrationInterface {
    name = 'RemoveUnusedColumnsFromMovieEntity1790278963906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "release_year"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "poster_url"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "director"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movies" ADD "director" character varying`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "poster_url" character varying`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "release_year" integer NOT NULL`);
    }

}
