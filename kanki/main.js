// Globals
var currentCardIndex = 0;
var correctAnswers = 0;
var incorrectAnswers = 0;
var deck = null;
var currentLevel = "all"; // Default to show all cards
var fontLoaded = false;
var appLanguage = "Japanese"; // Change this to your language name
var appLevels = ["N5", "N4"]; // Configurable levels according to your js/vocabulary.js

// The logging function
function log(logStuff) {
  var logElement = document.getElementById("log");
  if (logElement) {
    logElement.innerHTML += "<p>" + logStuff + "</p>";
  }
  console.log(logStuff);
}

function loadLanguageFont() {
  log("Loading " + appLanguage + " font...");
  
  // Force font loading early
  document.documentElement.style.fontFamily = "LanguageFont, sans-serif";
  
  // Wait for Kindle's slower processing
  setTimeout(function() {
    fontLoaded = true;
    log(appLanguage + " font loading completed");
    // Initial card display after font is loaded
    displayCurrentCard(false);
  }, 1000);
}

// Create flashcard deck data structure
function createDeck() {
  return {
    cards: [],
    lastStudied: new Date().getTime(),
    name: appLanguage + " Flashcards"
  };
}

function createCard(front, reading, back, notes, level, difficulty) {
  var displayText = front;
  if (reading) {
    displayText = front + " (" + reading + ")";
  }
  
  return {
    front: displayText,
    back: back,
    notes: notes || "",
    level: level || appLevels[0],
    difficulty: difficulty || 0,
    nextReview: new Date().getTime(),
    history: []
  };
}

// Default deck with words from vocabulary.js
function createDefaultDeck() {
  var deck = createDeck();
  
  // Add words from the VOCABULARY object
  if (typeof VOCABULARY !== 'undefined') {
    // Iterate through all levels in the vocabulary
    for (var level in VOCABULARY) {
      if (VOCABULARY.hasOwnProperty(level)) {
        for (var i = 0; i < VOCABULARY[level].length; i++) {
          var word = VOCABULARY[level][i];
          deck.cards.push(createCard(
            word.front, 
            word.reading,
            word.back, 
            word.notes, 
            level, 
            0
          ));
        }
      }
    }
    
    log("Created default deck with " + deck.cards.length + " cards");
  } else {
    // Fallback if vocabulary file isn't loaded
    log("Warning: VOCABULARY not found, using minimal deck");
    deck.cards.push(createCard("Example", null, "Translation", "Sample card", appLevels[0], 0));
    deck.cards.push(createCard("Second", null, "Another translation", "Another sample", appLevels[0], 0));
  }
  
  return deck;
}

// Update status message for notifications (not confirmations)
function updateStatusMessage(message) {
  var statusElement = document.getElementById("statusMessage");
  if (!statusElement) return;
  
  // Set message text
  statusElement.textContent = message;
  
  // Display the message
  statusElement.style.display = "block";
  
  // Auto-hide after delay
  setTimeout(function() {
    statusElement.style.display = "none";
  }, 3000);
}

// Show confirmation popup
function showConfirmation(message, onConfirm) {
  var overlay = document.getElementById("confirmationOverlay");
  var messageElement = document.getElementById("confirmationMessage");
  var yesButton = document.getElementById("confirmYesBtn");
  var noButton = document.getElementById("confirmNoBtn");
  
  // Set message
  messageElement.textContent = message;
  
  // Set button handlers
  yesButton.onclick = function() {
    overlay.style.display = "none";
    if (onConfirm) onConfirm();
  };
  
  noButton.onclick = function() {
    overlay.style.display = "none";
  };
  
  // Show overlay
  overlay.style.display = "block";
}

