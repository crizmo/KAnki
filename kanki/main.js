// Globals
var currentCardIndex = 0;
var correctAnswers = 0;
var incorrectAnswers = 0;
var deck = null;
var currentJlptLevel = "all"; // Default to show all cards
var fontLoaded = false;

// Convert Japanese characters to HTML entities
function toEscapeCodes(str) {
  var result = "";
  for (var i = 0; i < str.length; i++) {
    var charCode = str.charCodeAt(i);
    if (charCode > 127) {
      result += "&#" + charCode + ";";
    } else {
      result += str.charAt(i);
    }
  }
  return result;
}

// The logging function
function log(logStuff) {
  var logElement = document.getElementById("log");
  if (logElement) {
    logElement.innerHTML += "<p>" + logStuff + "</p>";
  }
  console.log(logStuff);
}

function loadJapaneseFont() {
  log("Loading Japanese font...");
  
  // Force font loading
  var fontCSS = "@font-face { font-family: 'JapaneseFont'; src: url('assets/fonts/japanese.ttf') format('truetype'); font-weight: normal; font-style: normal; font-display: block; }";
  var styleElement = document.createElement('style');
  styleElement.textContent = fontCSS;
  document.head.appendChild(styleElement);
  
  // Wait longer for Kindle's slower processing
  setTimeout(function() {
    fontLoaded = true;
    log("Japanese font loading completed");
  }, 2000);
}

// Create flashcard deck data structure
function createDeck() {
  return {
    cards: [],
    lastStudied: new Date().getTime(),
    name: "Japanese Flashcards"
  };
}

function createCard(front, reading, back, notes, jlptLevel, level) {
  var displayText = front;
  if (reading) {
    displayText = front + " (" + reading + ")";
  }
  
  return {
    front: toEscapeCodes(displayText),
    back: back,
    notes: notes || "",
    jlptLevel: jlptLevel || "N5",
    level: level || 0,
    nextReview: new Date().getTime(),
    history: []
  };
}
// Default Japanese deck with words from vocabulary.js
function createDefaultDeck() {
  var deck = createDeck();
  
  // Add words from the JLPT_VOCABULARY object
  // First, check if JLPT_VOCABULARY is defined
  if (typeof JLPT_VOCABULARY !== 'undefined') {
    if (JLPT_VOCABULARY.N5) {
      for (var i = 0; i < JLPT_VOCABULARY.N5.length; i++) {
        var word = JLPT_VOCABULARY.N5[i];
        deck.cards.push(createCard(
          word.front, 
          word.reading,
          word.back, 
          word.notes, 
          "N5", 
          0
        ));
      }
    }
    
    // Add N4 words
    if (JLPT_VOCABULARY.N4) {
      for (var j = 0; j < JLPT_VOCABULARY.N4.length; j++) {
        var word = JLPT_VOCABULARY.N4[j];
        deck.cards.push(createCard(
          word.front, 
          word.reading,
          word.back, 
          word.notes, 
          "N4", 
          0
        ));
      }
    }
    
    log("Created default deck with " + deck.cards.length + " cards");
  } else {
    // Fallback if vocabulary file isn't loaded - basic set of cards
    log("Warning: JLPT_VOCABULARY not found, using minimal deck");
    
    deck.cards.push(createCard("こんにちは", null, "Hello", "Greeting", "N5", 0));
    deck.cards.push(createCard("ありがとう", null, "Thank you", "Gratitude", "N5", 0));
    deck.cards.push(createCard("さようなら", null, "Goodbye", "Parting", "N5", 0));
    deck.cards.push(createCard("はい", null, "Yes", "Affirmation", "N5", 0));
    deck.cards.push(createCard("いいえ", null, "No", "Negation", "N5", 0));
    deck.cards.push(createCard("お願いします", null, "Please", "Request", "N5", 0));
    deck.cards.push(createCard("すみません", null, "Excuse me / Sorry", "Apology", "N5", 0));
    deck.cards.push(createCard("いくらですか", null, "How much is it?", "Question", "N5", 0));
    deck.cards.push(createCard("わかりません", null, "I don't understand", "Phrase", "N5", 0));
    deck.cards.push(createCard("あなた", null, "You", "Pronoun", "N5", 0));
    deck.cards.push(createCard("水", "みず", "Water", "Noun", "N5", 0));
    deck.cards.push(createCard("人", "ひと", "Person", "Noun", "N5", 0));
    deck.cards.push(createCard("本", "ほん", "Book", "Noun", "N5", 0));
    deck.cards.push(createCard("一", "いち", "One", "Number", "N5", 0));
    deck.cards.push(createCard("二", "に", "Two", "Number", "N5", 0));
    deck.cards.push(createCard("三", "さん", "Three", "Number", "N5", 0));
    deck.cards.push(createCard("四", "よん", "Four", "Number", "N5", 0));
    deck.cards.push(createCard("五", "ご", "Five", "Number", "N5", 0));
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
  
  // Update card history
  card.history.push({
    date: now,
    correct: wasCorrect
  });
  
  if (wasCorrect) {
    // Increase card level (max 5)
    card.level = Math.min(5, card.level + 1);
  } else {
    // Reset to level 0
    card.level = 0;
  }
  
  // Calculate next review time based on level
  var intervalHours;
  switch (card.level) {
    case 0: intervalHours = 0.1; break; // 6 minutes
    case 1: intervalHours = 1; break;   // 1 hour
    case 2: intervalHours = 6; break;   // 6 hours
    case 3: intervalHours = 24; break;  // 1 day
    case 4: intervalHours = 72; break;  // 3 days
    case 5: intervalHours = 168; break; // 1 week
    default: intervalHours = 0.1;
  }
  
  card.nextReview = now + (intervalHours * 60 * 60 * 1000);
}

// Get cards due for review (filtered by JLPT level if applicable)
function getDueCards() {
  var now = new Date().getTime();
  var filteredCards = deck.cards.filter(function(card) {
    var levelMatch = (currentJlptLevel === "all" || card.jlptLevel === currentJlptLevel);
    return levelMatch && card.nextReview <= now;
  });
  return filteredCards;
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
  levelBadge.className = "jlptBadge";
  levelBadge.textContent = card.jlptLevel;
  
  var frontElement = document.createElement("div");
  frontElement.className = "cardFront";
  // Use innerHTML to render the HTML entities
  frontElement.innerHTML = card.front;
  frontElement.style.fontFamily = "JapaneseFont, sans-serif";
  
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
  
  // Update JLPT level display
  updateJlptLevelDisplay();
}

// Update JLPT level display
function updateJlptLevelDisplay() {
  var levelDisplayElement = document.getElementById("levelDisplay");
  levelDisplayElement.textContent = "JLPT Level: " + (currentJlptLevel === "all" ? "All Levels" : currentJlptLevel);
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

// Change the currently selected JLPT level
function changeJlptLevel(level) {
  currentJlptLevel = level;
  currentCardIndex = 0; // Reset counter when changing level
  updateJlptLevelDisplay();
  displayCurrentCard(false);
}

// Initialize app on page load
function onPageLoad() {
  log("Application initializing...");
  
  // Load Japanese font
  loadJapaneseFont();
  
  // Always create a new default deck
  deck = createDefaultDeck();
  log("Created new default deck");
  
  // Display first card
  displayCurrentCard(false);
  
  log("Application initialized");
}

// Reset progress
function resetProgress() {
  updateStatusMessage("Are you sure you want to reset all cards' progress?", true, 
    function() { // onConfirm
      for (var i = 0; i < deck.cards.length; i++) {
        deck.cards[i].level = 0;
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