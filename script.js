// ============================================================
//  БАЗА ДАННЫХ
// ============================================================

const COMPOSERS = [
    'Пётр Ильич Чайковский',
    'Евгений Дмитриевич Дога',
    'Людовико Эйнауди',
    'Ференц Лист',
    'Сергей Васильевич Рахманинов',
    'Альфред Гарриевич Шнитке',
    'Дмитрий Дмитриевич Шостакович',
    'Георгий Васильевич Свиридов'
];

const WORKS = [
    {
        composer: 'Пётр Ильич Чайковский',
        title: 'Октябрь. «Осенняя песнь» из цикла «Времена года»',
        file: 'chaikovsky_oktabr.mp3'
    },
    {
        composer: 'Пётр Ильич Чайковский',
        title: 'Размышление',
        file: 'chaikovsky_razmyshlenie.MP3'
    },
    {
        composer: 'Евгений Дмитриевич Дога',
        title: 'Вальс «Граммофон»',
        file: 'doga_grammofon.mp3'
    },
    {
        composer: 'Людовико Эйнауди',
        title: 'Experience',
        file: 'einaudi_experience.mp3'
    },
    {
        composer: 'Ференц Лист',
        title: 'Грёзы любви',
        file: 'list_grezylubvi.MP3'
    },
    {
        composer: 'Сергей Васильевич Рахманинов',
        title: 'Концерт для фортепиано №2',
        file: 'rahmaninoff_concert2.mp3'
    },
    {
        composer: 'Сергей Васильевич Рахманинов',
        title: 'Прелюдия до-диез минор',
        file: 'rahmaninoff_preludedodiezminor.MP3'
    },
    {
        composer: 'Альфред Гарриевич Шнитке',
        title: 'Полька из музыки к кинофильму «Мёртвые души»',
        file: 'shnitke_polkamertvyedushi.mp3'
    },
    {
        composer: 'Альфред Гарриевич Шнитке',
        title: '«Лес сказок»',
        file: 'shnitke_lesskazok.mp3'
    },
    {
        composer: 'Дмитрий Дмитриевич Шостакович',
        title: 'Прелюдия ре-мажор',
        file: 'shostakovich_prelude5remajor.mp3'
    },
    {
        composer: 'Георгий Васильевич Свиридов',
        title: 'Вальс из кинофильма «Метель»',
        file: 'sviridov_metel.mp3'
    }
];

// ============================================================
//  СОСТОЯНИЕ ИГРЫ
// ============================================================
const TOTAL_QUESTIONS = 5;

let state = {
    questions: [],
    currentIndex: 0,
    score: 0,
    isAnswered: false,
    audioElement: null,
    animationId: null,
    isPaused: false,
    currentWork: null,
};

// DOM-элементы
const $ = id => document.getElementById(id);
const startScreen = $('startScreen');
const gameScreen = $('gameScreen');
const resultScreen = $('resultScreen');
const scoreDisplay = $('scoreDisplay');
const optionsContainer = $('optionsContainer');
const btnNext = $('btnNext');
const btnStart = $('btnStart');
const btnRestart = $('btnRestart');
const btnPause = $('btnPause');
const btnExit = $('btnExit');
const pulseRing = $('pulseRing');
const finalScore = $('finalScore');
const resultTitle = $('resultTitle');
const resultDetail = $('resultDetail');
const workTitle = $('workTitle');

// ============================================================
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// ============================================================
//  ГЕНЕРАЦИЯ ВОПРОСОВ
// ============================================================
function generateQuestions() {
    const shuffledWorks = shuffle([...WORKS]);
    const selectedWorks = shuffledWorks.slice(0, TOTAL_QUESTIONS);
    
    const questions = selectedWorks.map((work) => {
        const correctComposer = work.composer;
        
        let wrongComposer = correctComposer;
        const otherComposers = COMPOSERS.filter(c => c !== correctComposer);
        
        if (otherComposers.length > 0) {
            wrongComposer = getRandomElement(otherComposers);
        }
        
        let options = [
            { name: correctComposer, isCorrect: true },
            { name: wrongComposer, isCorrect: false }
        ];
        
        options = shuffle(options);
        const correctIndex = options.findIndex(opt => opt.isCorrect === true);
        
        return {
            work: work,
            correctComposer: correctComposer,
            options: options,
            correctIndex: correctIndex
        };
    });
    
    return questions;
}

