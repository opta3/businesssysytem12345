import { navigateTo, supabase } from '../app.js';

let currentLanguage = 'en'; // Default language

// Add this function to check if the current user is an admin
async function checkAdminStatus() {
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

// Add this function to load and display the user's profile picture
async function loadUserProfile(dashboard) {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            console.error('Error getting user:', userError);
            return;
        }
        
        console.log('Loading profile for user:', user.id);
        
        // Get user profile data - only request columns we know exist
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();
        
        if (profileError) {
            console.error('Error fetching profile:', profileError);
            // Continue execution even if profile fetch fails
        }
        
        // Find or create the profile section in the dashboard
        let profileSection = dashboard.querySelector('.user-profile');
        if (!profileSection) {
            profileSection = document.createElement('div');
            profileSection.className = 'user-profile';
            dashboard.prepend(profileSection);
        }
        
        // Default avatar data URI
        const defaultAvatarDataURI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNzBmMyIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOCAyLjY3IDggNnYxLjVjMCAyLjc2LTIuMjQgNS01IDVoLTZjLTIuNzYgMC01LTIuMjQtNS01VjExYzAtMy4zMyA1LjMzLTYgOC02ek0xMiA3Yy0xLjY2IDAtMyAxLjM0LTMgM3MxLjM0IDMgMyAzIDMtMS4zNCAzLTMtMS4zNC0zLTMtM3oiLz48L3N2Zz4=';
        
        // If we have profile data, display it
        if (profileData) {
            console.log('Profile data retrieved:', profileData);
            
            // Create or update profile picture element
            let profilePic = profileSection.querySelector('.profile-picture');
            if (!profilePic) {
                profilePic = document.createElement('div');
                profilePic.className = 'profile-picture';
                profileSection.prepend(profilePic);
            }
            
            // Always use default avatar since avatar_url doesn't exist in the database
            profilePic.innerHTML = `<img src="${defaultAvatarDataURI}" alt="Profile Picture">`;
            profilePic.style.display = 'block';
            
            // Add user name if available
            let nameElement = profileSection.querySelector('.user-name');
            if (!nameElement) {
                nameElement = document.createElement('div');
                nameElement.className = 'user-name';
                profileSection.appendChild(nameElement);
            }
            
            nameElement.textContent = profileData.full_name || user.email;
        } else {
            // If no profile data, just show email from user object
            let nameElement = profileSection.querySelector('.user-name');
            if (!nameElement) {
                nameElement = document.createElement('div');
                nameElement.className = 'user-name';
                profileSection.appendChild(nameElement);
            }
            
            // Create or update profile picture element with default avatar
            let profilePic = profileSection.querySelector('.profile-picture');
            if (!profilePic) {
                profilePic = document.createElement('div');
                profilePic.className = 'profile-picture';
                profileSection.prepend(profilePic);
            }
            
            profilePic.innerHTML = `<img src="${defaultAvatarDataURI}" alt="Default Profile">`;
            profilePic.style.display = 'block';
            
            nameElement.textContent = user.email;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        // Continue execution even if profile loading fails
    }
}

