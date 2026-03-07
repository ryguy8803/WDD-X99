// Forgot Password Page Handler
import { auth } from './script.js';
import { updatePassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Forgot Password Form Handler
const forgotForm = document.getElementById('forgot-form');
if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('password').value;
        
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to change your password');
            return;
        }
        
        try {
            await updatePassword(user, newPassword);
            alert('Password updated successfully!');
            history.back();
        } catch (error) {
            alert('Failed to update password: ' + error.message);
        }
    });
}
