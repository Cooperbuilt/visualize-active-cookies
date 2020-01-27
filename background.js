/**
 * @author Evan Cooper
 * @email <evcooper@wayfair.com>
 */

/** **************** STORE SYSTEM ************************ */
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
    case "UPDATE_TAB":
      return {
        ...state,
        url: payload.url,
        id: payload.id
      };
    default:
      return state;
  }
};

const store = createStore(reducer);

store.dispatch({});


/** **************** CSS/HTML MANIPULATION ************************ */
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

const updateCookieCountHTML = count => {
  const currentUrlElement = document.querySelector(".CookieManager-count");
  currentUrlElement.innerHTML = count;
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
    <div class="Card-propertyWrapper">
      <span class="Card-propertyName">Origin Domain:</span><p class="Card-cookieDomain">${cookie.domain}</p>
    </div>
    <p class="Card-cookieName">${cookie.name}</p>
    <p class="Card-cookieValue">${cookie.value}</p>

    <div aria-role="divider" class="Card-divider" />
  </li>
  `;
};

const createCookieList = cookies => {
  const cookieList = document.querySelector(".CookieManager-cookieList");
  const cookieHTML = generateCookieHtml(cookies);
  cookieList.innerHTML = cookieHTML.join("");
};

/** **************** UTILITIES ************************ */
/**
 * @param {string} url - full url of site to gather cookies on
 * @returns {array} - returns an array of cookies
 */
const returnAllCookies = (url, callback) => {
  return chrome.cookies.getAll({ url: url }, callback);
};

const generateCookieHtml = cookies => {
  return cookies.sort((a, b) => {
    if (a.name < b.name) { return -1 }
    else {
      return 1
    }
  }).map(createListItem);
};

const containsWebUrl = tabInfo => {
  return (
    tabInfo &&
    tabInfo.url &&
    (tabInfo.url.includes("http") || tabInfo.url.includes("https"))
  );
};

/** **************** COOKIE REMOVAL FUNCTIONS ************************ */

function removeCookie(cookie) {
  var url =
    "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
  chrome.cookies.remove({ url: url, name: cookie.name });
}

function clearAllCookies() {
  const cookieList = document.querySelector(".CookieManager-cookieList");
  cookieList.innerHTML = "";
  chrome.cookies.getAll({}, function (cookies) {
    for (var i in cookies) {
      removeCookie(cookies[i]);
    }
  });
}

/** **************** COOKIE COPYING FUNCTIONS ************************ */

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
        function () {
          const checkMark = document.querySelector(
            ".CookieManager-Check"
          );
          fadeElement(checkMark)
          /* clipboard successfully set */
        },
        function () { }
      );
    }
  });
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
    updateActiveTab()
    returnCookies()
  });

  allCookiesBtn.addEventListener("click", () => {
    allCookiesBtn.classList.add("is-Active");
    firstPartyCookiesBtn.classList.remove("is-Active");
    store.dispatch({
      type: "ALL_COOKIES"
    });
    updateActiveTab()
    returnCookies()
  });

  clearCookiesButton.addEventListener("click", clearAllCookies);
  copyCookiesButton.addEventListener("click", copyCookies);
}

function returnCookies() {
  const { url, id, firstPartyOnly } = store.getState()
  // if first party, use active tab to get all cookies
  if (firstPartyOnly) {
    returnAllCookies(
      url,
      createCookieList
    );
  } else {
    // If not first party, iterate through all requests and use their urls
    // to get all cookies. Flatten, and create a cookie list from those
    chrome.tabs.executeScript(id, {
      code: 'performance.getEntriesByType("resource").map(e => e.name)',
    }, data => {
      if (chrome.runtime.lastError || !data || !data[0]) return;
      const urls = data[0].map(url => url.split(/[#?]/)[0]);
      const uniqueUrls = [...new Set(urls).values()].filter(Boolean);
      Promise.all(
        uniqueUrls.map(url =>
          new Promise(resolve => {
            chrome.cookies.getAll({ url }, resolve);
          })
        )
      ).then(results => {
        // convert the array of arrays into a deduplicated flat array of cookies
        const cookies = [
          ...new Map(
            [].concat(...results)
              .map(c => [JSON.stringify(c), c])
          ).values()
        ];
        createCookieList(cookies)
      });
    });
  }
}

function updateActiveTab() {
  // Update the active tab
  chrome.tabs.query(
    {
      active: true,
      lastFocusedWindow: true
    },
    ([currentTab]) => {
      if (containsWebUrl(currentTab)) {
        store.dispatch({ type: "UPDATE_TAB", payload: { url: currentTab.url, id: currentTab.id } });
        returnCookies()
      } else {
        chrome.cookies.onChanged.addListener(updateActiveTab);
        return;
      }
    });
}



function afterDOMload() {
  setButtonHandlers();
  updateActiveTab();
}

/** **************** PROGRAM START ************************ */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", afterDOMload);
} else {
  updateActiveTab();
  chrome.cookies.onChanged.addListener(updateActiveTab);
}
