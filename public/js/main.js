document.addEventListener('DOMContentLoaded', function() {
    const unsavedNote = JSON.parse(localStorage.getItem('unsavedNote'));
    if (unsavedNote) {
      document.getElementById('title').value = unsavedNote.title;
      document.getElementById('content').value = unsavedNote.content;
    }
  
    // Save note to localStorage when the fields are changed
    document.getElementById('title').addEventListener('input', saveUnsavedNote);
    document.getElementById('content').addEventListener('input', saveUnsavedNote);
  
    function saveUnsavedNote() {
      const note = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value
      };
      localStorage.setItem('unsavedNote', JSON.stringify(note));
    }
  });
  