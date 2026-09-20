import { IsDateString, IsUUID, Matches } from "class-validator";

export class CreateDailyChallengeDto {
    @IsUUID()
    musicTrackId!: string;

    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date deve estar no formato YYYY-MM-DD',
    })
    @IsDateString()
    date!: string;
}