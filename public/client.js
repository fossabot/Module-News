/* Init */

var articles, index, step, lastIsRiding;

COBI.init('token');
COBI.devkit.overrideThumbControllerMapping.write(true);
COBI.app.clockVisible.write(false);

/* Init Experience & Overview */

if (COBI.parameters.state() == COBI.state.experience ||
    COBI.parameters.state() == COBI.state.overview) {
  
  createSwiper();
  initSourcePreferences();
  populateCategoryPicker();
  restoreCategoryPicker();
  clearContents();
  reloadContents();
  populateSourcePicker();
  
  $(document).ready(function() {
    $('select').material_select();
  });  
}

/* Swiper Contents */

function buildArticles(jsonString) {
  var json = JSON.parse(jsonString);
  for (var i = 0; i < json.articles.length; i++) {
      var article = json.articles[i];
      var index = articles.length;
      article.sourceName = sourceNameById(json.source);
      articles.push(article)
      if(article.title.length > 85) {
      article.title = article.title.substring(0,84)+"...";
  }
      createSwiperItem(index, article.title, article.description, article.urlToImage);
  }
  swiper.init();
  selectArticle(0);
}

function reloadContents() {
  var category = categoryPicker.options[categoryPicker.selectedIndex].value;
  
  localStorage.setItem('category',category);
  console.log("Reload Contents: " + i18next.language + " with category " + category);
  
  var localSources = getCategoriesByLanguage(i18next.language)[categoryPicker.selectedIndex].sources;
  
  for (var i = 0; i < localSources.length; i++) {
    if (getSourceEnabled(localSources[i].key)) {
      fetchNews(localSources[i].key, buildArticles);  
    }
  }
}

function clearContents() {
  var contentContainer = document.getElementById('item-container');
  while (contentContainer.firstChild) {
    contentContainer.removeChild(contentContainer.firstChild);
  }
  articles = [];
  step = 0; 
  index = -1;
}

/* Article & Category Browsing */

function nextArticle() {
  if (this.index < articles.length-1) {
    selectArticle(this.index + 1);
  } else if (getJumpCategorySetting()) {
    selectNextCategory();
  } else {
    selectArticle(0);
  }
}

function prevArticle() {
  if (this.index > 0) {
    selectArticle(this.index - 1);
  }
}

function selectArticle(index) {
  if (this.index != index) {
    console.log("Select Article: " + index + " / Riding: " + lastIsRiding);

    this.index = index;
    this.step = 0;

    swiper.slideTo(index);
    showHideSwiperItemContents(index, lastIsRiding);

    nextStep();
  }
}

function nextStep() {
  var article = articles[index];
  
  // Loop through steps
  if (this.step >= 3) this.step = 0;
  
  // Next step
  this.step++;
  
  // Should Read Description?
  if (this.step == 2 && !getArticleDescriptionSetting()) {
    // Nope -> Go to Reading List
    this.step = 3;    
  }

  // Read Title
  if (this.step == 1) {
      console.log("Read Title: " + article.title);
      COBI.app.textToSpeech.write({"content" : article.title, "language" : i18next.language});
  }
  // Read Description
  else if (this.step == 2) {
      console.log("Read Description: " + article.description);
      COBI.app.textToSpeech.write({"content" : article.description, "language" : i18next.language});
  }
  // Add to Read Later
  else if (this.step == 3) {
      console.log("Read Later: " + article.url);
      COBI.app.readLater.write({"title" : article.title, "url" : article.url})
      COBI.app.textToSpeech.write({"content" : i18next.t('read-later-tts'), "language" : i18next.language});
      Materialize.toast(i18next.t('read-later'), 5000, 'rounded white');
  }
}
