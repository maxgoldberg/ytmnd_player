/* -*- C++ -*- */

/**
 * YTMND Site->Flash Interface
 *
 * $Id: flash.js 2404 2012-05-05 21:24:17Z max $
 */


(function(){

  if (typeof ytmnd.loaders == 'undefined') {
    ytmnd.loaders = {};
  }

  if (typeof ytmnd.players == 'undefined') {
    ytmnd.players = {};
  }


  ytmnd.flash_junk = null;

  /**
   * Set up the flash handle before the page is loaded.
   */

  var flash_options = {"swf"               : ytmnd.cdn_url + "flash/ytmnd_loader.swf",
                       "expressInstaller"  : ytmnd.cdn_url + "flash/express_installer.swf",
                       "height"            : 260,
                       "width"             : 300,
                       "hasVersion"        : 10,
                       "wmode"             : "transparent",
                       "play"              : true,
                       "menu"              : false,
                       "quality"           : "autohigh",
                       "loop"              : false,
                       "bgcolor"           : "#000000",
                       "allowScriptAccess" : "always",
                       "allowFullScreen"   : true,
                       "allowNetworking"   : "all" };

  console.max('Preloading the SWF!');

  ytmnd.flash_junk = $.flash.create(flash_options);


  ytmnd.loaders.flash = {

    loader_verison    : 0.4,
    flash_handle      : null,
    is_flash_loaded   : false,
    is_js_loaded      : false,
    js_ytmnd_loaded   : false,
    ready_for_assets  : false,
    are_assets_loaded : false,
    waiting_on_ad     : true,


    is_supported: function()
    {
      return $.flash.hasVersion(10);
    },


    loader_init: function()
    {
      this.is_js_loaded = true;

      /**
       * Set up the flash handle.
       */

      this.flash_handle = ytmnd.flash_junk;
      ytmnd.site.player.flash_handle = this.flash_handle;


      console.max("Binding Flash to #loader");

      $('#loader').html(this.flash_handle);

      console.max("Bound Flash to #loader");

      /**
       * Now, before we do anything else, send off the assets so we can start loading them right away.
       */

      if (ytmnd.site.data.site.background.type == 'image') {
        this.js_send_assets(ytmnd.site.data.site.background.url,
                             ytmnd.site.data.site.foreground.url,
                             ytmnd.site.data.site.sound.url);
      }
      else {

        /**
         * Since we're sending it to flash, we have to use a real variable and not a constant.
         */

        var nuttin_honey = '';

        this.js_send_assets(nuttin_honey, ytmnd.site.data.site.foreground.url, ytmnd.site.data.site.sound.url);
      }
    },


    /**
     * Called by Flash to acknowledge we have a connection.
     */

    flash_loaded : function()
    {
      console.max('FLASH: IM LOADED BRO!');

      this.is_flash_loaded = true;
    },

    /**
     * A quick easy way for Flash to ensure it's hitting the right interface.
     */

    flash_js_check : function()
    {
      return 1;
    },

    /**
     * Called by Flash to let us know it's ready to start loading up assets.
     */

    flash_ready_for_assets : function()
    {
      console.max('FLASH: IM READY FOR ASSETS BRO');

      this.ready_for_assets = true;
    },


    /**
     * Send the URLs of the site assets to the Flash loader.
     *
     * Will loop every .1 second until flash is ready to take the asset handoff.
     */

    js_send_assets : function (background, foreground, sound)
    {
      if (this.ready_for_assets == false) {
        setTimeout(function(){ ytmnd.site.loader.js_send_assets(background, foreground, sound); }, 100);

        return false;
      }

      /**
       * Call the Flash function hand_off_assets(bg_url, fg_url, sound_url),
       * this will begin the loading process.
       */

      try {
        console.max('Sending our assets to Flash');

        this.flash_handle.hand_off_assets(background, foreground, sound);
      }
      catch (error) {
        console.log(error);
      }
    },


    /**
     * Empty function which flash will call any time load status changes.
     */

    flash_update_load_status : function (total_bytes, total_bytes_loaded, status_string)
    {

    },

    /**
     * Fired off by Flash once the assets are fully loaded and ready.
     */

    flash_assets_loaded : function()
    {
      this.are_assets_loaded = true;
    },


    /**
     * Flash lets us know when it's done displaying an ad, it will say "Waiting for your dumb computer."
     */

    flash_ad_wait_over : function(a, atl)
    {
      this.waiting_on_ad = false;
    },


    /**
     * Called by JS to let Flash know we're showing an ad client side. Not currently used
     */

    showing_aids: function(ms)
    {
      if (this.ready_for_assets == false) {
        setTimeout(function(){ ytmnd.site.loader.showing_aids(ms); }, 100);
        return false;
      }

      try {
        console.max('Telling flash abour our aids');
        this.flash_handle.showing_aids(ms);
      }
      catch (error) {
        console.log(error);
      }
    },

    /**
     * trace() calls from flash.
     */

    trace: function(message)
    {
      console.max('FROM FLASH:  ', message);
    }

  };


  ytmnd.players.flash = {

    flash_handle      : null,
    sound_playing     : false,
    flash_hidden      : false,

    /**
     * Called when we want to hide Flash
     */

    js_hide_player : function()
    {
      this.flash_hidden = this.flash_handle.hide_flash();
    },

    /**
     * Starts the sound from the current cue point
     */

    start_sound : function()
    {
      if (this.sound_playing == true) {
        return false;
      }

      this.flash_handle.start_sound();
      this.sound_playing = true;
    },

    /**
     * Stops the sound and sets the cue point to the first frame.
     */

    stop_sound : function()
    {
      if (this.sound_playing == false) {
        return false;
      }

      this.flash_handle.stop_sound();
      this.sound_playing = false;
    }
  };



})();

