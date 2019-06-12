/* -*- C++ -*- */

/**
 * YTMND Site->HTML5 Audio Interface
 *
 * TODO: set up priority based on supported types e.g. OGG->WAV->MP3?
 *
 * $Id: html5.js 2404 2012-05-05 21:24:17Z max $
 */


(function(){

  if (typeof ytmnd.loaders == 'undefined') {
    ytmnd.loaders = {};
  }

  if (typeof ytmnd.players == 'undefined') {
    ytmnd.players = {};
  }

  ytmnd.loaders.html5 = {

  audio_handle: null,
  autoplay_tester: null,
  waiting_on_ad: false,
  fg_image_handle: null,
  bg_image_handle: null,
  fg_image_ready: false,
  bg_image_ready: false,
  are_assets_loaded: false,
  audio_ready: false,
  autoplay_audio_ready: false,

    /**
     * Some audio mime-types I've seen used in different browsers:
     *
     * Array('audio/ogg; codecs="vorbis"', 'audio/mpg', 'audio/wave', 'audio/wav', 'audio/x-wav', 'audio/wav; codecs="1"')
     *audio/wav; codecs="1" result: "probably"
     */

    codecs: {'mp3': 'audio/mpeg',
             'ogg': 'audio/ogg; codecs="vorbis"',
             'wav': 'audio/wav; codecs="1"'},

    /**
     * Figure out our audio playing capabilities.
     */

    is_supported: function()
    {

      try {
        var audio_tag = document.createElement('audio');
        var audio_obj = new Audio();
      }
      catch (error) {
        console.log('received error in html5 is_supported:');
        console.log(error);

        var audio_tag = {};
        var audio_obj = {};
      }

      /**
       * Set up the array of supported methods and codecs.
       */

      var supported = {'tag': !!(audio_tag.canPlayType),
                       'obj': !!(audio_obj.canPlayType) };

      for (var codec in ytmnd.loaders.html5.codecs) {
        supported[codec] = false;
      }


      if (supported.obj == false) {
        return supported;
      }

      /**
       * Go through all our codecs and see which work.
       *
       * canPlayType currently returns "", "maybe", or "probably", we'll take anything that isn't "".
       */

      for (var codec in ytmnd.loaders.html5.codecs) {

        supported[codec] = (audio_obj.canPlayType(ytmnd.loaders.html5.codecs[codec]) != "");

        console.max('Testing audio codec for ' + codec + '[' + ytmnd.loaders.html5.codecs[codec] + ']: ',
                    audio_obj.canPlayType(ytmnd.loaders.html5.codecs[codec]));

      }

      return supported;
    },

    loader_init: function()
    {

      console.max('inside html5 loader_init');


      /**
       * Set up Audio preloader.
       */

      var is_iOS = (navigator.userAgent.match('iPhone') || navigator.userAgent.match('iPad'));

      this.audio_handle = new Audio();
      this.autoplay_tester = new Audio();

      if (typeof this.audio_handle.loop == 'boolean' && !is_iOS) {
        this.audio_handle.loop = true;
      }
      else {
        console.max('AUDIO LOOPING NOT SUPPORTED?!');
      }

      this.audio_handle.preload = 'auto';
      this.autoplay_tester.preload = 'auto';

      ytmnd.players.html5.audio_handle = this.audio_handle;

      var sound_load = function(event){
        console.max('AUDIO FIRED OFF canPlayThrough event!');
        ytmnd.site.loader.audio_ready = true;
      };

      var autoplay_sound_load = function(event){
        console.max('AUTOPLAY AUDIO FIRED OFF canPlayThrough event!');
        ytmnd.site.loader.autoplay_audio_ready = true;
      };


      /**
       * Set up Foreground Image Preloader
       */


      this.fg_image_handle = new Image();

      var foreground_image_load = function(){
        console.max('HTML5 fg_image_load() fired.');
        ytmnd.site.loader.fg_image_ready = true;
      };


      /**
       * Set up a Background Image Preloader if needed.
       */


      this.bg_image_handle = new Image();


      if (ytmnd.site.data.site.background.type == 'image') {

        var background_image_load = function(){
          console.max('HTML5 bg_image_load() fired.');
          ytmnd.site.loader.bg_image_ready = true;
        };
      }
      else {
        this.bg_image_ready = true;
      }


      this.wait_for_assets();



      console.max('Adding canPlayThrough event bind');

      $(this.audio_handle).bind('canplaythrough', sound_load);

      $(this.autoplay_tester).bind('canplaythrough', autoplay_sound_load);

      console.max('Bound foreground load');

      $(this.fg_image_handle).load(foreground_image_load);

      console.max('Bound background load');

      $(this.fg_image_handle).load(background_image_load);

      console.max('Adding a silence.mp3 to the autoplay audio object.');

      this.autoplay_tester.src = 'http://content.ytmnd.com/assets/sound/silence.mp3';

      console.max('HTML5 Audio src set - ' + ytmnd.site.data.site.sound.url);

      this.audio_handle.src = ytmnd.site.data.site.sound.url;

      console.max('HTML5 FG Image src set.');
      this.fg_image_handle.src = ytmnd.site.data.site.foreground.url;


      if (ytmnd.site.data.site.background.type == 'image') {
        console.max('HTML5 BG Image src set.');
        this.bg_image_handle.src = ytmnd.site.data.site.background.url;
      }


      this.audio_handle.load();
      this.autoplay_tester.load();

      /**
       * iOS doesn't allow sound to load until someone clicks a link, assholes.
       */

      if (is_iOS) {
        var play_link = function(event)
        {
          event.preventDefault();
          ytmnd.site.loader.audio_handle.load();
          $('#loader').html('<h1><a href="#">Loading..</a></h1>')
        };

        $('#loader').html('<h1><a href="#">Play</a></h1>').click(play_link);
      }

      /**
       * Some browsers don't loop when passed the 'loop' property, so this is a hack to fix that.
       */

      if (typeof this.audio_handle.loop != 'boolean' || is_iOS) {

        console.max('Adding loop hack');

        this.audio_handle.loop = false;
        var restart_audio = function(event)
        {
          console.max(ytmnd.site.loader.audio_handle.currentTime);
          ytmnd.site.loader.audio_handle.currentTime = 0;
          ytmnd.site.loader.audio_handle.play();
        }

        $(this.audio_handle).bind('ended', restart_audio);
      }
   },


    wait_for_assets: function()
    {
      if (this.are_assets_loaded != true) {
        if (this.fg_image_ready == true && this.bg_image_ready == true && this.audio_ready == true && this.autoplay_audio_ready == true) {
          console.max('HTML5: All assets ready!');
          this.are_assets_loaded = true;
        }
        else {
          setTimeout(function(){ ytmnd.site.loader.wait_for_assets(); }, 50);
          return false;
        }
      }
      else {
        return true;
      }
    },


    showing_aids: function(ignored)
    {
    }

  };


  ytmnd.players.html5 = {
    sound_playing: false,
    audio_handle: null,


    js_hide_player: function()
    {
    },

    /**
     * Starts the sound from the current cue point
     */

    start_sound : function()
    {
      if (this.sound_playing == true) {
        return false;
      }

      var promise = this.audio_handle.play();

      if (promise !== undefined) {
        promise.then(_ => {
            // Autoplay started!
          }).catch(error => {
        var play_link = function(event)
        {
          event.preventDefault();
          ytmnd.site.loader.audio_handle.load();
          $('#loader').html('<h1><a href="#">Loading..</a></h1>')
        };

              $('#loader').html('<h1><a href="#">Play</a></h1>').click(play_link);
              // Autoplay was prevented.
              // Show a "Play" button so that user can start playback.
            });
      }



      this.sound_playing = true;
      return true;
    },

    /**
     * Stops the sound and sets the cue point to the first frame.
     */

    stop_sound : function()
    {
      if (this.sound_playing == false) {
        return false;
      }

      this.audio_handle.pause();
      this.audio_handle.currentTime = 0;

      this.sound_playing = false;
      return true;
    }
  };



})();

