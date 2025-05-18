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
var deviceScaleFactor = 1.0; // New variable for device scaling

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
  
  var viewport = detectViewportAndAdjust();
  var cardContainer = document.getElementById("cardContainer");
  var controlButtons = document.getElementById("controlButtons");
  var intervalButtons = document.getElementById("intervalButtons");
  
  // Set dimensions based on screen size
  var cardHeight = "300px";
  var controlHeight = "100px"; // Reduced control height
  var intervalTop = "0px"; // Interval buttons appear at the top of the control section now
  var backMinHeight = "50px";
  var notesMinHeight = "20px";
  
  // Adjust dimensions based on detected viewport
  if (viewport.width >= 1800 || viewport.height >= 2400) {
    // Kindle Scribe
    cardHeight = "700px";
    controlHeight = "160px"; // Reduced from 320px
    intervalTop = "0px";
    backMinHeight = "120px";
    notesMinHeight = "40px";
  } else if (viewport.width >= 1050 || viewport.height >= 1400) {
    // Large Kindles
    cardHeight = "550px";
    controlHeight = "120px"; // Reduced from 240px
    intervalTop = "0px";
    backMinHeight = "90px";
    notesMinHeight = "30px";
  } else if (viewport.width >= 750 || viewport.height >= 1000) {
    // Medium Kindles
    cardHeight = "400px";
    controlHeight = "100px"; // Reduced from 200px
    intervalTop = "0px";
    backMinHeight = "65px";
    notesMinHeight = "25px";
  }
  
  if (cardContainer) {
    cardContainer.style.height = cardHeight; 
    cardContainer.style.overflow = "hidden";
  }
  
  if (controlButtons) {
    controlButtons.style.height = controlHeight; 
    controlButtons.style.overflow = "hidden";
  }
  
  if (intervalButtons) {
    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "hidden";
    intervalButtons.style.top = intervalTop;
    var forceLayout = intervalButtons.offsetHeight;
  }
  
  var backElement = document.getElementById("cardBack");
  if (backElement) {
    backElement.style.minHeight = backMinHeight;
  }
  
  var notesElement = document.getElementById("cardNotes");
  if (notesElement) {
    notesElement.style.minHeight = notesMinHeight;
  }
  
  log("Fixed element heights initialized for viewport " + viewport.width + "x" + viewport.height);
}

// Detect viewport size and adjust UI accordingly
function detectViewportAndAdjust() {
  var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  
  log("Detected viewport size: " + width + "x" + height);
  
  // Add a CSS class to the body based on screen size range
  var body = document.body;
  
  // Remove existing size classes
  body.classList.remove('kindle-small', 'kindle-medium', 'kindle-large', 'kindle-xlarge');
  
  // Add appropriate class
  if (width <= 600) {
    body.classList.add('kindle-small');
  } else if (width <= 850) {
    body.classList.add('kindle-medium');
  } else if (width <= 1300) {
    body.classList.add('kindle-large');
  } else {
    body.classList.add('kindle-xlarge');
  }
  
  return { width: width, height: height };
}

// Handle window resize or orientation change events
function handleViewportChange() {
  // Debounce the resize event
  if (window.resizeTimer) {
    clearTimeout(window.resizeTimer);
  }
  
  window.resizeTimer = setTimeout(function() {
    log("Viewport changed, reinitializing and applying device scaling...");
    // Apply device-specific scaling first
    detectDeviceAndSetScaling();
    initializeFixedHeights();
    displayCurrentCard(false);
    // Update text display for responsive layout
    updateProgressDisplay();
    updateLevelDisplay();
    
    // Reposition any visible popups or toasts
    var toast = document.getElementById("toastNotification");
    if (toast && toast.style.display === "block") {
      var screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      toast.style.top = (screenHeight > 1000) ? "120px" : "80px";
    }
    
    var overlay = document.getElementById("confirmationOverlay");
    if (overlay && overlay.style.display === "block") {
      var popup = overlay.querySelector(".popup");
      var screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      var topPosition = Math.round(screenHeight / 2 - 100);
      popup.style.top = topPosition + "px";
    }
  }, 250);
}

