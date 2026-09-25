import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUniqueMusicIndex1790296052397 implements MigrationInterface {
    name = 'CreateUniqueMusicIndex1790296052397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_music_track_movie_title_artist"
            ON "music_tracks" (
                "movie_id",
                lower(trim("title")),
                lower(trim(coalesce("artist", '')))
            )
        `);
        await queryRunner.query(`ALTER TABLE "music_tracks" ADD CONSTRAINT "UQ_5de5f04d39c2338aefb6a71a718" UNIQUE ("external_id")`);
        await queryRunner.query(`ALTER TABLE "music_tracks" ALTER COLUMN "artist" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "music_tracks" ALTER COLUMN "preview_url" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "music_tracks" ADD CONSTRAINT "UQ_b0d031799adf19c72b99dfa4b01" UNIQUE ("preview_url")`);
        await queryRunner.query(`ALTER TABLE "music_tracks" ALTER COLUMN "source" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "music_tracks" ALTER COLUMN "note" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "tmdb_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" ADD CONSTRAINT "UQ_a30f596bb8c7b8213cec64c5125" UNIQUE ("tmdb_id")`);
        await queryRunner.query(`ALTER TABLE "movies" DROP CONSTRAINT "UQ_5aa0bbd146c0082d3fc5a0ad5d8"`);
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "quote" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "quote" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" ADD CONSTRAINT "UQ_5aa0bbd146c0082d3fc5a0ad5d8" UNIQUE ("title")`);
        await queryRunner.query(`ALTER TABLE "movies" DROP CONSTRAINT "UQ_a30f596bb8c7b8213cec64c5125"`);
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "tmdb_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "music_tracks" ALTER COLUMN "note" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "music_tracks" ALTER COLUMN "source" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "music_tracks" DROP CONSTRAINT "UQ_b0d031799adf19c72b99dfa4b01"`);
        await queryRunner.query(`ALTER TABLE "music_tracks" ALTER COLUMN "preview_url" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "music_tracks" ALTER COLUMN "artist" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "music_tracks" DROP CONSTRAINT "UQ_5de5f04d39c2338aefb6a71a718"`);
        await queryRunner.query(`DROP INDEX "uq_music_track_movie_title_artist"`);
    }

}
