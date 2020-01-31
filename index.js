function openCookieManager() {
  chrome.windows.create({
    url: chrome.runtime.getURL("cookie_window.html"),
    type: "popup",
    focused: true,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', afterDOMLoaded);
} else {
  afterDOMLoaded();
}

function afterDOMLoaded() {
  var display_Cookies = document.getElementById("open_live_cookies");

  display_Cookies.addEventListener('click', function () {
    openCookieManager();
  });
}
