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
  const dateObj = new Date(cookie.expirationDate * 1000);
  const date = dateObj.toLocaleString().split(',')[0]
  var url =
    "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
  return `
  <li class="Card">
  <div class="Card-topWrapper">
    <div class="Card-iconWrapper" data-id-delete>
      <svg
        class="Trashcan"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 25 24.8"
        style="enable-background:new 0 0 25 24.8;"
        xml:space="preserve"
        class="icon-Trashcan ct-delete"
        data-ember-action=""
        data-ember-action-1015="1015"
      >
        <g class="Trashcan-open">
          <path
            d="M18.7,24.4H5.9L4.9,7h14.9L18.7,24.4z M7.6,22.6H17l0.8-13.7h-11L7.6,22.6z"
          ></path>
          <polygon
            points="13.6,10.3 13.1,21.2 14.9,21.2 15.4,10.3 "
          ></polygon>
          <polygon
            points="11.5,21.2 11,10.3 9.2,10.3 9.7,21.2 "
          ></polygon>
          <path
            d="M19.1,0.7l-4.7,0.9l-0.8-1.4L8.2,1.3L8,3l-4.7,1l0.2,4.7l17.3-3.5L19.1,0.7z

          M8.8,1.9l4.4 -1.0 l0.5,0.8
          L8.7,2.8z

          M5.2,6.4l0-1L18,2.8l0.3,0.9L5.2,6.4z"
          ></path>
        </g>
        <g class="Trashcan-closed">
          <path
            d="M6.8,8.8h11L17,22.6
          H7.6L6.8,8.8z
          M4.9,7l1,17.4h12.8
          l1-17.4
          H4.9z"
          ></path>
          <polygon
            points="13.6,10.3 13.1,21.2 14.9,21.2 15.4,10.3 "
          ></polygon>
          <polygon
            points="11.5,21.2 11,10.3 9.2,10.3 9.7,21.2 "
          ></polygon>
          <path
            d="M20.4,4h-4.8l-0.5-1.6
          H9.5L9,4
          H4.2
          L3.5,8.6h17.6
          L20.4,4z

          M9.9,3.2h4.8
          L14.9,3.9h-5.2z

          M5.6,6.7l0.2-1 h13l0.2,1
          H5.6z"
          ></path>
        </g>
      </svg>
    </div>
    <div class="Card-titleBlock">
      <p class="Card-cookieName" data-id-name >${cookie.name}</p>
      <p class="Card-cookieValue" data-id-value >${cookie.value}</p>
    </div>
  </div>
  <div aria-role="divider" class="Card-divider" />
  <div class="Card-propertiesGrid">
    <div>
      <p>domain</p>
      <p class="Card-property" data-id-domain>${cookie.domain}</p>
    </div>
     <div >
      <p>expiration</p>
      <p class="Card-property" data-id-date>${date}</p>
    </div>
     <div>
      <p>url</p>
      <p class="Card-property" data-id-url>${url}</p>
    </div>
 </div>
</li>
  `;
};

const createCookieList = cookies => {
  const cookieList = document.querySelector(".CookieManager-cookieList");
  const cookieHTML = generateCookieHtml(cookies);
  cookieList.innerHTML = cookieHTML.join("");
  setCookieRemovalHandlers()
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
  chrome.cookies.remove({ url: cookie.url, name: cookie.name });
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
    const cookieName = currentCookie.querySelector("[data-id-name]").innerHTML;
    const cookieValue = currentCookie.querySelector("[data-id-value]").innerHTML;
    const cookieDomain = currentCookie.querySelector("[data-id-domain]").innerHTML;
    const cookieDate = currentCookie.querySelector("[data-id-date]").innerHTML;
    const cookieurl = currentCookie.querySelector("[data-id-url]").innerHTML;

    newObject[cookieName] = {
      value: cookieValue,
      domain: cookieDomain,
      expires: cookieDate,
      same_site: cookieurl
    }
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

function setCookieRemovalHandlers() {
  const cards = Array.from(document.querySelectorAll(".Card"));

  cards.forEach(card => {
    const icon = card.querySelector("[data-id-delete]");
    const cookieName = card.querySelector("[data-id-name]").innerHTML;
    const cookieURL = card.querySelector("[data-id-url]").innerHTML;

    icon.addEventListener("click", () => {
      removeCookie({ url: cookieURL, name: cookieName });
      returnCookies()
    })
  })
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


