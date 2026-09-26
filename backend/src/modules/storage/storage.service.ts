import { PutObjectCommand, S3Client, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { audioRange, AudioRangeError } from './audio-range';


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

    async getAudio(key: string, range?: string) {
        try {
            let requestedRange: string | undefined;
            if (range) {
                const metadata = await this.client.send(new HeadObjectCommand({
                    Bucket: this.bucket, Key: key,
                }));
                requestedRange = audioRange(range, metadata.ContentLength ?? 0);
            }
            const object = await this.client.send(new GetObjectCommand({
                Bucket: this.bucket, Key: key, Range: requestedRange,
            }));
            if (!(object.Body instanceof Readable)) {
                throw new ServiceUnavailableException('Áudio temporariamente indisponível.');
            }
            return {
                stream: object.Body,
                type: key.toLowerCase().endsWith('.wav') ? 'audio/wav' : 'audio/mpeg',
                length: object.ContentLength,
                contentRange: object.ContentRange,
            };
        } catch (error) {
            if (error instanceof AudioRangeError) throw error;
            if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
                throw new NotFoundException('Áudio não encontrado.');
            }
            // Never expose R2 URLs, object keys or SDK errors to players.
            throw new ServiceUnavailableException('Áudio temporariamente indisponível.');
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
