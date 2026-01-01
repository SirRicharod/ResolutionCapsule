// Select our elements
const writingSection = document.getElementById('writing-section');
const lockedSection = document.getElementById('locked-section');
const textarea = document.getElementById('resolution');
const submitBtn = document.getElementById('submit-btn');

// Constants
const CONFIRM_TIMEOUT = 5000;
const ANIMATION_DURATION = 1200;
const ENVELOPE_ANIMATION_DURATION = 800;

// State
let isArmed = false;
let countdownInterval = null;
let confirmTimeout = null;

// Utility: Safe localStorage operations
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
        alert('Unable to save your capsule. Please check your browser settings.');
        return false;
    }
}

function getFromLocalStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error('Failed to read from localStorage:', e);
        return null;
    }
}

// Utility: Sanitize HTML to prevent XSS
function sanitizeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// PAGE LOAD LOGIC
window.onload = () => {
    const activeYear = getFromLocalStorage('activeYear');

    if (activeYear) {
        const capsuleDataString = getFromLocalStorage(`capsule_${activeYear}`);
        if (!capsuleDataString) return;
        
        const capsuleData = JSON.parse(capsuleDataString);
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

submitBtn.addEventListener('click', () => {
    const text = textarea.value.trim();

    // 1. Check if empty first
    if (text === "") {
        const toastElement = document.getElementById('errorToast');
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        return;
    }

    // 2. The Confirmation Logic
    if (!isArmed) {
        // First click: Change the button appearance
        submitBtn.innerHTML = "Click again to Seal 🔒";
        submitBtn.classList.add('btn-danger-confirm');
        isArmed = true;

        // Reset the button if they don't click again within timeout
        confirmTimeout = setTimeout(() => {
            submitBtn.innerHTML = "Submit Resolutions";
            submitBtn.classList.remove('btn-danger-confirm');
            isArmed = false;
        }, CONFIRM_TIMEOUT);

        return; // Stop here and wait for the second click
    }

    // Clear the timeout if second click happens before timeout
    if (confirmTimeout) {
        clearTimeout(confirmTimeout);
        confirmTimeout = null;
    }

    // 3. Second click: Proceed with sealing
    const currentYear = new Date().getFullYear();
    const capsuleData = {
        text: text,
        unlockDate: new Date(`January 1, ${currentYear + 1} 00:00:00`).getTime(),
        isLocked: true
    };

    // Save with error handling
    const saved = saveToLocalStorage(`capsule_${currentYear}`, JSON.stringify(capsuleData));
    if (!saved) {
        isArmed = false;
        submitBtn.innerHTML = "Submit Resolutions";
        submitBtn.classList.remove('btn-danger-confirm');
        return;
    }
    
    saveToLocalStorage('activeYear', currentYear);
    showTimerUI(currentYear, capsuleData);
});

// THE "DIRECTOR" FUNCTION (Animations)
function showTimerUI(activeYear, capsuleData) {
    // 1. Play the "Fold Away" animation on the notepad
    writingSection.classList.add('seal-paper');

    // 2. Wait for the animation before switching UI
    setTimeout(() => {
        writingSection.classList.add('d-none');
        lockedSection.classList.remove('d-none');

        // Reset the locked section to show the envelope and timer
        lockedSection.innerHTML = `
            <div class="envelope-display">
                <span class="icon" aria-hidden="true"><i class="bi bi-envelope-heart"></i></span>
                <span class="sealed">
                    <h2 class="mt-3">Capsule Sealed</h2>
                </span>
                <p>Your resolutions are safe.<br>They will reveal themselves in:</p>
                <div id="timer" aria-live="polite" aria-atomic="true"></div>
            </div>
        `;

        // 3. Play the "Pop In" animation on the envelope
        lockedSection.classList.add('envelope-entry');

        // 4. Remove animation class after it completes
        setTimeout(() => {
            lockedSection.classList.remove('envelope-entry');
        }, ENVELOPE_ANIMATION_DURATION);

        // 5. Start the actual numbers counting down
        runTimerLogic(capsuleData, activeYear);
    }, ANIMATION_DURATION);
}

// THE "CLOCK" FUNCTION (Math)
function runTimerLogic(capsuleData, activeYear) {
    // Clear any existing interval to prevent multiple timers
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    // Get fresh reference to timer display (in case DOM was rebuilt)
    const timerDisplay = document.getElementById('timer');
    if (!timerDisplay) {
        console.error('Timer display element not found');
        return;
    }

    const update = () => {
        const now = new Date().getTime();
        const distance = capsuleData.unlockDate - now;

        if (distance <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            unlockCapsule(activeYear);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const d = String(days).padStart(2, '0');
        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');

        timerDisplay.innerHTML = `${d}d ${h}h ${m}m ${s}s`;
    };

    update(); // Run once immediately
    countdownInterval = setInterval(update, 1000);
}

function unlockCapsule(year) {
    const capsuleDataString = getFromLocalStorage(`capsule_${year}`);
    if (!capsuleDataString) return;
    
    const capsuleData = JSON.parse(capsuleDataString);

    // Make sure we're showing the locked section
    writingSection.classList.add('d-none');
    lockedSection.classList.remove('d-none');

    lockedSection.innerHTML = `
        <div class="reveal-container text-center animate-fade-in">
            <h1 class="mb-4">✨ Your ${year} Message ✨</h1>
            <div class="past-resolution-box">${sanitizeHTML(capsuleData.text)}</div>
            <button class="btn mt-4" id="reset-btn">
                <i class="bi bi-pencil"></i> Start ${new Date().getFullYear()} Resolutions
            </button>
        </div>
    `;
    
    // Add event listener to the reset button
    document.getElementById('reset-btn').addEventListener('click', resetForNewYear);
}

function resetForNewYear() {
    try {
        localStorage.removeItem('activeYear');
    } catch (e) {
        console.error('Failed to clear localStorage:', e);
    }
    location.reload();
}