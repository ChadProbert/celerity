/**
 * Celerity Notes
 *
 * This file handles the functionality for the Celerity Notes feature,
 * including creating, reading, updating, and deleting notes.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const notesButton = document.getElementById("notesButton");
  const notesModal = document.getElementById("notesModal");
  const closeNotesModal = document.getElementById("closeNotesModal");
  const noteForm = document.getElementById("noteForm");
  const notesList = document.getElementById("notesList");
  const noteTitle = document.getElementById("noteTitle");
  const noteContent = document.getElementById("noteContent");
  const cancelNote = document.getElementById("cancelNote");

  // State
  let notes = [];
  let editingNoteId = null;

  // Initialize the notes system
  function init() {
    loadNotes();
    setupEventListeners();
  }

  // Set up event listeners
  function setupEventListeners() {
    // Toggle notes modal
    if (notesButton) {
      notesButton.addEventListener("click", toggleNotesModal);
    }

    // Close modal when clicking the close button
    if (closeNotesModal) {
      closeNotesModal.addEventListener("click", closeModal);
    }

    // Close modal when clicking outside the content
    notesModal.addEventListener("click", (e) => {
      if (e.target === notesModal) {
        closeModal();
      }
    });

    // Handle form submission
    if (noteForm) {
      noteForm.addEventListener("submit", handleSubmit);
    }

    // Handle cancel button
    if (cancelNote) {
      cancelNote.addEventListener("click", resetForm);
    }

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !notesModal.classList.contains("hidden")) {
        closeModal();
      }
    });
  }

  // Toggle notes modal
  function toggleNotesModal() {
    if (notesModal.style.display === "flex") {
      closeModal();
    } else {
      notesModal.style.display = "flex";
      renderNotes();
      // Focus on the content field when opening the modal
      noteContent.focus();
    }
  }

  // Close modal
  function closeModal() {
    notesModal.style.display = "none";
  }

  // Load notes from localStorage
  function loadNotes() {
    const savedNotes = localStorage.getItem("celerity-notes");
    if (savedNotes) {
      try {
        notes = JSON.parse(savedNotes);
      } catch (e) {
        console.error("Failed to parse notes from localStorage", e);
        notes = [];
      }
    }
  }

  // Save notes to localStorage
  function saveNotes() {
    localStorage.setItem("celerity-notes", JSON.stringify(notes));
  }

  // Render notes to the DOM
  function renderNotes() {
    if (!notesList) return;

    if (notes.length === 0) {
      notesList.innerHTML = `
        <div class="notes-empty">
          <p>Your notes are empty.
        </div>
      `;
      return;
    }

    notesList.innerHTML = notes
      .map(
        (note) => `
      <div class="note-card" data-id="${note.id}">
        <div class="note-actions">
          <button class="delete-note" aria-label="Delete note" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <h3>${escapeHtml(note.title || "Untitled Note")}</h3>
        <p>${
          note.content ? escapeHtml(note.content).replace(/\n/g, "<br>") : ""
        }</p>
        <span class="note-date">${formatDate(note.updatedAt)}</span>
      </div>
    `
      )
      .join("");

    // Add event listeners to note actions
    document.querySelectorAll(".edit-note").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const noteCard = e.target.closest(".note-card");
        if (noteCard) {
          editNote(noteCard.dataset.id);
        }
      });
    });

    document.querySelectorAll(".delete-note").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const noteCard = e.target.closest(".note-card");
        if (noteCard) {
          deleteNote(noteCard.dataset.id);
        }
      });
    });

    // Add click handler to view note
    document.querySelectorAll(".note-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        // Only trigger if not clicking on action buttons
        if (!e.target.closest(".note-actions")) {
          editNote(card.dataset.id);
        }
      });
    });
  }

  // Handle form submission
  function handleSubmit(e) {
    e.preventDefault();

    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    const now = new Date().toISOString();

    if (!content) {
      alert("Please enter some content for your note.");
      return;
    }

    if (editingNoteId) {
      // Update existing note
      const noteIndex = notes.findIndex((note) => note.id === editingNoteId);
      if (noteIndex !== -1) {
        notes[noteIndex] = {
          ...notes[noteIndex],
          title: title || "Untitled Note",
          content,
          updatedAt: now,
        };
      }
    } else {
      // Create new note
      const newNote = {
        id: Date.now().toString(),
        title: title || "Untitled Note",
        content,
        createdAt: now,
        updatedAt: now,
      };
      notes.unshift(newNote); // Add new note to the beginning of the array
    }

    saveNotes();
    renderNotes();
    resetForm();
  }

  // Edit a note
  function editNote(id) {
    const note = notes.find((note) => note.id === id);
    if (note) {
      editingNoteId = note.id;
      noteTitle.value = note.title === "Untitled Note" ? "" : note.title;
      noteContent.value = note.content;
      noteContent.focus();

      // Scroll to form
      document
        .querySelector(".note-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  }

  // Delete a note
  function deleteNote(id) {
    if (
      confirm(
        "Are you sure you want to delete this note? This cannot be undone."
      )
    ) {
      notes = notes.filter((note) => note.id !== id);
      saveNotes();
      renderNotes();

      // If we were editing the deleted note, reset the form
      if (editingNoteId === id) {
        resetForm();
      }
    }
  }

  // Reset the form
  function resetForm() {
    editingNoteId = null;
    noteForm.reset();
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteContent").value = "";
  }

  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Format date
  function formatDate(dateString) {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  // Initialize the notes system
  init();
});
