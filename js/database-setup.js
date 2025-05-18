// Create a profiles table with admin flag
const createProfilesTable = async () => {
    const { error } = await supabase.rpc('create_profiles_table_if_not_exists', {
        sql: `
            CREATE TABLE IF NOT EXISTS profiles (
                id UUID REFERENCES auth.users(id) PRIMARY KEY,
                full_name TEXT,
                email TEXT UNIQUE,
                age INTEGER,
                gender TEXT,
                tribe TEXT,
                phone TEXT,
                avatar_url TEXT,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
            );
            
            -- Set the first user (super admin) as admin
            UPDATE profiles 
            SET is_admin = TRUE 
            WHERE email = 'flaexdac@gmail.com';
        `
    });
    
    if (error) {
        console.error('Error creating profiles table:', error);
    } else {
        console.log('Profiles table created or already exists');
    }
};