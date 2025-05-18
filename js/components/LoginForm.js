import { loginUser, showSuccess, showError, navigateTo } from '../app.js';

export function createLoginForm() {
    const form = document.createElement('form');
    form.className = 'form-container';
    form.innerHTML = `
        <h2>Login</h2>
        
        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
        </div>

        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
        </div>

        <button type="submit">Login</button>
        
        <p class="form-footer">
            Don't have an account? <a href="#" id="registerLink">Register here</a>
        </p>
    `;

    // Form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');

        const result = await loginUser(email, password);
        if (result.success) {
            form.appendChild(showSuccess('Login successful! Redirecting to dashboard...'));
            setTimeout(() => navigateTo('dashboard'), 2000);
        } else {
            form.appendChild(showError(result.error));
        }
    });

    // Register link
    const registerLink = form.querySelector('#registerLink');
    registerLink.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('register');
    });

    return form;
}
