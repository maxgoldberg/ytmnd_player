# YTMND Player

## Overview

This will be a working document to describe the status of the YTMND player/preloader. The latest iteration of the YTMND player was updated in 2011. It uses javascrpipt to test browser capabilities and then uses either Flash or HTML5 javascript to preload and then play assets. The HTML5 player/preloader was written with the original iPad as a launch target so it is barebones and currently has numerous problems.

## Goals

We'd like to completely replace Flash and modernize the YTMND player so it will last for years to come with minimal updates. Streamlining the player would also make for much easier archival of YTMNDs.

## Hurdles
### Browser Compatibility
The last active development spurt on YTMND was in 2011 on Firefox. HTML5 audio support and capabilities have increased significantly since then. It would be nice to add support for FLAC and Opus if possible.

#### Targets:
  1. Chrome
  2. Firefox
  3. Chrome for Mobile
  3. Safari
  4. Safari for Mobile
  5. Microsoft Edge?

#### Relevant Links:

1. [HTML5 Audio Support](https://caniuse.com/#feat=audio)

## Autoplay
Somewhat unsurprisingly, modern browsers don't like website to just start playing audio as soon as a page loads. Last week I hacked in a temporary workaround so when autoplay is blocked, a play button is shown. Ideally we want this to be more versatile and work better with all browsers.

#### Relevant Links:
1. https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
2. https://sites.google.com/a/chromium.org/dev/audio-video/autoplay
3. https://stackoverflow.com/questions/50490304/how-to-make-audio-autoplay-on-chrome
4. [Proof-of-concept to avoid autoplay block](https://getaway.pizza/ugh/)
5. [Malware site that avoids autoplay block](https://productdesigning-online.gq/Call-for-SecurityCH-Issues18554289769/)


## Gapless Playback
One major issue we're currently seeing is gapless audio on HTML5 is not working correctly. I see this as a must-have feature, and it was one of the reasons why we so heavily relied on Flash. I think we'll need to make quite a few tech demos to try and nail this down on all browsers/mobile.

#### Relevant Links:
1. [Good test site which should have perfect gapless WAV audio](http://banned.ytmnd.com)
2. https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
3. https://twitter.com/jaffathecake/status/807177367307358208
4. https://lists.w3.org/Archives/Public/public-whatwg-archive/2014Oct/0238.html
5. https://github.com/regosen/Gapless-5
6. https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/loop

## Synchronization
One of the original reasons for the Flash preloader was to achieve perfect sync between sound and visuals. Many sites used to synchronize at different speeds on different browsers, and many are probably broken on the HTML5 preloader. This area needs more exploration, as I haven't really done much research into _how_ broken this is. It is much less noticeable on high-speed connections, but testing needs to be done on both slow connections and mobile.

#### Relevant links
1. [Original Flash Preloader announcement YTMND](http://ytmndflash.ytmnd.com)
2. [Site which shows off more sync](http://lsdj.ytmnd.com/)

## ETC
* Recreating the preloader stars
* Enabling baked-in base64/gzipped assets for a single HTML file YTMND
* Potential MP4 support (in cases where it makes sense)
* Potential scrubber support
