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
  const cookieHTML = generateCookieHtml(cookies);
  cookieList.innerHTML = cookieHTML.join("");
}

function displayCookies() {
  chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  }, ([currentTab]) => {
    if (currentTab && currentTab.url && currentTab.url.includes('http') || currentTab.url.includes('https')) {
      console.log('retrieve')
      chrome.cookies.getAll({ url: currentTab.url }, createCookieList);

    } else {
      console.log('listener')
      chrome.cookies.onChanged.addListener(displayCookies)
      return;
    }
  });
}



if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', displayCookies);
} else {
  displayCookies();
  chrome.cookies.onChanged.addListener(displayCookies)
}
