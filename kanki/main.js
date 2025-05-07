// Globals
var currentCardIndex = 0;
var correctAnswers = 0;
var incorrectAnswers = 0;
var deck = null;
var currentJlptLevel = "all"; // Default to show all cards
var isLoadingVocabulary = false;
var fontLoaded = false;

// The logging function
function log(logStuff) {
  var p = document.createElement("p");
  p.innerText = logStuff.toString();
  document.getElementById("log").appendChild(p);
  console.log(logStuff);
}

// Simple font loader
function loadJapaneseFont() {
  var fontCSS = "@font-face { font-family: 'JapaneseFont'; src: url(assets/fonts/japanese.ttf); }";
  var styleElement = document.createElement('style');
  styleElement.textContent = fontCSS;
  document.head.appendChild(styleElement);
  
  // Create a test element with Japanese text
  var testElement = document.createElement('div');
  testElement.style.fontFamily = 'JapaneseFont, sans-serif';
  testElement.style.visibility = 'hidden';
  testElement.style.position = 'absolute';
  testElement.style.top = '-1000px';
  testElement.textContent = 'こんにちは';
  document.body.appendChild(testElement);
  
  // Wait a bit for font to load
  setTimeout(function() {
    fontLoaded = true;
    testElement.remove();
    log("Japanese font loading completed");
  }, 1000);
}

// Create flashcard deck data structure
function createDeck() {
  return {
    cards: [],
    lastStudied: new Date().getTime(),
    name: "Japanese Flashcards"
  };
}

