// ==========================================
// ИССЕЯ — лёгкие хелперы форм
// Контактная форма — iframe Яндекс Форм; этот файл больше не отправляет
// данные сам. Оставлены утилиты, которые могут пригодиться будущим
// локальным формам (телефон-маска, счётчик символов).
// ==========================================

(function() {
    'use strict';

    const PhoneFormatter = {
        init: function() {
            const phoneInputs = document.querySelectorAll('input[type="tel"]');
            phoneInputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    this.formatPhone(e.target);
                });
            });
        },
        formatPhone: function(input) {
            let value = input.value.replace(/\D/g, '');
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            if (value.length > 0) {
                if (value[0] === '8') value = '7' + value.slice(1);
                if (value[0] !== '7') value = '7' + value;
                let formatted = '+7';
                if (value.length > 1) formatted += ' (' + value.substring(1, 4);
                if (value.length >= 5) formatted += ') ' + value.substring(4, 7);
                if (value.length >= 8) formatted += '-' + value.substring(7, 9);
                if (value.length >= 10) formatted += '-' + value.substring(9, 11);
                input.value = formatted;
            }
        }
    };

    const CharacterCounter = {
        init: function() {
            const textareas = document.querySelectorAll('textarea[maxlength]');
            textareas.forEach(textarea => this.addCounter(textarea));
        },
        addCounter: function(textarea) {
            const maxLength = parseInt(textarea.getAttribute('maxlength'), 10);
            const counter = document.createElement('div');
            counter.className = 'character-counter';
            counter.style.cssText = 'text-align: right; font-size: 0.875rem; color: var(--text-tertiary); margin-top: 0.5rem;';
            textarea.parentElement.appendChild(counter);
            const updateCounter = () => {
                const remaining = maxLength - textarea.value.length;
                counter.textContent = `${remaining} символов осталось`;
                counter.style.color = remaining < 50 ? '#ef4444' : 'var(--text-tertiary)';
            };
            textarea.addEventListener('input', updateCounter);
            updateCounter();
        }
    };

    function init() {
        PhoneFormatter.init();
        CharacterCounter.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.FormModule = {
        phoneFormatter: PhoneFormatter,
        characterCounter: CharacterCounter
    };
})();
