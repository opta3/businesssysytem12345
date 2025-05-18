import { supabase, showError, showSuccess } from '../app.js';
import * as XLSX from 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm';

export function createAdminPanel() {
    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    
    // Add HTML content
    panel.innerHTML = `
        <div class="admin-header">
            <h2>Admin Panel</h2>
            <div class="date-filter">
                <input type="date" id="startDate" placeholder="Start Date">
                <input type="date" id="endDate" placeholder="End Date">
                <button id="applyDateRange">Apply</button>
                
                <div class="quick-filters">
                    <button data-range="today">Today</button>
                    <button data-range="week">This Week</button>
                    <button data-range="month">This Month</button>
                    <button data-range="year">This Year</button>
                </div>
            </div>
            <div class="export-options">
                <div class="export-selection">
                    <h4>Select data to export:</h4>
                    <div class="checkbox-group">
                        <label><input type="checkbox" id="exportSales" checked> Sales</label>
                        <label><input type="checkbox" id="exportCosts" checked> Costs</label>
                        <label><input type="checkbox" id="exportProcurements" checked> Procurements</label>
                    </div>
                </div>
                <button id="exportPDF">Export to PDF</button>
                <button id="exportExcel">Export to Excel</button>
                <button id="manageAdmins">Manage Admins</button>
            </div>
        </div>
        
        <div class="admin-content">
            <div class="charts-container">
                <div class="chart-card">
                    <h3>Sales Overview</h3>
                    <canvas id="salesChart"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Costs Overview</h3>
                    <canvas id="costsChart"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Procurements Overview</h3>
                    <canvas id="procurementsChart"></canvas>
                </div>
            </div>
            
            <div class="profit-summary">
                <h3>Profit Summary</h3>
                <div id="profitDetails"></div>
            </div>
            
            <div class="data-tables">
                <div class="table-section">
                    <h3>Sales Data</h3>
                    <table id="salesTable">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Item</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Total</th>
                                <th>User</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
                
                <div class="table-section">
                    <h3>Costs Data</h3>
                    <table id="costsTable">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>User</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
                
                <div class="table-section">
                    <h3>Procurements Data</h3>
                    <table id="procurementsTable">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Delivery Date</th>
                                <th>Item</th>
                                <th>Unit Price</th>
                                <th>Quantity</th>
                                <th>Total</th>
                                <th>Supplier</th>
                                <th>Status</th>
                                <th>User</th>
                                <th>Document</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Declare chart variables at the component level
    let salesChart, costsChart, procurementsChart;

    // Helper function to format currency in TZS
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Initialize charts after the panel is added to the DOM
    setTimeout(() => {
        initializeCharts();
    }, 100);

    function initializeCharts() {
        const salesChartCtx = panel.querySelector('#salesChart');
        const costsChartCtx = panel.querySelector('#costsChart');
        const procurementsChartCtx = panel.querySelector('#procurementsChart');
        
        if (salesChartCtx && costsChartCtx && procurementsChartCtx) {
            salesChart = new Chart(salesChartCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Sales',
                        data: [],
                        backgroundColor: 'rgba(54, 162, 235, 0.5)'
                    }]
                }
            });

            costsChart = new Chart(costsChartCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Costs',
                        data: [],
                        backgroundColor: 'rgba(255, 99, 132, 0.5)'
                    }]
                }
            });

            procurementsChart = new Chart(procurementsChartCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Procurements',
                        data: [],
                        backgroundColor: 'rgba(75, 192, 192, 0.5)'
                    }]
                }
            });
        } else {
            console.error('Chart contexts not found');
        }
    }

    // Setup event listeners after the panel is added to the DOM
    setTimeout(() => {
        setupEventListeners();
        setupManageAdminsButton(panel);
    }, 200);

    function setupEventListeners() {
        const startDate = panel.querySelector('#startDate');
        const endDate = panel.querySelector('#endDate');
        const applyDateRange = panel.querySelector('#applyDateRange');
        const quickFilters = panel.querySelectorAll('.quick-filters button');
        const exportPDF = panel.querySelector('#exportPDF');
        const exportExcel = panel.querySelector('#exportExcel');
        const manageAdmins = panel.querySelector('#manageAdmins');

        if (!startDate || !endDate || !applyDateRange) {
            console.error('Date filter elements not found');
            return;
        }

        if (applyDateRange) {
            applyDateRange.addEventListener('click', () => {
                if (startDate.value && endDate.value) {
                    loadData(startDate.value, endDate.value);
                }
            });
        }

        if (quickFilters && quickFilters.length > 0) {
            quickFilters.forEach(button => {
                button.addEventListener('click', () => {
                    const range = button.dataset.range;
                    const today = new Date();
                    let start, end;

                    switch (range) {
                        case 'today':
                            start = end = today.toISOString().split('T')[0];
                            break;
                        case 'week':
                            start = new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split('T')[0];
                            end = new Date(today.setDate(today.getDate() + 6)).toISOString().split('T')[0];
                            break;
                        case 'month':
                            start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                            end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                            break;
                        case 'year':
                            start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                            end = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
                            break;
                    }

                    startDate.value = start;
                    endDate.value = end;
                    loadData(start, end);
                });
            });
        }

        if (exportPDF) {
            exportPDF.addEventListener('click', async () => {
                // Get export selections
                const exportSales = panel.querySelector('#exportSales').checked;
                const exportCosts = panel.querySelector('#exportCosts').checked;
                const exportProcurements = panel.querySelector('#exportProcurements').checked;
                
                if (!exportSales && !exportCosts && !exportProcurements) {
                    alert('Please select at least one data type to export.');
                    return;
                }
                
                try {
                    // Fetch user profiles for the report
                    const { data: profiles, error: profilesError } = await supabase
                        .from('profiles')
                        .select('*');
                    
                    if (profilesError) {
                        console.error('Error fetching profiles:', profilesError);
                        throw profilesError;
                    }
                    
                    // Create a map of user IDs to names and emails
                    const userMap = {};
                    profiles.forEach(profile => {
                        userMap[profile.id] = {
                            name: profile.full_name || 'No Name',
                            email: profile.email || 'No Email'
                        };
                    });
                    
                    // Use the global jsPDF object from the window
                    const doc = new window.jspdf.jsPDF();
                    
                    // Add title
                    doc.text('Business Management Report', 20, 20);
                    
                    // Add date range
                    doc.text(`Period: ${startDate.value} to ${endDate.value}`, 20, 30);
                    
                    // Add profit summary
                    let yPosition = 40;
                    const profitDetails = document.getElementById('profitDetails');
                    if (profitDetails) {
                        // Get profit details text content
                        const profitLines = profitDetails.textContent.trim().split('\n');
                        
                        // Add each line of profit details with proper spacing
                        profitLines.forEach(line => {
                            doc.text(line.trim(), 20, yPosition);
                            yPosition += 10;
                        });
                        
                        // Add extra space after profit details
                        yPosition += 10;
                    } else {
                        // If no profit details, still move down
                        yPosition = 60;
                    }
                    
                    // Add tables based on selection with proper spacing
                    if (exportSales) {
                        doc.text('Sales Data', 20, yPosition);
                        yPosition += 10;
                        
                        // Create a modified sales table with user info
                        const salesTable = document.getElementById('salesTable');
                        const modifiedSalesTable = document.createElement('table');
                        modifiedSalesTable.innerHTML = `
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Item</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                    <th>User Name</th>
                                    <th>User Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.from(salesTable.querySelectorAll('tbody tr')).map(row => {
                                    const cells = row.querySelectorAll('td');
                                    const userId = cells[5].getAttribute('data-user-id');
                                    const user = userId && userMap[userId] ? userMap[userId] : { name: 'N/A', email: 'N/A' };
                                    return `
                                        <tr>
                                            <td>${cells[0].textContent}</td>
                                            <td>${cells[1].textContent}</td>
                                            <td>${cells[2].textContent}</td>
                                            <td>${cells[3].textContent}</td>
                                            <td>${cells[4].textContent}</td>
                                            <td>${user.name}</td>
                                            <td>${user.email}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        `;
                        
                        // Add the modified table to the PDF
                        doc.autoTable({ 
                            html: modifiedSalesTable, 
                            startY: yPosition,
                            margin: { top: 10 }
                        });
                        yPosition = doc.lastAutoTable.finalY + 20; // Add more space after the table
                    }
                    
                    if (exportCosts) {
                        doc.text('Costs Data', 20, yPosition);
                        yPosition += 10;
                        
                        // Create a modified costs table with user info
                        const costsTable = document.getElementById('costsTable');
                        const modifiedCostsTable = document.createElement('table');
                        modifiedCostsTable.innerHTML = `
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>User Name</th>
                                    <th>User Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.from(costsTable.querySelectorAll('tbody tr')).map(row => {
                                    const cells = row.querySelectorAll('td');
                                    const userId = cells[3].getAttribute('data-user-id');
                                    const user = userMap[userId] || { name: 'N/A', email: 'N/A' };
                                    return `
                                        <tr>
                                            <td>${cells[0].textContent}</td>
                                            <td>${cells[1].textContent}</td>
                                            <td>${cells[2].textContent}</td>
                                            <td>${user.name}</td>
                                            <td>${user.email}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        `;
                        
                        // Add the modified table to the PDF
                        doc.autoTable({ 
                            html: modifiedCostsTable, 
                            startY: yPosition,
                            margin: { top: 10 }
                        });
                        yPosition = doc.lastAutoTable.finalY + 20; // Add more space after the table
                    }
                    
                    if (exportProcurements) {
                        doc.text('Procurements Data', 20, yPosition);
                        yPosition += 10;
                        
                        // Create a modified procurements table with user info
                        const procurementsTable = document.getElementById('procurementsTable');
                        const modifiedProcurementsTable = document.createElement('table');
                        modifiedProcurementsTable.innerHTML = `
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Delivery Date</th>
                                    <th>Item</th>
                                    <th>Unit Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                    <th>Supplier</th>
                                    <th>Status</th>
                                    <th>User Name</th>
                                    <th>User Email</th>
                                    <th>Document</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.from(procurementsTable.querySelectorAll('tbody tr')).map(row => {
                                    const cells = row.querySelectorAll('td');
                                    const userId = cells[8].getAttribute('data-user-id');
                                    const user = userMap[userId] || { name: 'N/A', email: 'N/A' };
                                    return `
                                        <tr>
                                            <td>${cells[0].textContent}</td>
                                            <td>${cells[1].textContent}</td>
                                            <td>${cells[2].textContent}</td>
                                            <td>${cells[3].textContent}</td>
                                            <td>${cells[4].textContent}</td>
                                            <td>${cells[5].textContent}</td>
                                            <td>${cells[6].textContent}</td>
                                            <td>${cells[7].textContent}</td>
                                            <td>${user.name}</td>
                                            <td>${user.email}</td>
                                            <td>${cells[9].querySelector('a') ? 'Yes' : 'No'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        `;
                        
                        // Add the modified table to the PDF
                        doc.autoTable({ 
                            html: modifiedProcurementsTable, 
                            startY: yPosition,
                            margin: { top: 10 }
                        });
                    }
                    
                    doc.save('business-report.pdf');
                    
                } catch (error) {
                    console.error('Error exporting to PDF:', error);
                    alert('Error exporting to PDF: ' + error.message);
                }
            });
        }

        if (exportExcel) {
            exportExcel.addEventListener('click', async () => {
                // Get export selections
                const exportSales = panel.querySelector('#exportSales').checked;
                const exportCosts = panel.querySelector('#exportCosts').checked;
                const exportProcurements = panel.querySelector('#exportProcurements').checked;
                
                if (!exportSales && !exportCosts && !exportProcurements) {
                    alert('Please select at least one data type to export.');
                    return;
                }
                
                try {
                    // Fetch user profiles for the report - make sure we get all fields
                    const { data: profiles, error: profilesError } = await supabase
                        .from('profiles')
                        .select('*');
                    
                    if (profilesError) {
                        console.error('Error fetching profiles:', profilesError);
                        throw profilesError;
                    }
                    
                    console.log('Fetched profiles for Excel export:', profiles);
                    
                    // Create a map of user IDs to names and emails
                    const userMap = {};
                    profiles.forEach(profile => {
                        userMap[profile.id] = {
                            name: profile.full_name || 'No Name',
                            email: profile.email || 'No Email'
                        };
                        console.log(`Excel export: Mapped user ${profile.id} to ${profile.full_name} (${profile.email})`);
                    });
                    
                    // Create a new workbook
                    const workbook = XLSX.utils.book_new();
                    
                    // Add sales data if selected
                    if (exportSales) {
                        // Fetch the latest sales data directly from the database
                        const { data: salesData, error: salesError } = await supabase
                            .from('sales')
                            .select('*')
                            .gte('date', startDate.value || '1900-01-01')
                            .lte('date', endDate.value || '2100-12-31')
                            .order('date', { ascending: false });
                        
                        if (salesError) {
                            console.error('Error fetching sales data for export:', salesError);
                            throw salesError;
                        }
                        
                        console.log('Fetched sales data for Excel export:', salesData);
                        
                        // Prepare data for Excel
                        const excelSalesData = [];
                        
                        // Add header row
                        excelSalesData.push(['Date', 'Item', 'Price', 'Quantity', 'Total', 'User Name', 'User Email']);
                        
                        // Add data rows
                        salesData.forEach(sale => {
                            const user = userMap[sale.user_id] || { name: 'Unknown User', email: 'No Email' };
                            excelSalesData.push([
                                sale.date,
                                sale.item_name,
                                sale.price_per_item,
                                sale.quantity,
                                sale.total_price,
                                user.name,
                                user.email
                            ]);
                        });
                        
                        const salesSheet = XLSX.utils.aoa_to_sheet(excelSalesData);
                        XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales');
                    }
                    
                    // Add costs data if selected
                    if (exportCosts) {
                        // Fetch the latest costs data directly from the database
                        const { data: costsData, error: costsError } = await supabase
                            .from('costs')
                            .select('*')
                            .gte('date', startDate.value || '1900-01-01')
                            .lte('date', endDate.value || '2100-12-31')
                            .order('date', { ascending: false });
                        
                        if (costsError) {
                            console.error('Error fetching costs data for export:', costsError);
                            throw costsError;
                        }
                        
                        // Prepare data for Excel
                        const excelCostsData = [];
                        
                        // Add header row
                        excelCostsData.push(['Date', 'Description', 'Amount', 'User Name', 'User Email']);
                        
                        // Add data rows
                        costsData.forEach(cost => {
                            const user = userMap[cost.user_id] || { name: 'Unknown User', email: 'No Email' };
                            excelCostsData.push([
                                cost.date,
                                cost.description,
                                cost.amount,
                                user.name,
                                user.email
                            ]);
                        });
                        
                        const costsSheet = XLSX.utils.aoa_to_sheet(excelCostsData);
                        XLSX.utils.book_append_sheet(workbook, costsSheet, 'Costs');
                    }
                    
                    // Add procurements data if selected
                    if (exportProcurements) {
                        // Fetch the latest procurements data directly from the database
                        const { data: procurementsData, error: procurementsError } = await supabase
                            .from('procurements')
                            .select('*')
                            .gte('date', startDate.value || '1900-01-01')
                            .lte('date', endDate.value || '2100-12-31')
                            .order('date', { ascending: false });
                        
                        if (procurementsError) {
                            console.error('Error fetching procurements data for export:', procurementsError);
                            throw procurementsError;
                        }
                        
                        // Prepare data for Excel
                        const excelProcurementsData = [];
                        
                        // Add header row
                        excelProcurementsData.push(['Date', 'Delivery Date', 'Item', 'Unit Price', 'Quantity', 'Total', 'Supplier', 'Status', 'User Name', 'User Email', 'Document']);
                        
                        // Add data rows
                        procurementsData.forEach(proc => {
                            const user = userMap[proc.user_id] || { name: 'Unknown User', email: 'No Email' };
                            excelProcurementsData.push([
                                proc.date,
                                proc.delivery_date,
                                proc.item_name,
                                proc.unit_price,
                                proc.quantity,
                                proc.total_cost,
                                proc.supplier,
                                proc.status,
                                user.name,
                                user.email,
                                proc.document_url ? 'Yes' : 'No'
                            ]);
                        });
                        
                        const procurementsSheet = XLSX.utils.aoa_to_sheet(excelProcurementsData);
                        XLSX.utils.book_append_sheet(workbook, procurementsSheet, 'Procurements');
                    }
                    
                    // Generate Excel file and download
                    XLSX.writeFile(workbook, 'business-report.xlsx');
                    
                } catch (error) {
                    console.error('Error exporting to Excel:', error);
                    alert('Error exporting to Excel: ' + error.message);
                }
            });
        }

        if (manageAdmins) {
            manageAdmins.addEventListener('click', () => {
                alert('Admin management functionality will be implemented soon.');
            });
        }
    }

    // Load data function
    async function loadData(startDate, endDate) {
        try {
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) throw userError;
            
            if (!user) {
                throw new Error('You must be logged in to view this page');
            }
            
            // Check if user is admin by querying the profiles table
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();
            
            if (profileError) throw profileError;
            
            if (!profileData || !profileData.is_admin) {
                throw new Error('You do not have permission to access the admin panel');
            }
            
            // Format dates for query
            const formattedStartDate = startDate || '1900-01-01';
            const formattedEndDate = endDate || '2100-12-31';
            
            console.log(`Loading data from ${formattedStartDate} to ${formattedEndDate}`);
            
            // Fetch sales data
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('*') // Make sure to select all columns including user_id
                .gte('date', formattedStartDate)
                .lte('date', formattedEndDate)
                .order('date', { ascending: false });
            
            if (salesError) throw salesError;
            
            console.log('Fetched sales data:', sales);
            
            // Fetch costs data
            const { data: costs, error: costsError } = await supabase
                .from('costs')
                .select('*')
                .gte('date', formattedStartDate)
                .lte('date', formattedEndDate)
                .order('date', { ascending: false });
            
            if (costsError) throw costsError;
            
            // Fetch procurements data
            const { data: procurements, error: procurementsError } = await supabase
                .from('procurements')
                .select('*')
                .gte('date', formattedStartDate)
                .lte('date', formattedEndDate)
                .order('date', { ascending: false });
            
            if (procurementsError) throw procurementsError;
            
            // Update tables with fetched data
            await updateTables(sales, costs, procurements);
            
            // Calculate profit
            calculateProfit(sales, costs);
            
            // Update charts
            updateCharts(sales, costs, procurements);
        } catch (error) {
            console.error('Error loading data:', error);
            panel.innerHTML = `<div class="error-message">Error loading data: ${error.message}</div>`;
        }
    }

    function updateCharts(sales, costs, procurements) {
        // Make sure charts are defined before updating
        if (!salesChart || !costsChart || !procurementsChart) {
            console.error('Charts not initialized');
            return;
        }
        
        // Update sales chart
        salesChart.data.labels = sales.map(s => s.date);
        salesChart.data.datasets[0].data = sales.map(s => s.total_price);
        salesChart.update();

        // Update costs chart
        costsChart.data.labels = costs.map(c => c.date);
        costsChart.data.datasets[0].data = costs.map(c => c.amount);
        costsChart.update();

        // Update procurements chart
        procurementsChart.data.labels = procurements.map(p => p.date);
        procurementsChart.data.datasets[0].data = procurements.map(p => p.total_cost);
        procurementsChart.update();
    }

    async function updateTables(sales, costs, procurements) {
        try {
            // Fetch all user profiles to get names
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email');
            
            if (profilesError) {
                console.error('Error fetching user profiles:', profilesError);
                throw profilesError;
            }
            
            console.log('Fetched profiles for tables:', profiles);
            
            // Create a map of user IDs to names for quick lookup
            const userMap = {};
            profiles.forEach(profile => {
                userMap[profile.id] = {
                    name: profile.full_name || 'No Name',
                    email: profile.email || 'No Email'
                };
                console.log(`Mapped user ${profile.id} to ${profile.full_name} (${profile.email})`);
            });
            
            // Update sales table
            const salesTable = panel.querySelector('#salesTable tbody');
            if (salesTable) {
                salesTable.innerHTML = sales.map(sale => {
                    console.log(`Processing sale with user_id: ${sale.user_id}`);
                    const userData = userMap[sale.user_id] || { name: 'Unknown User', email: 'No Email' };
                    return `
                        <tr>
                            <td>${sale.date}</td>
                            <td>${sale.item_name}</td>
                            <td>${formatCurrency(sale.price_per_item)}</td>
                            <td>${sale.quantity}</td>
                            <td>${formatCurrency(sale.total_price)}</td>
                            <td data-user-id="${sale.user_id || ''}">${userData.name}</td>
                        </tr>
                    `;
                }).join('');
            }

            // Update costs table
            const costsTable = panel.querySelector('#costsTable tbody');
            if (costsTable) {
                costsTable.innerHTML = costs.map(cost => {
                    const userData = userMap[cost.user_id] || { name: 'Unknown User', email: 'No Email' };
                    return `
                        <tr>
                            <td>${cost.date}</td>
                            <td>${cost.description}</td>
                            <td>${formatCurrency(cost.amount)}</td>
                            <td data-user-id="${cost.user_id || ''}">${userData.name}</td>
                        </tr>
                    `;
                }).join('');
            }

            // Update procurements table
            const procurementsTable = panel.querySelector('#procurementsTable tbody');
            if (procurementsTable) {
                procurementsTable.innerHTML = procurements.map(proc => {
                    const userData = userMap[proc.user_id] || { name: 'Unknown User', email: 'No Email' };
                    return `
                        <tr>
                            <td>${proc.date || 'N/A'}</td>
                            <td>${proc.delivery_date || 'N/A'}</td>
                            <td>${proc.item_name || 'N/A'}</td>
                            <td>${formatCurrency(proc.unit_price || 0)}</td>
                            <td>${proc.quantity || 0}</td>
                            <td>${formatCurrency(proc.total_cost || 0)}</td>
                            <td>${proc.supplier || 'N/A'}</td>
                            <td>${proc.status || 'N/A'}</td>
                            <td data-user-id="${proc.user_id || ''}">${userData.name}</td>
                            ${proc.document_url ? `<td><a href="${proc.document_url}" target="_blank" class="document-link">View Document</a></td>` : '<td>No document</td>'}
                        </tr>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Error updating tables:', error);
            panel.innerHTML += `<div class="error-message">Error updating tables: ${error.message}</div>`;
        }
    }

    function calculateProfit(sales, costs) {
        const totalSales = sales.reduce((sum, sale) => sum + sale.total_price, 0);
        const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
        
        const profit = totalSales - totalCosts;
        
        const profitDetails = panel.querySelector('#profitDetails');
        if (profitDetails) {
            profitDetails.innerHTML = `
                <p>Total Sales: ${formatCurrency(totalSales)}</p>
                <p>Total Costs: ${formatCurrency(totalCosts)}</p>
                <p class="profit">Net Profit: ${formatCurrency(profit)}</p>
            `;
            
            // Add data attributes for PDF export
            profitDetails.setAttribute('data-total-sales', totalSales);
            profitDetails.setAttribute('data-total-costs', totalCosts);
            profitDetails.setAttribute('data-net-profit', profit);
        }
    }

    // Load initial data with a delay to ensure charts are initialized
    setTimeout(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const startDateInput = panel.querySelector('#startDate');
        const endDateInput = panel.querySelector('#endDate');
        
        if (startDateInput && endDateInput) {
            startDateInput.value = startOfMonth.toISOString().split('T')[0];
            endDateInput.value = endOfMonth.toISOString().split('T')[0];
            
            loadData(startDateInput.value, endDateInput.value);
        }
    }, 500);

    return panel;
}

function setupManageAdminsButton(panel) {
    const manageAdmins = panel.querySelector('#manageAdmins');
    
    if (manageAdmins) {
        manageAdmins.addEventListener('click', async () => {
            try {
                // Get current user
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                
                if (userError) throw userError;
                
                if (!user) {
                    throw new Error('You must be logged in to manage admins');
                }
                
                // Check if user is super admin (first admin)
                const isSuperAdmin = user.email === 'flaexdac@gmail.com'; // Replace with your super admin email
                
                if (!isSuperAdmin) {
                    alert('Only the super admin can manage other admins');
                    return;
                }
                
                // Create admin management modal
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Manage Admins</h3>
                            <button class="close-btn">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="admin-management">
                                <div class="user-list-container">
                                    <h4>All Users</h4>
                                    <div class="search-box">
                                        <input type="text" id="userSearch" placeholder="Search users...">
                                    </div>
                                    <div class="user-list" id="userList">
                                        <div class="loading-spinner"></div>
                                    </div>
                                </div>
                                
                                <div class="admin-list-container">
                                    <h4>Current Admins</h4>
                                    <div class="admin-list" id="adminList">
                                        <div class="loading-spinner"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Close button functionality
                const closeBtn = modal.querySelector('.close-btn');
                closeBtn.addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
                
                // Close when clicking outside the modal
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        document.body.removeChild(modal);
                    }
                });
                
                // Load users and admins
                await loadUsers(modal);
                
            } catch (error) {
                console.error('Error managing admins:', error);
                alert('Error: ' + error.message);
            }
        });
    }
}

// Function to load users
async function loadUsers(modal) {
    const userList = modal.querySelector('#userList');
    const adminList = modal.querySelector('#adminList');
    const searchInput = modal.querySelector('#userSearch');
    
    try {
        // Fetch all users
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, email, is_admin');
        
        if (usersError) throw usersError;
        
        // Render users
        renderUsers(users, userList, adminList);
        
        // Setup search functionality
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredUsers = users.filter(user => 
                user.full_name?.toLowerCase().includes(searchTerm) || 
                user.email?.toLowerCase().includes(searchTerm)
            );
            renderUsers(filteredUsers, userList, adminList);
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
        userList.innerHTML = `<div class="error-message">Error loading users: ${error.message}</div>`;
        adminList.innerHTML = `<div class="error-message">Error loading admins: ${error.message}</div>`;
    }
}

// Function to render users
function renderUsers(users, userList, adminList) {
    // Filter admins
    const admins = users.filter(user => user.is_admin);
    const regularUsers = users.filter(user => !user.is_admin);
    
    // Render regular users
    userList.innerHTML = regularUsers.length > 0 
        ? regularUsers.map(user => `
            <div class="user-item">
                <div class="user-info">
                    <div class="user-name">${user.full_name || 'No Name'}</div>
                    <div class="user-email">${user.email || 'No Email'}</div>
                </div>
                <button class="make-admin-btn" data-user-id="${user.id}">Make Admin</button>
            </div>
        `).join('')
        : '<div class="empty-message">No regular users found</div>';
    
    // Render admins
    adminList.innerHTML = admins.length > 0
        ? admins.map(admin => `
            <div class="admin-item">
                <div class="admin-info">
                    <div class="admin-name">${admin.full_name || 'No Name'}</div>
                    <div class="admin-email">${admin.email || 'No Email'}</div>
                </div>
                <button class="remove-admin-btn" data-user-id="${admin.id}">Remove Admin</button>
            </div>
        `).join('')
        : '<div class="empty-message">No admins found</div>';
    
    // Add event listeners to buttons
    const makeAdminBtns = userList.querySelectorAll('.make-admin-btn');
    makeAdminBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.getAttribute('data-user-id');
            await updateAdminStatus(userId, true, userList, adminList);
        });
    });
    
    const removeAdminBtns = adminList.querySelectorAll('.remove-admin-btn');
    removeAdminBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.getAttribute('data-user-id');
            await updateAdminStatus(userId, false, userList, adminList);
        });
    });
}

// Function to update admin status
async function updateAdminStatus(userId, makeAdmin, userList, adminList) {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        // Check if user is super admin
        const isSuperAdmin = user.email === 'flaexdac@gmail.com'; // Replace with your super admin email
        
        if (!isSuperAdmin) {
            throw new Error('Only the super admin can change admin status');
        }
        
        // Update user's admin status
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: makeAdmin })
            .eq('id', userId);
        
        if (updateError) throw updateError;
        
        // Refresh the lists
        const modal = userList.closest('.modal');
        await loadUsers(modal);
        
        // Show success message
        alert(makeAdmin ? 'User is now an admin' : 'Admin privileges removed');
        
    } catch (error) {
        console.error('Error updating admin status:', error);
        alert('Error: ' + error.message);
    }
}
