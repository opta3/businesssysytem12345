
import { registerUser, showError, showSuccess, navigateTo, supabase } from '../app.js';

// Tanzania tribes list
const tanzaniaTribes = [
    'Sukuma', 'Nyamwezi', 'Chaga', 'Haya', 'Makonde', 'Ha', 'Gogo', 'Hehe',
    'Zaramo', 'Nyakyusa', 'Pare', 'Luguru', ' Shambaa', 'Digo', 'Tumbuka',
    'Yao', 'Ngoni', 'Sangu', 'Bena', 'Pogoro', 'Other'
];

export function createRegistrationForm() {
    const form = document.createElement('form');
    form.className = 'form-container';
    form.innerHTML = `
        <h2>Registration</h2>
        
        <div class="form-group">
            <label for="fullName">Full Name</label>
            <input type="text" id="fullName" name="fullName" required>
        </div>

        <div class="form-group">
            <label for="age">Age</label>
            <input type="number" id="age" name="age" min="18" required>
        </div>

        <div class="form-group">
            <label for="gender">Gender</label>
            <select id="gender" name="gender" required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
            </select>
        </div>

        <div class="form-group">
            <label for="tribe">Tribe</label>
            <select id="tribe" name="tribe" required>
                <option value="">Select Tribe</option>
                ${tanzaniaTribes.map(tribe => `<option value="${tribe}">${tribe}</option>`).join('')}
            </select>
        </div>

        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
        </div>

        <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" pattern="[0-9]{10}" required>
        </div>

        <div class="form-group">
            <label for="profilePicture">Profile Picture</label>
            <input type="file" id="profilePicture" name="profilePicture" accept="image/*" required>
        </div>

        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" minlength="8" required>
        </div>

        <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" minlength="8" required>
        </div>

        <button type="submit">Register</button>
    `;

    // Form validation
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = new FormData(form);
        const userData = {
            fullName: formData.get('fullName'),
            age: parseInt(formData.get('age')),
            gender: formData.get('gender'),
            tribe: formData.get('tribe'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        if (userData.password !== userData.confirmPassword) {
            form.appendChild(showError('Passwords do not match'));
            return;
        }

        try {
            // Check if email already exists
            const { data: existingUser, error: checkError } = await supabase
                .from('profiles')
                .select('email')
                .eq('email', userData.email)
                .single();
            
            if (existingUser) {
                form.appendChild(showError('This email is already registered. Please use a different email.'));
                return;
            }
            
            const registrationResult = await registerUser(userData);
            if (!registrationResult.success) {
                throw new Error(registrationResult.error);
            }

            // Handle profile picture if present
            // Comment out or remove this section since avatar_url doesn't exist
            /*
            const profilePicture = formData.get('profilePicture');
            if (profilePicture && profilePicture.size > 0) {
                try {
                    // ... profile picture upload code ...
                } catch (error) {
                    console.error('Error handling profile picture:', error);
                    // Continue with registration even if profile picture upload fails
                }
            }
            */

            form.appendChild(showSuccess('Registration successful! Redirecting to login...'));
            setTimeout(() => navigateTo('login'), 2000);

        } catch (error) {
            console.error('Registration error:', error);
            form.appendChild(showError(error.message || 'Registration failed. Please try again.'));
        }
    });

    return form;
}
