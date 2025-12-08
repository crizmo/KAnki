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
var deviceScaleFactor = 1.0; 
var lastShowAnswerTime = 0; 
var starredCardsQueue = []; 
var inStarredReviewMode = false; 
var reviewAllMode = false; 

var FSRS_W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];
var FSRS_DESIRED_RETENTION = 0.9; 

function fsrs_initStability(G) {
  return FSRS_W[G - 1];
}

function fsrs_initDifficulty(G) {
  return FSRS_W[4] - (G - 3) * FSRS_W[5];
}

function fsrs_retrievability(t, S) {
  return Math.pow(1 + (t / S) * 9, -1);
}

function fsrs_nextInterval(r, S) {
  return 9 * S * (1 / r - 1);
}

function fsrs_newDifficulty(D, G) {
  return FSRS_W[7] * fsrs_initDifficulty(3) + (1 - FSRS_W[7]) * (D - FSRS_W[6] * (G - 3));
}

function fsrs_newStabilityRecall(D, S, R, G) {
  var hardBonus = (G === 2) ? FSRS_W[15] : 1;
  var easyBonus = (G === 4) ? FSRS_W[16] : 1;
  return S * (Math.exp(FSRS_W[8] * (11 - D) * Math.pow(S, -FSRS_W[9]) * (Math.exp(FSRS_W[10] * (1 - R)) - 1) * hardBonus * easyBonus) + 1);
}

function fsrs_newStabilityForget(D, S, R) {
  return FSRS_W[11] * Math.pow(D, -FSRS_W[12]) * (Math.pow(S + 1, FSRS_W[13]) - 1) * Math.exp(FSRS_W[14] * (1 - R));
}


function initializeConfig() {
  if (typeof KANKI_CONFIG !== 'undefined') {
    appLanguage = KANKI_CONFIG.language || appLanguage;
    appLevels = KANKI_CONFIG.levels || appLevels;
    log("Loaded custom configuration: " + appLanguage + " with levels: " + appLevels.join(", "));
  } else {
    log("Using default configuration");
  }
}

function log(logStuff) {
  var logElement = document.getElementById("log");
  if (logElement) {
    logElement.innerHTML += "<p>" + logStuff + "</p>";
  }
  console.log(logStuff);
}

function loadLanguageFont() {
  log("Loading " + appLanguage + " font...");
  document.documentElement.style.fontFamily = "LanguageFont, sans-serif";
  setTimeout(function() {
    fontLoaded = true;
    log(appLanguage + " font loading completed");
    
    displayCurrentCard(false);
  }, 1000);
}


