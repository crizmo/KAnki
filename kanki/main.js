// Globals
var currentCardIndex = 0;
var correctAnswers = 0;
var incorrectAnswers = 0;
var deck = null;
var currentLevel = "all"; // Default to show all cards
var fontLoaded = false;
var incorrectCardsQueue = []; // Queue for storing incorrect cards
var inErrorReviewMode = false; // Flag to track if we're in error review mode
var showingStarredOnly = false; // Flag to track if we're showing only starred cards
var isReversedMode = false; // Flag to track if cards are being shown in reversed mode

// Initialize configuration from vocabulary.js if available
function initializeConfig() {
  if (typeof KANKI_CONFIG !== 'undefined') {
    appLanguage = KANKI_CONFIG.language || appLanguage;
    appLevels = KANKI_CONFIG.levels || appLevels;
    log("Loaded custom configuration: " + appLanguage + " with levels: " + appLevels.join(", "));
  } else {
    log("Using default configuration");
  }
}

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
    history: [],
    starred: false // Add starred property, default to false
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

// Function to set next review time based on difficulty
function setNextReviewTime(card, difficulty) {
  var now = new Date().getTime();
  
  // Record the review in history
  card.history.push({
    date: now,
    result: true,
    difficulty: difficulty
  });
  
  // Calculate interval based on difficulty
  var interval;
  switch (difficulty) {
    case 'again':
      interval = 10 * 60 * 1000; // 10 minutes
      card.difficulty = Math.max(0, card.difficulty - 1); // Decrease difficulty
      break;
    case 'hard':
      interval = 1 * 24 * 60 * 60 * 1000; // 1 day
      // Keep difficulty the same
      break;
    case 'good':
      interval = 3 * 24 * 60 * 60 * 1000; // 3 days
      card.difficulty += 1; // Increase difficulty
      break;
    case 'easy':
      interval = 7 * 24 * 60 * 60 * 1000; // 7 days
      card.difficulty += 2; // Increase difficulty more
      break;
    default:
      interval = 1 * 24 * 60 * 60 * 1000; // Default 1 day
  }
  
  // Apply a multiplier based on current difficulty level (longer intervals for higher difficulty)
  if (card.difficulty > 0) {
    interval = interval * (1 + (card.difficulty * 0.5));
  }
  
  // Set next review time
  card.nextReview = now + interval;
  
  return card;
}

