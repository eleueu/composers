// ============================================================
//  БАЗА ДАННЫХ: композиторы и пути к аудиофайлам
// ============================================================
const COMPOSERS_DB = [
    {
        name: 'Пётр Ильич Чайковский',
        audioSrc: 'audio/chaikovsky_oktabr.mp3'
    },
    {
        name: 'Пётр Ильич Чайковский',
        audioSrc: 'audio/chaikovsky_razmyshlenie.mp3'
    },
    {
        name: 'Евгений Дмитриевич Дога',
        audioSrc: 'audio/doga_grammofon.mp3'
    },
    {
        name: 'Людовико Эйнауди',
        audioSrc: 'audio/einaudi_experience.mp3'
    },
    {
        name: 'Ференц Лист',
        audioSrc: 'audio/list_grezylubvi.mp3'
    },
    {
        name: 'Сергей Васильевич Рахманинов',
        audioSrc: 'audio/rahmaninoff_concert2.mp3'
    },
    {
        name: 'Сергей Васильевич Рахманинов',
        audioSrc: 'audio/rahmaninoff_preludedodiezminor.mp3'
    },
    {
        name: 'Альфред Гарриевич Шнитке',
        audioSrc: 'audio/shnitke_lesskazok.mp3'
    },
    {
        name: 'Альфред Гарриевич Шнитке',
        audioSrc: 'audio/shnitke_polkamertvyedushi.mp3'
    },
    {
        name: 'Дмитрий Дмитриевич Шостакович',
        audioSrc: 'audio/shostakovich_prelude5remajor.mp3'
    },
    {
        name: 'Георгий Васильевич Свиридов',
        audioSrc: 'audio/sviridiv_metel.mp3'
    }
];

// ============================================================
//  СОСТОЯНИЕ ИГРЫ
// ============================================================
const TOTAL_QUESTIONS = 5;

let state = {
    allQuestions: [],
    currentIndex: 0,
    score: 0,
    isAnswered: false,
    audioElement: null,
    animationId: null,
};

// DOM-элементы
const $ = id => document.getElementById(id);
const startScreen = $('startScreen');
const gameScreen = $('gameScreen');
const resultScreen = $('resultScreen');
const scoreDisplay = $('scoreDisplay');
const trackInfo = $('trackInfo');
const optionsContainer = $('optionsContainer');
const feedback = $('feedback');
const btnNext = $('btnNext');
const btnStart = $('btnStart');
const btnRestart = $('btnRestart');
const pulseRing = $('pulseRing');
const finalScore = $('finalScore');
const resultTitle = $('resultTitle');
const resultDetail = $('resultDetail');

// ============================================================
//  ГЕНЕРАЦИЯ ВОПРОСОВ (исправленная)
// ============================================================
function generateQuestions() {
    const shuffled = [...COMPOSERS_DB];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, TOTAL_QUESTIONS);

    return selected.map((composer) => {
        const others = COMPOSERS_DB.filter(c => c.name !== composer.name);
        const shuffledOthers = [...others];
        for (let i = shuffledOthers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOthers[i], shuffledOthers[j]] = [shuffledOthers[j], shuffledOthers[i]];
        }
        const wrong = shuffledOthers[0] || COMPOSERS_DB[0];

        const options = [
            { name: composer.name, isCorrect: true },
            { name: wrong.name, isCorrect: false }
        ];
        
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        const correctIndex = options.findIndex(opt => opt.isCorrect === true);

        console.log('📝 Сгенерирован вопрос:');
        console.log('   Правильный композитор:', composer.name);
        console.log('   Вариант 1:', options[0].name, 'правильный?', options[0].isCorrect);
        console.log('   Вариант 2:', options[1].name, 'правильный?', options[1].isCorrect);
        console.log('   Индекс правильного ответа:', correctIndex);

        return {
            composer: composer,
            options: options,
            correctIndex: correctIndex
        };
    });
}

// ============================================================
//  ОСТАНОВКА АУДИО
// ============================================================
function stopAudio() {
    console.log('⏹ Остановка аудио');
    
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
        } catch (e) {
            console.warn('Ошибка при остановке аудио:', e);
        }
        state.audioElement = null;
    }
    
    pulseRing.className = 'pulse-ring';
    pulseRing.style.borderColor = 'rgba(41, 128, 255, 0.05)';
    pulseRing.style.boxShadow = 'inset 0 0 30px rgba(41, 128, 255, 0), 0 0 30px rgba(41, 128, 255, 0)';
    pulseRing.style.background = 'transparent';
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
        const intensity = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(elapsed * 3));
        updatePulseRingIntensity(intensity);
        state.animationId = requestAnimationFrame(animatePulse);
    }
    
    animatePulse();
}

function updatePulseRingIntensity(intensity) {
    pulseRing.classList.add('active');
    
    if (intensity > 0.7) {
        pulseRing.className = 'pulse-ring intense';
    } else if (intensity > 0.4) {
        pulseRing.className = 'pulse-ring strong';
    } else {
        pulseRing.className = 'pulse-ring active';
    }

    const glow = 30 + intensity * 100;
    const borderOpacity = 0.2 + intensity * 0.7;
    const insetGlow = intensity * 120;
    
    pulseRing.style.borderColor = 'rgba(41, 128, 255, ' + borderOpacity + ')';
    pulseRing.style.boxShadow = 
        'inset 0 0 ' + insetGlow + 'px rgba(41, 128, 255, ' + (0.05 + intensity * 0.2) + '), ' +
        'inset 0 0 ' + (insetGlow * 1.5) + 'px rgba(41, 128, 255, ' + (0.02 + intensity * 0.1) + '), ' +
        '0 0 ' + glow + 'px rgba(41, 128, 255, ' + (0.05 + intensity * 0.15) + ')';
    
    const alpha = 0.02 + intensity * 0.1;
    pulseRing.style.background = 'radial-gradient(' +
        'ellipse at center, ' +
        'rgba(41, 128, 255, ' + alpha + ') 0%, ' +
        'rgba(41, 128, 255, ' + (alpha * 0.5) + ') 40%, ' +
        'transparent 70%' +
    ')';
}

