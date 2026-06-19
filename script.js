const config = {
    photoDuration: 1.3,
    transitionDuration: 0.8,
    maxDecorPhotos: 8,

    countdownDuration: 0,
};

const chapters = window.CHAPTERS || [];

const photosLayer = document.querySelector('#photosLayer');
const chapterIntro = document.querySelector('#chapterIntro');
const chapterNumber = document.querySelector('#chapterNumber');
const chapterTitle = document.querySelector('#chapterTitle');
const chapterSubtitle = document.querySelector('#chapterSubtitle');
const progressBar = document.querySelector('#progressBar');
const togglePlayBtn = document.querySelector('#togglePlayBtn');
const restartBtn = document.querySelector('#restartBtn');
const stage = document.querySelector('#stage');

let mainTl = null;
let isPaused = false;
let currentCards = [];

const positions = [
    { x: -380, y: -170, r: -10, s: .42 },
    { x: 360, y: -160, r: 8, s: .42 },
    { x: -420, y: 120, r: 6, s: .42 },
    { x: 420, y: 130, r: -7, s: .42 },
    { x: -180, y: -230, r: 5, s: .38 },
    { x: 190, y: 220, r: -5, s: .38 },
    { x: -40, y: -260, r: -4, s: .36 },
    { x: 60, y: 260, r: 4, s: .36 },
];

function preloadImage(src) {
    if (!src) return;

    const img = new Image();
    img.src = encodeURI(src);
}

function createCard(src, className = '') {
    const card = document.createElement('article');
    card.className = `polaroid ${className}`;

    const img = document.createElement('img');
    img.src = encodeURI(src);
    img.alt = 'Souvenir';
    img.loading = 'eager';
    img.decoding = 'async';

    card.appendChild(img);
    photosLayer.appendChild(card);

    gsap.set(card, {
        xPercent: -50,
        yPercent: -50,
        left: '50%',
        top: '50%',
        x: 0,
        y: 0,
        scale: .7,
        rotation: 0,
        opacity: 0,
        force3D: true,
        zIndex: 50
    });

    currentCards.push(card);
    return card;
}

function clearCards() {
    currentCards.forEach(card => card.remove());
    currentCards = [];
}

function setChapter(chapter, index) {
    chapterNumber.textContent = `Chapitre ${String(index + 1).padStart(2, '0')}`;
    chapterTitle.textContent = chapter.title;
    chapterSubtitle.textContent = chapter.subtitle || '';
}

function getChapterOptions(chapter) {
    return {
        photoDuration: config.photoDuration,
        transitionDuration: config.transitionDuration,
        maxDecorPhotos: config.maxDecorPhotos,
        moveBackDuration: 0.55,
        removeDuration: 0.35,
    };
}

function showChapterIntro(tl, chapter, index) {
    tl.call(() => setChapter(chapter, index))
        .set(chapterIntro, { opacity: 0, scale: .96 })
        .to(chapterIntro, { opacity: 1, scale: 1, duration: .55 })
        .to(chapterIntro, { opacity: 0, scale: 1.03, duration: .45 }, '+=.35');
}

function createCountdown() {
    const countdown = document.createElement('div');
    countdown.id = 'countdownScreen';
    countdown.innerHTML = `
        <div class="countdown-inner">
            <p class="countdown-label">Le diaporama commence dans</p>
            <div class="countdown-number">${config.countdownDuration}</div>
        </div>
    `;

    stage.appendChild(countdown);
    return countdown;
}

function showCountdown(tl) {
    const countdown = createCountdown();
    const number = countdown.querySelector('.countdown-number');

    gsap.set(countdown, { opacity: 1 });

    for (let i = config.countdownDuration; i >= 1; i--) {
        tl.call(() => {
            number.textContent = i;
        });

        tl.fromTo(number,
            { scale: .55, opacity: 0 },
            { scale: 1, opacity: 1, duration: .25, ease: 'back.out(1.8)' }
        );

        tl.to(number, {
            scale: 1.15,
            opacity: 0,
            duration: .55,
            ease: 'power2.in'
        }, '+=.2');
    }

    tl.to(countdown, {
        opacity: 0,
        duration: .45,
        onComplete: () => countdown.remove()
    });
}