// Spaced repetition algorithm (simplified SM-2)
function calculateNextReview(card, wasCorrect) {
  var now = new Date().getTime();
  
  // Record the review in history
  card.history.push({
    date: now,
    result: wasCorrect
  });
  
  if (wasCorrect) {
    // Increase the level if correct
    card.difficulty += 1;
    
    // Calculate next review based on difficulty
    var interval;
    switch (card.difficulty) {
      case 1:
        interval = 1 * 24 * 60 * 60 * 1000; // 1 day
        break;
      case 2:
        interval = 3 * 24 * 60 * 60 * 1000; // 3 days
        break;
      case 3:
        interval = 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
      case 4:
        interval = 14 * 24 * 60 * 60 * 1000; // 2 weeks
        break;
      case 5:
        interval = 30 * 24 * 60 * 60 * 1000; // 1 month
        break;
      default:
        interval = 60 * 24 * 60 * 60 * 1000; // 2 months
        break;
    }
    
    card.nextReview = now + interval;
  } else {
    // If wrong, reset difficulty and review soon
    card.difficulty = 0;
    card.nextReview = now + (10 * 60 * 1000); // 10 minutes
  }
  
  return card;
}

// Get cards due for review (filtered by level if applicable)
function getDueCards() {
  var now = new Date().getTime();
  var dueCards = [];
  
  for (var i = 0; i < deck.cards.length; i++) {
    var card = deck.cards[i];
    if (card.nextReview <= now) {
      // Filter by level if a specific level is selected
      if (currentLevel === "all" || card.level === currentLevel) {
        dueCards.push(card);
      }
    }
  }
  
  return dueCards;
}

// Display current card - optimized to update DOM elements instead of recreating them
function displayCurrentCard(showAnswer) {
  var dueCards = getDueCards();
  
  // Get DOM elements once 
  var cardContainer = document.getElementById("cardContainer");
  var levelBadge = document.getElementById("levelBadge");
  var frontElement = document.getElementById("cardFront");
  var backElement = document.getElementById("cardBack");
  var notesElement = document.getElementById("cardNotes");
  var showAnswerBtn = document.getElementById("showAnswerBtn");
  var incorrectBtn = document.getElementById("incorrectBtn");
  var correctBtn = document.getElementById("correctBtn");
  
  // Hide answer elements by default
  backElement.style.display = "none";
  notesElement.style.display = "none";
  
  if (dueCards.length === 0) {
    // No cards due - display message and hide buttons
    cardContainer.style.display = "block";
    frontElement.innerHTML = "<p>No cards due for review!</p><p>Great job!</p>";
    levelBadge.style.display = "none";
    showAnswerBtn.style.display = "none";
    incorrectBtn.style.display = "none";
    correctBtn.style.display = "none";
    updateProgressDisplay();
    return;
  }
  
  // Show card container
  cardContainer.style.display = "block";
  
  // Get current card
  var card = dueCards[currentCardIndex % dueCards.length];
  
  // Update card content
  levelBadge.style.display = "block";
  levelBadge.textContent = card.level;
  frontElement.innerHTML = card.front;
  backElement.textContent = card.back;
  notesElement.textContent = card.notes || "";
  
  // Control button visibility based on answer state
  if (showAnswer) {
    backElement.style.display = "block";
    notesElement.style.display = "block";
    showAnswerBtn.style.display = "none";
    incorrectBtn.style.display = "inline-block";
    correctBtn.style.display = "inline-block";
  } else {
    showAnswerBtn.style.display = "inline-block";
    incorrectBtn.style.display = "none";
    correctBtn.style.display = "none";
  }
  
  // Update progress display
  updateProgressDisplay();
}

// Update the progress display
function updateProgressDisplay() {
  var progressElement = document.getElementById("progressDisplay");
  var dueCards = getDueCards();
  
  if (dueCards.length === 0) {
    progressElement.textContent = "All caught up! No cards to review.";
    return;
  }
  
  progressElement.textContent = "Card " + (currentCardIndex % dueCards.length + 1) + 
      " of " + dueCards.length + " • Correct: " + correctAnswers + 
      " • Incorrect: " + incorrectAnswers;
  
  // Update level display
  updateLevelDisplay();
}