export async function createDashboard() {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
            console.log('No user found, redirecting to login');
            navigateTo('login');
            return document.createElement('div'); // Return empty div
        }
        
        // Create dashboard HTML
        const dashboard = document.createElement('div');
        dashboard.className = 'dashboard';
        
        // Check if user is admin
        const isAdmin = await checkAdminStatus();
        
        // Add user profile section at the top
        const profileSection = document.createElement('div');
        profileSection.className = 'user-profile';
        dashboard.appendChild(profileSection);
        
        // Load user profile data - only request columns we know exist
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
            
        // Default avatar data URI
        const defaultAvatarDataURI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNzBmMyIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOCAyLjY3IDggNnYxLjVjMCAyLjc2LTIuMjQgNS01IDVoLTZjLTIuNzYgMC01LTIuMjQtNS01VjExYzAtMy4zMyA1LjMzLTYgOC02ek0xMiA3Yy0xLjY2IDAtMyAxLjM0LTMgM3MxLjM0IDMgMyAzIDMtMS4zNCAzLTMtMS4zNC0zLTMtM3oiLz48L3N2Zz4=';
            
        if (!profileError && profileData) {
            console.log('Profile data loaded:', profileData);
            
            // Create profile picture element
            const profilePic = document.createElement('div');
            profilePic.className = 'profile-picture';
            profilePic.innerHTML = `<img src="${defaultAvatarDataURI}" alt="Default Profile">`;
            
            // Create user name element
            const nameElement = document.createElement('div');
            nameElement.className = 'user-name';
            nameElement.textContent = profileData.full_name || user.email;
            
            // Add elements to profile section
            profileSection.appendChild(profilePic);
            profileSection.appendChild(nameElement);
        } else {
            // If profile data couldn't be loaded, just show a default avatar and email
            const profilePic = document.createElement('div');
            profilePic.className = 'profile-picture';
            profilePic.innerHTML = `<img src="${defaultAvatarDataURI}" alt="Default Profile">`;
            
            const nameElement = document.createElement('div');
            nameElement.className = 'user-name';
            nameElement.textContent = user.email;
            
            profileSection.appendChild(profilePic);
            profileSection.appendChild(nameElement);
        }
        
        // Add the rest of the dashboard HTML
        const dashboardContent = document.createElement('div');
        dashboardContent.className = 'dashboard-content';
        dashboardContent.innerHTML = `
            <div class="card">
                <h2>Welcome to Business Management System</h2>
                <p>Select an option below to get started:</p>
                
                <div class="menu-container">
                    <button id="menuToggle" class="menu-toggle">
                        <span class="menu-icon">☰</span>
                    </button>
                    
                    <div class="button-group" id="menuItems">
                        <button id="salesBtn" class="primary-btn">
                            <span class="icon">📊</span> Sales Form
                        </button>
                        <button id="costsBtn" class="primary-btn">
                            <span class="icon">💰</span> Costs Form
                        </button>
                        <button id="procurementsBtn" class="primary-btn">
                            <span class="icon">🛒</span> Procurements Form
                        </button>
                        ${isAdmin ? `
                        <button id="adminBtn" class="primary-btn">
                            <span class="icon">⚙️</span> Admin Panel
                        </button>
                        ` : ''}
                        <button id="languageBtn" class="primary-btn">
                            <span class="icon">🌐</span> Switch to Kiswahili
                        </button>
                    </div>
                </div>
                
                <div class="logout-container">
                    <button id="logoutBtn" class="secondary-btn">Logout</button>
                </div>
            </div>
        `;
        
        dashboard.appendChild(dashboardContent);

        // Button event listeners
        const menuToggle = dashboard.querySelector('#menuToggle');
        const menuItems = dashboard.querySelector('#menuItems');
        const salesBtn = dashboard.querySelector('#salesBtn');
        const costsBtn = dashboard.querySelector('#costsBtn');
        const procurementsBtn = dashboard.querySelector('#procurementsBtn');
        const adminBtn = dashboard.querySelector('#adminBtn');
        const languageBtn = dashboard.querySelector('#languageBtn');
        const logoutBtn = dashboard.querySelector('#logoutBtn');

        // Toggle menu visibility
        menuToggle.addEventListener('click', () => {
            menuItems.classList.toggle('show');
        });

        salesBtn.addEventListener('click', () => {
            console.log('Sales button clicked');
            navigateTo('sales');
        });
        
        costsBtn.addEventListener('click', () => {
            console.log('Costs button clicked');
            navigateTo('costs');
        });
        
        procurementsBtn.addEventListener('click', () => {
            console.log('Procurements button clicked');
            navigateTo('procurements');
        });
        
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                console.log('Admin button clicked');
                navigateTo('admin');
            });
        }
        
        languageBtn.addEventListener('click', () => {
            currentLanguage = currentLanguage === 'en' ? 'sw' : 'en';
            languageBtn.textContent = currentLanguage === 'en' ? 'Switch to Kiswahili' : 'Switch to English';
            // Update all text content based on current language
            updateLanguage(dashboard);
        });

        logoutBtn.addEventListener('click', async () => {
            console.log('Logout button clicked');
            await handleLogout();
        });
        
        // Add this line to call the new function
        await loadUserProfile(dashboard);
        
        return dashboard;
        
    } catch (error) {
        console.error('Error creating dashboard:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `Error creating dashboard: ${error.message}`;
        return errorDiv;
    }
}

function updateLanguage(dashboard) {
    // Update all text content based on current language
    const translations = {
        en: {
            welcome: 'Welcome to Business Management System',
            selectOption: 'Select an option below to get started:',
            menuToggle: 'Menu',
            salesBtn: 'Sales Form',
            costsBtn: 'Costs Form',
            procurementsBtn: 'Procurements Form',
            adminBtn: 'Admin Panel',
            languageBtn: 'Switch to Kiswahili',
            logoutBtn: 'Logout'
        },
        sw: {
            welcome: 'Karibu kwenye Mfumo wa Usimamizi wa Biashara',
            selectOption: 'Chagua chaguo hapa chini kuanza:',
            menuToggle: 'Menyu',
            salesBtn: 'Fomu ya Mauzo',
            costsBtn: 'Fomu ya Gharama',
            procurementsBtn: 'Fomu ya Ununuzi',
            adminBtn: 'Paneli ya Msimamizi',
            languageBtn: 'Badilisha kwa Kiingereza',
            logoutBtn: 'Toka'
        }
    };

    const currentTranslations = translations[currentLanguage];
    
    // Update text content
    dashboard.querySelector('h2').textContent = currentTranslations.welcome;
    dashboard.querySelector('p').textContent = currentTranslations.selectOption;
    dashboard.querySelector('#menuToggle .menu-icon').textContent = '☰'; // Keep the icon
    dashboard.querySelector('#salesBtn').innerHTML = `<span class="icon">📊</span> ${currentTranslations.salesBtn}`;
    dashboard.querySelector('#costsBtn').innerHTML = `<span class="icon">💰</span> ${currentTranslations.costsBtn}`;
    dashboard.querySelector('#procurementsBtn').innerHTML = `<span class="icon">🛒</span> ${currentTranslations.procurementsBtn}`;
    
    const adminBtn = dashboard.querySelector('#adminBtn');
    if (adminBtn) {
        adminBtn.innerHTML = `<span class="icon">⚙️</span> ${currentTranslations.adminBtn}`;
    }
    
    dashboard.querySelector('#languageBtn').innerHTML = `<span class="icon">🌐</span> ${currentTranslations.languageBtn}`;
    dashboard.querySelector('#logoutBtn').textContent = currentTranslations.logoutBtn;
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        console.log('User logged out successfully');
        navigateTo('login');
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout: ' + error.message);
    }
}
