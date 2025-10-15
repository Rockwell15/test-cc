// Wheel Spinner Application
const choiceInput = document.getElementById('choiceInput');
const addChoiceBtn = document.getElementById('addChoiceBtn');
const choicesList = document.getElementById('choicesList');
const spinBtn = document.getElementById('spinBtn');
const clearBtn = document.getElementById('clearBtn');
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const resultDisplay = document.getElementById('resultDisplay');

let choices = [];
let isSpinning = false;
let currentRotation = 0;

// Set canvas size
const canvasSize = 400;
canvas.width = canvasSize;
canvas.height = canvasSize;

// Color palette for wheel segments
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E63946', '#457B9D'
];

// Add choice to the list
function addChoice() {
    const choice = choiceInput.value.trim();
    if (choice === '') return;

    choices.push(choice);
    choiceInput.value = '';
    updateChoicesList();
    drawWheel();
    updateSpinButton();
}

// Update the displayed choices list
function updateChoicesList() {
    choicesList.innerHTML = '';
    choices.forEach((choice, index) => {
        const choiceItem = document.createElement('div');
        choiceItem.className = 'choice-item';
        choiceItem.innerHTML = `
            <span>${choice}</span>
            <button class="remove-btn" onclick="removeChoice(${index})">×</button>
        `;
        choicesList.appendChild(choiceItem);
    });
}

// Remove a choice
function removeChoice(index) {
    choices.splice(index, 1);
    updateChoicesList();
    drawWheel();
    updateSpinButton();
    resultDisplay.textContent = '';
}

// Update spin button state
function updateSpinButton() {
    spinBtn.disabled = choices.length < 2 || isSpinning;
}

// Draw the wheel
function drawWheel(rotation = 0) {
    if (choices.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#999';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Add choices to begin', canvasSize / 2, canvasSize / 2);
        return;
    }

    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const radius = canvasSize / 2 - 10;
    const anglePerSegment = (2 * Math.PI) / choices.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw segments
    choices.forEach((choice, index) => {
        const startAngle = index * anglePerSegment + rotation;
        const endAngle = (index + 1) * anglePerSegment + rotation;

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(
            choice.length > 15 ? choice.substring(0, 15) + '...' : choice,
            radius * 0.65,
            5
        );
        ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Spin the wheel
function spinWheel() {
    if (isSpinning || choices.length < 2) return;

    isSpinning = true;
    updateSpinButton();
    resultDisplay.textContent = '';

    // Random spin duration between 3-3.5 seconds
    const spinDuration = 3000 + Math.random() * 500;

    // Random number of full rotations (5-8) plus random angle
    const numberOfRotations = 5 + Math.random() * 3;
    const randomAngle = Math.random() * 2 * Math.PI;
    const totalRotation = numberOfRotations * 2 * Math.PI + randomAngle;

    const startTime = Date.now();
    const startRotation = currentRotation;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Easing function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);

        currentRotation = startRotation + totalRotation * easeOut;
        drawWheel(currentRotation);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Determine winner
            const normalizedRotation = currentRotation % (2 * Math.PI);
            const pointerAngle = Math.PI / 2; // Pointer at top (90 degrees)
            const anglePerSegment = (2 * Math.PI) / choices.length;

            // Calculate which segment the pointer is pointing at
            let winningIndex = Math.floor(((2 * Math.PI - normalizedRotation + pointerAngle) % (2 * Math.PI)) / anglePerSegment);
            winningIndex = winningIndex % choices.length;

            // Display result
            setTimeout(() => {
                resultDisplay.innerHTML = `
                    <div class="result-animation">
                        <h3>🎉 Winner! 🎉</h3>
                        <p class="winning-choice">${choices[winningIndex]}</p>
                    </div>
                `;
                isSpinning = false;
                updateSpinButton();
            }, 200);
        }
    }

    animate();
}

// Clear all choices
function clearAll() {
    if (isSpinning) return;
    choices = [];
    currentRotation = 0;
    updateChoicesList();
    drawWheel();
    updateSpinButton();
    resultDisplay.textContent = '';
}

// Event listeners
addChoiceBtn.addEventListener('click', addChoice);
choiceInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addChoice();
});
spinBtn.addEventListener('click', spinWheel);
clearBtn.addEventListener('click', clearAll);

// Initial draw
drawWheel();
