// Add this to the beginning of your app.js file or in a DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', function() {
    const root = document.getElementById('root');
    if (root) {
        root.style.minHeight = '100vh';
        root.style.display = 'flex';
        root.style.flexDirection = 'column';
    }
});

// Supabase configuration
const supabaseUrl = 'https://rprtlsentiiawfekhjrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcnRsc2VudGlpYXdmZWtoanJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MzY0MzMsImV4cCI6MjA2MTQxMjQzM30.X9Zim6RnnM-v1XfwfUoDu_Er0qDYL0p33xpee5Pi8e4';

// Initialize Supabase client
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Initialize application
async function initializeApp() {
    const root = document.getElementById('root');
    
    // Add error handling
    try {
        console.log('Initializing app...');
        
        // Check if user is logged in
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Auth error:', error);
            root.innerHTML = `<div class="error-message">Authentication error: ${error.message}</div>`;
            return;
        }
        
        console.log('Session check complete:', session ? 'User logged in' : 'No session');
        
        if (session) {
            // User is logged in, show dashboard
            navigateTo('dashboard');
        } else {
            // User is not logged in, show login form
            navigateTo('login');
        }
    } catch (err) {
        console.error('Initialization error:', err);
        root.innerHTML = `<div class="error-message">Failed to initialize app: ${err.message}</div>`;
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Create a function to get admin client only when needed
function getAdminClient() {
    return window.supabase.createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            storageKey: 'admin-storage-key' // Add unique storage key
        }
    });
}

// Utility functions
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    return errorDiv;
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    return successDiv;
}

// Authentication functions
async function registerUser(userData) {
    try {
        // Check if email already exists in auth
        const { data: authCheck, error: authCheckError } = await supabase.auth.signInWithOtp({
            email: userData.email,
            options: {
                shouldCreateUser: false
            }
        });
        
        // If no error, it means the email exists
        if (!authCheckError) {
            return { 
                success: false, 
                error: 'This email is already registered. Please use a different email.' 
            };
        }
        
        // Step 1: Sign up the user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.fullName,
                    age: userData.age,
                    gender: userData.gender,
                    tribe: userData.tribe,
                    phone: userData.phone
                }
            }
        });

        if (authError) throw authError;
        
        // Check if user was created successfully
        if (!authData.user) {
            throw new Error('User registration failed');
        }
        
        // Wait a moment for Supabase's database functions to create the profile
        // This is needed because Supabase has triggers that create profiles
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { success: true, data: authData };
    } catch (error) {
        console.error('Registration error details:', error);
        return { success: false, error: error.message || 'Registration failed' };
    }
}

async function loginUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Add this function to check if the current user is an admin
async function isUserAdmin() {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            return false;
        }
        
        // Check if user is admin by querying the profiles table
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
        
        if (profileError || !profileData) {
            return false;
        }
        
        return profileData.is_admin;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Navigation function
