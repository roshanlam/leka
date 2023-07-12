// Function to handle viewing a note
function viewNote(noteId) {
    // Make an AJAX request to fetch the note content
    $.ajax({
      url: `/notes/${noteId}`,
      type: 'GET',
      success: function (data) {
        // Fill the viewNoteModal with the note content
        $('#viewNoteModal').html(data);
      },
      error: function () {
        alert('Error retrieving note.');
      }
    });
  }
  
  // Function to handle editing a note
  function editNote(noteId) {
    // Make an AJAX request to fetch the note content
    $.ajax({
      url: `/notes/edit/${noteId}`,
      type: 'GET',
      success: function (data) {
        // Fill the editNoteModal with the note content
        $('#editNoteModal').html(data);
      },
      error: function () {
        alert('Error retrieving note.');
      }
    });
  }
  function showSignupForm() {
    document.getElementById("signupForm").style.display = "block";
    document.getElementById("loginForm").style.display = "none";
  }
  
  function showLoginForm() {
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
  }
  