// Create a new card
function createCard(front, back, notes, jlptLevel, level) {
  return {
    front: front,
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
      for (var i = 0; i < JLPT_VOCABULARY.N5.length; i++) {
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
      for (var j = 0; j < JLPT_VOCABULARY.N4.length; j++) {
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

// Fetch vocabulary from the API
function fetchVocabularyFromAPI(level) {
  if (isLoadingVocabulary) {
    return;
  }
  
  isLoadingVocabulary = true;
  updateStatusMessage("Fetching vocabulary from API...");
  
  // Show loading indicator
  document.getElementById("loadingIndicator").style.display = "block";
  
  fetchVocabulary(level, function(error, data) {
    isLoadingVocabulary = false;
    document.getElementById("loadingIndicator").style.display = "none";
    
    if (error) {
      log("Error fetching vocabulary: " + error);
      updateStatusMessage("Failed to fetch vocabulary. Please try again.");
      return;
    }
    
    if (!data || data.length === 0) {
      log("No vocabulary data returned from API");
      updateStatusMessage("No vocabulary found for selected level.");
      return;
    }
    
    log("Successfully fetched " + data.length + " vocabulary items");
    updateStatusMessage("Successfully fetched " + data.length + " words. Adding to deck...");
    
    // Process the vocabulary data
    var addedCount = 0;
    for (var i = 0; i < data.length; i++) {
      var word = data[i];
      
      // Check if this word already exists in the deck
      var exists = false;
      for (var j = 0; j < deck.cards.length; j++) {
        if (deck.cards[j].front === word.word) {
          exists = true;
          break;
        }
      }
      
      // Add the word if it doesn't exist
      if (!exists) {
        var jlptLevel = "N5"; // Default
        if (word.level) {
          jlptLevel = "N" + word.level;
        }
        
        deck.cards.push(createCard(
          word.word,
          word.meaning,
          word.type || "",
          jlptLevel,
          0
        ));
        addedCount++;
      }
    }
    
    // Save the updated deck
    saveFlashcardDeck();
    
    // Update UI
    updateStatusMessage("Added " + addedCount + " new vocabulary words to your deck!");
    displayCurrentCard(false);
  });
}

// Update status message
function updateStatusMessage(message) {
  var statusElement = document.getElementById("statusMessage");
  statusElement.textContent = message;
  statusElement.style.display = "block";
  
  // Hide after 5 seconds
  setTimeout(function() {
    statusElement.style.display = "none";
  }, 5000);
}

// Spaced repetition algorithm (simplified SM-2)
function calculateNextReview(card, wasCorrect) {
  var now = new Date().getTime();
  
  // Record review in history
  card.history.push({
    date: now,
    result: wasCorrect
  });
  
  if (wasCorrect) {
    // Increase level for correct answers
    card.level += 1;
    
    // Calculate next review time based on level
    var hoursUntilNextReview = 0;
    
    switch (card.level) {
      case 1:
        hoursUntilNextReview = 4;
        break;
      case 2:
        hoursUntilNextReview = 8;
        break;
      case 3:
        hoursUntilNextReview = 24;
        break;
      case 4:
        hoursUntilNextReview = 72;
        break;
      case 5:
        hoursUntilNextReview = 168;
        break;
      default:
        hoursUntilNextReview = Math.pow(2, Math.min(card.level, 15)) * 24;
    }
    
    card.nextReview = now + (hoursUntilNextReview * 60 * 60 * 1000);
  } else {
    // Reset level for incorrect answers
    card.level = Math.max(0, card.level - 1);
    
    // Schedule for review soon (30 minutes)
    card.nextReview = now + (30 * 60 * 1000);
  }
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
  frontElement.textContent = card.front;
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
  
  // Save deck
  saveFlashcardDeck();
  
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

// Add a new card to the deck
function addNewCard() {
  var frontText = document.getElementById("newCardFront").value.trim();
  var backText = document.getElementById("newCardBack").value.trim();
  var notesText = document.getElementById("newCardNotes").value.trim();
  var jlptLevel = document.getElementById("newCardJlptLevel").value;
  
  if (frontText === "" || backText === "") {
    alert("Front and back text are required!");
    return;
  }
  
  deck.cards.push(createCard(frontText, backText, notesText, jlptLevel, 0));
  
  // Clear form
  document.getElementById("newCardFront").value = "";
  document.getElementById("newCardBack").value = "";
  document.getElementById("newCardNotes").value = "";
  
  // Hide form
  document.getElementById("addCardForm").style.display = "none";
  
  // Save deck
  saveFlashcardDeck();
  
  log("Added new card: " + frontText + " (" + jlptLevel + ")");
  
  // Update display
  displayCurrentCard(false);
}

// Show the add card form
function showAddCardForm() {
  document.getElementById("addCardForm").style.display = "block";
}

// Hide the add card form
function hideAddCardForm() {
  document.getElementById("addCardForm").style.display = "none";
}

// Save deck to localStorage
function saveFlashcardDeck() {
  try {
    window.localStorage.setItem("com.bluebotlaboratories.kanki.deck", 
        JSON.stringify(deck));
    log("Deck saved successfully");
  } catch (e) {
    log("Error saving deck: " + e.message);
  }
}

// Load deck from localStorage
function loadFlashcardDeck() {
  try {
    var savedDeck = window.localStorage.getItem("com.bluebotlaboratories.kanki.deck");
    if (savedDeck) {
      deck = JSON.parse(savedDeck);
      
      // Ensure jlptLevel is set on older cards
      deck.cards.forEach(function(card) {
        if (!card.jlptLevel) {
          card.jlptLevel = "N5";
        }
      });
      
      log("Deck loaded successfully");
      return true;
    }
  } catch (e) {
    log("Error loading deck: " + e.message);
  }
  return false;
}

// Initialize app on page load
function onPageLoad() {
  log("Application initializing...");
  
  // Load Japanese font
  loadJapaneseFont();
  
  // Initialize deck
  if (!loadFlashcardDeck()) {
    deck = createDefaultDeck();
    saveFlashcardDeck();
    log("Created new default deck");
  }
  
  // Display first card
  displayCurrentCard(false);
  
  // Hide add card form initially
  document.getElementById("addCardForm").style.display = "none";
  
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
    
    saveFlashcardDeck();
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
    
    saveFlashcardDeck();
    displayCurrentCard(false);
    
    log("Complete reset performed");
  }
}

// Function to download vocabulary from API
function downloadJlptVocabulary(level) {
  if (confirm("Download JLPT " + level + " vocabulary from internet? This requires an internet connection.")) {
    fetchVocabularyFromAPI(level.replace("N", ""));
  }
}