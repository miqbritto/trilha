import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMusicTrackEntity1788642876163 implements MigrationInterface {
    name = 'AddMusicTrackEntity1788642876163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "music_tracks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "external_id" character varying NOT NULL, "artist" character varying, "preview_url" character varying, "source" character varying NOT NULL, "movie_id" uuid NOT NULL, CONSTRAINT "PK_90508cc4c5b065f30f1ff420826" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "releaseYear"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "posterUrl"`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "release_year" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "poster_url" character varying`);
        await queryRunner.query(`ALTER TABLE "music_tracks" ADD CONSTRAINT "FK_ad9a03c95b5110c66889a5912bd" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "music_tracks" DROP CONSTRAINT "FK_ad9a03c95b5110c66889a5912bd"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "poster_url"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "release_year"`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "posterUrl" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "releaseYear" integer NOT NULL`);
        await queryRunner.query(`DROP TABLE "music_tracks"`);
    }

}
