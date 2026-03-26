// Registration Page Handler
import { auth, db } from './script.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

function getFriendlyAuthError(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'An account with this email already exists. Try logging in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Your password is too weak. It must be at least 6 characters.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a moment and try again.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection and try again.';
        default:
            return 'Something went wrong. Please try again.';
    }
}

function showError(message) {
    const errorEl = document.getElementById('register-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
    }
}

function clearError() {
    const errorEl = document.getElementById('register-error');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
    }
}

// Register Form Handler
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password')?.value;

        if (!username) {
            showError('Please enter a username.');
            return;
        }

        if (!email) {
            showError('Please enter your email address.');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        if (!password) {
            showError('Please enter a password.');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match. Please try again.');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            await setDoc(doc(db, "users", userCredential.user.uid), {
                username: username,
                email: email,
                favorites: [],
                createdAt: new Date().toISOString()
            });

            window.location.href = 'tutorial.html';
        } catch (error) {
            showError(getFriendlyAuthError(error.code));
        }
    });
}