// Add event listeners for window resize and orientation change
function addViewportListeners() {
  if (window.addEventListener) {
    window.addEventListener('resize', handleViewportChange, false);
    window.addEventListener('orientationchange', handleViewportChange, false);
    log("Added viewport change listeners");
  }
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

// Save deck to localStorage
function saveDeck() {
  if (deck) {
    try {
      localStorage.setItem('kanki_deck', JSON.stringify(deck));
      log("Deck saved to localStorage");
    } catch (e) {
      log("Error saving deck: " + e.message);
    }
  }
}

// Load deck from localStorage or create a new one if none exists
function loadDeck() {
  try {
    var savedDeck = localStorage.getItem('kanki_deck');
    if (savedDeck) {
      deck = JSON.parse(savedDeck);
      log("Loaded saved deck with " + deck.cards.length + " cards");
      return true;
    }
  } catch (e) {
    log("Error loading deck: " + e.message);
  }
  
  // If no saved deck or error, create a new one
  deck = createDefaultDeck();
  log("Created new default deck");
  return false;
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
  var popup = overlay.querySelector(".popup");
  var messageElement = document.getElementById("confirmationMessage");
  var yesButton = document.getElementById("confirmYesBtn");
  var noButton = document.getElementById("confirmNoBtn");
  
  // Set message
  messageElement.textContent = message;
  
  // Adjust popup position for different screen sizes
  var screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  var topPosition = Math.round(screenHeight / 2 - 100);  // Center vertically
  popup.style.top = topPosition + "px";
  
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
  
  saveDeck();
  
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
    // Save view statistics
    saveDeck();
  }
  
  updateCardStats(card);
  
  if (showAnswer) {
    backElement.style.display = "block";
    notesElement.style.display = "block";
    showAnswerBtn.style.display = "none";
    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "visible";
  } else {
    showAnswerBtn.style.display = "block";
    intervalButtons.style.display = "none"; // Hide completely instead of using visibility
  }
  
  updateProgressDisplay();
}

function updateProgressDisplay() {
  var progressElement = document.getElementById("progressDisplay");
  
  if (inErrorReviewMode) {
    progressElement.textContent = "⚠️ " + (currentCardIndex + 1) + 
      "/" + incorrectCardsQueue.length + " • ✓" + correctAnswers + 
      " • ✗" + incorrectAnswers;
    return;
  }
  
  var dueCards = getDueCards();
  
  if (dueCards.length === 0) {
    progressElement.textContent = "✓ Done!";
    return;
  }
  
  progressElement.textContent = "Card :  " + (currentCardIndex % dueCards.length + 1) + 
      "/" + dueCards.length + " • ✓" + correctAnswers + 
      " • ✗" + incorrectAnswers;
  

  updateLevelDisplay();
}


function updateLevelDisplay() {
  var levelDisplayElement = document.getElementById("levelDisplay");
  var displayText = (currentLevel === "all" ? "All" : currentLevel);

  if (showingStarredOnly) {
    displayText += " ★";
  }
 
  displayText += " • " + (isReversedMode ? "Native→Target" : "Target→Native");
  
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
  

  saveDeck();
  
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

    // For 'again' difficulty, it's effectively the same as marking incorrect
    // This replaces the separate "Incorrect" button functionality
    if (difficulty === 'again') {
      // Special handling for "Again" button (previously the "Incorrect" button)
      incorrectAnswers++;
      if (!inErrorReviewMode) {
        incorrectCardsQueue.push(card);
      }
    } else {
      correctAnswers++;
    }

    setNextReviewTime(card, difficulty);
    
    currentCardIndex++;
    
    saveDeck();
    
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
  
  saveDeck();
  
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
  
  // Save user preference for level
  saveDeck();
}

