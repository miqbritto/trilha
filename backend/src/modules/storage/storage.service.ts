import { PutObjectCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class StorageService {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly publicUrl: string;

    constructor(config: ConfigService) {
        this.bucket = config.getOrThrow<string>("R2_BUCKET_NAME")
        
        this.publicUrl = config
            .getOrThrow<string>("R2_PUBLIC_URL")
            .replace(/\/+$/, '');

        this.client = new S3Client({
            region: 'auto',
            endpoint: config.getOrThrow<string>("R2_ENDPOINT"),
            credentials: {
                accessKeyId: config.getOrThrow<string>("R2_ACCESS_KEY_ID"),
                secretAccessKey: config.getOrThrow<string>("R2_SECRET_ACCESS_KEY")
            }
        })
    }

    getPublicUrl(key: string): string {
        const encodedKey = key
            .split('/')
            .map((segment => encodeURIComponent(segment)))
            .join('/')

        return `${this.publicUrl}/${encodedKey}`
    }

    async upload(
        key: string,
        body: Buffer,
        contentType: string,
    ): Promise<{key: string, url: string}> {
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: contentType
            })
        )

        return {
            key,
            url: this.getPublicUrl(key)
        }
    }

    async delete(key: string): Promise<void> {
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key
            })
        )
    }
}
