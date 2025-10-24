// --- Налаштування Таймера ---

// Встановіть точну дату і час завершення робіт.
// ФОРМАТ: "Рік-Місяць-ДеньTГодина:Хвилина:Секунда"
// 
// ВАЖЛИВО: Вкажіть свій часовий пояс (наприклад, +03:00 для Києва/EEST).
// 
// Приклад: 25 жовтня 2025 року, 18:00:00 за київським часом
const MAINTENANCE_END_TIME = "2025-10-27T18:00:00+03:00";

// --- Логіка Таймера ---
const timerElement = document.getElementById('timer');

// Отримуємо час завершення, перетворюючи наш рядок на мілісекунди
const endTime = new Date(MAINTENANCE_END_TIME).getTime();

// Запускаємо інтервал
const interval = setInterval(updateTimer, 1000);

// Допоміжна функція для додавання "0"
function pad(num) {
    return num < 10 ? '0' + num : num;
}

// Головна функція, що оновлює таймер
function updateTimer() {
    const now = new Date().getTime();
    
    // Ми рахуємо різницю від "endTime", який однаковий для всіх
    const distance = endTime - now;

    // ЯКЩО час вийшов:
    if (distance < 0) {
        clearInterval(interval);
        timerElement.innerHTML = "We should be back now. Please refresh the page!";
        timerElement.classList.add('finished');
        return; 
    }

    // Обчислення
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Вивід в HTML
    timerElement.innerHTML = `
        Returning in: 
        <span>${days}</span>d 
        <span>${pad(hours)}</span>h 
        <span>${pad(minutes)}</span>m 
        <span>${pad(seconds)}</span>s
    `;
}

// Запускаємо функцію один раз одразу
updateTimer();
