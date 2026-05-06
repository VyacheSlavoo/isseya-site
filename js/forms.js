// ==========================================
// ИССЕЯ - FORMS VALIDATION & HANDLING MODULE
// Professional form validation with UX
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // BITRIX24 — приёмник заявок
    // ==========================================
    // Bitrix24 — российский CRM, серверы и данные в РФ. Подключаем форму
    // через входящий вебхук:
    //
    //   1. Зарегистрируй портал на bitrix24.ru (бесплатно).
    //   2. Левое меню → Разработчикам → Другое → Входящие вебхуки.
    //   3. Добавь вебхук с правом «CRM (crm)».
    //   4. Скопируй URL вида
    //      https://<portal>.bitrix24.ru/rest/<id>/<token>/
    //   5. Подставь его сюда вместо '__BITRIX_WEBHOOK_URL__'.
    //
    // Пока URL не подставлен, форма падает на mailto-фолбек:
    // открывается почтовый клиент пользователя с уже заполненным
    // письмом на psychoteka@mail.ru, плюс копия текста ложится
    // в буфер обмена (на случай, если клиент не настроен).
    // ==========================================
    const BITRIX_WEBHOOK_URL = '__BITRIX_WEBHOOK_URL__';

    function isBitrixConfigured() {
        return typeof BITRIX_WEBHOOK_URL === 'string'
            && BITRIX_WEBHOOK_URL.startsWith('https://')
            && BITRIX_WEBHOOK_URL.includes('bitrix24')
            && !BITRIX_WEBHOOK_URL.includes('__BITRIX_WEBHOOK_URL__');
    }

    const FALLBACK_EMAIL = 'psychoteka@mail.ru';

    // Пауза между сабмитами от одного пользователя — против ботов.
    const SUBMIT_COOLDOWN_MS = 5000;
    let lastSubmitAt = 0;

    // ==========================================
    // FORM VALIDATION
    // ==========================================
    
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
                // Validate on blur
                input.addEventListener('blur', () => {
                    this.validateField(input);
                    this.updateSubmitState(input.form);
                });
                
                // Clear error on input
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
                // Focus first error
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
            
            // Required check
            if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
                isValid = false;
                errorMessage = 'Необходимо дать согласие на обработку персональных данных';
            }
            
            // Required check
            else if (field.hasAttribute('required') && value === '') {
                isValid = false;
                errorMessage = 'Это поле обязательно для заполнения';
            }
            
            // Email validation
            else if (field.type === 'email' && value !== '') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Введите корректный email адрес';
                }
            }
            
            // Phone validation (Russian format)
            else if (field.type === 'tel' && value !== '') {
                // Remove all non-digits
                const phoneDigits = value.replace(/\D/g, '');
                if (phoneDigits.length < 10 || phoneDigits.length > 11) {
                    isValid = false;
                    errorMessage = 'Введите корректный номер телефона (10-11 цифр)';
                }
            }
            
            // Min length
            else if (field.hasAttribute('minlength') && value.length < parseInt(field.getAttribute('minlength'))) {
                isValid = false;
                errorMessage = `Минимальная длина: ${field.getAttribute('minlength')} символов`;
            }
            
            // Max length
            else if (field.hasAttribute('maxlength') && value.length > parseInt(field.getAttribute('maxlength'))) {
                isValid = false;
                errorMessage = `Максимальная длина: ${field.getAttribute('maxlength')} символов`;
            }
            
            // Pattern
            else if (field.hasAttribute('pattern') && value !== '') {
                const pattern = new RegExp(field.getAttribute('pattern'));
                if (!pattern.test(value)) {
                    isValid = false;
                    errorMessage = field.getAttribute('title') || 'Неверный формат';
                }
            }
            
            // Select validation
            if (field.tagName === 'SELECT' && value === '') {
                isValid = false;
                errorMessage = 'Выберите опцию из списка';
            }
            
            // Show/hide error
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
            
            let errorElement = field.parentElement.querySelector('.error-message');
            
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.className = 'error-message';
                errorElement.setAttribute('role', 'alert');
                field.parentElement.appendChild(errorElement);
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
            
            const errorElement = field.parentElement.querySelector('.error-message');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        },

        updateSubmitState: function(form) {
            if (!form) return;
            const submitButton = form.querySelector('button[type="submit"]');
            if (!submitButton) return;

            const requiredFields = form.querySelectorAll('input[required], textarea[required], select[required]');
            const hasEmpty = Array.from(requiredFields).some(field => {
                return field.type === 'checkbox' ? !field.checked : field.value.trim() === '';
            });
            const hasErrors = form.querySelector('.error') !== null;

            submitButton.disabled = hasEmpty || hasErrors;
            submitButton.setAttribute('aria-disabled', String(submitButton.disabled));
        },
        
        submitForm: function(form) {
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;

            // Honeypot: скрытое поле, которое заполняют только боты.
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

            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Отправка...</span>';

            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            this.sendToServer(data)
                .then(result => {
                    let successMessage = 'Спасибо! Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.';
                    if (result && result.channel === 'mailto') {
                        successMessage = 'Открылся ваш почтовый клиент с готовым письмом — отправьте его, и мы получим обращение. Если клиент не открылся, текст уже скопирован — вставьте его в письмо на ' + FALLBACK_EMAIL + '.';
                    }
                    this.showSuccess(form, successMessage);
                    form.reset();
                    document.dispatchEvent(new CustomEvent('isseya:form-submit-success', {
                        detail: { formName: 'contact_form' }
                    }));
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
            if (isBitrixConfigured()) {
                return this.sendToBitrix(data);
            }
            return this.sendViaMailto(data);
        },

        sendToBitrix: function(data) {
            const consentAccepted = data.personal_data_consent === 'accepted';

            // form-encoded body — без CORS preflight, никаких кастомных заголовков
            const params = new URLSearchParams();
            const subject = (data.subject || 'Обращение').toString();
            params.append('fields[TITLE]', 'Сайт: ' + subject);
            params.append('fields[NAME]', (data.name || '').toString());
            params.append('fields[EMAIL][0][VALUE]', (data.email || '').toString());
            params.append('fields[EMAIL][0][VALUE_TYPE]', 'WORK');
            params.append('fields[PHONE][0][VALUE]', (data.phone || '').toString());
            params.append('fields[PHONE][0][VALUE_TYPE]', 'WORK');
            const commentLines = [
                'Тема: ' + subject,
                'Согласие на обработку ПД: ' + (consentAccepted ? 'да' : 'нет'),
                'Источник: ' + window.location.href,
                '',
                (data.message || '').toString()
            ];
            params.append('fields[COMMENTS]', commentLines.join('\n'));
            params.append('fields[SOURCE_ID]', 'WEB');
            params.append('fields[SOURCE_DESCRIPTION]', window.location.href);

            const trimmedUrl = BITRIX_WEBHOOK_URL.replace(/\/+$/, '/');
            const url = trimmedUrl + 'crm.lead.add.json';

            return fetch(url, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
                body: params
            }).then(function(resp) {
                if (!resp.ok) {
                    throw new Error('Bitrix24 HTTP ' + resp.status);
                }
                return resp.json();
            }).then(function(json) {
                if (json && json.error) {
                    throw new Error('Bitrix24: ' + (json.error_description || json.error));
                }
                return { success: true, leadId: json && json.result };
            });
        },

        sendViaMailto: function(data) {
            const consentAccepted = data.personal_data_consent === 'accepted';
            const subject = (data.subject || 'Обращение с сайта').toString();
            const body = [
                'Имя: ' + (data.name || ''),
                'Эл. почта: ' + (data.email || ''),
                'Телефон: ' + (data.phone || ''),
                'Тема: ' + subject,
                'Согласие на обработку ПД: ' + (consentAccepted ? 'да' : 'нет'),
                '',
                (data.message || '').toString()
            ].join('\n');

            // Кладём текст в буфер обмена — на случай, если почтовый
            // клиент не настроен и пользователю нужно вставить вручную.
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(body).catch(function() {});
            }

            const mailto = 'mailto:' + FALLBACK_EMAIL
                + '?subject=' + encodeURIComponent('[Сайт] ' + subject)
                + '&body=' + encodeURIComponent(body);
            // Используем временную ссылку, чтобы не менять scroll/history.
            const a = document.createElement('a');
            a.href = mailto;
            a.rel = 'noopener noreferrer';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            return Promise.resolve({ success: true, channel: 'mailto' });
        },
        
        showSuccess: function(form, message) {
            this.showNotification(message, 'success');
        },
        
        showError: function(form, message) {
            this.showNotification(message, 'error');
        },
        
        showNotification: function(message, type) {
            const notification = document.createElement('div');
            notification.className = `form-notification form-notification-${type === 'success' ? 'success' : 'error'}`;

            const content = document.createElement('div');
            content.className = 'notification-content';

            const icon = document.createElement('i');
            icon.className = `fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`;
            icon.setAttribute('aria-hidden', 'true');
            content.appendChild(icon);

            const text = document.createElement('span');
            text.textContent = String(message);
            content.appendChild(text);

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'notification-close';
            closeBtn.setAttribute('aria-label', 'Закрыть уведомление');
            const closeIcon = document.createElement('i');
            closeIcon.className = 'fas fa-times';
            closeIcon.setAttribute('aria-hidden', 'true');
            closeBtn.appendChild(closeIcon);
            closeBtn.addEventListener('click', () => notification.remove());

            notification.appendChild(content);
            notification.appendChild(closeBtn);

            document.body.appendChild(notification);
            
            // Add styles if not already present
            if (!document.getElementById('form-notification-styles')) {
                this.injectNotificationStyles();
            }
            
            // Animate in
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            // Auto remove after 5 seconds
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
                
                .form-notification-success {
                    border-left: 4px solid #10b981;
                }
                
                .form-notification-error {
                    border-left: 4px solid #ef4444;
                }
                
                .notification-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    flex: 1;
                }
                
                .notification-content i {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }
                
                .form-notification-success i {
                    color: #10b981;
                }
                
                .form-notification-error i {
                    color: #ef4444;
                }
                
                .notification-content span {
                    line-height: 1.5;
                    color: var(--text-primary);
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-tertiary);
                    padding: 0;
                    font-size: 1.25rem;
                    transition: color 0.2s;
                    flex-shrink: 0;
                }
                
                .notification-close:hover {
                    color: var(--text-primary);
                }
                
                @media (max-width: 768px) {
                    .form-notification {
                        right: 10px;
                        left: 10px;
                        min-width: auto;
                        max-width: none;
                    }
                }
                
                /* Form error styles */
                input.error,
                textarea.error,
                select.error {
                    border-color: #ef4444 !important;
                    background-color: rgba(239, 68, 68, 0.05);
                }
                
                .error-message {
                    display: block;
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-top: 0.5rem;
                    animation: slideDown 0.2s ease-out;
                }

                input.valid,
                textarea.valid,
                select.valid {
                    border-color: rgba(16, 185, 129, 0.55) !important;
                    background-color: rgba(16, 185, 129, 0.04);
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // ==========================================
    // PHONE NUMBER FORMATTING
    // ==========================================
    
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
            
            // Limit to 11 digits
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            
            // Format: +7 (999) 999-99-99
            if (value.length > 0) {
                if (value[0] === '8') value = '7' + value.slice(1);
                if (value[0] !== '7') value = '7' + value;
                
                let formatted = '+7';
                if (value.length > 1) {
                    formatted += ' (' + value.substring(1, 4);
                }
                if (value.length >= 5) {
                    formatted += ') ' + value.substring(4, 7);
                }
                if (value.length >= 8) {
                    formatted += '-' + value.substring(7, 9);
                }
                if (value.length >= 10) {
                    formatted += '-' + value.substring(9, 11);
                }
                
                input.value = formatted;
            }
        }
    };
    
    // ==========================================
    // CHARACTER COUNTER
    // ==========================================
    
    const CharacterCounter = {
        init: function() {
            const textareas = document.querySelectorAll('textarea[maxlength]');
            
            textareas.forEach(textarea => {
                this.addCounter(textarea);
            });
        },
        
        addCounter: function(textarea) {
            const maxLength = textarea.getAttribute('maxlength');
            const counter = document.createElement('div');
            counter.className = 'character-counter';
            counter.style.cssText = 'text-align: right; font-size: 0.875rem; color: var(--text-tertiary); margin-top: 0.5rem;';
            
            textarea.parentElement.appendChild(counter);
            
            const updateCounter = () => {
                const remaining = maxLength - textarea.value.length;
                counter.textContent = `${remaining} символов осталось`;
                
                if (remaining < 50) {
                    counter.style.color = '#ef4444';
                } else {
                    counter.style.color = 'var(--text-tertiary)';
                }
            };
            
            textarea.addEventListener('input', updateCounter);
            updateCounter();
        }
    };
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            FormValidator.init();
            PhoneFormatter.init();
            CharacterCounter.init();
        });
    } else {
        FormValidator.init();
        PhoneFormatter.init();
        CharacterCounter.init();
    }
    
    // Expose to window for external access
    window.FormModule = {
        validator: FormValidator,
        phoneFormatter: PhoneFormatter
    };
    
    console.log('📝 Forms validation module loaded');
    
})();