// Initialize app on page load
function onPageLoad() {
  log("Application initializing...");

  initializeConfig();
  
  // Apply device-specific scaling before anything else
  detectDeviceAndSetScaling();

  loadLanguageFont();

  initializeFixedHeights();

  detectViewportAndAdjust();

  updateLevelButtons();

  addViewportListeners();

  if (!loadDeck()) {
    deck = createDefaultDeck();
    log("Created new default deck");
  }
  
  // Update menu button states
  var starredFilterBtn = document.getElementById("starredFilterBtn");
  var reverseToggleBtn = document.getElementById("reverseToggleBtn");
  
  if (starredFilterBtn && showingStarredOnly) {
    starredFilterBtn.classList.add("active");
  }
  
  if (reverseToggleBtn && isReversedMode) {
    reverseToggleBtn.classList.add("active");
  }

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
  
  // These buttons are now in the HTML directly
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
  
  // Adjust toast position for larger screens
  var screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  toast.style.top = (screenHeight > 1000) ? "120px" : "80px";
  
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
  saveDeck();
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
  saveDeck();
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
    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "visible";
  } else {
    showAnswerBtn.style.display = "block";
    intervalButtons.style.display = "none"; // Hide completely instead of using visibility
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
  saveDeck();
}

function handleAnswerCard(wasCorrect) {
  if (inErrorReviewMode) {
    answerErrorCard(wasCorrect);
  } else {
    if (!wasCorrect) {
      answerCard(wasCorrect);
    }
    saveDeck();
  }
}

function toggleStarCurrentCard() {
  var dueCards = getDueCards();
  if (dueCards.length === 0) return;
  
  var cardIndex = currentCardIndex % dueCards.length;
  var card = dueCards[cardIndex];
  
  card.starred = !card.starred;
  
  updateStarButton(card.starred);
  
  saveDeck();
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
  
  // Save user preference for starred filter
  saveDeck();
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
  
  // Save user preference for card direction
  saveDeck();
  
  showToast(isReversedMode ? "Flip: Native → Target" : "Flip: Target → Native", 1500);
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

// Detect device and set appropriate scaling
function detectDeviceAndSetScaling() {
  var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  
  log("Device resolution detected: " + width + "x" + height);
  
  // Base scale is for 600x800 (original Kindle)
  deviceScaleFactor = 1.0;
  
  // Specific handling for Kindle Paperwhite 3 (1072×1448)
  if ((width >= 1070 && width <= 1080) && (height >= 1440 && height <= 1460)) {
    deviceScaleFactor = 0.6; // Special scaling for Paperwhite 3
    log("Kindle Paperwhite 3 detected. Applied special scaling: " + deviceScaleFactor);
  }
  // High DPI Kindle devices (like Oasis, Scribe)
  else if (width >= 1000 && height >= 1400) {
    deviceScaleFactor = 0.65; // Reduce the scaling factor for high-res screens
    log("High-res device detected. Applied scaling: " + deviceScaleFactor);
  }
  // Mid-size Kindle screens
  else if ((width >= 750 && width < 1000) || (height >= 1000 && height < 1400)) {
    deviceScaleFactor = 0.8;
    log("Mid-size device detected. Applied scaling: " + deviceScaleFactor);
  }
  
  // Apply scaling to the root element
  document.documentElement.style.fontSize = (deviceScaleFactor * 100) + "%";
  
  // Set a CSS variable that can be used in CSS files
  document.documentElement.style.setProperty('--device-scale', deviceScaleFactor);
  
  // Add a special class for specific device types
  var body = document.body;
  body.classList.remove('kindle-base', 'kindle-paperwhite', 'kindle-oasis');
  
  if ((width >= 1070 && width <= 1080) && (height >= 1440 && height <= 1460)) {
    body.classList.add('kindle-paperwhite');
  } else if (width >= 1200) {
    body.classList.add('kindle-oasis');
  } else {
    body.classList.add('kindle-base');
  }
}