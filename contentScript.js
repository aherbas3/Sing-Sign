let lastSongId = null;

async function fetchASLVideo(noun) {
    const config = await fetch(chrome.runtime.getURL('config.json'))
    .then(response => response.json())
    .catch(error => {
      console.error('Error loading API key:', error);
      throw error;
    });
  
  const API_KEY = config.apiKey;
  let searchQuery = `${noun}`;
  if (searchQuery.toLowerCase() === "time") return 'gPHgrgZdlX0';
  if (searchQuery === "kids" || searchQuery === "kid") searchQuery = "children";
  const CHANNEL_ID = 'UCACxqsL_FA-gMD2fwil7ZXA';
  const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&channelId=${CHANNEL_ID}&key=${API_KEY}`;

  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    return data.items?.[0]?.id?.videoId || null;
  } catch (error) {
    console.error(`Failed to fetch ASL video for: ${noun}`, error);
    return null;
  }
}

async function fetchCachedASLVideo(noun) {
  const cacheKey = `asl_${noun.toLowerCase()}`;

  return new Promise((resolve) => {
    chrome.storage.local.get([cacheKey], async (result) => {
      if (result[cacheKey]) {
        resolve(result[cacheKey]); // Use cached videoId
      } else {
        const videoId = await fetchASLVideo(noun);
        if (videoId) {
          chrome.storage.local.set({ [cacheKey]: videoId });
        }
        resolve(videoId);
      }
    });
  });
}

async function getASLVideoMap(nounSet) {
  const result = [];

  for (const noun of nounSet) {
    const videoId = await fetchCachedASLVideo(noun);
    result.push({ word: noun, videoId });

    await new Promise((res) => setTimeout(res, 250));
  }

  return result;
}

async function extractLyricsText() {
    const songTitle = document.querySelector('[data-testid="context-item-link"]')?.textContent;
    const artistName = document.querySelector('[data-testid="context-item-info-artist"]')?.textContent;
    const songId = songTitle && artistName ? `${songTitle}-${artistName}` : null;

    lastSongId = songId;

    const response = await fetch(`http://127.0.0.1:5000/lyrics?artist=${artistName}&song=${songTitle}`)
    const fetchedNouns = await response.json();

    return fetchedNouns;
}

const iframeMap = new Map();

const lazyLoadIframes = () => {
  const placeholders = document.querySelectorAll('.lazy-iframe');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      const div = entry.target;

      if (entry.isIntersecting) {
        // If iframe already created, resume
        if (iframeMap.has(div)) {
          const iframe = iframeMap.get(div);
          iframe.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo' }),
            '*'
          );
          return;
        }

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = div.dataset.src + "&enablejsapi=1"; // Important for JS API
        iframe.className = "video";
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'autoplay; encrypted-media');
        iframe.setAttribute('allowfullscreen', '');

        // Replace placeholder
        div.replaceWith(iframe);
        iframeMap.set(div, iframe);
        obs.unobserve(div); // optional: remove observer for replaced div
      } else {
        // Pause if iframe exists and is out of view
        const iframe = iframeMap.get(div);
        if (iframe) {
          iframe.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo' }),
            '*'
          );
        }
      }
    });
  }, {
    rootMargin: "100px 0px",
    threshold: 0.1
  });

  placeholders.forEach(div => observer.observe(div));
};

function createBoxes(data) {
    const innerDiv = document.querySelector(".sing-sign-sidebar-inside");
    const innerHeader = document.querySelector(".sing-sign-header");

    // Remove all old boxes
    const existingBoxes = innerDiv.querySelectorAll(".sing-sign-box");
    existingBoxes.forEach(box => box.remove());

    if (data) {
        if (innerHeader) innerHeader.remove();
        data.forEach(entry => {
            const signBox = document.createElement("div");
            signBox.classList.add("sing-sign-box");

            signBox.innerHTML = `
                <h2>${entry.title}</h2>
                <div 
                    class="video lazy-iframe" 
                    data-src="https://www.youtube.com/embed/${entry.videoId}?autoplay=1&mute=1&loop=1&playlist=${entry.videoId}"
                ></div>
                `;
    
            innerDiv.append(signBox);
        });
        iframeMap.clear();
        lazyLoadIframes();
    } else if (!innerHeader) {
        const innerDiv = document.querySelector(".sing-sign-sidebar-inside");
        const innerHeader = document.createElement("h1");
        innerHeader.classList.add("sing-sign-header");
        innerHeader.innerHTML = "Your signs will appear here!";
        innerDiv.innerHTML = "";
        innerDiv.appendChild(innerHeader);
    }

}

function mapNounToVideo(nouns) {
    const nounSet = [...new Set(nouns)];
    getASLVideoMap(nounSet).then((videoMap) => {
        console.log(videoMap);
        const data = nouns.map((noun) => {
            const match = videoMap.find((entry) => entry.word === noun);
            return {
                title: noun,
                videoId: match ? match.videoId : null
            };
        });

        const innerDiv = document.querySelector(".sing-sign-sidebar-inside");
        console.log(data);
        if (innerDiv) {
            createBoxes(data);
        }
    });
}

async function handleLyricsChange() {
    extractLyricsText().then(extractedNouns => {
        nouns = extractedNouns;
        if (nouns.length > 0) {
            const innerHeader = document.querySelector(".sing-sign-header");
            if (innerHeader) {
                innerHeader.textContent = "Loading...";
                mapNounToVideo(nouns);
            }
        } else {
            const innerHeader = document.querySelector(".sing-sign-header");
            innerHeader.textContent = "No Lyrics were found for this song :(";
        }
    });

    // nouns = getCleanNounsFromLyrics(lyrics);
}

function resetSidebar() {
    const innerDiv = document.querySelector(".sing-sign-sidebar-inside");
    if (innerDiv) {
        const innerHeader = document.createElement("h1");
        innerHeader.classList.add("sing-sign-header");
        innerHeader.innerHTML = "Your signs will appear here!";
        innerDiv.innerHTML = "";
        innerDiv.appendChild(innerHeader);
    }
}

setTimeout(
    async () => {
        const nowPlayingWidget = document.querySelector('[data-testid="now-playing-widget"]');
        if (nowPlayingWidget) {
            const observer = new MutationObserver(() => {
                chrome.storage.local.get(["running"]).then((result) => {
                    if (result.running) {
                        handleLyricsChange();
                        resetSidebar();
                    }
                });
            });

            observer.observe(nowPlayingWidget, {
                childList: true,
                subtree: true,
            });
        }
    }, 3000
)

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.running && namespace === "local") {
    if (changes.running.newValue) {
        handleLyricsChange();
        resetSidebar();
    }
  }
});