// Update level display
function updateLevelDisplay() {
  var levelDisplayElement = document.getElementById("levelDisplay");
  levelDisplayElement.textContent = "Level: " + (currentLevel === "all" ? "All Levels" : currentLevel);
}

// Handle showing the answer
function showAnswer() {
  displayCurrentCard(true);
}

// Handle marking card as correct or incorrect
function answerCard(wasCorrect) {
  var dueCards = getDueCards();
  if (dueCards.length === 0) return;
  
  var cardIndex = currentCardIndex % dueCards.length;
  var card = dueCards[cardIndex];
  
  // Update card with spacing algorithm
  calculateNextReview(card, wasCorrect);
  
  // Update stats
  if (wasCorrect) {
    correctAnswers++;
  } else {
    incorrectAnswers++;
  }
  
  // Move to next card
  currentCardIndex++;
  
  // Display next card
  displayCurrentCard(false);
}

// Change the currently selected level
function changeLevel(level) {
  currentLevel = level;
  currentCardIndex = 0; // Reset counter when changing level
  updateLevelDisplay();
  displayCurrentCard(false);
}

// Initialize app on page load
function onPageLoad() {
  log("Application initializing...");
  
  // Load language font
  loadLanguageFont();
  
  // Update level buttons based on appLevels
  updateLevelButtons();
  
  // Always create a new default deck
  deck = createDefaultDeck();
  log("Created new default deck");
  
  // Initial progress display
  updateProgressDisplay();
  
  log("Application initialized");
  
  // First card will be displayed after font loads
}

// Update level buttons dynamically based on appLevels
function updateLevelButtons() {
  var levelsContainer = document.getElementById("levelButtons");
  if (!levelsContainer) return;
  
  // Clear existing buttons except the "All Levels" button
  while (levelsContainer.children.length > 1) {
    levelsContainer.removeChild(levelsContainer.lastChild);
  }
  
  // Add button for each level in appLevels
  for (var i = 0; i < appLevels.length; i++) {
    var button = document.createElement("button");
    button.textContent = appLevels[i];
    button.onclick = createLevelChangeHandler(appLevels[i]);
    levelsContainer.appendChild(button);
  }
}

// Helper to create onclick handlers
function createLevelChangeHandler(level) {
  return function() {
    changeLevel(level);
  };
}

// Show reset progress confirmation
function showResetProgressConfirm() {
  showConfirmation("Are you sure you want to reset all cards' progress?", resetProgress);
}

// Show reset all confirmation
function showResetAllConfirm() {
  showConfirmation("Are you sure you want to reset all data? This will delete all cards and progress.", resetAll);
}

// Show toast notification
function showToast(message, duration) {
  var toast = document.getElementById("toastNotification");
  if (!toast) return;
  
  // Set toast message
  toast.textContent = message;
  
  // Show toast
  toast.style.display = "block";
  
  // Auto-hide after specified duration
  setTimeout(function() {
    toast.style.display = "none";
  }, duration || 2000); // Default 2 seconds
}

// Reset progress
function resetProgress() {
  for (var i = 0; i < deck.cards.length; i++) {
    deck.cards[i].difficulty = 0;
    deck.cards[i].nextReview = new Date().getTime();
    deck.cards[i].history = [];
  }
  
  currentCardIndex = 0;
  correctAnswers = 0;
  incorrectAnswers = 0;
  
  displayCurrentCard(false);
  showToast("Progress has been reset", 2000);
  log("Progress reset");
}

// Reset all
function resetAll() {
  deck = createDefaultDeck();
  currentCardIndex = 0;
  correctAnswers = 0;
  incorrectAnswers = 0;
  
  displayCurrentCard(false);
  showToast("All data has been reset", 2000);
  log("Complete reset performed");
}