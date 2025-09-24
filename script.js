document.addEventListener('DOMContentLoaded', function() {
    const greetingElement = document.getElementById('greeting');
    const buttonElement = document.getElementById('changeGreeting');
    const countElement = document.getElementById('count');

    const greetings = [
        'Hello World!',
        'Bonjour le monde!',
        'Hola Mundo!',
        'Ciao mondo!',
        'Hallo Welt!',
        'Olá Mundo!',
        'Привет мир!',
        'こんにちは世界!',
        '你好世界!',
        'مرحبا بالعالم!'
    ];

    let currentIndex = 0;
    let clickCount = 0;

    buttonElement.addEventListener('click', function() {
        clickCount++;
        currentIndex = (currentIndex + 1) % greetings.length;

        greetingElement.style.animation = 'none';
        setTimeout(() => {
            greetingElement.textContent = greetings[currentIndex];
            greetingElement.style.animation = 'fadeIn 0.5s ease-in';
        }, 10);

        countElement.textContent = clickCount;

        createSparkle(event.clientX, event.clientY);
    });

    function createSparkle(x, y) {
        const sparkle = document.createElement('div');
        sparkle.style.position = 'fixed';
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        sparkle.style.width = '10px';
        sparkle.style.height = '10px';
        sparkle.style.borderRadius = '50%';
        sparkle.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        sparkle.style.pointerEvents = 'none';
        sparkle.style.animation = 'sparkle 0.6s ease-out forwards';

        document.body.appendChild(sparkle);

        setTimeout(() => {
            sparkle.remove();
        }, 600);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes sparkle {
            0% {
                transform: translate(0, 0) scale(0);
                opacity: 1;
            }
            100% {
                transform: translate(0, -50px) scale(1.5);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});