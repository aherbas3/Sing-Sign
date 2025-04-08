const statusText = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");
const closeBtn = document.getElementById("closeBtn");

function updateUI(running) {
  statusText.textContent = running ? "Stop SingSign?" : "Start SingSign?";
  toggleBtn.textContent = "Yes";
}

function start() {
    const style = document.createElement("style");
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap');
        .sing-sign-sidebar {
            --dark-gray: #2D2D2D;
            background-color: var(--dark-gray);
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
        }

        .sing-sign-sidebar-inside {
            display: flex;
            width: 100%;
            height: 100%;
            flex-direction: column;
            gap: 20px;
            padding: 20px;
            border-radius: 10px;
            align-items: center;
            background-color: white;
        }

        .sing-sign-sidebar-inside > h1 {
            color: black;
            font-family: "Nunito", sans-serif;
            font-size: 32px;
            text-align: center;
        }

        .sing-sign-box {
            width: 200px;
            height: 200px;
            background-color: gray;
        }
    `;
    document.head.appendChild(style);

    // create side bar
    const asideElement = document.querySelector(".XOawmCGZcQx4cesyNfVO");
    const sideDiv = document.createElement("div");
    sideDiv.classList.add("sing-sign-sidebar");
    const innerDiv = document.createElement("div");
    innerDiv.classList.add("sing-sign-sidebar-inside");
    

    //add header
    const innerHeader = document.createElement("h1");
    innerHeader.textContent = "Your signs will appear here!";
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

    // for (let i = 0; i < 3; i++) {
    //     const signBox = document.createElement("div");
    //     const signText = document.createElement("h1");
    //     signBox.classList.add("sing-sign-box");
    //     sideDiv.append(signBox);
    // }

    document.querySelector(".XOawmCGZcQx4cesyNfVO > aside").style.display =
        "none";
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
      func: () => {
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
      },
    });
  }

  updateUI(isRunning);
});
