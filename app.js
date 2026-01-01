// Select our elements
const writingSection = document.getElementById('writing-section');
const lockedSection = document.getElementById('locked-section');
const textarea = document.getElementById('resolution');
const submitBtn = document.getElementById('submit-btn');
const timerDisplay = document.getElementById('timer');

// PAGE LOAD LOGIC
window.onload = () => {
    const activeYear = localStorage.getItem('activeYear');

    if (activeYear) {
        const capsuleData = JSON.parse(localStorage.getItem(`capsule_${activeYear}`));
        const now = new Date().getTime();

        if (now >= capsuleData.unlockDate) {
            unlockCapsule(activeYear);
        } else {
            // IMPORTANT: If we are just refreshing the page, 
            // don't play animations, just show the timer.
            writingSection.classList.add('d-none');
            lockedSection.classList.remove('d-none');
            runTimerLogic(capsuleData, activeYear);
        }
    }
};

// SUBMIT BUTTON LOGIC
submitBtn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (text === "") return alert("Please write something first!");

    const currentYear = new Date().getFullYear();
    const capsuleData = {
        text: text,
        // For testing: unlocks in 5 seconds. 
        // Real logic: new Date(`January 1, ${currentYear + 1} 00:00:00`).getTime()
        unlockDate: new Date().getTime() + 5000,
        isLocked: true
    };

    localStorage.setItem(`capsule_${currentYear}`, JSON.stringify(capsuleData));
    localStorage.setItem('activeYear', currentYear);

    // Trigger the animation sequence!
    showTimerUI();
});

// THE "DIRECTOR" FUNCTION (Animations)
function showTimerUI() {
    const activeYear = localStorage.getItem('activeYear');
    const capsuleData = JSON.parse(localStorage.getItem(`capsule_${activeYear}`));

    // 1. Play the "Fold Away" animation on the notepad
    writingSection.classList.add('seal-paper');

    // 2. Wait 1.2 seconds (the length of the animation) before switching UI
    setTimeout(() => {
        writingSection.classList.add('d-none');
        lockedSection.classList.remove('d-none');

        // 3. Play the "Pop In" animation on the envelope
        lockedSection.classList.add('envelope-entry');

        // 4. Start the actual numbers counting down
        runTimerLogic(capsuleData, activeYear);
    }, 1200);
}

// THE "CLOCK" FUNCTION (Math)
function runTimerLogic(capsuleData, activeYear) {
    const update = () => {
        const now = new Date().getTime();
        const distance = capsuleData.unlockDate - now;

        if (distance <= 0) {
            clearInterval(countdownInterval);
            unlockCapsule(activeYear);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerDisplay.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    update(); // Run once immediately
    const countdownInterval = setInterval(update, 1000);
}
function unlockCapsule(year) {
    const capsuleData = JSON.parse(localStorage.getItem(`capsule_${year}`));

    writingSection.classList.add('d-none');
    lockedSection.classList.remove('d-none');

    lockedSection.innerHTML = `
        <div class="reveal-container text-center animate-fade-in">
            <h1 class="mb-4">✨ Your ${year} Message ✨</h1>
            <div class="past-resolution-box">${capsuleData.text}</div>
            <button class="btn mt-4" onclick="resetForNewYear()">
                <i class="bi bi-pencil"></i> Start ${new Date().getFullYear()} Resolutions
            </button>
        </div>
    `;
}

function resetForNewYear() {
    localStorage.removeItem('activeYear');
    location.reload();
}