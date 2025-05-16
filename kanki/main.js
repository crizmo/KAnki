// Globals
var currentCardIndex = 0;
var correctAnswers = 0;
var incorrectAnswers = 0;
var deck = null;
var currentLevel = "all"; 
var fontLoaded = false;
var incorrectCardsQueue = []; 
var inErrorReviewMode = false;
var showingStarredOnly = false; 
var isReversedMode = false; 

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

// Initialize fixed element heights to prevent layout shifts on e-ink display
function initializeFixedHeights() {
  log("Initializing fixed element heights for e-ink optimization...");
  
  var cardContainer = document.getElementById("cardContainer");
  var controlButtons = document.getElementById("controlButtons");
  var intervalButtons = document.getElementById("intervalButtons");
  
  if (cardContainer) {
    cardContainer.style.height = "300px"; 
    cardContainer.style.overflow = "hidden";
  }
  
  if (controlButtons) {
    controlButtons.style.height = "160px"; 
    controlButtons.style.overflow = "hidden";
  }
  
  if (intervalButtons) {
    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "hidden";
    intervalButtons.style.top = "70px";
    var forceLayout = intervalButtons.offsetHeight;
  }
  
  var backElement = document.getElementById("cardBack");
  if (backElement) {
    backElement.style.minHeight = "50px";
  }
  
  var notesElement = document.getElementById("cardNotes");
  if (notesElement) {
    notesElement.style.minHeight = "20px";
  }
  
  log("Fixed element heights initialized");
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
    starred: false,
    timesViewed: 0,
    lastViewed: null
  };
}

// Default deck with words from vocabulary.js
function createDefaultDeck() {
  var deck = createDeck();
  
  if (typeof VOCABULARY !== 'undefined') {
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
  
  statusElement.textContent = message;
  
  statusElement.style.display = "block";

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
    cardContainer.style.display = "block";
    frontElement.innerHTML = "<p>No cards due for review!</p><p>Great job!</p>";
    levelBadge.style.display = "none";
    showAnswerBtn.style.display = "none";
    incorrectBtn.style.display = "none";

    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "hidden";
    starButton.style.display = "none"; 
    document.getElementById("cardStats").style.display = "none"; 
  
    if (incorrectCardsQueue.length > 0) {
      showErrorReviewPrompt();
    }
    
    updateProgressDisplay();
    return;
  }
  cardContainer.style.display = "block";
  document.getElementById("cardStats").style.display = "block"; // Show stats

  var card = dueCards[currentCardIndex % dueCards.length];
  

  levelBadge.style.display = "block";
  levelBadge.textContent = card.level;
  

  if (isReversedMode) {
    frontElement.innerHTML = card.back;
    backElement.textContent = card.front;
  } else {
    frontElement.innerHTML = card.front;
    backElement.textContent = card.back;
  }
  
  notesElement.textContent = card.notes || "";
  
  starButton.style.display = "block";
  updateStarButton(card.starred);

  if (!showAnswer) { 
    card.timesViewed = (card.timesViewed || 0) + 1;
    card.lastViewed = new Date().getTime();
  }
  
  updateCardStats(card);
  
  if (showAnswer) {
    backElement.style.display = "block";
    notesElement.style.display = "block";
    showAnswerBtn.style.display = "none";
    incorrectBtn.style.display = "inline-block";
    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "visible";
  } else {
    showAnswerBtn.style.display = "inline-block";
    incorrectBtn.style.display = "none";
    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "hidden";
  }
  
  updateProgressDisplay();
}

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
  

  updateLevelDisplay();
}


function updateLevelDisplay() {
  var levelDisplayElement = document.getElementById("levelDisplay");
  var displayText = "Level: " + (currentLevel === "all" ? "All Levels" : currentLevel);

  if (showingStarredOnly) {
    displayText += " (Starred Only)";
  }
 
  displayText += " • " + (isReversedMode ? "Native → Target" : "Target → Native");
  
  levelDisplayElement.textContent = displayText;
}


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
    var now = new Date().getTime();
    card.history.push({
      date: now,
      result: false
    });
    
    card.difficulty = 0;
    card.nextReview = now + (10 * 60 * 1000); // 10 minutes
    
    incorrectAnswers++;
    
    if (!inErrorReviewMode) {
      incorrectCardsQueue.push(card);
    }
  }
  
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

    setNextReviewTime(card, difficulty);
  
    correctAnswers++;
    
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

  initializeConfig();

  loadLanguageFont();

  initializeFixedHeights();

  updateLevelButtons();

  deck = createDefaultDeck();
  log("Created new default deck");

  updateProgressDisplay();
  
  log("Application initialized");
}

