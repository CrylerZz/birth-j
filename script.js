const config = {
    photoDuration: 1.2,
    transitionDuration: 1.2,
    maxDecorPhotos: 8,
    countdownDuration: 5,
    finalPhotoHoldDuration: 8,
};

const debug = {
    enabled: false,
    startChapterIndex: 0,
    skipCountdown: false,
};

const chapters = window.CHAPTERS || [];

const photosLayer = document.querySelector('#photosLayer');
const chapterIntro = document.querySelector('#chapterIntro');
const chapterNumber = document.querySelector('#chapterNumber');
const chapterTitle = document.querySelector('#chapterTitle');
const progressBar = document.querySelector('#progressBar');
const togglePlayBtn = document.querySelector('#togglePlayBtn');
const restartBtn = document.querySelector('#restartBtn');
const stage = document.querySelector('#stage');

const music = document.querySelector('#music');

const musicConfig = {
    volume: 0.48,
    fadeInDuration: 4,
};

let mainTl = null;
let isPaused = false;
let currentCards = [];
let globalZIndex = 100;

const positions = [
    { x: -520, y: -240, r: -11, s: .40 },
    { x: 520, y: -230, r: 9, s: .40 },
    { x: -560, y: 190, r: 7, s: .40 },
    { x: 560, y: 200, r: -8, s: .40 },
    { x: -300, y: -300, r: 5, s: .36 },
    { x: 310, y: 310, r: -5, s: .36 },
    { x: -130, y: 330, r: -4, s: .34 },
    { x: 140, y: -330, r: 4, s: .34 },
];

const finalDecorPositions = [
    { x: -560, y: -255, r: -9, s: .34 },
    { x: 560, y: -255, r: 8, s: .34 },
    { x: -620, y: 95, r: 6, s: .35 },
    { x: 620, y: 95, r: -7, s: .35 },
    { x: -520, y: 315, r: -5, s: .31 },
    { x: 520, y: 315, r: 5, s: .31 },
];

/* VARIANTES D'ANIMATION PHOTOS */

const animationHistory = {
    enter: [],
    idle: [],
    park: [],
};

const animationConfig = {
    avoidRepeatCount: 3,
};

const ENTER_VARIANTS = [
    {
        name: 'softZoomBlur',
        from: () => ({ x: 0, y: 24, scale: .54, rotation: randomBetween(-5, 5), opacity: 0, filter: 'blur(18px)' }),
        to: () => ({ x: 0, y: 0, scale: 1, rotation: randomBetween(-2, 2), opacity: 1, filter: 'blur(0px)' }),
        ease: 'power3.out',
    },
    {
        name: 'slideFromLeft',
        from: () => ({ x: -260, y: randomBetween(-45, 45), scale: .82, rotation: randomBetween(-9, -4), opacity: 0, filter: 'blur(6px)' }),
        to: () => ({ x: 0, y: 0, scale: 1, rotation: randomBetween(-2.2, 1), opacity: 1, filter: 'blur(0px)' }),
        ease: 'expo.out',
    },
    {
        name: 'slideFromRight',
        from: () => ({ x: 260, y: randomBetween(-45, 45), scale: .82, rotation: randomBetween(4, 9), opacity: 0, filter: 'blur(6px)' }),
        to: () => ({ x: 0, y: 0, scale: 1, rotation: randomBetween(-1, 2.2), opacity: 1, filter: 'blur(0px)' }),
        ease: 'expo.out',
    },
    {
        name: 'riseFromBottom',
        from: () => ({ x: randomBetween(-35, 35), y: 150, scale: .78, rotation: randomBetween(-4, 4), opacity: 0, filter: 'blur(10px)' }),
        to: () => ({ x: 0, y: 0, scale: 1, rotation: randomBetween(-2, 2), opacity: 1, filter: 'blur(0px)' }),
        ease: 'back.out(1.15)',
    },
    {
        name: 'dropFromTop',
        from: () => ({ x: randomBetween(-35, 35), y: -140, scale: .86, rotation: randomBetween(-7, 7), opacity: 0, filter: 'blur(8px)' }),
        to: () => ({ x: 0, y: 0, scale: 1, rotation: randomBetween(-2, 2), opacity: 1, filter: 'blur(0px)' }),
        ease: 'back.out(1.3)',
    },
    {
        name: 'rotateReveal',
        from: () => ({ x: 0, y: 0, scale: .72, rotation: randomSign() * randomBetween(12, 18), opacity: 0, filter: 'blur(12px)' }),
        to: () => ({ x: 0, y: 0, scale: 1, rotation: randomBetween(-1.8, 1.8), opacity: 1, filter: 'blur(0px)' }),
        ease: 'power4.out',
    },
    {
        name: 'snapPop',
        from: () => ({ x: 0, y: 0, scale: .32, rotation: randomBetween(-3, 3), opacity: 0, filter: 'blur(3px)' }),
        to: () => ({ x: 0, y: 0, scale: 1, rotation: randomBetween(-2, 2), opacity: 1, filter: 'blur(0px)' }),
        ease: 'back.out(1.8)',
    },
];

