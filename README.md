# SingSign Spotify Extension
1. Download the code or clone the repository and remember this file location
2. You will need to create an API key to run this extension.
    1. Navigate to your [Google Cloud Console](https://console.cloud.google.com/) and log in with your credentials.
    2. Navigate to APIs & Services --> Credentials --> Create Credentials --> API Key. Create you API key to use for this application
    3. To make sure it works with Youtube navigate to Enabled APIs & services --> Enable APIS and Services and then search for the YouTube Data API v3 and click enable. You can now use this key across platforms.
   
## Chrome Extension ##
To run the Chrome Extension, 
1) Create a config.json file in the chrome extension directory, in this file you will store your api key. You will store your api key in this file as:
   {
    "apiKey": "your_key_here"
1) Keep in mind that this API key has a quota of about 100 words, so you can only run about 3-5 songs before you hit that quota.
1) Navigate to chrome://extensions on your chrome browser. Ensure developer mode is turned on (top right of the page). Then click load unpacked and upload the directory to have the extension uploaded to your browser.
![image](https://github.com/user-attachments/assets/652a5021-e0ce-4bb4-a1dc-91726ccc90aa)


# Running

## For the first time

1. Navigate to chrome://extensions on your chrome browser. Ensure developer mode is turned on (top right of the page). Then click load unpacked and upload the directory to have the extension uploaded to your browser. (same as above)
2. In a terminal, navigate to the sing-sign directory then run the LyricFetcher.py file using ```python LyricFetcher.py``` or ```python3 LyricFetcher.py``` on MacOS
3. Now you can go to spotify, choose a song, and start the extension!

