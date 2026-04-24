// Ankit - Books Management (CREATE, READ, DELETE)

document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    document.getElementById('addBookForm').addEventListener('submit', addBook);
    document.getElementById('searchBooks').addEventListener('input', filterBooks);
});

// CREATE - Add book
async function addBook(e) {
    e.preventDefault();
    
    const bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        isbn: document.getElementById('bookISBN').value || null,
        genre: document.getElementById('bookGenre').value,
        published_year: parseInt(document.getElementById('bookYear').value),
        available_copies: parseInt(document.getElementById('bookCopies').value)
    };
    
    const { error } = await supabaseClient
        .from('books')
        .insert([bookData]);
    
    if (error) {
        console.error('Error:', error);
        showMessage('Error adding book: ' + error.message, true);
    } else {
        showMessage('Book added successfully!');
        document.getElementById('addBookForm').reset();
        document.getElementById('bookYear').value = '2024';
        document.getElementById('bookCopies').value = '1';
        loadBooks();
    }
}

// READ - Load all books
async function loadBooks() {
    const { data, error } = await supabaseClient
        .from('books')
        .select('*')
        .order('book_id');
    
    if (error) {
        showMessage('Error loading books', true);
        return;
    }
    
    displayBooks(data || []);
}

function displayBooks(books) {
    const tbody = document.getElementById('booksTableBody');
    tbody.innerHTML = '';
    
    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No books found. Add some!</td></tr>';
        return;
    }
    
    books.forEach(book => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${book.book_id || book.id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn || '-'}</td>
            <td>${book.genre || '-'}</td>
            <td>${book.published_year || '-'}</td>
            <td>${book.available_copies || 0}</td>
            <td><button class="btn-danger" onclick="deleteBook(${book.book_id || book.id})">🗑️ Delete</button></td>
        `;
    });
}

// DELETE - Remove book
async function deleteBook(id) {
    if (confirm('Are you sure you want to delete this book?')) {
        const { error } = await supabaseClient
            .from('books')
            .delete()
            .eq('book_id', id);
        
        if (error) {
            showMessage('Error deleting book: ' + error.message, true);
        } else {
            showMessage('Book deleted successfully');
            loadBooks();
        }
    }
}

// Filter books
function filterBooks() {
    const searchTerm = document.getElementById('searchBooks').value.toLowerCase();
    const rows = document.querySelectorAll('#booksTableBody tr');
    
    rows.forEach(row => {
        const title = row.cells[1]?.textContent.toLowerCase() || '';
        const author = row.cells[2]?.textContent.toLowerCase() || '';
        const isbn = row.cells[3]?.textContent.toLowerCase() || '';
        
        if (title.includes(searchTerm) || author.includes(searchTerm) || isbn.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}