const IDLE_VARIANTS = [
    {
        name: 'slowZoomIn',
        to: () => ({ scale: 1.045, x: randomBetween(-8, 8), y: randomBetween(-5, 5), rotation: randomBetween(-1.5, 1.5) }),
    },
    {
        name: 'slowZoomOut',
        to: () => ({ scale: .965, x: randomBetween(-8, 8), y: randomBetween(-5, 5), rotation: randomBetween(-1.5, 1.5) }),
    },
    {
        name: 'driftLeft',
        to: () => ({ x: -34, y: randomBetween(-10, 10), scale: 1.018, rotation: randomBetween(-2.2, -.4) }),
    },
    {
        name: 'driftRight',
        to: () => ({ x: 34, y: randomBetween(-10, 10), scale: 1.018, rotation: randomBetween(.4, 2.2) }),
    },
    {
        name: 'gentleFloat',
        to: () => ({ x: randomBetween(-16, 16), y: randomBetween(-20, -8), scale: 1.025, rotation: randomBetween(-1.4, 1.4) }),
    },
    {
        name: 'quietHold',
        to: () => ({ x: randomBetween(-4, 4), y: randomBetween(-4, 4), scale: 1.005, rotation: randomBetween(-.6, .6) }),
    },
];

const PARK_VARIANTS = [
    {
        name: 'classicBack',
        build: (pos) => ({ x: pos.x, y: pos.y, scale: pos.s, rotation: pos.r, opacity: 1, filter: 'blur(0px)' }),
        ease: 'power3.inOut',
    },
    {
        name: 'blurToBack',
        build: (pos) => ({ x: pos.x, y: pos.y, scale: pos.s, rotation: pos.r, opacity: .96, filter: 'blur(1px)' }),
        ease: 'power2.inOut',
    },
    {
        name: 'spinToBack',
        build: (pos) => ({ x: pos.x, y: pos.y, scale: pos.s, rotation: pos.r + randomSign() * randomBetween(5, 9), opacity: 1, filter: 'blur(0px)' }),
        ease: 'back.inOut(1.1)',
    },
    {
        name: 'pushAway',
        build: (pos) => ({ x: pos.x, y: pos.y, scale: pos.s * .92, rotation: pos.r, opacity: .92, filter: 'blur(1.5px)' }),
        ease: 'power4.inOut',
    },
    {
        name: 'floatToSlot',
        build: (pos) => ({ x: pos.x + randomBetween(-18, 18), y: pos.y + randomBetween(-14, 14), scale: pos.s, rotation: pos.r, opacity: 1, filter: 'blur(0px)' }),
        ease: 'sine.inOut',
    },
    {
        name: 'quickSlideBack',
        build: (pos) => ({ x: pos.x, y: pos.y, scale: pos.s, rotation: pos.r, opacity: 1, filter: 'blur(0px)' }),
        ease: 'expo.inOut',
        durationFactor: .82,
    },
];

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function randomSign() {
    return Math.random() < .5 ? -1 : 1;
}

