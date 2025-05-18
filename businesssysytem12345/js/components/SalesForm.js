import { supabase, showError, showSuccess, navigateTo } from '../app.js';

export function createSalesForm() {
    const form = document.createElement('form');
    form.className = 'form-container sales-form';
    form.innerHTML = `
        <h2>Sales Form</h2>
        
        <div class="compact-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="date">Date</label>
                    <input type="date" id="date" name="date" required>
                </div>
                
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" name="status" required>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="item_name">Name of Item</label>
                <input type="text" id="item_name" name="item_name" required>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="price_per_item">Price Per Item (TZS)</label>
                    <input type="number" id="price_per_item" name="price_per_item" min="0" step="0.01" required>
                </div>
                
                <div class="form-group">
                    <label for="quantity">Quantity</label>
                    <input type="number" id="quantity" name="quantity" min="1" step="1" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="total_price">Total Price (TZS)</label>
                <input type="number" id="total_price" name="total_price" readonly>
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

    // Calculate total price automatically
    const pricePerItemInput = form.querySelector('#price_per_item');
    const quantityInput = form.querySelector('#quantity');
    const totalPriceInput = form.querySelector('#total_price');

    function calculateTotal() {
        if (pricePerItemInput.value && quantityInput.value) {
            const total = parseFloat(pricePerItemInput.value) * parseInt(quantityInput.value);
            totalPriceInput.value = total.toFixed(2);
        }
    }

    pricePerItemInput.addEventListener('input', calculateTotal);
    quantityInput.addEventListener('input', calculateTotal);

    // Form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const messageContainer = form.querySelector('#messageContainer');
        messageContainer.innerHTML = ''; // Clear previous messages
        
        try {
            // Get the current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                throw new Error(`Authentication error: ${userError.message}`);
            }
            
            if (!user) {
                messageContainer.innerHTML = `<div class="error-message">You must be logged in to submit a sale.</div>`;
                messageContainer.scrollIntoView({ behavior: 'smooth' });
                return;
            }
            
            console.log('Current user:', user); // Debug log
            
            const formData = new FormData(form);
            const saleData = {
                date: formData.get('date'),
                item_name: formData.get('item_name'),
                price_per_item: parseFloat(formData.get('price_per_item')),
                quantity: parseInt(formData.get('quantity')),
                total_price: parseFloat(formData.get('total_price')),
                status: formData.get('status'),
                user_id: user.id  // Ensure user_id is included
            };

            console.log('Submitting sale data with user_id:', saleData.user_id);
            
            // Insert the sale data
            const { data, error } = await supabase
                .from('sales')
                .insert([saleData])
                .select(); // Add this to get the inserted data back

            if (error) {
                console.error('Error details:', error);
                messageContainer.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
                messageContainer.scrollIntoView({ behavior: 'smooth' });
                return;
            }

            console.log('Sale submitted successfully:', data);
            messageContainer.innerHTML = `<div class="success-message">Sale recorded successfully!</div>`;
            messageContainer.scrollIntoView({ behavior: 'smooth' });
            
            // Clear form except date
            form.querySelector('#item_name').value = '';
            form.querySelector('#price_per_item').value = '';
            form.querySelector('#quantity').value = '';
            form.querySelector('#total_price').value = '';
            form.querySelector('#status').value = 'completed'; // Reset to default
        } catch (error) {
            console.error('Error details:', error);
            messageContainer.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
            messageContainer.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Back button
    const backBtn = form.querySelector('#backBtn');
    backBtn.addEventListener('click', () => {
        navigateTo('dashboard');
    });

    return form;
}