// Get cards due for review (filtered by level if applicable)
function getDueCards() {
  var now = new Date().getTime();
  var dueCards = [];
  
  for (var i = 0; i < deck.cards.length; i++) {
    var card = deck.cards[i];
    if (card.nextReview <= now) {
      // Apply both level and starred filters
      var levelMatch = (currentLevel === "all" || card.level === currentLevel);
      var starMatch = (!showingStarredOnly || card.starred === true);
      
      if (levelMatch && starMatch) {
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
  var intervalButtons = document.getElementById("intervalButtons");
  var starButton = document.getElementById("starButton");
  
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
    intervalButtons.style.display = "none";
    starButton.style.display = "none"; // Hide star button
    
    // Check if we have incorrect cards to review
    if (incorrectCardsQueue.length > 0) {
      showErrorReviewPrompt();
    }
    
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
  
  // In reversed mode, swap front and back
  if (isReversedMode) {
    frontElement.innerHTML = card.back;
    backElement.textContent = card.front;
  } else {
    frontElement.innerHTML = card.front;
    backElement.textContent = card.back;
  }
  
  notesElement.textContent = card.notes || "";
  
  // Update star button
  starButton.style.display = "block";
  updateStarButton(card.starred);
  
  // Control button visibility based on answer state
  if (showAnswer) {
    backElement.style.display = "block";
    notesElement.style.display = "block";
    showAnswerBtn.style.display = "none";
    incorrectBtn.style.display = "inline-block";
    intervalButtons.style.display = "block";
  } else {
    showAnswerBtn.style.display = "inline-block";
    incorrectBtn.style.display = "none";
    intervalButtons.style.display = "none";
  }
  
  // Update progress display
  updateProgressDisplay();
}

// Update the progress display
function updateProgressDisplay() {
  var progressElement = document.getElementById("progressDisplay");
  
  if (inErrorReviewMode) {
    progressElement.textContent = "Error Review: Card " + (currentCardIndex + 1) + 
      " of " + incorrectCardsQueue.length + " • Correct: " + correctAnswers + 
      " • Incorrect: " + incorrectAnswers;
    return;
  }
  
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
  var displayText = "Level: " + (currentLevel === "all" ? "All Levels" : currentLevel);
  
  // Add starred status to display if filter is active
  if (showingStarredOnly) {
    displayText += " (Starred Only)";
  }
  
  // Add direction indicator
  displayText += " • " + (isReversedMode ? "Native → Target" : "Target → Native");
  
  levelDisplayElement.textContent = displayText;
}

// Handle showing the answer
function showAnswer() {
  if (inErrorReviewMode) {
    displayErrorCard(true);
  } else {
    displayCurrentCard(true);
  }
}

// Handle marking card as correct or incorrect
function answerCard(wasCorrect) {
  var dueCards = getDueCards();
  if (dueCards.length === 0) return;
  
  var cardIndex = currentCardIndex % dueCards.length;
  var card = dueCards[cardIndex];
  
  if (!wasCorrect) {
    // Record the incorrect answer
    var now = new Date().getTime();
    card.history.push({
      date: now,
      result: false
    });
    
    // Reset difficulty and set for review soon
    card.difficulty = 0;
    card.nextReview = now + (10 * 60 * 1000); // 10 minutes
    
    // Update stats
    incorrectAnswers++;
    
    // Add to error review queue when not already in error review mode
    if (!inErrorReviewMode) {
      incorrectCardsQueue.push(card);
    }
  }
  
  // Move to next card
  currentCardIndex++;
  
  // Check if we're done with regular cards and have errors to review
  if (!inErrorReviewMode && currentCardIndex % dueCards.length === 0 && incorrectCardsQueue.length > 0) {
    showErrorReviewPrompt();
  } else {
    // Display next card
    displayCurrentCard(false);
  }
}

// Handle answer with interval
function handleAnswerWithInterval(difficulty) {
  if (inErrorReviewMode) {
    answerErrorCardWithInterval(difficulty);
  } else {
    var dueCards = getDueCards();
    if (dueCards.length === 0) return;
    
    var cardIndex = currentCardIndex % dueCards.length;
    var card = dueCards[cardIndex];
    
    // Calculate next review time based on selected difficulty
    setNextReviewTime(card, difficulty);
    
    // Update stats
    correctAnswers++;
    
    // Move to next card
    currentCardIndex++;
    
    // Check if we're done with regular cards and have errors to review
    if (currentCardIndex % dueCards.length === 0 && incorrectCardsQueue.length > 0) {
      showErrorReviewPrompt();
    } else {
      // Display next card
      displayCurrentCard(false);
    }
  }
}

// Handle error card review with intervals
function answerErrorCardWithInterval(difficulty) {
  if (currentCardIndex >= incorrectCardsQueue.length) return;
  
  var card = incorrectCardsQueue[currentCardIndex];
  
  // Calculate next review time based on selected difficulty
  setNextReviewTime(card, difficulty);
  
  // Mark the card for removal from error queue
  incorrectCardsQueue[currentCardIndex] = null;
  
  // Move to next card
  currentCardIndex++;
  
  if (currentCardIndex >= incorrectCardsQueue.length) {
    endErrorReview();
  } else {
    displayErrorCard(false);
  }
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

  // Load configuration
  initializeConfig();
  
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
  
  // Add Starred Filter button
  var starredFilterBtn = document.createElement("button");
  starredFilterBtn.id = "starredFilterBtn";
  starredFilterBtn.textContent = "★ Starred";
  starredFilterBtn.onclick = toggleStarredFilter;
  levelsContainer.appendChild(starredFilterBtn);
  
  // Add Reverse Mode button
  var reverseToggleBtn = document.createElement("button");
  reverseToggleBtn.id = "reverseToggleBtn";
  reverseToggleBtn.textContent = "↔ Reverse";
  reverseToggleBtn.onclick = toggleCardDirection;
  levelsContainer.appendChild(reverseToggleBtn);
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
    // Preserve starred status on reset progress
  }
  
  currentCardIndex = 0;
  correctAnswers = 0;
  incorrectAnswers = 0;
  incorrectCardsQueue = []; // Clear error queue
  inErrorReviewMode = false;
  
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
  incorrectCardsQueue = []; // Clear error queue
  inErrorReviewMode = false;
  showingStarredOnly = false; // Reset starred filter
  isReversedMode = false; // Reset card direction
  
  displayCurrentCard(false);
  showToast("All data has been reset", 2000);
  log("Complete reset performed");
}

// Show prompt to review errors
function showErrorReviewPrompt() {
  showConfirmation(
    "You have " + incorrectCardsQueue.length + " incorrect cards. Review them now?", 
    startErrorReview
  );
}

// Start error review mode
function startErrorReview() {
  if (incorrectCardsQueue.length === 0) return;
  
  inErrorReviewMode = true;
  showToast("Reviewing incorrect cards", 2000);
  
  // Set up for error review
  var statusElement = document.getElementById("statusMessage");
  statusElement.textContent = "Error Review Mode";
  statusElement.style.display = "block";
  
  // Start from first error card
  currentCardIndex = 0;
  displayErrorCard(false);
}

// Display error card
function displayErrorCard(showAnswer) {
  // Similar to displayCurrentCard but works with incorrectCardsQueue
  var cardContainer = document.getElementById("cardContainer");
  var levelBadge = document.getElementById("levelBadge");
  var frontElement = document.getElementById("cardFront");
  var backElement = document.getElementById("cardBack");
  var notesElement = document.getElementById("cardNotes");
  var showAnswerBtn = document.getElementById("showAnswerBtn");
  var incorrectBtn = document.getElementById("incorrectBtn");
  var intervalButtons = document.getElementById("intervalButtons");
  var starButton = document.getElementById("starButton");
  
  // Hide answer elements by default
  backElement.style.display = "none";
  notesElement.style.display = "none";
  
  if (currentCardIndex >= incorrectCardsQueue.length) {
    // Finished with all error cards
    endErrorReview();
    return;
  }
  
  // Show card container
  cardContainer.style.display = "block";
  
  // Get current error card
  var card = incorrectCardsQueue[currentCardIndex];
  
  // Update card content
  levelBadge.style.display = "block";
  levelBadge.textContent = card.level;
  
  // In reversed mode, swap front and back
  if (isReversedMode) {
    frontElement.innerHTML = card.back;
    backElement.textContent = card.front;
  } else {
    frontElement.innerHTML = card.front;
    backElement.textContent = card.back;
  }
  
  notesElement.textContent = card.notes || "";
  
  // Update star button
  starButton.style.display = "block";
  updateStarButton(card.starred);
  
  // Control button visibility based on answer state
  if (showAnswer) {
    backElement.style.display = "block";
    notesElement.style.display = "block";
    showAnswerBtn.style.display = "none";
    incorrectBtn.style.display = "inline-block";
    intervalButtons.style.display = "block";
  } else {
    showAnswerBtn.style.display = "inline-block";
    incorrectBtn.style.display = "none";
    intervalButtons.style.display = "none";
  }
  
  // Update progress display
  updateProgressDisplay();
}

// Answer error card
function answerErrorCard(wasCorrect) {
  if (currentCardIndex >= incorrectCardsQueue.length) return;
  
  var card = incorrectCardsQueue[currentCardIndex];
  
  // Only handle incorrect answers here
  if (!wasCorrect) {
    // Keep in error queue
    // Move to next card
    currentCardIndex++;
    
    if (currentCardIndex >= incorrectCardsQueue.length) {
      endErrorReview();
    } else {
      displayErrorCard(false);
    }
  }
  // If correct, it will be handled by the interval buttons
}

// End error review mode
function endErrorReview() {
  // Clean up the queue (remove null entries from cards that were answered correctly)
  incorrectCardsQueue = incorrectCardsQueue.filter(function(card) {
    return card !== null;
  });
  
  inErrorReviewMode = false;
  
  // Reset UI
  var statusElement = document.getElementById("statusMessage");
  statusElement.style.display = "none";
  
  // If we still have errors, ask if user wants to try again
  if (incorrectCardsQueue.length > 0) {
    showConfirmation(
      "You still have " + incorrectCardsQueue.length + " cards to master. Review them again?",
      startErrorReview
    );
  } else {
    showToast("All error cards reviewed successfully!", 2000);
    // Return to normal mode
    currentCardIndex = 0;
    displayCurrentCard(false);
  }
}

// Handle answer card (redirects to appropriate function based on mode)
function handleAnswerCard(wasCorrect) {
  if (inErrorReviewMode) {
    answerErrorCard(wasCorrect);
  } else {
    if (!wasCorrect) {
      answerCard(wasCorrect);
    }
    // If correct, the interval buttons will handle it
  }
}

// Toggle starred status of the current card
function toggleStarCurrentCard() {
  var dueCards = getDueCards();
  if (dueCards.length === 0) return;
  
  var cardIndex = currentCardIndex % dueCards.length;
  var card = dueCards[cardIndex];
  
  // Toggle starred status
  card.starred = !card.starred;
  
  // Update the star button's appearance
  updateStarButton(card.starred);
  
  // Show toast notification
  showToast(card.starred ? "Card starred" : "Card unstarred", 1000);
}

// Update the star button's appearance based on card's starred status
function updateStarButton(isStarred) {
  var starButton = document.getElementById("starButton");
  if (!starButton) return;
  
  if (isStarred) {
    starButton.innerHTML = "★"; // Filled star
    starButton.classList.add("starred");
  } else {
    starButton.innerHTML = "☆"; // Empty star
    starButton.classList.remove("starred");
  }
}

// Toggle showing only starred cards
function toggleStarredFilter() {
  showingStarredOnly = !showingStarredOnly;
  currentCardIndex = 0; // Reset counter when changing filter
  
  // Update filter button appearance
  var starredFilterBtn = document.getElementById("starredFilterBtn");
  if (starredFilterBtn) {
    if (showingStarredOnly) {
      starredFilterBtn.classList.add("active");
    } else {
      starredFilterBtn.classList.remove("active");
    }
  }
  
  updateLevelDisplay();
  displayCurrentCard(false);
}

// Toggle between normal and reversed card mode
function toggleCardDirection() {
  isReversedMode = !isReversedMode;
  currentCardIndex = 0; // Reset counter when changing mode
  
  // Update toggle button appearance
  var reverseToggleBtn = document.getElementById("reverseToggleBtn");
  if (reverseToggleBtn) {
    if (isReversedMode) {
      reverseToggleBtn.classList.add("active");
    } else {
      reverseToggleBtn.classList.remove("active");
    }
  }
  
  // Update direction display in UI
  updateDirectionDisplay();
  
  // Refresh card display
  displayCurrentCard(false);
  
  // Show toast notification
  showToast(isReversedMode ? "Reversed Mode: Native → Target" : "Normal Mode: Target → Native", 2000);
}

// Update direction display in UI
function updateDirectionDisplay() {
  var levelDisplayElement = document.getElementById("levelDisplay");
  var levelText = "Level: " + (currentLevel === "all" ? "All Levels" : currentLevel);
  
  // Add starred status to display if filter is active
  if (showingStarredOnly) {
    levelText += " (Starred Only)";
  }
  
  // Add direction indicator
  levelText += " • " + (isReversedMode ? "Native → Target" : "Target → Native");
  
  levelDisplayElement.textContent = levelText;
}