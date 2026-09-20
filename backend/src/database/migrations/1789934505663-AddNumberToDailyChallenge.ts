import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNumberToDailyChallenge1789934505663 implements MigrationInterface {
    name = 'AddNumberToDailyChallenge1789934505663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "daily_challenges" ADD "number" integer`);
        await queryRunner.query(`
            WITH numbered_challenges AS (
                SELECT "id", ROW_NUMBER() OVER (ORDER BY "date", "id") AS "number"
                FROM "daily_challenges"
            )
            UPDATE "daily_challenges" AS challenge
            SET "number" = numbered_challenges."number"::integer
            FROM numbered_challenges
            WHERE challenge."id" = numbered_challenges."id"
        `);
        await queryRunner.query(`ALTER TABLE "daily_challenges" ALTER COLUMN "number" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "daily_challenges" ADD CONSTRAINT "UQ_6eb7a935e2a759a88c8f67b2559" UNIQUE ("number")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "daily_challenges" DROP CONSTRAINT "UQ_6eb7a935e2a759a88c8f67b2559"`);
        await queryRunner.query(`ALTER TABLE "daily_challenges" DROP COLUMN "number"`);
    }

}
