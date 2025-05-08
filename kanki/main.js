// Globals
var currentCardIndex = 0;
var correctAnswers = 0;
var incorrectAnswers = 0;
var deck = null;
var currentLevel = "all"; // Default to show all cards
var fontLoaded = false;
var appLanguage = "Japanese"; // Change this to your language name, for example "Spanish" / "Arabic" / "French"
var appLevels = ["N5", "N4"]; // Configurable levels - change according to vocabulary.js ,e.g. ["A1", "A2", "B1", "B2", "C1", "C2"]

// Convert non-ASCII characters to HTML entities for Kindle display
// function toEscapeCodes(str) {
//   var result = "";
//   for (var i = 0; i < str.length; i++) {
//     var charCode = str.charCodeAt(i);
//     if (charCode > 127) {
//       result += "&#" + charCode + ";";
//     } else {
//       result += str.charAt(i);
//     }
//   }
//   return result;
// }

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
  
  // Force font loading
  var fontCSS = "@font-face { font-family: 'LanguageFont'; src: url('assets/fonts/language.ttf') format('truetype'); font-weight: normal; font-style: normal; font-display: block; }";
  var styleElement = document.createElement('style');
  styleElement.textContent = fontCSS;
  document.head.appendChild(styleElement);
  
  // Wait longer for Kindle's slower processing
  setTimeout(function() {
    fontLoaded = true;
    log(appLanguage + " font loading completed");
  }, 2000);
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
  // First, check if VOCABULARY is defined
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
    // Fallback if vocabulary file isn't loaded - basic set of cards
    log("Warning: VOCABULARY not found, using minimal deck");
    
    deck.cards.push(createCard("Example", null, "Translation", "Sample card", appLevels[0], 0));
    deck.cards.push(createCard("Second", null, "Another translation", "Another sample", appLevels[0], 0));
  }
  
  return deck;
}

// Update status message with optional confirmation buttons
function updateStatusMessage(message, isConfirmation, onConfirm, onCancel) {
  var statusElement = document.getElementById("statusMessage");
  if (!statusElement) return;
  
  // Clear existing content
  statusElement.innerHTML = '';
  
  // Add message
  var messageEl = document.createElement("div");
  messageEl.className = "statusText";
  messageEl.textContent = message;
  statusElement.appendChild(messageEl);
  
  // If this is a confirmation, add yes/no buttons
  if (isConfirmation && onConfirm) {
    var buttonContainer = document.createElement("div");
    buttonContainer.className = "statusButtons";
    
    var yesButton = document.createElement("button");
    yesButton.textContent = "Yes";
    yesButton.className = "confirmBtn";
    yesButton.onclick = function() {
      statusElement.style.display = "none";
      onConfirm();
    };
    
    var noButton = document.createElement("button");
    noButton.textContent = "No";
    noButton.className = "cancelBtn";
    noButton.onclick = function() {
      statusElement.style.display = "none";
      if (onCancel) onCancel();
    };
    
    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    statusElement.appendChild(buttonContainer);
  }
  
  // Display the message
  statusElement.style.display = "block";
  
  // Auto-hide for non-confirmation messages
  if (!isConfirmation) {
    setTimeout(function() {
      statusElement.style.display = "none";
    }, 3000);
  }
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

// Display current card
function displayCurrentCard(showAnswer) {
  var cardContainer = document.getElementById("cardContainer");
  var dueCards = getDueCards();
  
  // Clear previous content
  cardContainer.innerHTML = "";
  
  if (dueCards.length === 0) {
    // No cards due
    var message = document.createElement("div");
    message.className = "card";
    message.innerHTML = "<p>No cards due for review!</p><p>Great job!</p>";
    cardContainer.appendChild(message);
    document.getElementById("answerButtons").style.display = "none";
    document.getElementById("showAnswerBtn").style.display = "none";
    return;
  }
  
  var card = dueCards[currentCardIndex % dueCards.length];
  var cardElement = document.createElement("div");
  cardElement.className = "card";
  
  var levelBadge = document.createElement("div");
  levelBadge.className = "levelBadge";
  levelBadge.textContent = card.level;
  
  var frontElement = document.createElement("div");
  frontElement.className = "cardFront";
  
  // Use innerHTML to render the HTML entities
  frontElement.innerHTML = card.front;
  frontElement.style.fontFamily = "LanguageFont, sans-serif";
  
  cardElement.appendChild(levelBadge);
  cardElement.appendChild(frontElement);
  
  if (showAnswer) {
    var backElement = document.createElement("div");
    backElement.className = "cardBack";
    backElement.textContent = card.back;
    
    var notesElement = document.createElement("div");
    notesElement.className = "cardNotes";
    notesElement.textContent = card.notes;
    
    cardElement.appendChild(backElement);
    cardElement.appendChild(notesElement);
    
    document.getElementById("showAnswerBtn").style.display = "none";
    document.getElementById("answerButtons").style.display = "block";
  } else {
    document.getElementById("showAnswerBtn").style.display = "block";
    document.getElementById("answerButtons").style.display = "none";
  }
  
  cardContainer.appendChild(cardElement);
  
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
  
  // Display first card
  displayCurrentCard(false);
  
  log("Application initialized");
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
    button.onclick = function(level) {
      return function() { 
        changeLevel(level); 
      };
    }(appLevels[i]);
    levelsContainer.appendChild(button);
  }
}

// Helper to create onclick handlers
function createLevelChangeHandler(level) {
  return function() {
    changeLevel(level);
  };
}

// Reset progress
function resetProgress() {
  updateStatusMessage("Are you sure you want to reset all cards' progress?", true, 
    function() { // onConfirm
      for (var i = 0; i < deck.cards.length; i++) {
        deck.cards[i].difficulty = 0;
        deck.cards[i].nextReview = new Date().getTime();
        deck.cards[i].history = [];
      }
      
      currentCardIndex = 0;
      correctAnswers = 0;
      incorrectAnswers = 0;
      
      displayCurrentCard(false);
      updateStatusMessage("Progress has been reset", false);
      log("Progress reset");
    }
  );
}

// Reset all
function resetAll() {
  updateStatusMessage("Are you sure you want to reset all data? This will delete all cards and progress.", true,
    function() { // onConfirm
      deck = createDefaultDeck();
      currentCardIndex = 0;
      correctAnswers = 0;
      incorrectAnswers = 0;
      
      displayCurrentCard(false);
      updateStatusMessage("All data has been reset", false);
      log("Complete reset performed");
    }
  );
}