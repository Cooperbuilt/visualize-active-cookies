/**
 * @author Evan Cooper
 * @email <evcooper@wayfair.com>
 */

const updateUrlHTML = (url) => {
  const currentUrlElement = document.querySelector(".CookieManager-currentUrl");
  currentUrlElement.innerHTML = url;
}

const updateCookieCountHTML = (count) => {
  const currentUrlElement = document.querySelector(".CookieManager-count");
  currentUrlElement.innerHTML = count;
}

/**
 * @param {string} url - full url of site to gather cookies on
 * @returns {array} - returns an array of cookies
 */
const returnAllCookies = (url, callback) => {
  return chrome.cookies.getAll({ url: currentTab.url }, callback);
}

/**
 *
 * @param {object} cookie
 * @property {string} object.name - name of the cookie
 * @property {string} object.value - value of the cookie
 */
const createListItem = (cookie) => {
  return `
  <li class="Card">
    <p class="Card-title">${cookie.name}</p>
    <p class="Card-text">${cookie.value}</p>
    <div aria-role="divider" class="Card-divider" />
  </li>
  `
}

const generateCookieHtml = (cookies) => {
  return cookies.map(createListItem)
}

const createCookieList = (cookies) => {
  const cookieList = document.querySelector('.CookieManager-cookieList');
  updateCookieCountHTML(cookies.length)
  const cookieHTML = generateCookieHtml(cookies);
  cookieList.innerHTML = cookieHTML.join("");
}

const containsWebUrl = (tabInfo) => {
  return (tabInfo && tabInfo.url && (tabInfo.url.includes('http') || tabInfo.url.includes('https')))
}

function displayCookies() {
  chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  }, ([currentTab]) => {
    if (containsWebUrl(currentTab)) {
      updateUrlHTML(currentTab.url);
      chrome.cookies.getAll({}, createCookieList);
    } else {
      chrome.cookies.onChanged.addListener(displayCookies)
      return;
    }
  });
}

// TODO clean this up to be more functional
function clearAllCookies() {
  const cookieList = document.querySelector('.CookieManager-cookieList');
  cookieList.innerHTML = "";
  chrome.cookies.getAll({}, function (cookies) {
    for (var i in cookies) {
      removeCookie(cookies[i]);
    }
  });
}

function removeCookie(cookie) {
  var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
    cookie.path;
  chrome.cookies.remove({ "url": url, "name": cookie.name });
}

function setButtonHandler() {
  const button = document.querySelector(".CookieManager-button");
  button.addEventListener('click', () => {
    clearAllCookies()
  });
}

function afterDOMload() {
  setButtonHandler()
  displayCookies()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', afterDOMload);
} else {
  displayCookies();
  chrome.cookies.onChanged.addListener(displayCookies)
}
