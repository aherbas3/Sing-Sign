let lastSongId = null;

async function fetchASLVideo(noun) {
    const config = await fetch(chrome.runtime.getURL('config.json'))
    .then(response => response.json())
    .catch(error => {
      console.error('Error loading API key:', error);
      throw error;
    });
  
  const API_KEY = config.apiKey;
  const searchQuery = `${noun} ASL sign`;
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

    // Optional: throttle to reduce burst usage (250ms delay)
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

function createBoxes(data) {
    const innerDiv = document.querySelector(".sing-sign-sidebar-inside");
    const innerHeader = document.querySelector(".sing-sign-header");

    // Remove all old boxes
    const existingBoxes = innerDiv.querySelectorAll(".sing-sign-box");
    existingBoxes.forEach(box => box.remove());

    if (data) {
        if (innerHeader) innerHeader.remove();
        data.slice(0, 5).forEach(entry => {
            const signBox = document.createElement("div");
            signBox.classList.add("sing-sign-box");

            signBox.innerHTML = `
            <h2>${entry.title}</h2>
            <iframe class="video" src="https://www.youtube.com/embed/${entry.videoId}?autoplay=1&mute=1&loop=1&playlist=${entry.videoId}" title="YouTube video player" frameborder="0"allowfullscreen></iframe>
            `
    
            innerDiv.append(signBox);
        });
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
        mapNounToVideo(nouns);
    });

    // nouns = getCleanNounsFromLyrics(lyrics);
}

setTimeout(
    async () => {
        const nowPlayingWidget = document.querySelector('[data-testid="now-playing-widget"]');
        if (nowPlayingWidget) {
            handleLyricsChange();
            const observer = new MutationObserver(() => {
                handleLyricsChange();
                console.log("change")
            });

            observer.observe(nowPlayingWidget, {
                childList: true,
                subtree: true,
            });
        }
    }, 3000
)