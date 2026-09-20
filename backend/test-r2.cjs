require('dotenv').config();

const {
    S3Client,
    ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

const client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
})

async function main() {
    try {
        const result = await client.send(
            new ListObjectsV2Command({
                Bucket: process.env.R2_BUCKET_NAME,
                MaxKeys: 10
            })
        )

        console.log('Conexão com o R2 funcionando!')
        console.log(
            'Arquivos: ',
            (result.Contents ?? []).map((item) => item.Key)
        )
    } finally {
        client.destroy()
    }
}

main().catch((error) => {
    console.error("Falha ao acesar o R2: ", error.name, error.message)
    process.exitCode = 1;
})