async function navigateTo(page) {
    console.log('Navigating to:', page);
    const root = document.getElementById('root');
    
    if (!root) {
        console.error('Root element not found!');
        return;
    }
    
    root.innerHTML = '<div class="loading-spinner"></div>'; // Show loading spinner
    
    // Check if trying to access admin panel
    if (page === 'admin') {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            root.innerHTML = `
                <div class="error-message">
                    You do not have permission to access the admin panel.
                </div>
                <button class="back-btn" onclick="window.navigateTo('dashboard')">Back to Dashboard</button>
            `;
            return;
        }
    }
    
    switch (page) {
        case 'login':
            console.log('Loading login form...');
            import('./components/LoginForm.js')
                .then(module => {
                    console.log('Login form module loaded');
                    const loginForm = module.createLoginForm();
                    root.innerHTML = ''; // Clear loading spinner
                    root.appendChild(loginForm);
                })
                .catch(error => {
                    console.error('Error loading login form:', error);
                    root.innerHTML = `
                        <div class="error-message">
                            Failed to load login form. Please refresh the page.
                            <br>Error: ${error.message}
                        </div>
                    `;
                });
            break;
        case 'dashboard':
            console.log('Loading dashboard...');
            import('./components/Dashboard.js')
                .then(async module => {
                    console.log('Dashboard module loaded');
                    try {
                        const dashboard = await module.createDashboard();
                        root.innerHTML = ''; // Clear loading spinner
                        root.appendChild(dashboard);
                    } catch (error) {
                        console.error('Error creating dashboard:', error);
                        root.innerHTML = `
                            <div class="error-message">
                                Failed to create dashboard. Please refresh the page.
                                <br>Error: ${error.message}
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Error loading dashboard module:', error);
                    root.innerHTML = `
                        <div class="error-message">
                            Failed to load dashboard module. Please refresh the page.
                            <br>Error: ${error.message}
                        </div>
                    `;
                });
            break;
        case 'costs':
            console.log('Loading costs form...');
            import('./components/CostsForm.js')
                .then(module => {
                    console.log('Costs form module loaded');
                    const costsForm = module.createCostsForm();
                    root.innerHTML = ''; // Clear loading spinner
                    root.appendChild(costsForm);
                })
                .catch(error => {
                    console.error('Error loading costs form:', error);
                    root.innerHTML = `
                        <div class="error-message">
                            Failed to load costs form. Please refresh the page.
                            <br>Error: ${error.message}
                        </div>
                    `;
                });
            break;
        case 'sales':
            console.log('Loading sales form...');
            import('./components/SalesForm.js')
                .then(module => {
                    console.log('Sales form module loaded');
                    const salesForm = module.createSalesForm();
                    root.innerHTML = ''; // Clear loading spinner
                    root.appendChild(salesForm);
                })
                .catch(error => {
                    console.error('Error loading sales form:', error);
                    root.innerHTML = `
                        <div class="error-message">
                            Failed to load sales form. Please refresh the page.
                            <br>Error: ${error.message}
                        </div>
                    `;
                });
            break;
        case 'procurements':
            console.log('Loading procurements form...');
            import('./components/ProcurementsForm.js')
                .then(module => {
                    console.log('Procurements form module loaded');
                    const procurementsForm = module.createProcurementsForm();
                    root.innerHTML = ''; // Clear loading spinner
                    root.appendChild(procurementsForm);
                })
                .catch(error => {
                    console.error('Error loading procurements form:', error);
                    root.innerHTML = `
                        <div class="error-message">
                            Failed to load procurements form. Please refresh the page.
                            <br>Error: ${error.message}
                        </div>
                    `;
                });
            break;
        case 'admin':
            console.log('Loading admin panel...');
            import('./components/AdminPanel.js')
                .then(module => {
                    console.log('Admin panel module loaded');
                    const adminPanel = module.createAdminPanel();
                    const adminRoot = document.getElementById('admin-panel');
                    
                    // Clear the main root and admin panel
                    root.innerHTML = '';
                    adminRoot.innerHTML = '';
                    
                    // Add a back button
                    const backBtn = document.createElement('button');
                    backBtn.textContent = 'Back to Dashboard';
                    backBtn.className = 'back-button';
                    backBtn.addEventListener('click', () => {
                        adminRoot.innerHTML = '';
                        navigateTo('dashboard');
                    });
                    
                    // Append the back button and admin panel
                    adminRoot.appendChild(backBtn);
                    adminRoot.appendChild(adminPanel);
                })
                .catch(error => {
                    console.error('Error loading admin panel:', error);
                    root.innerHTML = `
                        <div class="error-message">
                            Failed to load admin panel. Please refresh the page.
                            <br>Error: ${error.message}
                        </div>
                    `;
                });
            break;
        case 'register':
            console.log('Loading registration form...');
            import('./components/RegistrationForm.js')
                .then(module => {
                    console.log('Registration form module loaded');
                    const registrationForm = module.createRegistrationForm();
                    root.innerHTML = ''; // Clear loading spinner
                    root.appendChild(registrationForm);
                })
                .catch(error => {
                    console.error('Error loading registration form:', error);
                    root.innerHTML = `
                        <div class="error-message">
                            Failed to load registration form. Please refresh the page.
                            <br>Error: ${error.message}
                        </div>
                    `;
                });
            break;
        default:
            console.error(`Page not found: ${page}`);
            root.innerHTML = `<div class="error-message">Page "${page}" not found</div>`;
            
            // Add a button to go back to dashboard
            const backBtn = document.createElement('button');
            backBtn.textContent = 'Back to Dashboard';
            backBtn.addEventListener('click', () => navigateTo('dashboard'));
            root.appendChild(backBtn);
    }
}

// Make navigateTo available globally for the back button
window.navigateTo = navigateTo;

// Export modified objects and functions
export {
    supabase,
    showError,
    showSuccess,
    navigateTo,
    getAdminClient as supabaseAdmin,
    loginUser,
    registerUser,
    isUserAdmin
}; 