function pickVariant(type, variants) {
    if (!variants.length) return null;

    const recent = animationHistory[type] || [];
    const available = variants.filter(variant => !recent.includes(variant.name));
    const pool = available.length ? available : variants;
    const variant = pool[Math.floor(Math.random() * pool.length)];

    animationHistory[type].push(variant.name);
    animationHistory[type] = animationHistory[type].slice(-animationConfig.avoidRepeatCount);

    return variant;
}

function resetAnimationHistory() {
    animationHistory.enter = [];
    animationHistory.idle = [];
    animationHistory.park = [];
}

function buildPhotoScene() {
    return {
        enter: pickVariant('enter', ENTER_VARIANTS),
        idle: pickVariant('idle', IDLE_VARIANTS),
        park: pickVariant('park', PARK_VARIANTS),
    };
}

function preloadImage(src) {
    if (!src) return;
    const img = new Image();
    img.src = encodeURI(src);
}

function createCard(src, className = '') {
    const card = document.createElement('article');
    card.className = `polaroid ${className}`;

    const img = document.createElement('img');
    const encodedSrc = encodeURI(src);

    img.src = encodedSrc;
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
        scale: .72,
        rotation: 0,
        opacity: 0,
        filter: 'blur(0px)',
        transformOrigin: '50% 50%',
        force3D: true,
        zIndex: globalZIndex++,
    });

    currentCards.push(card);
    return card;
}

function clearCards() {
    currentCards.forEach(card => {
        gsap.killTweensOf(card);
        card.remove();
    });

    currentCards = [];
}

function resetFinalState() {
    stage?.classList.remove('is-final-section');

    const oldFinalText = document.querySelector('#finalTextLayer');
    if (oldFinalText) oldFinalText.remove();
}

function animatePhotoChapter(tl, chapter, options) {
    const photos = chapter.photos || [];

    for (let i = 0; i < photos.length; i++) {
        const src = photos[i];
        let scene = null;

        tl.call(() => {
            preloadImage(photos[i + 1]);
            preloadImage(photos[i + 2]);

            scene = buildPhotoScene();

            const card = createCard(src, 'is-focus');

            animateCardEnter(card, scene, options);
            animateCardIdle(card, scene, options);
        });

        tl.to({}, { duration: options.photoDuration });

        tl.call(() => {
            const activeCard = getActiveFocusCard();
            sendCardToBackground(activeCard, i, options, scene);
            removeOldDecorCards(options);
        });

        tl.to({}, { duration: options.breatheDuration });
    }
}

function setChapter(chapter) {
    if (chapterNumber) {
        chapterNumber.textContent = '';
    }

    chapterTitle.innerHTML = `
        <div class="chapter-title-decorated">
            <div class="chapter-bg-word">Souvenirs</div>

            <div class="chapter-stars">
                <span>✦</span>
                <span>♡</span>
                <span>✦</span>
            </div>

            <div class="chapter-line chapter-line-top"></div>

            <h2 class="chapter-main-title">${chapter.title}</h2>

            <div class="chapter-line chapter-line-bottom"></div>

            <div class="chapter-small-text">Julia · 18 ans · souvenirs</div>
        </div>
    `;
}

function getChapterOptions() {
    return {
        photoDuration: config.photoDuration,
        transitionDuration: config.transitionDuration,
        maxDecorPhotos: config.maxDecorPhotos,
        removeDuration: 0.35,
        moveBackDuration: 0.6,
        breatheDuration: 0.4,
    };
}

function getStartIndex() {
    if (!debug.enabled) return 0;

    return Math.min(
        Math.max(debug.startChapterIndex, 0),
        Math.max(chapters.length - 1, 0)
    );
}

