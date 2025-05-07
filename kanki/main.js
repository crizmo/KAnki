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

function createCard(front, back, notes, jlptLevel, level) {
  return {
    front: toEscapeCodes(front), // Convert to HTML entities
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
    // Add N5 words
    if (JLPT_VOCABULARY.N5) {
      for (var i = 0; i < JLPT_VOCABULARY.N5.length && i < 20; i++) { // Limit to 20 words
        var word = JLPT_VOCABULARY.N5[i];
        deck.cards.push(createCard(
          word.front, 
          word.back, 
          word.notes, 
          "N5", 
          0
        ));
      }
    }
    
    // Add N4 words
    if (JLPT_VOCABULARY.N4) {
      for (var j = 0; j < JLPT_VOCABULARY.N4.length && j < 10; j++) { // Limit to 10 words
        var word = JLPT_VOCABULARY.N4[j];
        deck.cards.push(createCard(
          word.front, 
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
    
    // N5 Level Cards - minimal set
    deck.cards.push(createCard("こんにちは", "Hello", "Greeting", "N5", 0));
    deck.cards.push(createCard("ありがとう", "Thank you", "Gratitude", "N5", 0));
    deck.cards.push(createCard("さようなら", "Goodbye", "Parting", "N5", 0));
    deck.cards.push(createCard("はい", "Yes", "Affirmation", "N5", 0));
    deck.cards.push(createCard("いいえ", "No", "Negation", "N5", 0));
    
    // N4 Level Cards - minimal set
    deck.cards.push(createCard("急ぐ", "To hurry", "Verb", "N4", 0));
    deck.cards.push(createCard("同じ", "Same", "Adjective", "N4", 0));
    deck.cards.push(createCard("違う", "Different", "Verb", "N4", 0));
  }
  
  return deck;
}

// Update status message
function updateStatusMessage(message) {
  var statusElement = document.getElementById("statusMessage");
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.display = "block";
    
    // Hide after 3 seconds
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
  if (confirm("Are you sure you want to reset all cards' progress?")) {
    deck.cards.forEach(function(card) {
      card.level = 0;
      card.nextReview = new Date().getTime();
      card.history = [];
    });
    
    currentCardIndex = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    
    displayCurrentCard(false);
    
    log("Progress reset");
  }
}

// Reset all
function resetAll() {
  if (confirm("Are you sure you want to reset all data? This will delete all cards and progress.")) {
    deck = createDefaultDeck();
    currentCardIndex = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    
    displayCurrentCard(false);
    
    log("Complete reset performed");
  }
}