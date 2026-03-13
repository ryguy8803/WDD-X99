import { auth } from './script.js';
import { sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgot-form');

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = forgotPasswordForm.email.value;
            const appContainer = document.querySelector('.app-container');

            sendPasswordResetEmail(auth, email)
                .then(() => {
                    if (appContainer) {
                        appContainer.innerHTML = `
                            <div class="card" style="text-align: center; padding: var(--large-spacing); max-width: 400px;">
                                <h1 class="page-title">Email Sent</h1>
                                <p style="margin-bottom: var(--medium-spacing);">A password reset link has been sent to <strong>${email}</strong>. Please check your inbox.</p>
                                <a href="login.html" class="button high">Back to Login</a>
                            </div>
                        `;
                    }
                })
                .catch((error) => {
                    const errorMessage = error.message;
                    console.error('Error sending password reset email:', error.code, errorMessage);
                     if (appContainer) {
                        appContainer.innerHTML = `
                            <div class="card" style="text-align: center; padding: var(--large-spacing); max-width: 400px;">
                                <h1 class="page-title">Error</h1>
                                <p style="margin-bottom: var(--medium-spacing); color: var(--color-error);">${errorMessage}</p>
                                <a href="forgotpassword.html" class="button high">Try Again</a>
                            </div>
                        `;
                    }
                });
        });
    }
});
