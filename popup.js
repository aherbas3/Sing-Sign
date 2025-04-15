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

            .sing-sign-box > .video {
                width: 100%;
                max-width: 240px;
                aspect-ratio: 16 / 9;
                flex-shrink: 0;
                object-fit: cover;
                background-color: var(--dark-gray);
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
    innerHeader.classList.add("sing-sign-header");
    innerHeader.innerHTML = "Your signs will appear here!";
    innerDiv.appendChild(innerHeader);

    //add sider bar
    sideDiv.appendChild(innerDiv);
    asideElement.prepend(sideDiv);

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

    window._singSpotifyPlayHandler = async function () {
        if (this.ariaLabel === "Play") {
            // getSigns();
        }
    };

    window._singSpotifyResetHandler = function () {
        // resetSidebar();
        const playButton = document.querySelector("[data-testid='control-button-playpause']");
        if (playButton.ariaLabel === "Play") {
            // getSigns();
        }
    };

    const playButton = document.querySelector("[data-testid='control-button-playpause']");
    playButton.addEventListener("click", window._singSpotifyPlayHandler)

    const nextButton = document.querySelector("[data-testid='control-button-skip-forward']");
    nextButton.addEventListener("click", window._singSpotifyResetHandler)

    const prevButton = document.querySelector("[data-testid='control-button-skip-back']");
    prevButton.addEventListener("click", window._singSpotifyResetHandler)

}

function stop() {
    if (window._singResizeObserver) {
        window._singResizeObserver.disconnect();
        window._singResizeObserver = null;
    }

    const playButton = document.querySelector("[data-testid='control-button-playpause']");
    playButton.removeEventListener("click", window._singSpotifyPlayHandler);

    const nextButton = document.querySelector("[data-testid='control-button-skip-forward']");
    nextButton.removeEventListener("click", window._singSpotifyResetHandler)
    
    const prevButton = document.querySelector("[data-testid='control-button-skip-back']");
    prevButton.removeEventListener("click", window._singSpotifyResetHandler)

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
