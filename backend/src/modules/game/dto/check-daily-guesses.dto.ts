import { Min, IsUUID, IsInt } from "class-validator";

export class CheckDailyGuessDto {
    @IsUUID()
    challengeId!: string;

    @IsInt()
    @Min(1)
    tmdbId!: number;
}