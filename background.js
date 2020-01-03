/**
 * @author Evan Cooper
 * @email <evcooper@wayfair.com>
 */

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
  <li>
    <p>Key Name: ${cookie.name}</p>
    <p>Key Value: ${cookie.value}</p>
  </li>
  `
}

const generateCookieHtml = (cookies) => {
  return cookies.map(createListItem)
}

const createCookieList = (cookies) => {
  const cookieList = document.querySelector('.CookieManager-cookieList');
  const cookieHTML = generateCookieHtml(cookies);
  cookieList.innerHTML = cookieHTML.join("");
}

function displayCookies() {
  chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  }, ([currentTab]) => {
    if (currentTab && currentTab.url && currentTab.url.includes('http') || currentTab.url.includes('https')) {
      chrome.cookies.getAll({ url: currentTab.url }, createCookieList);
    } else {
      chrome.windows.onFocusChanged.addListener(displayCookies)
      return;
    }
  });
}



if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', afterDOMLoaded);
} else {
  afterDOMLoaded();
}

function afterDOMLoaded() {
  displayCookies();
}
