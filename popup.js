const statusText = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");
const closeBtn = document.getElementById("closeBtn");

function updateUI(running) {
  statusText.textContent = running ? "Stop SingSign?" : "Start SingSign?";
  toggleBtn.textContent = "Yes";
}

function start() {
    function createStyles () {
        const fontLink = document.createElement("link");
        fontLink.href = "https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap";
        fontLink.rel = "stylesheet";
        document.head.appendChild(fontLink);

        const style = document.createElement("style");
        style.textContent = `
            .sing-sign-sidebar {
                --dark-gray: #2D2D2D;
                --main: #2D2863;
                background-color: var(--dark-gray);
                padding: 16px 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                font-family: "Nunito", sans-serif;
            }

            .sing-sign-sidebar-inside {
                width: 100%;
                height: 100%;
                gap: 20px;
                padding: 20px;
                border-radius: 10px;
                background-color: white;
                overflow-y: auto;
                overflow-x: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .sing-sign-sidebar-inside > h1 {
                color: black;
                font-size: 32px;
                text-align: center;
            }

            .sing-sign-box {
                width: 100%;
                max-width: 300px;
                aspect-ratio: 15 / 11;
                background-color: var(--main);
                flex-shrink: 0;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 8px;
                padding: 5px 20px;
            }

            .sing-sign-box > h2 {
                color: white;
                font-size: 32px;
            }

            .sing-sign-box > img {
                width: 100%;
                max-width: 240px;
                aspect-ratio: 16 / 9;
                flex-shrink: 0;
                object-fit: cover;
            }
        `;
        document.head.appendChild(style);
    }

    createStyles();

    // create side bar
    const asideElement = document.querySelector(".XOawmCGZcQx4cesyNfVO");
    const sideDiv = document.createElement("div");
    sideDiv.classList.add("sing-sign-sidebar");
    const innerDiv = document.createElement("div");
    innerDiv.classList.add("sing-sign-sidebar-inside");

    //add header
    const innerHeader = document.createElement("h1");
    innerHeader.innerHTML = "Your signs will appear here!";
    innerDiv.appendChild(innerHeader);

    //add sider bar
    sideDiv.appendChild(innerDiv);

    window._singResizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
        const width = entry.contentRect.width;
        if (width !== 0) {
            document.querySelector(".XOawmCGZcQx4cesyNfVO > aside").style.display =
        "none";
        }
        sideDiv.style.display = width === 0 ? "none" : "flex";
        }
    });

    window._singResizeObserver.observe(asideElement);

    asideElement.prepend(sideDiv);

    const data = [
        {title: "organism", img: chrome.runtime.getURL("assets/organism-img.png")},
        {title: "biology", img: chrome.runtime.getURL("assets/biology-img.png")},
        {title: "beauty", img: chrome.runtime.getURL("assets/beauty-img.png")},
        {title: "season", img: chrome.runtime.getURL("assets/season-img.png")},
    ]

    data.forEach(entry => {
        const signBox = document.createElement("div");

        const signText = document.createElement("h2");
        signText.textContent = entry.title;
        signBox.appendChild(signText);

        const signImage = document.createElement("img");
        signImage.setAttribute("src", entry.img);
        signBox.appendChild(signImage);

        signBox.classList.add("sing-sign-box");
        innerDiv.append(signBox);
    }) 

    document.querySelector(".XOawmCGZcQx4cesyNfVO > aside").style.display =
        "none";
}

function stop() {
    if (window._singResizeObserver) {
        window._singResizeObserver.disconnect();
        window._singResizeObserver = null;
    }

    const sideDiv = document.querySelector(".sing-sign-sidebar");
    if (sideDiv) {
        document.querySelector(".XOawmCGZcQx4cesyNfVO").removeChild(sideDiv);
    }

    document.querySelector(".XOawmCGZcQx4cesyNfVO > aside").style.display =
        "block";
}

chrome.storage.local.get(["running"]).then((result) => {
  updateUI(result.running);
});

closeBtn.addEventListener("click", () => {window.close()})

toggleBtn.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const { running } = await chrome.storage.local.get(["running"]);
  const isRunning = !running;

  chrome.storage.local.set({ running: isRunning });

  if (isRunning) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: start,
    });
  } else {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: stop,
    });
  }

  updateUI(isRunning);
});
