(function (global) {
  "use strict";

  var BrowserControl = function BrowserControl(view, homeurl) {
    this.webview = view;
    this.homeurl = homeurl;
  };
  global.BrowserControl = BrowserControl;

  BrowserControl.prototype.back = function back() {
    var webview = global.document.querySelector(this.webview);
    if (webview.canGoBack()) webview.back();
    return this;
  };

  BrowserControl.prototype.forward = function forward() {
    var webview = global.document.querySelector(this.webview);
    if (webview.canGoForward()) webview.forward();
    return this;
  };

  BrowserControl.prototype.reload = function reload() {
    var webview = global.document.querySelector(this.webview);
    webview.reload();
    return this;
  };

  BrowserControl.prototype.home = function home() {
    var webview = global.document.querySelector(this.webview);
    webview.src = this.homeurl;
    return this;
  };

  var TitleBar = function TitleBar(position, titlebar_icon_url, titlebar_text, allowChangingPosition, browser) {
      if (typeof position !== "string") position = "top";
      if (typeof allowChangingPosition !== "boolean") allowChangingPosition = false;
      if (typeof browser !== "object" || !(browser instanceof BrowserControl)) browser = undefined;
      
      if (!global.document.getElementById("content")) throw "you need to have all things wrapped inside <div id=\"content\" />!";
      if (position !== "left" && position !== "right" && position !== "top" && position !== "bottom") throw "wrong position!";
      
      this._name = position + "-titlebar";
      this._position = position;
      this.__build_done = false;
      
      global.chrome.storage.sync.get("titlebar_position", (function(result) {
         if (typeof result === "object" && typeof result["titlebar_position"] === "string") {
            if (result.titlebar_position === "left" || result.titlebar_position === "right" || result.titlebar_position === "top" || result.titlebar_position === "bottom") {
                position = result.titlebar_position;
                this._name = position + "-titlebar";
                this._position = position;
            }
         }
         
         this.__build_done = true;
      }).bind(this));
      
      this._icon = titlebar_icon_url;
      this._text = titlebar_text;
      this.allowChangingPosition = allowChangingPosition;
      this._browser = browser;
  };
  global.TitleBar = TitleBar;

  TitleBar.prototype.closeWindow = function closeWindow(e) {
    if (e.shiftKey && this.allowChangingPosition) { //change titlebar position
      this.unbind();
      if (this._position === "left") {
        this._position = "top";
      } else if (this._position === "top") {
        this._position = "right";
      } else if (this._position === "right") {
        this._position = "bottom";
      } else {
        this._position = "left";
      }
      this._name = this._position + "-titlebar";
      this.bind();

      this.buttons.closeButton.title = "Change titlebar position";
      this.buttons.closeButton.className += " position";
      global.chrome.storage.sync.set({"titlebar_position": this._position});
    } else { //close
      global.chrome.app.window.current().close();
    }
    return this;
  };

  TitleBar.prototype.minimizeWindow = function minimizeWindow(e) {
    var window = global.chrome.app.window.current();
    
    if (window.isFullscreen()) {
      window.restore();
    } else if (e.shiftKey) {
      if (window.isMaximized()) {
        window.restore();
      } else {
        window.maximize();
      }
    } else {
        window.minimize();
    }

    return this;
  };

  TitleBar.prototype.creator = {};

  TitleBar.prototype.creator.updateImageUrl = function updateImageUrl(image_id, new_image_url) {
    var image = global.document.getElementById(image_id);
    if (image)
      image.src = new_image_url;
    return this;
  };

  TitleBar.prototype.creator.createImage = function createImage(image_id, image_url) {
    var image = global.document.createElement("img");
    image.setAttribute("id", image_id);
    image.src = image_url;
    return image;
  };

  TitleBar.prototype.creator.createButton = function createButton(button_name, buttonText, titleText, normal_image_url,
    hover_image_url, click_func) {
    var button = global.document.createElement("div");
    button.setAttribute("class", "titlebar-button " + button_name);
    if (normal_image_url) {
      var button_img = this.createImage(button_name + "-image", normal_image_url);
      button.appendChild(button_img);
      if (hover_image_url) {
        button.onmouseover = (function () {
          this.updateImageUrl(button_name + "-image", hover_image_url);
        }).bind(this);
        button.onmouseout = (function () {
          this.updateImageUrl(button_name + "-image", normal_image_url);
        }).bind(this);
      }
    }
    if (click_func) {
      button.onclick = click_func;
    }
    if (titleText) {
      button.title = titleText;
    }
    if (buttonText) {
      button.innerHTML = buttonText;
    }
    return button;
  };

  TitleBar.prototype.focus = function focusTitlebar(focus) {
    var bg_color = focus ? "#23232C" : "#555959";
    var titlebar = global.document.getElementById(this._name);
    if (titlebar)
      titlebar.style.backgroundColor = bg_color;
  };

  TitleBar.prototype.bind = function addTitlebar() {
    
    if (!this.__build_done) {
      setTimeout(this.bind.bind(this), 100);
      return;
    }
    
    this.buttons = {};
    var document = global.document;
    var titlebar = document.createElement("div");
    titlebar.setAttribute("id", this._name);
    titlebar.setAttribute("class", this._name);

    var icon = document.createElement("div");
    icon.setAttribute("class", this._name + "-icon");
    icon.appendChild(this.creator.createImage(this._name + "icon", this._icon));
    titlebar.appendChild(icon);

    var title = document.createElement("div");
    title.setAttribute("class", this._name + "-text");
    title.innerText = this._text;
    titlebar.appendChild(title);

    var closeTitle = "Close";
    var closeChangeTitle = "\n\n(Shift+click changes titlebar position)";
    var closeButton = this.creator.createButton(this._name + "-button titlebar-close-button",
      "", closeTitle + (this.allowChangingPosition ? closeChangeTitle : ""), null, null, this.closeWindow.bind(this));
    titlebar.appendChild(closeButton);
    this.buttons.closeButton = closeButton;

    var minimizeTitle = "Minimize";
    var minimizeChangeTitle = "\n\n(Shift+click maximizes window)";
    var minimizeButton = this.creator.createButton(this._name + "-button titlebar-minimize-button",
      "", minimizeTitle + minimizeChangeTitle, null, null, this.minimizeWindow.bind(this));
    titlebar.appendChild(minimizeButton);
    this.buttons.minimizeButton = minimizeButton;

    this.__MonitorShiftKey = (function MonitorShiftKey(e) {
      if (!e) e = window.event;

      if (e.type === "keydown" && e.keyCode === 16) {
        if (this.allowChangingPosition && this.buttons.closeButton.className.search("position") === -1) {
          this.buttons.closeButton.title = "Change titlebar position";
          this.buttons.closeButton.className += " position";
        }
        if (this.buttons.minimizeButton.className.search("maximize") === -1) {
          this.buttons.minimizeButton.title = "Maximize window";
          this.buttons.minimizeButton.className += " maximize";
        }
      } else if (e.type === "keyup" && e.keyCode === 16) {
        if (this.allowChangingPosition && this.buttons.closeButton.className.search("position") !== -1) {
          this.buttons.closeButton.title = closeTitle + closeChangeTitle;
          this.buttons.closeButton.className = this.buttons.closeButton.className.replace(" position", "");
        }
        if (this.buttons.minimizeButton.className.search("maximize") !== -1) {
          this.buttons.minimizeButton.title = minimizeTitle + minimizeChangeTitle;
          this.buttons.minimizeButton.className = this.buttons.minimizeButton.className.replace(" maximize", "");
        }
      }
    }).bind(this);

    document.addEventListener("keydown", this.__MonitorShiftKey);
    document.addEventListener("keyup", this.__MonitorShiftKey);

    if (this._browser) {
      var backButton = this.creator.createButton(this._name + "-button titlebar-back-button",
        "", "Back", null, null, this._browser.back.bind(this._browser));
      titlebar.appendChild(backButton);
      this.buttons.backButton = backButton;

      var forwardButton = this.creator.createButton(this._name + "-button titlebar-forward-button",
        "", "Forward", null, null, this._browser.forward.bind(this._browser));
      titlebar.appendChild(forwardButton);
      this.buttons.forwardButton = forwardButton;

      var reloadButton = this.creator.createButton(this._name + "-button titlebar-reload-button",
        "", "Reload", null, null, this._browser.reload.bind(this._browser));
      titlebar.appendChild(reloadButton);
      this.buttons.reloadButton = reloadButton;

      var homeButton = this.creator.createButton(this._name + "-button titlebar-home-button",
        "", "Home", null, null, this._browser.home.bind(this._browser));
      titlebar.appendChild(homeButton);
      this.buttons.homeButton = homeButton;
    }

    var divider = document.createElement("div");
    divider.setAttribute("class", this._name + "-divider");
    titlebar.appendChild(divider);

    document.body.appendChild(titlebar);

    this.onfocus = (function () {
      this.focus(true);
    }).bind(this);
    global.addEventListener("focus", this.onfocus);
    this.onblur = (function () {
      this.focus(false);
    }).bind(this);
    global.addEventListener("blur", this.onblur);
    this.onresize = this.updateContentStyle.bind(this);
    global.addEventListener("resize", this.onresize);

    this.updateContentStyle();
  };

  TitleBar.prototype.unbind = function removeTitlebar() {
    var document = global.document;
    var titlebar = document.getElementById(this._name);
    if (titlebar) {
      document.body.removeChild(titlebar);
      if (this.onfocus) global.removeEventListener("focus", this.onfocus);
      if (this.onblur) global.removeEventListener("blur", this.onblur);
      if (this.onresize) global.removeEventListener("resize", this.onresize);
      if (this.__MonitorShiftKey) {
        document.removeEventListener("keydown", this.__MonitorShiftKey);
        document.removeEventListener("keyup", this.__MonitorShiftKey);
      }
      this.resetContentStyle();
    }
  };

  TitleBar.prototype.resetContentStyle = function resetContentStyle() {
    var document = global.document;
    var content = document.getElementById("content");
    if (!content)
      return;
    content.setAttribute("style", "");
  };

  TitleBar.prototype.updateContentStyle = function updateContentStyle() {
    if (this.callUpdateContent) clearTimeout(this.callUpdateContent);
    this.callUpdateContent = setTimeout((function () {
      var document = global.document;
      var content = document.getElementById("content");
      if (!content)
        return;

      var titlebar = document.getElementById(this._name);
      if (titlebar) {
        var left = 0;
        var top = 0;
        var width = global.outerWidth;
        var height = global.outerHeight;

        switch (this._position) {
        case "top":
          height -= titlebar.offsetHeight;
          top += titlebar.offsetHeight;
          break;
        case "bottom":
          height -= titlebar.offsetHeight;
          break;
        case "left":
          width -= titlebar.offsetWidth;
          left += titlebar.offsetWidth;
          break;
        case "right":
          width -= titlebar.offsetWidth;
          break;
        default:
          return;
        }

        var contentStyle = "position: absolute; ";
        contentStyle += "left: " + left + "px; ";
        contentStyle += "top: " + top + "px; ";
        contentStyle += "width: " + width + "px; ";
        contentStyle += "height: " + height + "px; ";
        content.setAttribute("style", contentStyle);
      }
    }).bind(this), 100);
  };
})(window);
