# Business Management System

A comprehensive web application for managing business operations, including sales, costs, and procurements. Built with HTML, CSS, JavaScript, and Supabase.

## Features

### User System
- Registration with detailed user information
- Login functionality
- Profile picture upload
- Multi-language support (English and Kiswahili)

### Forms
- Sales Form: Track sales with item details and pricing
- Costs Form: Record business expenses
- Procurements Form: Manage purchases with supplier information
- All forms support add, edit, and delete operations

### Admin Panel
- View all records (Sales, Costs, Procurements)
- Data visualization with charts
- Profit calculation
- Export reports to PDF and Excel
- Admin user management

## Setup Instructions

1. Clone the repository:
```bash
git clone [repository-url]
cd business-management-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project in Supabase
   - Create the following tables:
     - users
     - sales
     - costs
     - procurements
   - Set up storage buckets for profile pictures and procurement documents

4. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add your Supabase URL and anon key:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:
```bash
npm start
```

## Database Schema

### Users Table
- id (uuid, primary key)
- email (text, unique)
- full_name (text)
- age (integer)
- gender (text)
- tribe (text)
- phone (text)
- profile_picture_url (text)
- created_at (timestamp)

### Sales Table
- id (uuid, primary key)
- date (date)
- item_name (text)
- price_per_item (decimal)
- quantity (integer)
- total_price (decimal)
- user_id (uuid, foreign key)
- created_at (timestamp)

### Costs Table
- id (uuid, primary key)
- date (date)
- description (text)
- amount (decimal)
- user_id (uuid, foreign key)
- created_at (timestamp)

### Procurements Table
- id (uuid, primary key)
- item_name (text)
- price (decimal)
- quantity (integer)
- total_cost (decimal)
- supplier_name (text)
- document_url (text)
- user_id (uuid, foreign key)
- created_at (timestamp)

## Usage

1. Register a new account
2. Log in to access the dashboard
3. Use the navigation buttons to access different forms
4. Enter data in the forms
5. View and manage records in the admin panel
6. Export reports as needed

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. "# businesssysytem1234" 
