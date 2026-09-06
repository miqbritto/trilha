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
            releaseYear: 2014,
            posterUrl:
                'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        },
        {
            title: 'The Dark Knight',
            releaseYear: 2008,
            posterUrl:
                'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        },
        {
            title: 'Inception',
            releaseYear: 2010,
            posterUrl:
                'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
        },
        {
            title: 'Harry Potter and the Philosopher\'s Stone',
            releaseYear: 2001,
            posterUrl:
                'https://image.tmdb.org/t/p/w500/4rwpv5tC4bqJQXQWQzYV5W5KXkQ.jpg',
        },
        {
            title: 'The Lord of the Rings: The Fellowship of the Ring',
            releaseYear: 2001,
            posterUrl:
                'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg',
        },
        {
            title: 'Jurassic Park',
            releaseYear: 1993,
            posterUrl:
                'https://image.tmdb.org/t/p/w500/fjTU1Bgh3KJu4lR2xHN5V2Z5z3W.jpg',
        },
        {
            title: 'Jaws',
            releaseYear: 1975,
            posterUrl:
                'https://image.tmdb.org/t/p/w500/lxM6kqilAdpdhqUl2biYp5frUxE.jpg',
        },
        {
            title: 'Star Wars: A New Hope',
            releaseYear: 1977,
            posterUrl:
                'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7F1q5H3V5r6D.jpg',
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