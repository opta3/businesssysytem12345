import { supabase, showError, showSuccess, navigateTo } from '../app.js';

export function createProcurementsForm() {
    const form = document.createElement('form');
    form.className = 'form-container procurements-form';
    form.innerHTML = `
        <h2>Procurements Form</h2>
        
        <div class="compact-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="date">Order Date</label>
                    <input type="date" id="date" name="date" required>
                </div>
                
                <div class="form-group">
                    <label for="delivery_date">Delivery Date</label>
                    <input type="date" id="delivery_date" name="delivery_date" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="item_name">Item Name</label>
                <input type="text" id="item_name" name="item_name" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="unit_price">Unit Price (TZS)</label>
                    <input type="number" id="unit_price" name="unit_price" min="0" step="0.01" required>
                </div>
                
                <div class="form-group">
                    <label for="price">Price Per Item (TZS)</label>
                    <input type="number" id="price" name="price" min="0" step="0.01" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="quantity">Quantity</label>
                    <input type="number" id="quantity" name="quantity" min="1" required>
                </div>
                
                <div class="form-group">
                    <label for="total_cost">Total Cost (TZS)</label>
                    <input type="number" id="total_cost" name="total_cost" readonly>
                </div>
            </div>
            
            <div class="form-group">
                <label for="supplier">Supplier</label>
                <input type="text" id="supplier" name="supplier" required>
            </div>
            
            <div class="form-group">
                <label for="status">Status</label>
                <select id="status" name="status" required>
                    <option value="pending">Pending</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="document">Document (Optional)</label>
                <input type="file" id="document" name="document">
            </div>
            
            <div id="messageContainer" class="message-container"></div>
        </div>
        
        <div class="button-group fixed-bottom">
            <button type="submit" class="submit-btn">Save</button>
            <button type="button" id="backBtn" class="back-btn">Back to Dashboard</button>
        </div>
    `;
    
    // Set default date to today
    const dateInput = form.querySelector('#date');
    const deliveryDateInput = form.querySelector('#delivery_date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Set default delivery date to 7 days from today
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    deliveryDateInput.value = nextWeek.toISOString().split('T')[0];
    
    // Calculate total cost
    const unitPrice = form.querySelector('#unit_price');
    const price = form.querySelector('#price');
    const quantity = form.querySelector('#quantity');
    const totalCost = form.querySelector('#total_cost');
    
    function calculateTotal() {
        if (price.value && quantity.value) {
            totalCost.value = (parseFloat(price.value) * parseInt(quantity.value)).toFixed(2);
        }
    }
    
    // Set price equal to unit_price by default
    unitPrice.addEventListener('input', function() {
        price.value = unitPrice.value;
        calculateTotal();
    });
    
    price.addEventListener('input', calculateTotal);
    quantity.addEventListener('input', calculateTotal);
    
    // Form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const messageContainer = form.querySelector('#messageContainer');
        messageContainer.innerHTML = ''; // Clear previous messages
        
        try {
            // Check if user is authenticated
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                throw userError;
            }
            
            if (!user) {
                messageContainer.innerHTML = `<div class="error-message">You must be logged in to submit a procurement.</div>`;
                messageContainer.scrollIntoView({ behavior: 'smooth' });
                return;
            }
            
            const formData = new FormData(form);
            const procurementData = {
                date: formData.get('date'),
                delivery_date: formData.get('delivery_date'),
                item_name: formData.get('item_name'),
                unit_price: parseFloat(formData.get('unit_price')),
                price: parseFloat(formData.get('price')),
                quantity: parseInt(formData.get('quantity')),
                total_cost: parseFloat(formData.get('total_cost')),
                supplier: formData.get('supplier'),
                status: formData.get('status'),
                user_id: user.id
            };
            
            console.log('Submitting procurement data:', procurementData);
            
            // Upload document if provided
            const document = formData.get('document');
            if (document && document.size > 0) {
                const timestamp = new Date().getTime();
                const fileExt = document.name.split('.').pop();
                const fileName = `${timestamp}.${fileExt}`;
                const filePath = `procurements/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, document);
                
                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath);
                
                procurementData.document_url = publicUrl;
            }
            
            // Insert procurement data
            const { data, error } = await supabase
                .from('procurements')
                .insert([procurementData]);

            if (error) {
                console.error('Error details:', error);
                messageContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
                messageContainer.scrollIntoView({ behavior: 'smooth' });
                return;
            }

            console.log('Procurement submitted successfully:', data);
            messageContainer.innerHTML = `<div class="success-message">Procurement recorded successfully!</div>`;
            messageContainer.scrollIntoView({ behavior: 'smooth' });
            
            // Clear form except date
            form.querySelector('#item_name').value = '';
            form.querySelector('#unit_price').value = '';
            form.querySelector('#price').value = '';
            form.querySelector('#quantity').value = '';
            form.querySelector('#total_cost').value = '';
            form.querySelector('#supplier').value = '';
            form.querySelector('#status').value = 'pending'; // Reset to default
            form.querySelector('#document').value = '';
        } catch (error) {
            console.error('Error details:', error);
            messageContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
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
