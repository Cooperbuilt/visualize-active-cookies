/**
 * @author Evan Cooper
 * @email <evcooper@wayfair.com>
 */

// Store System for funsies
const createStore = (reducer, initialState) => {
  const store = {};
  store.state = initialState;
  store.listeners = [];

  store.getState = () => store.state;

  store.subscribe = listener => {
    store.listeners.push(listener);
  };

  store.dispatch = action => {
    store.state = reducer(store.state, action);
    store.listeners.forEach(listener => listener());
  };

  return store;
};

const getInitialState = () => {
  return {
    firstPartyOnly: true
  };
};

const reducer = (state = getInitialState(), { type, payload }) => {
  switch (type) {
    case "FIRST_PARTY":
      return {
        ...state,
        firstPartyOnly: true
      };
    case "ALL_COOKIES":
      return {
        ...state,
        firstPartyOnly: false
      };
    case "UPDATE_TAB_URL":
      return {
        ...state,
        activeTabURL: payload
      };
    default:
      return state;
  }
};

const store = createStore(reducer);

const updateCookieCountHTML = count => {
  const currentUrlElement = document.querySelector(".CookieManager-count");
  currentUrlElement.innerHTML = count;
};

/**
 * @param {string} url - full url of site to gather cookies on
 * @returns {array} - returns an array of cookies
 */
const returnAllCookies = (url, callback) => {
  return chrome.cookies.getAll({ url: url }, callback);
};

/**
 *
 * @param {object} cookie
 * @property {string} object.name - name of the cookie
 * @property {string} object.value - value of the cookie
 */
const createListItem = cookie => {
  return `
  <li class="Card">
    <p class="Card-title">${cookie.name}</p>
    <p class="Card-text">${cookie.value}</p>
    <div aria-role="divider" class="Card-divider" />
  </li>
  `;
};

const generateCookieHtml = cookies => {
  return cookies.map(createListItem);
};

const createCookieList = cookies => {
  const cookieList = document.querySelector(".CookieManager-cookieList");
  const cookieHTML = generateCookieHtml(cookies);
  cookieList.innerHTML = cookieHTML.join("");
};

const containsWebUrl = tabInfo => {
  return (
    tabInfo &&
    tabInfo.url &&
    (tabInfo.url.includes("http") || tabInfo.url.includes("https"))
  );
};

store.subscribe(() => {
  displayCookies();
});

function displayCookies() {
  const { firstPartyOnly } = store.getState();
  chrome.tabs.query(
    {
      active: true,
      lastFocusedWindow: true
    },
    ([currentTab]) => {
      if (containsWebUrl(currentTab)) {
        returnAllCookies(
          firstPartyOnly ? currentTab.url : null,
          createCookieList
        );
        store.dispatch({ type: "UPDATE_TAB_URL", payload: currentTab.url });
      } else {
        chrome.cookies.onChanged.addListener(displayCookies);
        return;
      }
    }
  );
}

// TODO clean this up to be more functional
function clearAllCookies() {
  const cookieList = document.querySelector(".CookieManager-cookieList");
  cookieList.innerHTML = "";
  chrome.cookies.getAll({}, function(cookies) {
    for (var i in cookies) {
      removeCookie(cookies[i]);
    }
  });
}

function fadeOut(el) {
  el.style.opacity = 0;
}

function fadeIn(el) {
  el.style.opacity = 1;
}
function fadeElement(element) {
  fadeIn(element);
  setInterval(() => {
    fadeOut(element)
  }, 3000);
}

function copyCookies() {
  const cookies = Array.from(document.querySelectorAll(".Card"));
  const cookieObject = cookies.reduce((newObject, currentCookie) => {
    const cookieName = currentCookie.querySelector(".Card-title").innerHTML;
    const cookieValue = currentCookie.querySelector(".Card-text").innerHTML;
    newObject[cookieName] = cookieValue;
    return newObject;
  }, {});
  navigator.permissions.query({ name: "clipboard-write" }).then(result => {
    if (result.state == "granted" || result.state == "prompt") {
      navigator.clipboard.writeText(JSON.stringify(cookieObject)).then(
        function() {
          const checkMark = document.querySelector(
            ".CookieManager-Check"
          );
          fadeElement(checkMark)
          /* clipboard successfully set */
        },
        function() {}
      );
    }
  });
}

function removeCookie(cookie) {
  var url =
    "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
  chrome.cookies.remove({ url: url, name: cookie.name });
}

function setButtonHandlers() {
  const firstPartyCookiesBtn = document.getElementById("1stParty");
  const allCookiesBtn = document.getElementById("AllCookies");
  const clearCookiesButton = document.getElementById("ClearCookies");
  const copyCookiesButton = document.getElementById("CopyCookies");

  firstPartyCookiesBtn.addEventListener("click", () => {
    firstPartyCookiesBtn.classList.add("is-Active");
    allCookiesBtn.classList.remove("is-Active");
    store.dispatch({
      type: "FIRST_PARTY"
    });
    const { activeTabURL } = store.getState();
    returnAllCookies(activeTabURL, createCookieList);
  });
  allCookiesBtn.addEventListener("click", () => {
    allCookiesBtn.classList.add("is-Active");
    firstPartyCookiesBtn.classList.remove("is-Active");
    store.dispatch({
      type: "ALL_COOKIES"
    });
    returnAllCookies(null, createCookieList);
  });

  clearCookiesButton.addEventListener("click", clearAllCookies);
  copyCookiesButton.addEventListener("click", copyCookies);
}

function afterDOMload() {
  setButtonHandlers();
  displayCookies();
}
store.dispatch({});
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", afterDOMload);
} else {
  displayCookies();
  chrome.cookies.onChanged.addListener(displayCookies);
}
