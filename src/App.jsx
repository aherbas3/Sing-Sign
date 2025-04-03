import React from "react";
import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    chrome.storage.local
      .get(["running"])
      .then((result) => {
        console.log("found and set: " + result.running);
        setRunning(result.running);
      })
      .catch(() => {
        console.log("not found but set: false");
        setRunning(false);
      });
  }, []);

  const start = () => {
    chrome.storage.local.set({ running: true }).then(async () => {
      setRunning(true);
      let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const newBtn = document.createElement("button");
          newBtn.className = "Button-sc-1dqy6lx-0 sing-sign-button";
          newBtn.innerHTML = "Click";
          document.querySelector(".mwpJrmCgLlVkJVtWjlI1").appendChild(newBtn);

          const bottomDiv = document.createElement("div");
          bottomDiv.className = "sing-sign-group";
          bottomDiv.style.backgroundColor = "red";
          bottomDiv.style.height = "200px";
          document
            .querySelector(".jEMA2gVoLgPQqAFrPhFw")
            .appendChild(bottomDiv);

          const sideDiv = document.createElement("div");
          sideDiv.className = "sing-sign-sidebar";
          sideDiv.style.backgroundColor = "pink";
          sideDiv.style.height = "100%";
          sideDiv.style.width = "100%";
          document.querySelector(".XOawmCGZcQx4cesyNfVO").appendChild(sideDiv);
        },
      });
    });
  };

  const stop = async () => {
    chrome.storage.local.set({ running: false }).then(async () => {
      setRunning(false);
      let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const newBtn = document.querySelector(".sing-sign-button");
          const bottomDiv = document.querySelector(".sing-sign-group");
          const sideDiv = document.querySelector(".sing-sign-sidebar");

          document.querySelector(".mwpJrmCgLlVkJVtWjlI1").removeChild(newBtn);
          document
            .querySelector(".jEMA2gVoLgPQqAFrPhFw")
            .removeChild(bottomDiv);
          document.querySelector(".XOawmCGZcQx4cesyNfVO").removeChild(sideDiv);
        },
      });
    });
  };

  return (
    <>
      <h1>{running ? "Stop" : "Start"} SingSign?</h1>
      <div className="btn-wrapper">
        <button
          onClick={() => {
            running ? stop() : start();
          }}
        >
          Yes
        </button>
        <button onClick={() => window.close()}>No</button>
      </div>
    </>
  );
}

export default App;