// Update level buttons dynamically based on appLevels
function updateLevelButtons() {
  var levelsContainer = document.getElementById("levelButtons");
  if (!levelsContainer) return;
  
  while (levelsContainer.children.length > 1) {
    levelsContainer.removeChild(levelsContainer.lastChild);
  }
  
  for (var i = 0; i < appLevels.length; i++) {
    var button = document.createElement("button");
    button.textContent = appLevels[i];
    button.onclick = createLevelChangeHandler(appLevels[i]);
    levelsContainer.appendChild(button);
  }
  
  var lineBreak = document.createElement("br");
  levelsContainer.appendChild(lineBreak);
  
  var starredFilterBtn = document.createElement("button");
  starredFilterBtn.id = "starredFilterBtn";
  starredFilterBtn.textContent = "★ Starred";
  starredFilterBtn.onclick = toggleStarredFilter;
  starredFilterBtn.style.marginTop = "10px"; 
  levelsContainer.appendChild(starredFilterBtn);
  
  var reverseToggleBtn = document.createElement("button");
  reverseToggleBtn.id = "reverseToggleBtn";
  reverseToggleBtn.textContent = "↔ Reverse";
  reverseToggleBtn.onclick = toggleCardDirection;
  reverseToggleBtn.style.marginTop = "10px"; 
  levelsContainer.appendChild(reverseToggleBtn);
}

function createLevelChangeHandler(level) {
  return function() {
    changeLevel(level);
  };
}

function showResetProgressConfirm() {
  showConfirmation("Are you sure you want to reset all cards' progress?", resetProgress);
}

function showResetAllConfirm() {
  showConfirmation("Are you sure you want to reset all data? This will delete all cards and progress.", resetAll);
}

function showToast(message, duration) {
  var toast = document.getElementById("toastNotification");
  if (!toast) return;
  
  toast.textContent = message;
  
  toast.style.display = "block";
  
  setTimeout(function() {
    toast.style.display = "none";
  }, duration || 2000);
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
  incorrectCardsQueue = []; 
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
  incorrectCardsQueue = [];
  inErrorReviewMode = false;
  showingStarredOnly = false; 
  isReversedMode = false;
  
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
  
  var statusElement = document.getElementById("statusMessage");
  statusElement.textContent = "Error Review Mode";
  statusElement.style.display = "block";
  
  currentCardIndex = 0;
  displayErrorCard(false);
}

// Display error card
function displayErrorCard(showAnswer) {
  var cardContainer = document.getElementById("cardContainer");
  var levelBadge = document.getElementById("levelBadge");
  var frontElement = document.getElementById("cardFront");
  var backElement = document.getElementById("cardBack");
  var notesElement = document.getElementById("cardNotes");
  var showAnswerBtn = document.getElementById("showAnswerBtn");
  var incorrectBtn = document.getElementById("incorrectBtn");
  var intervalButtons = document.getElementById("intervalButtons");
  var starButton = document.getElementById("starButton");

  backElement.style.display = "none";
  notesElement.style.display = "none";
  
  if (currentCardIndex >= incorrectCardsQueue.length) {
    endErrorReview();
    return;
  }
  
  cardContainer.style.display = "block";
  document.getElementById("cardStats").style.display = "block"; // Show stats
  
  var card = incorrectCardsQueue[currentCardIndex];
  
  levelBadge.style.display = "block";
  levelBadge.textContent = card.level;

  if (isReversedMode) {
    frontElement.innerHTML = card.back;
    backElement.textContent = card.front;
  } else {
    frontElement.innerHTML = card.front;
    backElement.textContent = card.back;
  }
  
  notesElement.textContent = card.notes || "";
  
  starButton.style.display = "block";
  updateStarButton(card.starred);
  
  if (!showAnswer) { 
    card.timesViewed = (card.timesViewed || 0) + 1;
    card.lastViewed = new Date().getTime();
  }
  
  updateCardStats(card);
  
  if (showAnswer) {
    backElement.style.display = "block";
    notesElement.style.display = "block";
    showAnswerBtn.style.display = "none";
    incorrectBtn.style.display = "inline-block";
    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "visible";
  } else {
    showAnswerBtn.style.display = "inline-block";
    incorrectBtn.style.display = "none";
    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "hidden";
  }
  
  updateProgressDisplay();
}