// ============================================================
//  ОСТАНОВКА АУДИО
// ============================================================
function stopAudio() {
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }
    
    if (state.audioElement) {
        try {
            state.audioElement.pause();
            state.audioElement.currentTime = 0;
            state.audioElement.src = '';
            state.audioElement.load();
        } catch (e) {}
        state.audioElement = null;
    }
    
    pulseRing.className = 'pulse-ring';
    pulseRing.style.borderColor = 'rgba(41, 128, 255, 0.05)';
    pulseRing.style.boxShadow = 'inset 0 0 30px rgba(41, 128, 255, 0), 0 0 30px rgba(41, 128, 255, 0)';
    pulseRing.style.background = 'transparent';
}

// ============================================================
//  УПРАВЛЕНИЕ ИГРОЙ
// ============================================================
function togglePause() {
    state.isPaused = !state.isPaused;
    
    if (state.isPaused) {
        btnPause.textContent = 'Продолжить';
        btnPause.classList.add('active');
        
        if (state.audioElement) {
            state.audioElement.pause();
        }
        
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
        
        pulseRing.className = 'pulse-ring';
        pulseRing.style.borderColor = 'rgba(41, 128, 255, 0.15)';
        pulseRing.style.boxShadow = 'inset 0 0 20px rgba(41, 128, 255, 0.02), 0 0 20px rgba(41, 128, 255, 0.02)';
        pulseRing.style.background = 'transparent';
        
        document.querySelectorAll('.btn-option').forEach(btn => {
            btn.disabled = true;
        });
        
    } else {
        btnPause.textContent = 'Пауза';
        btnPause.classList.remove('active');
        
        if (state.audioElement) {
            state.audioElement.play().catch(err => console.warn('Ошибка возобновления:', err));
        }
        
        startPulseAnimation();
        
        if (!state.isAnswered) {
            document.querySelectorAll('.btn-option').forEach(btn => {
                btn.disabled = false;
            });
        }
    }
}

function exitGame() {
    stopAudio();
    state.isPaused = false;
    state.isAnswered = false;
    
    btnPause.textContent = 'Пауза';
    btnPause.classList.remove('active');
    
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    
    state.score = 0;
    state.currentIndex = 0;
    state.questions = generateQuestions();
    scoreDisplay.textContent = '0';
    workTitle.textContent = '';
    btnNext.style.display = 'none';
    
    document.querySelectorAll('.btn-option').forEach(btn => {
        btn.disabled = false;
        btn.className = 'btn-option';
    });
}

// ============================================================
//  ПУЛЬСАЦИЯ
// ============================================================
function startPulseAnimation() {
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
    }
    
    let startTime = Date.now();
    
    function animatePulse() {
        const elapsed = (Date.now() - startTime) / 1000;
        
        const pulse1 = 0.5 + 0.5 * Math.sin(elapsed * 3.2);
        const pulse2 = 0.5 + 0.5 * Math.sin(elapsed * 1.7 + 1.2);
        const pulse3 = 0.5 + 0.5 * Math.sin(elapsed * 4.5 + 0.8);
        
        const rawIntensity = (pulse1 * 0.6 + pulse2 * 0.3 + pulse3 * 0.1);
        const intensity = 0.1 + rawIntensity * 0.8;
        
        updatePulseRingIntensity(intensity);
        
        state.animationId = requestAnimationFrame(animatePulse);
    }
    
    animatePulse();
}

