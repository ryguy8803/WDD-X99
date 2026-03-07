// Registration Page Handler
import { auth, db } from './script.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Register Form Handler
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password')?.value;
        
        if (confirmPassword && password !== confirmPassword) {
            alert('Passwords do not match');
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
            alert('Registration failed: ' + error.message);
        }
    });
}