function answerErrorCard(wasCorrect) {
  if (currentCardIndex >= incorrectCardsQueue.length) return;
  
  var card = incorrectCardsQueue[currentCardIndex];

  if (!wasCorrect) {
    currentCardIndex++;
    
    if (currentCardIndex >= incorrectCardsQueue.length) {
      endErrorReview();
    } else {
      displayErrorCard(false);
    }
  }
}

function endErrorReview() {
  incorrectCardsQueue = incorrectCardsQueue.filter(function(card) {
    return card !== null;
  });
  
  inErrorReviewMode = false;
  
  var statusElement = document.getElementById("statusMessage");
  statusElement.style.display = "none";

  if (incorrectCardsQueue.length > 0) {
    showConfirmation(
      "You still have " + incorrectCardsQueue.length + " cards to master. Review them again?",
      startErrorReview
    );
  } else {
    showToast("All error cards reviewed successfully!", 2000);
    currentCardIndex = 0;
    displayCurrentCard(false);
  }
}

function handleAnswerCard(wasCorrect) {
  if (inErrorReviewMode) {
    answerErrorCard(wasCorrect);
  } else {
    if (!wasCorrect) {
      answerCard(wasCorrect);
    }
  }
}

function toggleStarCurrentCard() {
  var dueCards = getDueCards();
  if (dueCards.length === 0) return;
  
  var cardIndex = currentCardIndex % dueCards.length;
  var card = dueCards[cardIndex];
  
  card.starred = !card.starred;
  
  updateStarButton(card.starred);
  
  showToast(card.starred ? "Card starred" : "Card unstarred", 1000);
}

function updateStarButton(isStarred) {
  var starButton = document.getElementById("starButton");
  if (!starButton) return;
  
  if (isStarred) {
    starButton.innerHTML = "★";
    starButton.classList.add("starred");
  } else {
    starButton.innerHTML = "☆";
    starButton.classList.remove("starred");
  }
}

// Toggle showing only starred cards
function toggleStarredFilter() {
  showingStarredOnly = !showingStarredOnly;
  currentCardIndex = 0; 
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

function toggleCardDirection() {
  isReversedMode = !isReversedMode;
  currentCardIndex = 0; 
  var reverseToggleBtn = document.getElementById("reverseToggleBtn");
  if (reverseToggleBtn) {
    if (isReversedMode) {
      reverseToggleBtn.classList.add("active");
    } else {
      reverseToggleBtn.classList.remove("active");
    }
  }
  
  updateDirectionDisplay();
  
  displayCurrentCard(false);
  
  showToast(isReversedMode ? "Reversed Mode: Native → Target" : "Normal Mode: Target → Native", 2000);
}

function updateDirectionDisplay() {
  var levelDisplayElement = document.getElementById("levelDisplay");
  var levelText = "Level: " + (currentLevel === "all" ? "All Levels" : currentLevel);
  
  if (showingStarredOnly) {
    levelText += " (Starred Only)";
  }
  
  levelText += " • " + (isReversedMode ? "Native → Target" : "Target → Native");
  
  levelDisplayElement.textContent = levelText;
}

function updateCardStats(card) {
  var statsElement = document.getElementById("cardStats");
  if (!statsElement || !card) return;
  
  var totalViews = card.timesViewed || 0;
  var correctAnswers = 0;
  var incorrectAnswers = 0;
  var lastViewed = card.lastViewed ? new Date(card.lastViewed) : null;
  
  if (card.history && card.history.length > 0) {
    for (var i = 0; i < card.history.length; i++) {
      if (card.history[i].result === true) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }
    }
  }

  var lastViewedText = "never";
  if (lastViewed) {
    var now = new Date();
    var diffMs = now - lastViewed;
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    var diffHours = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
    var diffMins = Math.floor(diffMs / (1000 * 60)) % 60;
    
    if (diffDays > 0) {
      lastViewedText = diffDays + " day" + (diffDays !== 1 ? "s" : "") + " ago";
    } else if (diffHours > 0) {
      lastViewedText = diffHours + " hour" + (diffHours !== 1 ? "s" : "") + " ago";
    } else if (diffMins > 0) {
      lastViewedText = diffMins + " minute" + (diffMins !== 1 ? "s" : "") + " ago";
    } else {
      lastViewedText = "just now";
    }
  }
  
  statsElement.innerHTML = "Viewed " + totalViews + " time" + (totalViews !== 1 ? "s" : "") + 
    " • Last: " + lastViewedText;
}