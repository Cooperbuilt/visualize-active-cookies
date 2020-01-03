function displayCookies() {
  chrome.windows.create({
    url: chrome.runtime.getURL("cookie_window.html"),
    type: "popup",
    focused: true,
  });
}

function clearAllCookies() {
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', afterDOMLoaded);
} else {
  afterDOMLoaded();
}

function afterDOMLoaded() {
  var display_Cookies = document.getElementById("open_cookie_manager");
  var clear_Cookies = document.getElementById("clear_cookies");

  clear_Cookies.addEventListener('click', function () {
    clearAllCookies();
  });

  display_Cookies.addEventListener('click', function () {
    displayCookies();
  });
}