function initializeFixedHeights() {
  log("Initializing fixed element heights for e-ink optimization...");
  
  var viewport = detectViewportAndAdjust();
  var cardContainer = document.getElementById("cardContainer");
  var controlButtons = document.getElementById("controlButtons");
  var intervalButtons = document.getElementById("intervalButtons");
  
  var cardHeight = "300px";
  var controlHeight = "100px"; 
  var intervalTop = "0px"; 
  var backMinHeight = "50px";
  var notesMinHeight = "20px";
  
  if (viewport.width >= 1800 || viewport.height >= 2400) {
    
    cardHeight = "700px";
    controlHeight = "160px"; 
    intervalTop = "0px";
    backMinHeight = "120px";
    notesMinHeight = "40px";
  } else if (viewport.width >= 1050 || viewport.height >= 1400) {
    
    cardHeight = "550px";
    controlHeight = "120px"; 
    intervalTop = "0px";
    backMinHeight = "90px";
    notesMinHeight = "30px";
  } else if (viewport.width >= 750 || viewport.height >= 1000) {
    
    cardHeight = "400px";
    controlHeight = "100px"; 
    intervalTop = "0px";
    backMinHeight = "65px";
    notesMinHeight = "25px";
  }
  
  if (cardContainer) {
    cardContainer.style.height = cardHeight; 
    cardContainer.style.overflowY = "auto";
    cardContainer.style.overflowX = "hidden";
  }
  
  if (controlButtons) {
    controlButtons.style.height = controlHeight; 
    controlButtons.style.overflow = "visible";
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


function detectViewportAndAdjust() {
  var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  
  log("Detected viewport size: " + width + "x" + height);
  var body = document.body;
  body.classList.remove('kindle-small', 'kindle-medium', 'kindle-large', 'kindle-xlarge');
  
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


function handleViewportChange() {
  
  if (window.resizeTimer) {
    clearTimeout(window.resizeTimer);
  }
  
  window.resizeTimer = setTimeout(function() {
    log("Viewport changed, reinitializing and applying device scaling...");
    
    detectDeviceAndSetScaling();
    initializeFixedHeights();
    displayCurrentCard(false);
    
    updateProgressDisplay();
    updateLevelDisplay();
    
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

function addViewportListeners() {
  if (window.addEventListener) {
    window.addEventListener('resize', handleViewportChange, false);
    window.addEventListener('orientationchange', handleViewportChange, false);
    log("Added viewport change listeners");
  }
}

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
    lastViewed: null,
    fsrs_D: null, 
    fsrs_S: null, 
    fsrs_lastReview: null 
  };
}

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

function loadDeck() {
  try {
    var savedDeck = localStorage.getItem('kanki_deck');
    if (savedDeck) {
      deck = JSON.parse(savedDeck);
      migrateCardsToFSRS(deck); 
      log("Loaded saved deck with " + deck.cards.length + " cards");
      return true;
    }
  } catch (e) {
    log("Error loading deck: " + e.message);
  }
  
  deck = createDefaultDeck();
  log("Created new default deck");
  return false;
}

function migrateCardsToFSRS(deck) {
  for (var i = 0; i < deck.cards.length; i++) {
    var card = deck.cards[i];
    if (card.fsrs_S === undefined || card.fsrs_S === null) {
      
      card.fsrs_D = null;
      card.fsrs_S = null;
      card.fsrs_lastReview = null;
      
    }
  }
}

function updateStatusMessage(message) {
  var statusElement = document.getElementById("statusMessage");
  if (!statusElement) return;
  
  statusElement.textContent = message;
  
  statusElement.style.display = "block";

  setTimeout(function() {
    statusElement.style.display = "none";
  }, 3000);
}

function showConfirmation(message, onConfirm) {
  var overlay = document.getElementById("confirmationOverlay");
  var popup = overlay.querySelector(".popup");
  var messageElement = document.getElementById("confirmationMessage");
  var yesButton = document.getElementById("confirmYesBtn");
  var noButton = document.getElementById("confirmNoBtn");
  
  messageElement.textContent = message;
  
  var screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  var topPosition = Math.round(screenHeight / 2 - 100);  
  popup.style.top = topPosition + "px";
  
  yesButton.onclick = function() {
    overlay.style.display = "none";
    if (onConfirm) onConfirm();
  };
  
  noButton.onclick = function() {
    overlay.style.display = "none";
  };
  
  overlay.style.display = "block";
}

function calculateNextReview(card, wasCorrect) {
  var now = new Date().getTime();
  
  card.history.push({
    date: now,
    result: wasCorrect
  });
  
  if (wasCorrect) {
    
    card.difficulty += 1;
    
    var interval;
    switch (card.difficulty) {
      case 1:
        interval = 1 * 24 * 60 * 60 * 1000; 
        break;
      case 2:
        interval = 3 * 24 * 60 * 60 * 1000; 
        break;
      case 3:
        interval = 7 * 24 * 60 * 60 * 1000; 
        break;
      case 4:
        interval = 14 * 24 * 60 * 60 * 1000; 
        break;
      case 5:
        interval = 30 * 24 * 60 * 60 * 1000; 
        break;
      default:
        interval = 60 * 24 * 60 * 60 * 1000; 
        break;
    }
    
    card.nextReview = now + interval;
  } else {
    
    card.difficulty = 0;
    card.nextReview = now + (10 * 60 * 1000); 
  }
  
  saveDeck();
  
  return card;
}

function setNextReviewTime(card, difficulty) {
  var now = new Date().getTime();
  
  var gradeMap = {'again': 1, 'hard': 2, 'good': 3, 'easy': 4};
  var G = gradeMap[difficulty] || 3; 
  
  card.history.push({
    date: now,
    result: true,
    difficulty: difficulty,
    grade: G
  });
  
  var interval;
  
  if (card.fsrs_S === null || card.fsrs_D === null) {
    
    card.fsrs_S = fsrs_initStability(G);
    card.fsrs_D = fsrs_initDifficulty(G);
    card.fsrs_lastReview = now;
    interval = fsrs_nextInterval(FSRS_DESIRED_RETENTION, card.fsrs_S) * 24 * 60 * 60 * 1000;
  } else {
    var deltaT = (now - card.fsrs_lastReview) / (24 * 60 * 60 * 1000); 
    var R = fsrs_retrievability(deltaT, card.fsrs_S);
    
    var newD = fsrs_newDifficulty(card.fsrs_D, G);
    newD = Math.max(1, Math.min(10, newD)); 
    
    var newS;
    if (G >= 2) {
      
      newS = fsrs_newStabilityRecall(card.fsrs_D, card.fsrs_S, R, G);
    } else {
      
      newS = fsrs_newStabilityForget(card.fsrs_D, card.fsrs_S, R);
    }
    
    card.fsrs_D = newD;
    card.fsrs_S = newS;
    card.fsrs_lastReview = now;
    interval = fsrs_nextInterval(FSRS_DESIRED_RETENTION, newS) * 24 * 60 * 60 * 1000;
  }
  
  if (G === 1) {
    interval = Math.max(interval, 10 * 60 * 1000);
  }
  
  card.nextReview = now + interval;
  
  return card;
}


function getDueCards() {
  var now = new Date().getTime();
  var dueCards = [];
  
  for (var i = 0; i < deck.cards.length; i++) {
    var card = deck.cards[i];
    var isDue = reviewAllMode || (card.nextReview <= now);
    if (isDue) {
      
      var levelMatch = (currentLevel === "all" || card.level === currentLevel);
      var starMatch = (!showingStarredOnly || card.starred === true);
      
      if (levelMatch && starMatch) {
        dueCards.push(card);
      }
    }
  }
  
  return dueCards;
}


function getStarredCardsFromCurrentSession() {
  var starredCards = [];
  
  for (var i = 0; i < deck.cards.length; i++) {
    var card = deck.cards[i];
    if (card.starred === true && card.timesViewed > 0) {
      
      var levelMatch = (currentLevel === "all" || card.level === currentLevel);
      if (levelMatch) {
        starredCards.push(card);
      }
    }
  }
  
  return starredCards;
}

function reviewAllCards() {
  reviewAllMode = true;
  currentCardIndex = 0;
  displayCurrentCard(false);
}

function exitReviewAllMode() {
  reviewAllMode = false;
  currentCardIndex = 0;
  displayCurrentCard(false);
}

function displayCurrentCard(showAnswer) {
  var dueCards = getDueCards();
  
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
  
  if (dueCards.length === 0) {
    cardContainer.style.display = "block";
    var reviewAllButton = reviewAllMode ? "<button onclick='exitReviewAllMode()' style='margin-top: 10px;'>Back to Due Cards</button>" : "<button onclick='reviewAllCards()' style='margin-top: 10px;'>Review All Cards</button>";
    frontElement.innerHTML = "<div style='font-size: 0.7em; font-weight: normal; text-align: center; padding: 20px;'><p>No cards due for review!</p><p>Great job! </p>" + reviewAllButton + "</div>";
    levelBadge.style.display = "none";
    showAnswerBtn.style.display = "none";

    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "hidden";
    starButton.style.display = "none"; 
    document.getElementById("cardStats").style.display = "none"; 
  
    if (incorrectCardsQueue.length > 0) {
      showErrorReviewPrompt();
    } else if (getStarredCardsFromCurrentSession().length > 0 && !inStarredReviewMode) {
      showStarredReviewPrompt();
    }
    
    updateProgressDisplay();
    return;
  }
  cardContainer.style.display = "block";
  document.getElementById("cardStats").style.display = "block";

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
    
    saveDeck();
  }
  
  updateCardStats(card);
  updateScrollIndicators();
  
  if (showAnswer) {
    backElement.style.display = "block";
    notesElement.style.display = "block";
    showAnswerBtn.style.display = "none";
    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "visible";
    
    setTimeout(updateScrollIndicators, 100);
  } else {
    showAnswerBtn.style.display = "block";
    intervalButtons.style.display = "none"; 
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
  
  if (inStarredReviewMode) {
    progressElement.textContent = "★ " + (currentCardIndex + 1) + 
      "/" + starredCardsQueue.length + " starred cards";
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

function updateScrollIndicators() {
  var cardContainer = document.getElementById("cardContainer");
  if (!cardContainer) return;
  
  setTimeout(function() {
    
    var hasScrollableContent = cardContainer.scrollHeight > cardContainer.clientHeight;
    
    if (!hasScrollableContent) {
      
      cardContainer.classList.remove("scrollable-top");
      cardContainer.classList.remove("scrollable-bottom");
      return;
    }
    
    var isScrollableTop = cardContainer.scrollTop > 5; 
    var isScrollableBottom = cardContainer.scrollTop < (cardContainer.scrollHeight - cardContainer.clientHeight - 5);
    
    if (isScrollableTop) {
      cardContainer.classList.add("scrollable-top");
    } else {
      cardContainer.classList.remove("scrollable-top");
    }
    
    if (isScrollableBottom && hasScrollableContent) {
      cardContainer.classList.add("scrollable-bottom");
    } else {
      cardContainer.classList.remove("scrollable-bottom");
    }
    
    cardContainer.removeEventListener('scroll', scrollHandler);
    cardContainer.addEventListener('scroll', scrollHandler);
  }, 50);
}


function scrollHandler() {
  var cardContainer = document.getElementById("cardContainer");
  if (!cardContainer) return;
  
  var hasScrollableContent = cardContainer.scrollHeight > cardContainer.clientHeight;
  
  if (!hasScrollableContent) {
    cardContainer.classList.remove("scrollable-top");
    cardContainer.classList.remove("scrollable-bottom");
    return;
  }
  
  var isScrollableTop = cardContainer.scrollTop > 5; 
  var isScrollableBottom = cardContainer.scrollTop < (cardContainer.scrollHeight - cardContainer.clientHeight - 5);
  
  if (isScrollableTop) {
    cardContainer.classList.add("scrollable-top");
  } else {
    cardContainer.classList.remove("scrollable-top");
  }
  
  if (isScrollableBottom && hasScrollableContent) {
    cardContainer.classList.add("scrollable-bottom");
  } else {
    cardContainer.classList.remove("scrollable-bottom");
  }
}

function initializeCardKeyboardNavigation() {
  document.addEventListener('keydown', function(event) {
    var cardContainer = document.getElementById("cardContainer");
    if (!cardContainer) return;
       
    var activeElement = document.activeElement;
    var isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
    
    if (isInputFocused) return; 
    
    var scrollAmount = 50; 
    var handled = false;
    
    switch(event.key) {
      case 'ArrowUp':
        cardContainer.scrollBy(0, -scrollAmount);
        handled = true;
        break;
      case 'ArrowDown':
        cardContainer.scrollBy(0, scrollAmount);
        handled = true;
        break;
      case 'PageUp':
        cardContainer.scrollBy(0, -cardContainer.clientHeight * 0.8);
        handled = true;
        break;
      case 'PageDown':
        cardContainer.scrollBy(0, cardContainer.clientHeight * 0.8);
        handled = true;
        break;
      case 'Home':
        cardContainer.scrollTop = 0;
        handled = true;
        break;
      case 'End':
        cardContainer.scrollTop = cardContainer.scrollHeight;
        handled = true;
        break;
    }
    
    if (handled) {
      event.preventDefault();
      
      updateScrollIndicators();
    }
  });
}

function showAnswer() {
  
  lastShowAnswerTime = Date.now();
  
  if (inErrorReviewMode) {
    displayErrorCard(true);
  } else if (inStarredReviewMode) {
    displayStarredCard(true);
  } else {
    displayCurrentCard(true);
  }
}


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
    card.nextReview = now + (10 * 60 * 1000); 
    
    incorrectAnswers++;
    
    if (!inErrorReviewMode) {
      incorrectCardsQueue.push(card);
    }
  }
  
  currentCardIndex++;
  
  saveDeck();
  
  if (!inErrorReviewMode && currentCardIndex % dueCards.length === 0 && incorrectCardsQueue.length > 0) {
    showErrorReviewPrompt();
  } else {
    displayCurrentCard(false);
  }
}


function handleAnswerWithInterval(difficulty) {
  
  if (Date.now() - lastShowAnswerTime < 500) {
    return;
  }
  
  if (inErrorReviewMode) {
    answerErrorCardWithInterval(difficulty);
  } else if (inStarredReviewMode) {
    answerStarredCardWithInterval(difficulty);
  } else {
    var dueCards = getDueCards();
    if (dueCards.length === 0) return;
    
    var cardIndex = currentCardIndex % dueCards.length;
    var card = dueCards[cardIndex];
 
    if (difficulty === 'again') {
      
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
    
    if (currentCardIndex % dueCards.length === 0 && incorrectCardsQueue.length > 0) {
      showErrorReviewPrompt();
    } else {
      displayCurrentCard(false);
    }
  }
}


function answerErrorCardWithInterval(difficulty) {
  if (currentCardIndex >= incorrectCardsQueue.length) return;
  
  var card = incorrectCardsQueue[currentCardIndex];
  setNextReviewTime(card, difficulty);
  incorrectCardsQueue[currentCardIndex] = null;
  currentCardIndex++;
  
  saveDeck();
  
  if (currentCardIndex >= incorrectCardsQueue.length) {
    endErrorReview();
  } else {
    displayErrorCard(false);
  }
}


function answerStarredCardWithInterval(difficulty) {
  if (currentCardIndex >= starredCardsQueue.length) return;
  
  var card = starredCardsQueue[currentCardIndex];
  currentCardIndex++;
  
  saveDeck();
  
  if (currentCardIndex >= starredCardsQueue.length) {
    endStarredReview();
  } else {
    displayStarredCard(false);
  }
}

function changeLevel(level) {
  currentLevel = level;
  currentCardIndex = 0; 
  updateLevelDisplay();
  displayCurrentCard(false);
  
  
  saveDeck();
}

function onPageLoad() {
  log("Application initializing...");

  initializeConfig();
  
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
  
  var starredFilterBtn = document.getElementById("starredFilterBtn");
  var reverseToggleBtn = document.getElementById("reverseToggleBtn");
  
  if (starredFilterBtn && showingStarredOnly) {
    starredFilterBtn.classList.add("active");
  }
  
  if (reverseToggleBtn && isReversedMode) {
    reverseToggleBtn.classList.add("active");
  }

  updateProgressDisplay();
  
  
  setTimeout(function() {
    updateScrollIndicators();
  }, 200);
  
  
  initializeCardKeyboardNavigation();
  
  log("Application initialized");
}


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

  var screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  toast.style.top = (screenHeight > 1000) ? "120px" : "80px";
  
  toast.style.display = "block";
  
  setTimeout(function() {
    toast.style.display = "none";
  }, duration || 2000);
}


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
  starredCardsQueue = [];
  inStarredReviewMode = false;
  
  var statusElement = document.getElementById("statusMessage");
  statusElement.style.display = "none";
  
  displayCurrentCard(false);
  saveDeck();
  showToast("Progress has been reset", 2000);
  log("Progress reset");
}


function resetAll() {
  deck = createDefaultDeck();
  currentCardIndex = 0;
  correctAnswers = 0;
  incorrectAnswers = 0;
  incorrectCardsQueue = [];
  inErrorReviewMode = false;
  showingStarredOnly = false; 
  isReversedMode = false;
  starredCardsQueue = [];
  inStarredReviewMode = false;
  
  var statusElement = document.getElementById("statusMessage");
  statusElement.style.display = "none";
  
  displayCurrentCard(false);
  saveDeck();
  showToast("All data has been reset", 2000);
  log("Complete reset performed");
}


function showErrorReviewPrompt() {
  showConfirmation(
    "You have " + incorrectCardsQueue.length + " incorrect cards. Review them now?", 
    startErrorReview
  );
}


function showStarredReviewPrompt() {
  var starredCount = getStarredCardsFromCurrentSession().length;
  showConfirmation(
    "You have " + starredCount + " starred cards from this session. Review them now?", 
    startStarredReview
  );
}


function startErrorReview() {
  if (incorrectCardsQueue.length === 0) return;
  
  inErrorReviewMode = true;
  showToast("Reviewing incorrect cards", 2000);
  
  var statusElement = document.getElementById("statusMessage");
  statusElement.textContent = "Error Review Mode";
  statusElement.style.display = "block";
  
  currentCardIndex = 0;
  lastViewedCardId = null; 
  displayErrorCard(false);
}

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
  document.getElementById("cardStats").style.display = "block";
  
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
    intervalButtons.style.display = "none"; 
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

function answerStarredCard(wasCorrect) {
  if (currentCardIndex >= starredCardsQueue.length) return;
  
  var card = starredCardsQueue[currentCardIndex];
  currentCardIndex++;
  
  if (currentCardIndex >= starredCardsQueue.length) {
    endStarredReview();
  } else {
    displayStarredCard(false);
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
    
    if (getStarredCardsFromCurrentSession().length > 0 && !inStarredReviewMode) {
      showStarredReviewPrompt();
    } else {
      currentCardIndex = 0;
      displayCurrentCard(false);
    }
  }
  saveDeck();
}


function startStarredReview() {
  starredCardsQueue = getStarredCardsFromCurrentSession();
  if (starredCardsQueue.length === 0) return;
  
  
  var previouslyShowingStarredOnly = showingStarredOnly;
  
  inStarredReviewMode = true;
  showToast("Reviewing starred cards", 2000);
  
  var statusElement = document.getElementById("statusMessage");
  statusElement.textContent = "Starred Cards Review";
  statusElement.style.display = "block";
  
  currentCardIndex = 0;
  lastViewedCardId = null; 
  displayStarredCard(false);
}


function displayStarredCard(showAnswer) {
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
  
  if (currentCardIndex >= starredCardsQueue.length) {
    endStarredReview();
    return;
  }
  
  cardContainer.style.display = "block";
  document.getElementById("cardStats").style.display = "block";

  var card = starredCardsQueue[currentCardIndex];
  
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
  updateScrollIndicators();
  
  if (showAnswer) {
    backElement.style.display = "block";
    notesElement.style.display = "block";
    showAnswerBtn.style.display = "none";
    intervalButtons.style.display = "block";
    intervalButtons.style.visibility = "visible";
    setTimeout(updateScrollIndicators, 100);
  } else {
    showAnswerBtn.style.display = "block";
    intervalButtons.style.display = "none";
  }
  
  updateProgressDisplay();
}

function endStarredReview() {
  inStarredReviewMode = false;
  starredCardsQueue = [];
  
  var statusElement = document.getElementById("statusMessage");
  statusElement.style.display = "none";
  
  showToast("Starred cards review completed!", 2000);
  
  showingStarredOnly = false;
  var starredFilterBtn = document.getElementById("starredFilterBtn");
  if (starredFilterBtn) {
    starredFilterBtn.classList.remove("active");
  }
  
  currentCardIndex = 0;
  updateLevelDisplay(); 
  displayCurrentCard(false);
  saveDeck();
}

function handleAnswerCard(wasCorrect) {
  if (inErrorReviewMode) {
    answerErrorCard(wasCorrect);
  } else if (inStarredReviewMode) {
    answerStarredCard(wasCorrect);
  } else {
    if (!wasCorrect) {
      answerCard(wasCorrect);
    }
    saveDeck();
  }
}

function toggleStarCurrentCard() {
  var card = null;
  
  if (inStarredReviewMode) {
    if (currentCardIndex >= starredCardsQueue.length) return;
    card = starredCardsQueue[currentCardIndex];
  } else if (inErrorReviewMode) {
    if (currentCardIndex >= incorrectCardsQueue.length) return;
    card = incorrectCardsQueue[currentCardIndex];
  } else {
    var dueCards = getDueCards();
    if (dueCards.length === 0) return;
    var cardIndex = currentCardIndex % dueCards.length;
    card = dueCards[cardIndex];
  }
  
  if (!card) return;
  
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
  
  
  var masteryText = "";
  if (card.fsrs_S !== null && card.fsrs_S !== undefined) {
    var stability = Math.round(card.fsrs_S);
    var difficulty = Math.round(card.fsrs_D * 10) / 10;
    var masteryLevel = getMasteryLevel(card.fsrs_S);
    masteryText = " | " + masteryLevel + " S:" + stability + " D:" + difficulty;
  } else if (card.history && card.history.length > 0) {
    masteryText = " | Learning";
  } else {
    masteryText = " | New";
  }
  
  statsElement.innerHTML = "Viewed " + totalViews + " time" + (totalViews !== 1 ? "s" : "") + 
    " • Last: " + lastViewedText + masteryText;
}

function getMasteryLevel(stability) {
  if (stability < 7) return "Beginner";
  if (stability < 30) return "Learning";
  if (stability < 90) return "Good";
  if (stability < 365) return "Strong";
  return "Master";
}

function detectDeviceAndSetScaling() {
  var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  
  log("Device resolution detected: " + width + "x" + height);
  
  deviceScaleFactor = 1.0;
  
  if ((width >= 1070 && width <= 1080) && (height >= 1440 && height <= 1460)) {
    deviceScaleFactor = 0.6; 
    log("Kindle Paperwhite 3 detected. Applied special scaling: " + deviceScaleFactor);
  }
  
  else if (width >= 1000 && height >= 1400) {
    deviceScaleFactor = 0.65; 
    log("High-res device detected. Applied scaling: " + deviceScaleFactor);
  }
  
  else if ((width >= 750 && width < 1000) || (height >= 1000 && height < 1400)) {
    deviceScaleFactor = 0.8;
    log("Mid-size device detected. Applied scaling: " + deviceScaleFactor);
  }

  document.documentElement.style.fontSize = (deviceScaleFactor * 100) + "%";
  document.documentElement.style.setProperty('--device-scale', deviceScaleFactor);

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