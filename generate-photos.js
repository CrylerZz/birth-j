const fs = require('fs');
const path = require('path');

const photosRoot = path.join(__dirname, 'photos');

const chaptersConfig = [
    {
        title: 'Avant toi, on dormait encore',
        folders: ['grossesse', '1 an', '2 ans', '3 ans', '4 ans', '5 ans'],
        music: 'music/photograph.mp3',
    },
    {
        title: 'Apprentissage des bêtises',
        folders: ['6 ans', '7 ans', '8 ans', '9 ans', '10 ans', '11 ans', '12 ans'],
        music: 'music/photograph.mp3',
    },
    {
        title: 'Ado détectée, prudence recommandée',
        folders: ['13 ans', '14 ans', '15 ans', '16 ans', '17 ans', '18 ans'],
        music: 'music/happy.mp3',
    },
    {
        title: 'Le bisou de l’équipe officielle',
        folders: ['final'],
        isFinal: true,
        music: 'music/final.mp3',
    },
];

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

const chapters = chaptersConfig
    .map(chapter => {
        const photos = chapter.folders.flatMap(folder => {
            const folderPath = path.join(photosRoot, folder);

            if (!fs.existsSync(folderPath)) {
                console.warn(`⚠️ Dossier introuvable : ${folderPath}`);
                return [];
            }

            return fs
                .readdirSync(folderPath)
                .filter(file => allowedExtensions.includes(path.extname(file).toLowerCase()))
                .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))
                .map(file => `photos/${folder}/${file}`);
        });

        const isFinal = chapter.isFinal === true;

        const mainPhoto = isFinal
            ? photos.find(photo => {
                const filename = path.basename(photo).toLowerCase();
                return filename.startsWith('main.');
            })
            : null;

        const decorPhotos = isFinal
            ? photos.filter(photo => photo !== mainPhoto)
            : photos;

        return {
            title: chapter.title,
            photos: decorPhotos,
            isFinal,
            mainPhoto: mainPhoto || null,
            music: chapter.music || null,
        };
    })
    .filter(chapter => {
        if (chapter.isFinal) {
            return chapter.mainPhoto || chapter.photos.length > 0;
        }

        return chapter.photos.length > 0;
    });

const output = `window.CHAPTERS = ${JSON.stringify(chapters, null, 2)};`;

const outputPath = path.join(__dirname, 'assets/js/photos-manifest.js');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

fs.writeFileSync(outputPath, output, 'utf8');

console.log(`✅ ${chapters.length} chapitres générés`);
console.log(`📸 ${chapters.reduce((total, chapter) => total + chapter.photos.length, 0)} photos générées`);
console.log(`🎵 Playlist : ${chapters.map(chapter => chapter.music).filter(Boolean).join(' → ')}`);