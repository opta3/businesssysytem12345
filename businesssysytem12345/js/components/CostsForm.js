import { supabase, showError, showSuccess, navigateTo } from '../app.js';

export function createCostsForm() {
    console.log('Creating costs form...');
    
    const form = document.createElement('form');
    form.className = 'form-container costs-form';
    form.innerHTML = `
        <h2>Costs Form</h2>
        
        <div class="compact-form">
            <div class="form-group">
                <label for="date">Date</label>
                <input type="date" id="date" name="date" required>
            </div>

            <div class="form-group">
                <label for="category">Category</label>
                <select id="category" name="category" required>
                    <option value="">Select a category</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Taxes">Taxes</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div class="form-group">
                <label for="costDescription">Cost Description</label>
                <textarea id="costDescription" name="costDescription" rows="3" required></textarea>
            </div>

            <div class="form-group">
                <label for="costAmount">Cost Amount (TZS)</label>
                <input type="number" id="costAmount" name="costAmount" min="0" step="0.01" required>
            </div>
            
            <div id="messageContainer" class="message-container"></div>
        </div>
        
        <div class="button-group fixed-bottom">
            <button type="submit" class="submit-btn">Submit</button>
            <button type="button" id="backBtn" class="back-btn">Back to Dashboard</button>
        </div>
    `;
    
    // Set default date to today
    const dateInput = form.querySelector('#date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log('Form submitted');
        
        const messageContainer = form.querySelector('#messageContainer');
        messageContainer.innerHTML = ''; // Clear previous messages
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            messageContainer.innerHTML = `<div class="error-message">You must be logged in to submit a cost.</div>`;
            messageContainer.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        
        const formData = new FormData(form);
        const costData = {
            date: formData.get('date'),
            category: formData.get('category'),
            description: formData.get('costDescription'),
            amount: parseFloat(formData.get('costAmount')),
            user_id: user.id
        };

        console.log('Submitting cost data:', costData);

        try {
            const { data, error } = await supabase
                .from('costs')
                .insert([costData]);

            if (error) {
                console.error('Error details:', error);
                messageContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
                messageContainer.scrollIntoView({ behavior: 'smooth' });
                return;
            }

            console.log('Cost submitted successfully:', data);
            messageContainer.innerHTML = `<div class="success-message">Cost recorded successfully!</div>`;
            messageContainer.scrollIntoView({ behavior: 'smooth' });
            
            // Clear form except date
            form.querySelector('#category').value = '';
            form.querySelector('#costDescription').value = '';
            form.querySelector('#costAmount').value = '';
        } catch (error) {
            console.error('Error submitting cost:', error);
            messageContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
            messageContainer.scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    // Back button
    const backBtn = form.querySelector('#backBtn');
    backBtn.addEventListener('click', () => {
        navigateTo('dashboard');
    });

    console.log('Costs form created');
    return form;
}
