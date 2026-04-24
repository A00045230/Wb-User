// Marvel - Returns Management (UPDATE, DELETE)

document.addEventListener('DOMContentLoaded', () => {
    loadActiveLoansForReturn();
    loadReturnHistory();
    document.getElementById('searchReturn').addEventListener('input', filterReturnLoans);
});

async function loadActiveLoansForReturn() {
    const { data, error } = await supabaseClient
        .from('loans')
        .select(`
            loan_id,
            loan_date,
            due_date,
            members!inner (name),
            books!inner (title, book_id, available_copies)
        `)
        .is('return_date', null);
    
    if (error) {
        console.error('Error loading active loans:', error);
        showMessage('Error loading loans', true);
        return;
    }
    
    displayActiveLoansForReturn(data || []);
}

function displayActiveLoansForReturn(loans) {
    const tbody = document.getElementById('returnLoansBody');
    tbody.innerHTML = '';
    
    if (loans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No active loans</td>' + '</tr>';
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    loans.forEach(loan => {
        const isOverdue = loan.due_date < today;
        const status = isOverdue ? 
            '<span class="status-overdue">Overdue</span>' : 
            '<span class="status-active">Active</span>';
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${loan.loan_id}</td>
            <td>${loan.members?.name || 'Unknown'}</td>
            <td>${loan.books?.title || 'Unknown'}</td>
            <td>${new Date(loan.loan_date).toLocaleDateString()}</td>
            <td>${new Date(loan.due_date).toLocaleDateString()}</td>
            <td>${status}</td>
            <td><button class="btn-success" onclick="processReturn(${loan.loan_id}, ${loan.books?.book_id})">✅ Return</button></td>
        `;
    });
}

async function processReturn(loanId, bookId) {
    if (!confirm('Process this book return?')) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Update loan with return date
    const { error: loanError } = await supabaseClient
        .from('loans')
        .update({ 
            return_date: today,
            status: 'returned'
        })
        .eq('loan_id', loanId);
    
    if (loanError) {
        showMessage('Error processing return: ' + loanError.message, true);
        return;
    }
    
    // Increase available copies
    const { data: book } = await supabaseClient
        .from('books')
        .select('available_copies')
        .eq('book_id', bookId)
        .single();
    
    if (book) {
        await supabaseClient
            .from('books')
            .update({ available_copies: (book.available_copies || 0) + 1 })
            .eq('book_id', bookId);
    }
    
    showMessage('Book returned successfully!');
    loadActiveLoansForReturn();
    loadReturnHistory();
    
    // Refresh other pages data if needed
    if (typeof loadBooksForSelect !== 'undefined') loadBooksForSelect();
    if (typeof loadDashboardStats !== 'undefined') loadDashboardStats();
}

async function loadReturnHistory() {
    const { data, error } = await supabaseClient
        .from('loans')
        .select(`
            loan_id,
            return_date,
            members!inner (name),
            books!inner (title)
        `)
        .not('return_date', 'is', null)
        .order('return_date', { ascending: false })
        .limit(20);
    
    if (error) {
        console.error('Error loading return history:', error);
        return;
    }
    
    displayReturnHistory(data || []);
}

function displayReturnHistory(loans) {
    const tbody = document.getElementById('returnHistoryBody');
    tbody.innerHTML = '';
    
    if (loans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No return history</td>' + '</tr>';
        return;
    }
    
    loans.forEach(loan => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${loan.loan_id}</td>
            <td>${loan.members?.name || 'Unknown'}</td>
            <td>${loan.books?.title || 'Unknown'}</td>
            <td>${new Date(loan.return_date).toLocaleDateString()}</td>
            <td><span class="status-inactive">Returned</span></td>
        `;
    });
}

function filterReturnLoans() {
    const searchTerm = document.getElementById('searchReturn').value.toLowerCase();
    const rows = document.querySelectorAll('#returnLoansBody tr');
    
    rows.forEach(row => {
        const member = row.cells[1]?.textContent.toLowerCase() || '';
        const book = row.cells[2]?.textContent.toLowerCase() || '';
        
        if (member.includes(searchTerm) || book.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}