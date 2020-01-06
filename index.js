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
  var display_Cookies = document.getElementById("open_cookie_manager");

  display_Cookies.addEventListener('click', function () {
    openCookieManager();
  });
}
