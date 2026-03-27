// Login Page Handler
import { auth } from './script.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

function getFriendlyAuthError(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Incorrect email or password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please wait a moment and try again.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection and try again.';
        default:
            return 'Something went wrong. Please try again.';
    }
}

function showError(message) {
    const errorEl = document.getElementById('login-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
    }
}

function clearError() {
    const errorEl = document.getElementById('login-error');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
    }
}

// Login Form Handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email) {
            showError('Please enter your email address.');
            return;
        }

        if (!password) {
            showError('Please enter your password.');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'home.html';
        } catch (error) {
            showError(getFriendlyAuthError(error.code));
        }
    });
}
