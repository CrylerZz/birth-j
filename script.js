const config = {
    photoDuration: 1.4,
    transitionDuration: 1.4,
    maxDecorPhotos: 8,
    countdownDuration: 5,
    finalPhotoHoldDuration: 8,
};

const debug = {
    enabled: true,
    startChapterIndex: 2,
    skipCountdown: true,
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
        scale: .72,
        rotation: 0,
        opacity: 0,
        force3D: true,
        zIndex: globalZIndex++,
    });

    currentCards.push(card);
    return card;
}

function clearCards() {
    currentCards.forEach(card => card.remove());
    currentCards = [];
}

function resetFinalState() {
    stage?.classList.remove('is-final-section');

    const oldFinalText = document.querySelector('#finalTextLayer');
    if (oldFinalText) oldFinalText.remove();
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
        moveBackDuration: 0.8,
        breatheDuration: 0.6,
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
        .set('.chapter-line', {
            scaleX: 0,
        })
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

function sendCardToBackground(card, index, options) {
    if (!card) return;

    card.classList.remove('is-focus');
    card.classList.add('is-decor');

    const pos = positions[index % positions.length];

    gsap.to(card, {
        x: pos.x,
        y: pos.y,
        scale: pos.s,
        rotation: pos.r,
        opacity: 1,
        zIndex: Math.max(1, globalZIndex - 100),
        duration: options.moveBackDuration,
        ease: 'power3.inOut',
    });
}

function removeOldDecorCards(options) {
    const decorCards = currentCards.filter(card => card.classList.contains('is-decor'));

    if (decorCards.length <= options.maxDecorPhotos) return;

    const old = decorCards[0];

    gsap.to(old, {
        opacity: 0,
        scale: .25,
        duration: options.removeDuration,
        ease: 'power2.in',
        onComplete: () => {
            old.remove();
            currentCards = currentCards.filter(card => card !== old);
        },
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

            gsap.set(card, {
                zIndex: globalZIndex++,
            });

            gsap.to(card, {
                opacity: 1,
                scale: 1,
                rotation: i % 2 === 0 ? -2 : 2,
                duration: options.transitionDuration,
                ease: 'back.out(1.25)',
            });
        });

        tl.to({}, { duration: options.photoDuration });

        tl.call(() => {
            const activeCard = currentCards.find(card => card.classList.contains('is-focus'));

            sendCardToBackground(activeCard, i, options);
            removeOldDecorCards(options);
        });

        tl.to({}, { duration: options.breatheDuration });
    }
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
            zIndex: globalZIndex++,
        });

        gsap.to(card, {
            opacity: 1,
            scale: .92,
            rotation: 0,
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
        duration: .55,
        stagger: .015,
        ease: 'power2.in',
        onComplete: clearCards,
    }, '+=.25');
}

function buildTimeline() {
    clearCards();
    resetFinalState();

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