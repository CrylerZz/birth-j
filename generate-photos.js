const fs = require('fs');
const path = require('path');

const photosRoot = path.join(__dirname, 'photos');

const chapterOrder = [
    'grossesse',
    '1 an',
    '2 ans',
    '3 ans',
    '4 ans',
    '5 ans',
    '6 ans',
    '7 ans',
    '8 ans',
    '9 ans',
    '10 ans',
    '11 ans',
    '12 ans',
    '13 ans',
    '14 ans',
    '15 ans',
    '16 ans',
    '17 ans',
    '18 ans',
    'final',
];

const subtitles = {
    grossesse: 'Le tout début de l’histoire',
    final: 'Une nouvelle page commence',
};

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

const chapters = chapterOrder
    .filter(folder => fs.existsSync(path.join(photosRoot, folder)))
    .map(folder => {
        const folderPath = path.join(photosRoot, folder);

        const photos = fs
            .readdirSync(folderPath)
            .filter(file => allowedExtensions.includes(path.extname(file).toLowerCase()))
            .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))
            .map(file => `photos/${folder}/${file}`);

        return {
            title: folder === 'grossesse'
                ? 'Grossesse'
                : folder === 'final'
                    ? 'Final'
                    : folder,
            subtitle: subtitles[folder] || `Souvenirs de ses ${folder}`,
            photos,
        };
    })
    .filter(chapter => chapter.photos.length > 0);

const output = `window.CHAPTERS = ${JSON.stringify(chapters, null, 2)};`;

fs.writeFileSync(
    path.join(__dirname, 'assets/js/photos-manifest.js'),
    output,
    'utf8'
);

console.log(`✅ ${chapters.length} chapitres générés`);