function showChapterIntro(tl, chapter) {
    tl.call(() => setChapter(chapter))
        .set(chapterIntro, {
            opacity: 0,
            scale: .96,
            zIndex: globalZIndex++,
        })
        .set('.chapter-line', { scaleX: 0 })
        .set('.chapter-stars span', {
            opacity: 0,
            y: 12,
            scale: .7,
        })
        .set('.chapter-main-title', {
            opacity: 0,
            y: 28,
            scale: .94,
        })
        .set('.chapter-small-text', {
            opacity: 0,
            y: 14,
        })
        .set('.chapter-bg-word', {
            opacity: 0,
            scale: .9,
        })
        .to(chapterIntro, {
            opacity: 1,
            scale: 1,
            duration: .45,
        })
        .to('.chapter-bg-word', {
            opacity: 1,
            scale: 1,
            duration: .6,
        }, '-=.2')
        .to('.chapter-stars span', {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: .45,
            stagger: .08,
            ease: 'back.out(2)',
        }, '-=.35')
        .to('.chapter-line', {
            scaleX: 1,
            duration: .55,
            stagger: .08,
            ease: 'power3.out',
        }, '-=.25')
        .to('.chapter-main-title', {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: .65,
            ease: 'power3.out',
        }, '-=.25')
        .to('.chapter-small-text', {
            opacity: 1,
            y: 0,
            duration: .45,
        }, '-=.25')
        .to(chapterIntro, {
            opacity: 0,
            scale: 1.03,
            duration: .55,
        }, '+=.75');
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

    gsap.set(countdown, {
        opacity: 1,
        zIndex: globalZIndex++,
    });

    for (let i = config.countdownDuration; i >= 1; i--) {
        tl.call(() => {
            number.textContent = i;
        });

        tl.fromTo(number,
            { scale: .55, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: .25,
                ease: 'back.out(1.8)',
            }
        );

        tl.to(number, {
            scale: 1.15,
            opacity: 0,
            duration: .55,
            ease: 'power2.in',
        }, '+=.2');
    }

    tl.to(countdown, {
        opacity: 0,
        duration: .45,
        onComplete: () => countdown.remove(),
    });
}

function animateCardEnter(card, scene, options) {
    const enter = scene.enter || ENTER_VARIANTS[0];

    gsap.killTweensOf(card);

    gsap.set(card, {
        ...enter.from(),
        zIndex: globalZIndex++,
    });

    gsap.to(card, {
        ...enter.to(),
        duration: options.transitionDuration * randomBetween(.86, 1.18),
        ease: enter.ease || 'power3.out',
    });
}

function animateCardIdle(card, scene, options) {
    const idle = scene.idle || IDLE_VARIANTS[0];

    gsap.to(card, {
        ...idle.to(),
        duration: Math.max(.25, options.photoDuration),
        ease: 'sine.inOut',
    });
}

function sendCardToBackground(card, index, options, scene = null) {
    if (!card) return;

    const park = scene?.park || pickVariant('park', PARK_VARIANTS) || PARK_VARIANTS[0];
    const pos = positions[index % positions.length];

    card.classList.remove('is-focus');
    card.classList.add('is-decor');

    gsap.killTweensOf(card);

    gsap.to(card, {
        ...park.build(pos),
        zIndex: Math.max(1, globalZIndex - 100),
        duration: options.moveBackDuration * (park.durationFactor || 1),
        ease: park.ease || 'power3.inOut',
    });
}

function removeOldDecorCards(options) {
    const decorCards = currentCards.filter(card => card.classList.contains('is-decor'));

    if (decorCards.length <= options.maxDecorPhotos) return;

    const old = decorCards[0];

    gsap.killTweensOf(old);

    gsap.to(old, {
        opacity: 0,
        scale: .25,
        filter: 'blur(10px)',
        duration: options.removeDuration,
        ease: 'power2.in',
        onComplete: () => {
            old.remove();
            currentCards = currentCards.filter(card => card !== old);
        },
    });
}

function getActiveFocusCard() {
    const focusCards = currentCards.filter(card => card.classList.contains('is-focus'));
    return focusCards[focusCards.length - 1] || null;
}

