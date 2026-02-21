// Authentication handling for login and register pages
import { auth, db } from './script.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Login Form Handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect to home page after successful login
            window.location.href = 'c1_home.html';
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        }
    });
}

// Register Form Handler
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password')?.value;
        
        // Check if passwords match (if confirm field exists)
        if (confirmPassword && password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Create user document in Firestore
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email,
                favorites: [],
                createdAt: new Date().toISOString()
            });
            
            // Redirect based on screen size - mobile vs desktop
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                window.location.href = 'b1_tutorial_1.html';
            } else {
                window.location.href = 'b_tutorial.html';
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed: ' + error.message);
        }
    });
}