// ============================================================
//  ВОСПРОИЗВЕДЕНИЕ АУДИО
// ============================================================
function playMelody(composer) {
    console.log('▶ Воспроизведение:', composer.name);
    console.log('   Файл:', composer.audioSrc);
    
    stopAudio();
    
    setTimeout(() => {
        try {
            const audio = new Audio();
            audio.src = composer.audioSrc;
            audio.preload = 'auto';
            
            console.log('   Создан новый аудиоэлемент');
            
            startPulseAnimation();
            
            audio.addEventListener('canplaythrough', function onCanPlay() {
                audio.removeEventListener('canplaythrough', onCanPlay);
                console.log('   Аудио загружено, начинаем воспроизведение');
                audio.play().then(() => {
                    console.log('✅ Воспроизведение начато');
                    state.audioElement = audio;
                }).catch(err => {
                    console.warn('⚠️ Ошибка воспроизведения:', err);
                });
            });
            
            audio.addEventListener('error', function(e) {
                console.warn('⚠️ Ошибка загрузки аудио:', composer.audioSrc);
            });
            
            audio.load();
            state.audioElement = audio;
            
        } catch (e) {
            console.error('❌ Критическая ошибка:', e);
            startPulseAnimation();
        }
    }, 100);
}

// ============================================================
//  ЗАГРУЗКА ВОПРОСА
// ============================================================
function loadQuestion(index) {
    const q = state.allQuestions[index];
    if (!q) {
        console.warn('Вопрос не найден, индекс:', index);
        return;
    }

    console.log('📝 Загрузка вопроса', index + 1, 'из', state.allQuestions.length);
    console.log('   Правильный ответ:', q.composer.name);
    console.log('   correctIndex:', q.correctIndex);

    state.isAnswered = false;
    feedback.textContent = '';
    feedback.className = 'feedback';
    btnNext.style.display = 'none';

    scoreDisplay.textContent = state.score;

    const btns = optionsContainer.querySelectorAll('.btn-option');
    btns.forEach((btn, i) => {
        if (i < q.options.length) {
            btn.textContent = q.options[i].name;
            const isCorrect = q.options[i].isCorrect === true;
            btn.dataset.correct = isCorrect ? 'true' : 'false';
            btn.className = 'btn-option';
            btn.disabled = false;
            console.log('   Кнопка', i + ':', q.options[i].name, 'правильный?', isCorrect);
        }
    });

    trackInfo.textContent = 'Отрывок произведения';

    setTimeout(() => {
        playMelody(q.composer);
    }, 200);
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
    
    console.log('🔍 Выбран вариант:', btn.textContent);
    console.log('   Правильный?', isCorrect);
    
    state.isAnswered = true;

    stopAudio();

    const allBtns = optionsContainer.querySelectorAll('.btn-option');
    allBtns.forEach(b => b.disabled = true);

    allBtns.forEach(b => {
        if (b.dataset.correct === 'true') {
            b.classList.add('correct');
            console.log('   ✅ Правильный ответ:', b.textContent);
        } else if (b === btn && !isCorrect) {
            b.classList.add('wrong');
        }
    });

    if (isCorrect) {
        state.score += 1;
        scoreDisplay.textContent = state.score;
        feedback.textContent = 'Правильно! Отлично!';
        feedback.className = 'feedback correct';
    } else {
        const correctName = state.allQuestions[state.currentIndex].options.find(o => o.isCorrect === true).name;
        feedback.textContent = 'Неверно. Правильный ответ: ' + correctName;
        feedback.className = 'feedback wrong';
    }

    if (state.currentIndex < state.allQuestions.length - 1) {
        btnNext.style.display = 'block';
        btnNext.textContent = 'Следующий вопрос';
    } else {
        btnNext.style.display = 'block';
        btnNext.textContent = 'Узнать результат';
    }
}

function goToNext() {
    state.currentIndex++;
    if (state.currentIndex < state.allQuestions.length) {
        loadQuestion(state.currentIndex);
    } else {
        showResult();
    }
}

function showResult() {
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'flex';
    startScreen.style.display = 'none';

    const total = state.allQuestions.length;
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

function resetGame() {
    stopAudio();
    state.score = 0;
    state.currentIndex = 0;
    state.isAnswered = false;
    state.allQuestions = generateQuestions();

    scoreDisplay.textContent = '0';
    feedback.textContent = '';
    feedback.className = 'feedback';
    btnNext.style.display = 'none';

    startScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'none';
}

function startGame() {
    state.allQuestions = generateQuestions();
    state.score = 0;
    state.currentIndex = 0;

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

document.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', handleOptionClick);
});

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================
resetGame();
console.log('🎵 Игра "Угадай композитора" загружена!');
console.log('📚 В базе ' + COMPOSERS_DB.length + ' композиторов');