function updatePulseRingIntensity(intensity) {
    pulseRing.classList.add('active');
    
    const smoothIntensity = intensity * intensity * (3 - 2 * intensity);
    
    const minIntensity = 0.05;
    const maxIntensity = 1.0;
    const finalIntensity = minIntensity + (maxIntensity - minIntensity) * smoothIntensity;
    
    if (finalIntensity > 0.8) {
        pulseRing.className = 'pulse-ring intense';
    } else if (finalIntensity > 0.5) {
        pulseRing.className = 'pulse-ring strong';
    } else {
        pulseRing.className = 'pulse-ring active';
    }

    const glow = 20 + finalIntensity * 160;
    const borderOpacity = 0.1 + finalIntensity * 0.85;
    const insetGlow = finalIntensity * 200;
    
    pulseRing.style.borderColor = 'rgba(41, 128, 255, ' + borderOpacity + ')';
    pulseRing.style.boxShadow = 
        'inset 0 0 ' + insetGlow + 'px rgba(41, 128, 255, ' + (0.03 + finalIntensity * 0.25) + '), ' +
        'inset 0 0 ' + (insetGlow * 2) + 'px rgba(41, 128, 255, ' + (0.01 + finalIntensity * 0.12) + '), ' +
        '0 0 ' + glow + 'px rgba(41, 128, 255, ' + (0.03 + finalIntensity * 0.2) + ')';
    
    const alpha = 0.01 + finalIntensity * 0.15;
    pulseRing.style.background = 'radial-gradient(' +
        'ellipse at center, ' +
        'rgba(41, 128, 255, ' + alpha + ') 0%, ' +
        'rgba(41, 128, 255, ' + (alpha * 0.4) + ') 40%, ' +
        'transparent 70%' +
    ')';
}

// ============================================================
//  ВОСПРОИЗВЕДЕНИЕ АУДИО
// ============================================================
function playMelody(work, onComplete) {
    const filePath = 'audio/' + work.file;
    console.log('Воспроизведение:', work.title, '—', work.composer);
    
    state.currentWork = work;
    
    stopAudio();
    
    setTimeout(() => {
        try {
            const audio = new Audio();
            audio.src = filePath;
            audio.preload = 'auto';
            
            startPulseAnimation();
            
            audio.addEventListener('canplaythrough', function onCanPlay() {
                audio.removeEventListener('canplaythrough', onCanPlay);
                audio.play().then(() => {
                    state.audioElement = audio;
                    if (onComplete) onComplete();
                }).catch(err => {
                    console.warn('Ошибка воспроизведения:', err);
                    if (onComplete) onComplete();
                });
            });
            
            audio.addEventListener('error', function(e) {
                console.warn('Ошибка загрузки аудио:', filePath);
                if (onComplete) onComplete();
            });
            
            audio.load();
            state.audioElement = audio;
            
        } catch (e) {
            console.error('Критическая ошибка:', e);
            startPulseAnimation();
            if (onComplete) onComplete();
        }
    }, 100);
}

// ============================================================
//  ЗАГРУЗКА ВОПРОСА
// ============================================================
function loadQuestion(index) {
    const q = state.questions[index];
    if (!q) {
        console.warn('Вопрос не найден, индекс:', index);
        return;
    }

    state.isAnswered = false;
    state.isPaused = false;
    btnPause.textContent = 'Пауза';
    btnPause.classList.remove('active');
    workTitle.textContent = '';
    btnNext.style.display = 'none';

    scoreDisplay.textContent = state.score;

    const btns = optionsContainer.querySelectorAll('.btn-option');
    btns.forEach((btn, i) => {
        if (i < q.options.length) {
            btn.textContent = q.options[i].name;
            btn.dataset.correct = q.options[i].isCorrect ? 'true' : 'false';
            btn.className = 'btn-option';
            btn.disabled = false;
        }
    });

    setTimeout(() => {
        playMelody(q.work);
    }, 300);
}