function createFinalTextLayer() {
    const old = document.querySelector('#finalTextLayer');
    if (old) old.remove();

    const layer = document.createElement('section');
    layer.id = 'finalTextLayer';
    layer.className = 'final-section';

    layer.innerHTML = `
        <div class="final-title-wrap">
            <div class="final-title">END</div>
            <div class="final-line">
                <span></span>
                <i>♡</i>
                <span></span>
            </div>
        </div>

        <div class="final-note final-note-left">
            Grandir ensemble,<br>
            rire, partager,<br>
            s’aimer.
        </div>

        <div class="final-note final-note-right">
            Des souvenirs<br>
            qui resteront<br>
            pour toujours.
        </div>

        <div class="final-note final-note-bottom">
            Merci pour tous ces moments inoubliables.
        </div>

        <div class="final-glow-heart">♡</div>
    `;

    stage.appendChild(layer);

    gsap.set(layer, {
        opacity: 0,
        zIndex: globalZIndex++,
    });

    return layer;
}

function animateFinalChapter(tl, chapter, options) {
    const decorPhotos = (chapter.photos || []).slice(0, 6);
    const mainPhoto = chapter.mainPhoto || decorPhotos[0];

    if (!mainPhoto) return;

    tl.call(() => {
        stage?.classList.add('is-final-section');
    });

    const finalTextLayer = createFinalTextLayer();

    decorPhotos.forEach((src, index) => {
        tl.call(() => {
            const card = createCard(src, 'is-decor is-final-decor');
            const pos = finalDecorPositions[index % finalDecorPositions.length];

            gsap.set(card, {
                x: pos.x,
                y: pos.y,
                scale: pos.s,
                rotation: pos.r,
                opacity: 0,
                filter: 'blur(0px)',
                zIndex: 20 + index,
            });

            gsap.to(card, {
                opacity: 1,
                duration: .55,
                ease: 'power2.out',
            });
        });

        tl.to({}, { duration: .12 });
    });

    tl.to({}, { duration: .35 });

    tl.call(() => {
        const card = createCard(mainPhoto, 'is-focus is-final-main');

        gsap.set(card, {
            x: 0,
            y: 25,
            scale: .72,
            rotation: 0,
            opacity: 0,
            filter: 'blur(12px)',
            zIndex: globalZIndex++,
        });

        gsap.to(card, {
            opacity: 1,
            scale: .92,
            rotation: 0,
            filter: 'blur(0px)',
            duration: options.transitionDuration,
            ease: 'back.out(1.25)',
        });
    });

    tl.to(finalTextLayer, {
        opacity: 1,
        duration: .7,
    }, '-=.7');

    tl.from('.final-title', {
        y: -35,
        opacity: 0,
        scale: .92,
        duration: .75,
        ease: 'power3.out',
    }, '-=.45');

    tl.from('.final-line span', {
        width: 0,
        duration: .6,
        stagger: .08,
        ease: 'power3.out',
    }, '-=.35');

    tl.from('.final-line i', {
        scale: 0,
        opacity: 0,
        duration: .4,
        ease: 'back.out(2)',
    }, '-=.25');

    tl.from('.final-note', {
        y: 18,
        opacity: 0,
        duration: .6,
        stagger: .18,
        ease: 'power3.out',
    }, '-=.15');

    tl.from('.final-glow-heart', {
        opacity: 0,
        scale: .4,
        duration: .7,
        ease: 'back.out(2)',
    }, '-=.25');

    tl.to('.final-glow-heart', {
        scale: 1.12,
        opacity: .75,
        duration: 1.2,
        repeat: 3,
        yoyo: true,
        ease: 'sine.inOut',
    });

    tl.to({}, {
        duration: config.finalPhotoHoldDuration,
    });
}

function fadeOutChapterCards(tl) {
    tl.to(currentCards, {
        opacity: 0,
        scale: .25,
        filter: 'blur(10px)',
        duration: .55,
        stagger: .015,
        ease: 'power2.in',
        onComplete: clearCards,
    }, '+=.25');
}

/* MUSIQUE UNIQUE */

function resetMusic() {
    if (!music) return;

    gsap.killTweensOf(music);

    music.pause();
    music.currentTime = 0;
    music.volume = 0;
}

async function startMusic() {
    if (!music) return;

    gsap.killTweensOf(music);

    music.currentTime = 0;
    music.volume = 0;

    try {
        await music.play();
    } catch (error) {
        console.warn('Musique bloquée par le navigateur.', error);
        return;
    }

    gsap.to(music, {
        volume: musicConfig.volume,
        duration: musicConfig.fadeInDuration,
        ease: 'power2.inOut',
    });
}