function animatePhotoChapter(tl, chapter, options) {
    const photos = chapter.photos || [];

    for (let i = 0; i < photos.length; i++) {
        const src = photos[i];

        tl.call(() => {
            preloadImage(photos[i + 1]);
            preloadImage(photos[i + 2]);

            const card = createCard(src, 'is-focus');

            gsap.to(card, {
                opacity: 1,
                scale: 1,
                rotation: i % 2 === 0 ? -2 : 2,
                duration: options.transitionDuration,
                ease: 'back.out(1.25)'
            });
        });

        tl.to({}, { duration: options.photoDuration });

        tl.call(() => {
            const card = currentCards[currentCards.length - 1];
            if (!card) return;

            card.classList.remove('is-focus');

            const pos = positions[i % positions.length];

            gsap.to(card, {
                x: pos.x,
                y: pos.y,
                scale: pos.s,
                rotation: pos.r,
                opacity: 1,
                zIndex: i + 1,
                duration: options.moveBackDuration,
                ease: 'power3.inOut'
            });

            const decorCards = currentCards.filter(card => !card.classList.contains('is-focus'));

            if (decorCards.length > options.maxDecorPhotos) {
                const old = decorCards[0];

                gsap.to(old, {
                    opacity: 0,
                    scale: .25,
                    duration: options.removeDuration,
                    onComplete: () => {
                        old.remove();
                        currentCards = currentCards.filter(card => card !== old);
                    }
                });
            }
        });
    }
}

function buildTimeline() {
    clearCards();

    gsap.set('#finalScreen', { opacity: 0 });
    gsap.set(progressBar, { width: '0%' });

    const oldCountdown = document.querySelector('#countdownScreen');
    if (oldCountdown) oldCountdown.remove();

    mainTl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onUpdate: () => {
            if (progressBar) {
                gsap.set(progressBar, { width: `${mainTl.progress() * 100}%` });
            }
        }
    });

    showCountdown(mainTl);

    mainTl
        .set('.intro', { opacity: 1, scale: 1, pointerEvents: 'auto' })
        .from('.intro-kicker', { opacity: 0, y: 20, duration: .5 })
        .from('.intro-title', { opacity: 0, scale: .84, duration: .75 }, '-=.25')
        .from('.intro-text', { opacity: 0, y: 20, duration: .5 }, '-=.35')
        .to('.intro', { opacity: 0, scale: .96, duration: .45 });

    for (let c = 0; c < chapters.length; c++) {
        const chapter = chapters[c];
        const options = getChapterOptions(chapter);

        showChapterIntro(mainTl, chapter, c);
        animatePhotoChapter(mainTl, chapter, options);

        mainTl.to(currentCards, {
            opacity: 0,
            scale: .25,
            duration: .55,
            stagger: .015,
            onComplete: clearCards
        }, '+=.25');
    }

    mainTl
        .to('#finalScreen', { opacity: 1, duration: .8 })
        .from('.final-card', { y: 30, scale: .92, duration: .65 }, '<');
}

function setPaused(value) {
    isPaused = value;

    if (mainTl) {
        mainTl.paused(isPaused);
    }

    if (togglePlayBtn) {
        togglePlayBtn.textContent = isPaused ? 'Reprendre' : 'Pause';
    }
}

togglePlayBtn?.addEventListener('click', () => {
    setPaused(!isPaused);
});

restartBtn?.addEventListener('click', () => {
    setPaused(false);

    if (mainTl) {
        mainTl.kill();
    }

    buildTimeline();
});

buildTimeline();