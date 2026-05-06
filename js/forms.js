// ==========================================
// ИССЕЯ — валидация и отправка контактной формы (Google Таблицы / Apps Script)
// ==========================================

(function() {
    'use strict';

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEHKtQZG6eT3C3_1nGqULAunArnQ2s63MxA1dtEJLCrIUtKM8BtoEpiLoRR909r4NZ/exec';

    const SUBMIT_COOLDOWN_MS = 5000;
    let lastSubmitAt = 0;

    const FormValidator = {
        init: function() {
            this.setupForms();
            this.setupRealTimeValidation();
        },

        setupForms: function() {
            const forms = document.querySelectorAll('form.contact-form');

            forms.forEach(form => {
                this.updateSubmitState(form);
                form.addEventListener('submit', (e) => {
                    e.preventDefault();

                    if (this.validateForm(form)) {
                        this.submitForm(form);
                    }
                });
            });
        },

        setupRealTimeValidation: function() {
            const inputs = document.querySelectorAll('input[required], textarea[required], select[required]');

            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                    this.updateSubmitState(input.form);
                });

                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                    if (input.value.trim().length > 0) {
                        this.validateField(input);
                    }
                    this.updateSubmitState(input.form);
                });

                if (input.type === 'checkbox') {
                    input.addEventListener('change', () => {
                        this.validateField(input);
                        this.updateSubmitState(input.form);
                    });
                }
            });
        },

        validateForm: function(form) {
            let isValid = true;
            const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
            }

            return isValid;
        },

        validateField: function(field) {
            const value = field.value.trim();
            let isValid = true;
            let errorMessage = '';

            if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
                isValid = false;
                errorMessage = field.name === 'cross_border_transfer_consent'
                    ? 'Необходимо дать согласие на трансграничную передачу персональных данных (ст. 12 152-ФЗ)'
                    : 'Необходимо дать согласие на обработку персональных данных';
            } else if (field.hasAttribute('required') && value === '') {
                isValid = false;
                errorMessage = 'Это поле обязательно для заполнения';
            } else if (field.type === 'email' && value !== '') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Введите корректный email адрес';
                }
            } else if (field.type === 'tel' && value !== '') {
                const phoneDigits = value.replace(/\D/g, '');
                if (phoneDigits.length < 10 || phoneDigits.length > 11) {
                    isValid = false;
                    errorMessage = 'Введите корректный номер телефона (10-11 цифр)';
                }
            } else if (field.hasAttribute('minlength') && value.length < parseInt(field.getAttribute('minlength'), 10)) {
                isValid = false;
                errorMessage = 'Минимальная длина: ' + field.getAttribute('minlength') + ' символов';
            } else if (field.hasAttribute('maxlength') && value.length > parseInt(field.getAttribute('maxlength'), 10)) {
                isValid = false;
                errorMessage = 'Максимальная длина: ' + field.getAttribute('maxlength') + ' символов';
            } else if (field.hasAttribute('pattern') && value !== '') {
                const pattern = new RegExp(field.getAttribute('pattern'));
                if (!pattern.test(value)) {
                    isValid = false;
                    errorMessage = field.getAttribute('title') || 'Неверный формат';
                }
            }

            if (field.tagName === 'SELECT' && value === '') {
                isValid = false;
                errorMessage = 'Выберите опцию из списка';
            }

            if (!isValid) {
                this.showFieldError(field, errorMessage);
            } else {
                this.clearFieldError(field);
            }

            return isValid;
        },

        showFieldError: function(field, message) {
            field.classList.add('error');
            field.classList.remove('valid');
            field.setAttribute('aria-invalid', 'true');

            const parent = field.closest('.form-consent') || field.parentElement;
            let errorElement = parent.querySelector(':scope > .error-message');

            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.className = 'error-message';
                errorElement.setAttribute('role', 'alert');
                parent.appendChild(errorElement);
            }

            errorElement.textContent = message;
            errorElement.style.display = 'block';
        },

        clearFieldError: function(field) {
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
            if (field.type === 'checkbox' ? field.checked : field.value.trim() !== '') {
                field.classList.add('valid');
            } else {
                field.classList.remove('valid');
            }

            const parent = field.closest('.form-consent') || field.parentElement;
            const errorElement = parent.querySelector(':scope > .error-message');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        },

        updateSubmitState: function(form) {
            if (!form) return;
            const submitButton = form.querySelector('button[type="submit"]');
            if (!submitButton) return;

            const requiredFields = form.querySelectorAll('input[required], textarea[required], select[required]');
            const hasEmpty = Array.from(requiredFields).some(f => {
                return f.type === 'checkbox' ? !f.checked : f.value.trim() === '';
            });
            const hasErrors = form.querySelector('.error') !== null;

            submitButton.disabled = hasEmpty || hasErrors;
            submitButton.setAttribute('aria-disabled', String(submitButton.disabled));
        },

        submitForm: function(form) {
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;

            const honeypot = form.querySelector('input[name="website_url"]');
            if (honeypot && honeypot.value.trim() !== '') {
                this.showSuccess(form, 'Спасибо! Сообщение отправлено.');
                form.reset();
                return;
            }

            const now = Date.now();
            if (now - lastSubmitAt < SUBMIT_COOLDOWN_MS) {
                this.showError(form, 'Слишком частые отправки. Пожалуйста, подождите несколько секунд.');
                return;
            }
            lastSubmitAt = now;

            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Отправка...</span>';

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            this.sendToServer(data)
                .then(() => {
                    try {
                        this.showSuccess(form, 'Спасибо! Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.');
                        form.reset();
                        document.dispatchEvent(new CustomEvent('isseya:form-submit-success', {
                            detail: { formName: 'contact_form' }
                        }));
                    } catch (uiErr) {
                        console.error('Post-submit UI error:', uiErr);
                        form.reset();
                        this.showSuccess(form, 'Сообщение принято. Спасибо!');
                    }
                })
                .catch(error => {
                    this.showError(form, 'Произошла ошибка при отправке. Пожалуйста, попробуйте позже или напишите на psychoteka@mail.ru');
                    console.error('Form submit error:', error);
                })
                .finally(() => {
                    submitButton.innerHTML = originalText;
                    this.updateSubmitState(form);
                });
        },

        sendToServer: function(data) {
            const messageWithContact = [
                'Телефон: ' + (data.phone || ''),
                'Эл. почта: ' + (data.email || ''),
                '',
                data.message || ''
            ].join('\n');

            const consentTs = new Date().toISOString();
            const params = new URLSearchParams({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                subject: data.phone ? (data.subject || '') + ' (' + data.phone + ')' : (data.subject || ''),
                message: messageWithContact,
                personal_data_consent: data.personal_data_consent === 'accepted' ? 'accepted' : '',
                personal_data_consent_at: data.personal_data_consent === 'accepted' ? consentTs : '',
                cross_border_transfer_consent: data.cross_border_transfer_consent === 'accepted' ? 'accepted' : '',
                cross_border_transfer_consent_at: data.cross_border_transfer_consent === 'accepted' ? consentTs : '',
                source: window.location.href,
                sent_at: consentTs
            });

            return fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: params
            }).then(() => ({ success: true }));
        },

        showSuccess: function(form, message) {
            this.showNotification(message, 'success');
        },

        showError: function(form, message) {
            this.showNotification(message, 'error');
        },

        showNotification: function(message, type) {
            const notification = document.createElement('div');
            notification.className = 'form-notification form-notification-' + type;

            const content = document.createElement('div');
            content.className = 'notification-content';

            const icon = document.createElement('i');
            icon.className = 'fas fa-' + (type === 'success' ? 'check-circle' : 'exclamation-circle');
            icon.setAttribute('aria-hidden', 'true');

            const span = document.createElement('span');
            span.textContent = message;

            content.appendChild(icon);
            content.appendChild(span);

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'notification-close';
            closeBtn.setAttribute('aria-label', 'Закрыть');
            const closeIcon = document.createElement('i');
            closeIcon.className = 'fas fa-times';
            closeIcon.setAttribute('aria-hidden', 'true');
            closeBtn.appendChild(closeIcon);
            closeBtn.addEventListener('click', function() {
                notification.remove();
            });

            notification.appendChild(content);
            notification.appendChild(closeBtn);
            document.body.appendChild(notification);

            if (!document.getElementById('form-notification-styles')) {
                this.injectNotificationStyles();
            }

            requestAnimationFrame(() => notification.classList.add('show'));

            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        },

        injectNotificationStyles: function() {
            const style = document.createElement('style');
            style.id = 'form-notification-styles';
            style.textContent = `
                .form-notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    min-width: 300px;
                    max-width: 500px;
                    padding: 1.25rem;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    z-index: 10000;
                    transform: translateX(calc(100% + 40px));
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                }
                .form-notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                .form-notification-success { border-left: 4px solid #10b981; }
                .form-notification-error { border-left: 4px solid #ef4444; }
                .notification-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    flex: 1;
                }
                .notification-content i { font-size: 1.5rem; flex-shrink: 0; }
                .form-notification-success .notification-content i { color: #10b981; }
                .form-notification-error .notification-content i { color: #ef4444; }
                .notification-content span { line-height: 1.5; color: var(--text-primary); }
                .notification-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-tertiary);
                    padding: 0;
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }
                .notification-close:hover { color: var(--text-primary); }
                @media (max-width: 768px) {
                    .form-notification {
                        right: 10px;
                        left: 10px;
                        min-width: auto;
                        max-width: none;
                    }
                }
                input.error, textarea.error, select.error {
                    border-color: #ef4444 !important;
                    background-color: rgba(239, 68, 68, 0.05);
                }
                .error-message {
                    display: block;
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-top: 0.5rem;
                }
                input.valid, textarea.valid, select.valid {
                    border-color: rgba(16, 185, 129, 0.55) !important;
                    background-color: rgba(16, 185, 129, 0.04);
                }
            `;
            document.head.appendChild(style);
        }
    };

    const PhoneFormatter = {
        init: function() {
            document.querySelectorAll('input[type="tel"]').forEach(input => {
                input.addEventListener('input', (e) => {
                    this.formatPhone(e.target);
                });
            });
        },
        formatPhone: function(input) {
            let value = input.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
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
            document.querySelectorAll('textarea[maxlength]').forEach(t => this.addCounter(t));
        },
        addCounter: function(textarea) {
            const maxLength = parseInt(textarea.getAttribute('maxlength'), 10);
            const counter = document.createElement('div');
            counter.className = 'character-counter';
            counter.style.cssText = 'text-align: right; font-size: 0.875rem; color: var(--text-tertiary); margin-top: 0.5rem;';
            textarea.parentElement.appendChild(counter);
            const updateCounter = () => {
                const remaining = maxLength - textarea.value.length;
                counter.textContent = remaining + ' символов осталось';
                counter.style.color = remaining < 50 ? '#ef4444' : 'var(--text-tertiary)';
            };
            textarea.addEventListener('input', updateCounter);
            updateCounter();
        }
    };

    function boot() {
        FormValidator.init();
        PhoneFormatter.init();
        CharacterCounter.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.FormModule = {
        validator: FormValidator,
        phoneFormatter: PhoneFormatter,
        characterCounter: CharacterCounter
    };
})();