function pauseMusic() {
    if (!music || music.paused) return;
    music.pause();
}

function resumeMusic() {
    if (!music) return;
    music.play().catch(() => {});
}

/* TIMELINE */

function buildTimeline() {
    clearCards();
    resetFinalState();
    resetMusic();
    resetAnimationHistory();

    globalZIndex = 100;

    gsap.set(progressBar, {
        width: '0%',
    });

    const oldCountdown = document.querySelector('#countdownScreen');
    if (oldCountdown) oldCountdown.remove();

    mainTl = gsap.timeline({
        defaults: {
            ease: 'power3.out',
        },
        onUpdate: () => {
            if (progressBar) {
                gsap.set(progressBar, {
                    width: `${mainTl.progress() * 100}%`,
                });
            }
        },
    });

    if (!debug.enabled || !debug.skipCountdown) {
        showCountdown(mainTl);
    }

    mainTl.call(() => {
        startMusic();
    });

    const startIndex = getStartIndex();

    for (let c = startIndex; c < chapters.length; c++) {
        const chapter = chapters[c];
        const options = getChapterOptions();

        showChapterIntro(mainTl, chapter);

        if (chapter.isFinal) {
            animateFinalChapter(mainTl, chapter, options);
        } else {
            animatePhotoChapter(mainTl, chapter, options);
            fadeOutChapterCards(mainTl);
        }
    }
}

function setPaused(value) {
    isPaused = value;

    if (mainTl) {
        mainTl.paused(isPaused);
    }

    if (isPaused) {
        pauseMusic();
    } else {
        resumeMusic();
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

/* PRELOAD PROGRESSIF DES IMAGES */

const imageCache = new Map();

function getAllSlideshowImages() {
    const allImages = [];

    chapters.forEach(chapter => {
        if (chapter.mainPhoto) {
            allImages.push(chapter.mainPhoto);
        }

        (chapter.photos || []).forEach(photo => {
            allImages.push(photo);
        });
    });

    return [...new Set(allImages.filter(Boolean))];
}

function preloadOneImage(src) {
    return new Promise(resolve => {
        if (!src) return resolve(null);

        const encodedSrc = encodeURI(src);

        if (imageCache.has(encodedSrc)) {
            return resolve(imageCache.get(encodedSrc));
        }

        const img = new Image();

        img.onload = async () => {
            try {
                if (img.decode) {
                    await img.decode();
                }
            } catch (error) {}

            imageCache.set(encodedSrc, img);
            resolve(img);
        };

        img.onerror = () => {
            console.warn('Image impossible à précharger :', src);
            resolve(null);
        };

        img.src = encodedSrc;
    });
}

async function preloadImagesProgressively(onProgress) {
    const images = getAllSlideshowImages();

    if (!images.length) {
        onProgress?.(100, 0, 0);
        return;
    }

    const batchSize = 5;
    let loaded = 0;

    for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);

        await Promise.all(
            batch.map(src => preloadOneImage(src))
        );

        loaded += batch.length;

        const percent = Math.min(100, Math.round((loaded / images.length) * 100));

        onProgress?.(percent, loaded, images.length);

        await new Promise(resolve => setTimeout(resolve, 25));
    }
}

const startScreen = document.querySelector('#startScreen');
const startBtn = document.querySelector('#startBtn');

gsap.set(startScreen, {
    opacity: 1,
});

startBtn?.addEventListener('click', async () => {
    if (!startBtn || !startScreen) return;

    startBtn.disabled = true;

    const originalText = startBtn.textContent;

    await preloadImagesProgressively((percent) => {
        startBtn.textContent = `Préparation des souvenirs... ${percent}%`;
    });

    startBtn.textContent = originalText || 'Commencer';

    gsap.to(startScreen, {
        opacity: 0,
        scale: 1.03,
        duration: 1,
        ease: 'power3.inOut',
        onComplete: () => {
            startScreen.remove();
            buildTimeline();
        },
    });
});