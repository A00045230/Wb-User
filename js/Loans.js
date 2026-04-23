document.addEventListener("DOMContentLoaded", () => {
  console.log("Loans page loaded");
  loadMembersForSelect();
  loadBooksForSelect();
  loadActiveLoans();

  const today = new Date();
  const dueDate = new Date(today.setDate(today.getDate() + 14));
  document.getElementById("dueDate").value = dueDate
    .toISOString()
    .split("T")[0];

  document.getElementById("addLoanForm").addEventListener("submit", addLoan);
});

async function loadMembersForSelect() {
  console.log("Loading members...");

  const { data, error } = await supabaseClient.from("members").select("*");

  if (error) {
    console.error("Error loading members:", error);
    showMessage("Error loading members: " + error.message, true);
    return;
  }

  console.log("Members data:", data);

  const select = document.getElementById("loanMemberId");
  if (!select) return;

  select.innerHTML = '<option value="">Select Member</option>';

  if (data && data.length > 0) {
    data.forEach((member) => {
      // Use either member_id or id - check which exists
      const memberId = member.member_id || member.id;
      select.innerHTML += `<option value="${memberId}">${member.name}</option>`;
    });
    console.log(`Added ${data.length} members`);
  } else {
    console.warn("No members found");
    select.innerHTML = '<option value="">No members found - add some!</option>';
  }
}

async function loadBooksForSelect() {
  console.log("Loading books...");

  const { data, error } = await supabaseClient.from("books").select("*");

  if (error) {
    console.error("Error loading books:", error);
    showMessage("Error loading books: " + error.message, true);
    return;
  }

  console.log("Books data:", data);

  const select = document.getElementById("loanBookId");
  if (!select) return;

  select.innerHTML = '<option value="">Select Book</option>';

  if (data && data.length > 0) {
    const availableBooks = data.filter(
      (book) => (book.available_copies || 0) > 0,
    );

    if (availableBooks.length > 0) {
      availableBooks.forEach((book) => {
        const bookId = book.book_id || book.id;
        const copies = book.available_copies || 0;
        select.innerHTML += `<option value="${bookId}">${book.title} (${copies} available)</option>`;
      });
      console.log(`Added ${availableBooks.length} books`);
    } else {
      select.innerHTML =
        '<option value="">No books with available copies</option>';
    }
  } else {
    console.warn("No books found");
    select.innerHTML = '<option value="">No books found - add some!</option>';
  }
}

async function addLoan(e) {
  e.preventDefault();

  const memberId = document.getElementById("loanMemberId").value;
  const bookId = document.getElementById("loanBookId").value;
  const dueDate = document.getElementById("dueDate").value;

  if (!memberId || !bookId) {
    showMessage("Please select both member and book", true);
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const loanData = {
    book_id: parseInt(bookId),
    member_id: parseInt(memberId),
    loan_date: today,
    due_date: dueDate,
    status: "active",
  };

  console.log("Inserting loan:", loanData);

  const { error: loanError } = await supabaseClient
    .from("loans")
    .insert([loanData]);

  if (loanError) {
    console.error("Error creating loan:", loanError);
    showMessage("Error creating loan: " + loanError.message, true);
    return;
  }

  const { data: book } = await supabaseClient
    .from("books")
    .select("available_copies")
    .eq("book_id", parseInt(bookId))
    .single();

  if (book) {
    const newCopies = (book.available_copies || 1) - 1;
    await supabaseClient
      .from("books")
      .update({ available_copies: newCopies })
      .eq("book_id", parseInt(bookId));
  }

  showMessage("Book issued successfully!");

  document.getElementById("addLoanForm").reset();
  const newToday = new Date();
  const newDueDate = new Date(newToday.setDate(newToday.getDate() + 14));
  document.getElementById("dueDate").value = newDueDate
    .toISOString()
    .split("T")[0];

  loadActiveLoans();
  loadBooksForSelect();
}

async function loadActiveLoans() {
  console.log("Loading active loans...");

  const { data, error } = await supabaseClient
    .from("loans")
    .select("*")
    .is("return_date", null);

  if (error) {
    console.error("Error loading loans:", error);
    showMessage("Error loading loans", true);
    return;
  }

  console.log("Loans data:", data);

  const enrichedLoans = [];
  for (const loan of data || []) {
    const [memberRes, bookRes] = await Promise.all([
      supabaseClient
        .from("members")
        .select("name")
        .eq("member_id", loan.member_id)
        .single(),
      supabaseClient
        .from("books")
        .select("title")
        .eq("book_id", loan.book_id)
        .single(),
    ]);

    enrichedLoans.push({
      ...loan,
      member_name: memberRes.data?.name || "Unknown",
      book_title: bookRes.data?.title || "Unknown",
    });
  }

  displayActiveLoans(enrichedLoans);
}

function displayActiveLoans(loans) {
  const tbody = document.getElementById("activeLoansBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!loans || loans.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center;">No active loans</td>' +
      "<tr>";
    return;
  }

  const today = new Date();

  loans.forEach((loan) => {
    const dueDate = new Date(loan.due_date);
    const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    const row = tbody.insertRow();
    row.innerHTML = `
            <td>${loan.loan_id || loan.id}</td>
            <td>${loan.member_name}</td>
            <td>${loan.book_title}</td>
            <td>${new Date(loan.loan_date).toLocaleDateString()}</td>
            <td>${dueDate.toLocaleDateString()}</td>
            <td class="${daysLeft < 0 ? "status-overdue" : ""}">${daysLeft < 0 ? "Overdue" : daysLeft + " days"}</td>
        `;
  });
}
