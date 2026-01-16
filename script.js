document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startOverlay = document.getElementById('start-overlay');
    const examLayout = document.getElementById('exam-layout');
    const resultModal = document.getElementById('result-modal');

    const startBtn = document.getElementById('start-btn');
    const finishBtn = document.getElementById('finish-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const reviewBtn = document.getElementById('review-btn');
    const restartBtnFinal = document.getElementById('restart-btn-final');

    const timerDisplay = document.getElementById('timer-display');
    const questionNav = document.getElementById('question-nav');

    // Question Field Elements
    const qNumberDisplay = document.getElementById('q-number-display');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');

    // Stats
    const resCorrect = document.getElementById('res-correct');
    const resWrong = document.getElementById('res-wrong');
    const resPercent = document.getElementById('res-percent');

    // State
    let currentQuestions = [];
    let currentIndex = 0;
    let userAnswers = {}; // { 0: "Answer String", 1: ... }
    let timerInterval = null;
    let isReviewMode = false;
    const TIME_LIMIT_MINUTES = 30;
    let timeRemaining = TIME_LIMIT_MINUTES * 60;

    // --- Event Listeners ---
    startBtn.addEventListener('click', startTest);
    finishBtn.addEventListener('click', () => {
        if (confirm("Testni yakunlashni xohlaysizmi?")) {
            finishTest();
        }
    });

    prevBtn.addEventListener('click', () => navigate(currentIndex - 1));
    nextBtn.addEventListener('click', () => navigate(currentIndex + 1));

    reviewBtn.addEventListener('click', startReview);
    restartBtnFinal.addEventListener('click', () => location.reload()); // Simple reload to restart

    // --- Functions ---

    function startTest() {
        startOverlay.classList.add('hidden');
        examLayout.classList.remove('hidden');

        // 1. Prepare Data
        // Select 15 random questions
        currentQuestions = [...questions].sort(() => 0.5 - Math.random()).slice(0, 15);

        // 2. Initialize State
        currentIndex = 0;
        userAnswers = {};
        isReviewMode = false;
        document.body.classList.remove('review-mode');

        // 3. Render
        renderNav();
        loadQuestion(0);

        // 4. Start Timer
        startTimer();
    }

    function startTimer() {
        timeRemaining = TIME_LIMIT_MINUTES * 60;
        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                finishTest(true); // Auto finish
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const m = Math.floor(timeRemaining / 60);
        const s = timeRemaining % 60;
        timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        // Visual warning
        if (timeRemaining < 60) {
            timerDisplay.style.color = '#ff1744';
        } else {
            timerDisplay.style.color = 'white';
        }
    }

    function finishTest(auto = false) {
        clearInterval(timerInterval);

        // Calculate Score
        let correctCount = 0;
        // Count unanswered as wrong
        currentQuestions.forEach((q, idx) => {
            const userPick = userAnswers[idx];
            if (userPick && userPick === q.correctAnswer) {
                correctCount++;
            }
        });

        const wrongCount = currentQuestions.length - correctCount;
        const percent = Math.round((correctCount / currentQuestions.length) * 100);

        // Update Stats UI
        resCorrect.textContent = correctCount;
        resWrong.textContent = wrongCount;
        resPercent.textContent = `${percent}%`;

        // Hide Exam, Show Modal
        // examLayout.classList.add('hidden'); // Actually keep exam layout in background, just show modal
        resultModal.classList.remove('hidden');
    }

    function startReview() {
        resultModal.classList.add('hidden');
        isReviewMode = true;
        document.body.classList.add('review-mode'); // CSS handles coloring

        // Go back to first question or keep current
        loadQuestion(currentIndex);

        // Disable Finish Button during review
        finishBtn.style.display = 'none';

        // Maybe change Nav Title?
        qNumberDisplay.textContent += " (Ko'rib chiqish)";
    }

    function navigate(newIndex) {
        if (newIndex >= 0 && newIndex < currentQuestions.length) {
            loadQuestion(newIndex);
        }
    }

    function renderNav() {
        questionNav.innerHTML = '';
        currentQuestions.forEach((_, idx) => {
            const btn = document.createElement('div');
            btn.className = 'nav-item';
            btn.textContent = idx + 1;
            btn.onclick = () => loadQuestion(idx);
            questionNav.appendChild(btn);
        });
    }

    function updateNavState() {
        const items = questionNav.children;
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove('active');
            if (i === currentIndex) items[i].classList.add('active');

            if (userAnswers[i]) {
                items[i].classList.add('answered');
            }
        }
    }

    function loadQuestion(index) {
        currentIndex = index;
        const data = currentQuestions[index];

        updateNavState();

        qNumberDisplay.textContent = `Savol ${index + 1}`;
        questionText.textContent = data.question;

        // Buttons
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === currentQuestions.length - 1;

        // Options
        optionsContainer.innerHTML = '';

        if (!data.shuffledOptions) {
            data.shuffledOptions = [...data.options].sort(() => 0.5 - Math.random());
        }

        const labels = ['A', 'B', 'C', 'D'];

        data.shuffledOptions.forEach((opt, i) => {
            const row = document.createElement('div');
            row.className = 'option-row';

            // Selection Logic
            const isSelected = userAnswers[index] === opt;
            const isCorrectAnswer = opt === data.correctAnswer;

            if (isSelected) {
                row.classList.add('selected');
            }

            // REVIEW MODE LOGIC
            if (isReviewMode) {
                if (isCorrectAnswer) {
                    row.classList.add('correct');
                } else if (isSelected && !isCorrectAnswer) {
                    row.classList.add('incorrect');
                }
            }

            // Content
            row.innerHTML = `
                <span class="option-label">${labels[i] || '-'}</span>
                <span class="option-content">${opt}</span>
            `;

            // Click Event (Only if not review mode)
            if (!isReviewMode) {
                row.addEventListener('click', () => {
                    userAnswers[index] = opt;
                    loadQuestion(index); // Re-render to show selection
                });
            }

            optionsContainer.appendChild(row);
        });
    }
});
