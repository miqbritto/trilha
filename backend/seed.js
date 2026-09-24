require('dotenv').config();
const { DataSource } = require('typeorm');

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: ['dist/**/*.entity.js'],
    synchronize: false,
});

async function seed() {
    await dataSource.initialize();

    console.log('Iniciando seed...');

    const movieRepository = dataSource.getRepository('movies');
    const musicTrackRepository = dataSource.getRepository('music_tracks');

    // =========================
    // FILMES
    // =========================

    const movies = [
        {
            title: 'Interstellar',
        },
        {
            title: 'The Dark Knight',
        },
        {
            title: 'Inception',
        },
        {
            title: 'Harry Potter and the Philosopher\'s Stone',
        },
        {
            title: 'The Lord of the Rings: The Fellowship of the Ring',
        },
        {
            title: 'Jurassic Park',
        },
        {
            title: 'Jaws',
        },
        {
            title: 'Star Wars: A New Hope',
        },
    ];

    const savedMovies = await movieRepository.save(movies);

    console.log(`${savedMovies.length} filmes inseridos.`);

    // =========================
    // MÚSICAS
    // =========================

    const tracks = [
        {
            title: 'Cornfield Chase',
            externalId: 'seed-interstellar',
            artist: 'Hans Zimmer',
            previewUrl: 'https://example.com/interstellar-preview.mp3',
            source: 'SEED',
            movieId: savedMovies[0].id,
        },
        {
            title: 'Why So Serious?',
            externalId: 'seed-dark-knight',
            artist: 'Hans Zimmer',
            previewUrl: 'https://example.com/dark-knight-preview.mp3',
            source: 'SEED',
            movieId: savedMovies[1].id,
        },
        {
            title: 'Time',
            externalId: 'seed-inception',
            artist: 'Hans Zimmer',
            previewUrl: 'https://example.com/inception-preview.mp3',
            source: 'SEED',
            movieId: savedMovies[2].id,
        },
        {
            title: 'Hedwig\'s Theme',
            externalId: 'seed-harry-potter',
            artist: 'John Williams',
            previewUrl: 'https://example.com/harry-potter-preview.mp3',
            source: 'SEED',
            movieId: savedMovies[3].id,
        },
        {
            title: 'The Fellowship of the Ring',
            externalId: 'seed-lotr',
            artist: 'Howard Shore',
            previewUrl: 'https://example.com/lotr-preview.mp3',
            source: 'SEED',
            movieId: savedMovies[4].id,
        },
        {
            title: 'Theme from Jurassic Park',
            externalId: 'seed-jurassic-park',
            artist: 'John Williams',
            previewUrl: 'https://example.com/jurassic-park-preview.mp3',
            source: 'SEED',
            movieId: savedMovies[5].id,
        },
        {
            title: 'Main Theme',
            externalId: 'seed-jaws',
            artist: 'John Williams',
            previewUrl: 'https://example.com/jaws-preview.mp3',
            source: 'SEED',
            movieId: savedMovies[6].id,
        },
        {
            title: 'Main Title',
            externalId: 'seed-star-wars',
            artist: 'John Williams',
            previewUrl: 'https://example.com/star-wars-preview.mp3',
            source: 'SEED',
            movieId: savedMovies[7].id,
        },
    ];

    const savedTracks = await musicTrackRepository.save(tracks);

    console.log(`${savedTracks.length} músicas inseridas.`);

    console.log('Seed finalizada com sucesso.');

    await dataSource.destroy();
}

seed().catch(async (error) => {
    console.error('Erro ao executar seed:', error);

    if (dataSource.isInitialized) {
        await dataSource.destroy();
    }

    process.exit(1);
});