// ============================================================
//  ОБРАБОТКА КЛИКА ПО ВАРИАНТУ
// ============================================================
function handleOptionClick(e) {
    const btn = e.currentTarget;
    if (state.isAnswered) return;
    if (btn.disabled) return;

    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 300);

    const isCorrect = btn.dataset.correct === 'true';
    state.isAnswered = true;

    stopAudio();

    const allBtns = optionsContainer.querySelectorAll('.btn-option');
    allBtns.forEach(b => b.disabled = true);

    allBtns.forEach(b => {
        if (b.dataset.correct === 'true') {
            b.classList.add('correct');
        } else if (b === btn && !isCorrect) {
            b.classList.add('wrong');
        }
    });

    const currentWork = state.questions[state.currentIndex].work;
    workTitle.textContent = currentWork.title + ' — ' + currentWork.composer;

    if (isCorrect) {
        state.score += 1;
        scoreDisplay.textContent = state.score;
    }

    if (state.currentIndex < state.questions.length - 1) {
        btnNext.style.display = 'block';
        btnNext.textContent = 'Следующий вопрос';
    } else {
        btnNext.style.display = 'block';
        btnNext.textContent = 'Узнать результат';
    }
}

// ============================================================
//  ПЕРЕХОД К СЛЕДУЮЩЕМУ ВОПРОСУ / РЕЗУЛЬТАТ
// ============================================================
function goToNext() {
    state.currentIndex++;
    if (state.currentIndex < state.questions.length) {
        loadQuestion(state.currentIndex);
    } else {
        showResult();
    }
}

// ============================================================
//  РЕЗУЛЬТАТ
// ============================================================
function showResult() {
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'flex';
    startScreen.style.display = 'none';

    const total = state.questions.length;
    finalScore.textContent = state.score + '/' + total;

    if (state.score === total) {
        resultTitle.textContent = 'Идеально!';
        resultDetail.textContent = 'Огромный и чудесный мир музыки ждёт Вас!';
    } else if (state.score >= total * 0.8) {
        resultTitle.textContent = 'Отлично!';
        resultDetail.textContent = 'Огромный и чудесный мир музыки ждёт Вас!';
    } else if (state.score >= total * 0.6) {
        resultTitle.textContent = 'Очень хорошо!';
        resultDetail.textContent = 'Огромный и чудесный мир музыки ждёт Вас!';
    } else if (state.score >= total * 0.4) {
        resultTitle.textContent = 'Хорошо!';
        resultDetail.textContent = 'Отлично справляетесь!';
    } else {
        resultTitle.textContent = 'Неплохо!';
        resultDetail.textContent = 'Огромный и чудесный мир музыки ждёт Вас!';
    }
}

// ============================================================
//  СБРОС / СТАРТ
// ============================================================
function resetGame() {
    stopAudio();
    state.score = 0;
    state.currentIndex = 0;
    state.isAnswered = false;
    state.isPaused = false;
    state.questions = generateQuestions();

    btnPause.textContent = 'Пауза';
    btnPause.classList.remove('active');

    scoreDisplay.textContent = '0';
    workTitle.textContent = '';
    btnNext.style.display = 'none';

    startScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'none';
}

function startGame() {
    state.questions = generateQuestions();
    state.score = 0;
    state.currentIndex = 0;
    state.isPaused = false;
    btnPause.textContent = 'Пауза';
    btnPause.classList.remove('active');

    startScreen.style.display = 'none';
    resultScreen.style.display = 'none';
    gameScreen.style.display = 'flex';

    loadQuestion(0);
}

// ============================================================
//  ОБРАБОТЧИКИ
// ============================================================
btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', resetGame);
btnNext.addEventListener('click', goToNext);
btnPause.addEventListener('click', togglePause);
btnExit.addEventListener('click', exitGame);

document.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', handleOptionClick);
});

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================
resetGame();
console.log('Игра "Угадай композитора" загружена!');
console.log('Композиторов:', COMPOSERS.length);
console.log('Произведений:', WORKS.length);