/* -*- C++ -*- */

/**
 * Sup boners? It's the YTMND loader.
 *
 * We are the music makers... and we are the dreamer of dreams.
 *
 * $Id: ytmnd_loader.js 2263 2011-07-15 06:59:40Z max $
 */

/**
 * This should be overwritten by another js file that's loaded up. If it isn't we can safely assume the
 * user is blocking ads and as such, shame them into whitelisting YTMND.
 */

var aww_cmon = 1;


/**
 * Now on to the guts.
 */

(function(){

  if (typeof ytmnd == 'undefined') {
    ytmnd = {};
  }

  if (typeof ytmnd.loaders == 'undefined') {
    ytmnd.loaders = {};
  }

  if (typeof ytmnd.players == 'undefined') {
    ytmnd.players = {};
  }


  ytmnd.site_template = function()
  {

    /**
     * UI functionality for controls and non-site elements (e.g. info bar, restart button, etc)
     */

    this.ui     = {};

    /**
     * Handles loading of site data, assets, etc may be modular.
     */

    this.loader = {};

    /**
     * Handles playing sound.
     */

    this.player = {};

    /**
     * A copy of the site info JSON package
     */

    this.data   = {};

    /**
     * Handles site-specific layout stuff (e.g. image placement, zooming text, etc)
     */

    this.layout = {};


    /**
     * Player/loader preference. Some day, we'll change this when HTML5 is better supported
     * and the codec wars end.
     */

    this.player_preference = 'flash';

    /**
     * Global foreground and background image handles so we can restart animated GIFs,
     * and keep track of load status.
     */


    this.foreground = { handle: $('<div id="foreground_image">'),
                           img: $('<img id="foreground_img" alt="">'),
                        loader: new Image(),
                        loaded: false };


    this.background = { handle: $('body'),
                           img: $('<img id="background_img" alt="">'),
                        loader: new Image(),
                        loaded: false };

    /**
     * Set the cache validation to 'never', this ensures that
     * the image will be loaded from the cache if possible, and
     * the browser should not check for an updated version.
     *
     * Since all our assets have immutable URLs, they'll never change.
     * We also want to make sure when we're moving the image around
     * we won't have accidentally load the image twice.
     */

    /*
    this.foreground.loader.validate = 'never';
    this.background.loader.validate = 'never';
    */


    /**
     * Keep track to differentiate between a full start and a restart.
     */

    this.is_playing = false;



    /**
     * UI
     */

    /**
     * Keep track of the rotations of the secret restart button.
     */

    this.ui.restart_button_rotation = 0;


    /**
     * Populate the info box with all of the site information.
     */

    this.ui.populate_info_box =  function(data)
    {
      /**
       * Set the logo on the left side of the info bar based on the score of the site.
       */

      var closest_star = Math.round(data.score.computed_score);

      $('#info_box_closer').removeClass('logo5').addClass('logo' + closest_star);


      /**
       * Add the title.
       */

      $('#site_title').html(ytmnd.site_link(data.site_id, data.domain,
                                            data.title, false, (data.work_safe == 'n'), true));

      /**
       * Add user and site links.
       */

      $('#author').html(ytmnd.user_link(data.user.user_id, data.user.user_name));
      $('#site_profile_link').attr('href', 'http://' + ytmnd.domain + '/sites/' + data.site_id + '/profile');
      $('#comments_link').attr('href',     'http://' + ytmnd.domain + '/sites/' + data.site_id + '/profile#comments');


      /**
       * Add a starbar and initialize it.
       */

      $('#score').html(starbar.add(data.site_id,data.score.computed_score, false, ['wsc', 'fav'], false));

      starbar.pageLoad();


      /**
       * Handle all the credits for asset, and the description.
       */

      $('#fg_image_origin').html(data.fg_image_origin);

      if (data.background.type == 'image') {
        $('#bg_image_origin').html(data.bg_image_origin);
      }
      else {
        $('#bg_image_origin_wrapper').hide();
      }

      $('#sound_origin').html(data.sound_origin);
      $('#description').html(data.description).addClass('selected');

      /**
       * Ghetto accordion to show large content blocks.
       */

      $("#site_info_right label").click(function() {
          $("#site_info_right > div > div").removeClass('selected');
          $(this).parent().children('div').addClass('selected');
        });

      /**
       * Handle all the keywords.
       */

      var keyword_html = '';

      for (var i = 0; i <= data.keywords.length - 1; ++i) {
        keyword_html += '<div class="keyword">';
        keyword_html += '  <a class="keyword" href="http://' + ytmnd.domain + '/keywords/' + data.keywords[i] + '">' + data.keywords[i] + '</a>';
        keyword_html += '</div>';
      }

      $('#keyword_list').html(keyword_html);

      /**
       * Parse Richtext
       */

      $('.rt_parse').richtext_parse();

      /**
       * Set up the click event handlers to open and close the infobar.
       */

      $('#corner').click(function(event){

          var window_width = $(window).width();

          if (window_width >= 610 && window_width < 1180) {
            var max_width = (window_width - 150) + 'px';

            $('#site_info').css({'width': max_width, 'max-width': max_width, 'min-width': max_width});
            $('#site_info_right').hide();
          }
          else {
            $('#site_info').css({'width': '1180px', 'max-width': '1180px', 'min-width': '1180px'});
            $('#site_info_right').show();
          }


          $('#infobar').css('visibility', 'visible').show();
          $('#corner').hide();
          event.preventDefault();
        });

      $('#info_box_closer').click(function(event){
          $('#infobar').hide();
          $('#corner').show();
          event.preventDefault();
        });


      /**
       * Make the corner image visible.
       */

      $('#corner').css('visibility', 'visible');
      $('#corner').click(function(event){
          $('#facebook_junk').facebook_like(fb_options);
        });
    };


    /**
     * Hide the loader/player/flash. Use visibility so the sound will keep playing.
     */

    this.ui.hide_loader = function()
    {
      $('#player_div, #loader').css('visibility', 'hidden').css('left', '-2000px');
    }


    /**
     * Layout
     */

    /**
     * Image placement abbreviation map.
     */

    this.layout.placements = { 't': 'top',
                               'm': 'center',
                               'b': 'bottom',
                               'l': 'left',
                               'c': 'center',
                               'r': 'right' };


    /**
     * Create the CSS properties for an image given the placement and URL.
     */

    this.layout.image_css = function(placement, url)
    {
      var css = {'background-image': 'url("' + url + '")',
                 'background-position': '',
                 //'background-attachment' : 'fixed',
                 'background-repeat': 'no-repeat' };

      if (placement == 'tile') {
        css['background-repeat'] = 'repeat';
      }
      else {
        css['background-position']  = this.placements[placement.substr(0, 1)] + ' ';
        css['background-position'] += this.placements[placement.substr(1, 1)];
      }

      return css;
    }

    /**
     * Holds compiled zoom_text html that can be generated before display-time.
     */

    this.layout.compiled_zooming_text = $('<div id="zoom_text">');

    /**
     * Archaic function to make the zooming text on YTMNDs.
     *
     * Due to the way it changes based on length, we continue to use this dumb
     * function to ensure zooming text always looks the same.
     */

    this.layout.make_zooming_text = function (zoom_text)
    {
      var max_len = Math.max(zoom_text.line_1.length,
                             zoom_text.line_2.length,
                             zoom_text.line_3.length);

      if (max_len > 0) {

        var j, i, z, cur_line, cur_spacing;
        var font_size = 50;

        if      (max_len >= 20) { font_size = 21; }
        else if (max_len >= 15) { font_size = 25; }
        else if (max_len >= 13) { font_size = 30; }
        else if (max_len >= 12) { font_size = 35; }
        else if (max_len >= 10) { font_size = 40; }
        else if (max_len >= 10) { font_size = 45; }
        else { font_size = 50; }

        var spacing = (font_size*2) + 25;

        var zin = 100;

        for (var j = 2; j >= 0; --j) {
          cur_spacing = (spacing * j) * 2;


          for(var i = 1; i <= font_size; ++i) {
            zin++;
            var z = (i == font_size) ? '00' : ((i<4)?'0':'')+(i*4).toString(16);

            cur_line = $('<div>'+ zoom_text['line_' + (j+1)] + '</div>').css({'z-index': zin,
                'left': (i*2) + 'px',
                'top':  (i+cur_spacing) + 'px',
                'color': '#'+z+z+z,
                'font-size': (i*2) + 'pt'});
            this.compiled_zooming_text.append(cur_line);
          }
        }
      }
    }

    this.layout.compile_zooming_text = function(zoom_text)
    {
      if (zoom_text.style == 'default') {
        var max_len = Math.max(zoom_text.line_1.length,
                               zoom_text.line_2.length,
                               zoom_text.line_3.length);

        if (max_len > 0) {
          this.make_zooming_text(zoom_text);
        }
      }
      else if (zoom_text.style == 'image') {

        /**
         * Only make the zooming text image as tall as it has to be.
         */

        var height = 750;

        if (zoom_text.line_3.trim() == '') {
          height = 480;
        }

        if (zoom_text.line_2.trim() == '') {
          height = 220;
        }

        var zoom_text_image_css = {"background-image" : "url('" + zoom_text.url + "')",
                                   "background-repeat": "no-repeat",
                                   "height"           : height + "px" };


        this.compiled_zooming_text.css(zoom_text_image_css);
      }

      console.max('Compiled zooming text.');
    }



    /**
     * Main
     */

    /**
     * This function is called as soon as we have the data package with all the site
     * layout information, assets and meta-data.
     */

    this.parse_site_data = function(site_data)
    {
      console.max('Site data loaded.');

      this.data = site_data;

      /**
       * Now figure out our capabilities.
       */

      var flash_audio = false;
      var html5_audio = false;


      var html5_support_matrix = ytmnd.loaders.html5.is_supported();

      /**
       * Even if we can support html5 audio, we need to make sure one of the sound files
       * we have is playable.
       */

      if (typeof html5_support_matrix[this.data.site.sound.type] != 'undefined' &&
          html5_support_matrix[this.data.site.sound.type] == true) {

        html5_audio = this.data.site.sound;
      }
      else if (typeof this.data.site.sound.alternatives != 'undefined') {
        for (var codec in this.data.site.sound.alternatives) {
          if (typeof html5_support_matrix[codec] != 'undefined' &&
              html5_support_matrix[codec] == true) {

            html5_audio = this.data.site.sound.alternatives[codec];
            break;
          }
        }
      }

      /**
       * Should return true if Flash version 10 or greater is installed.
       */

      flash_audio = ytmnd.loaders.flash.is_supported();


      /**
       * Now choose which to use.
       */

      if (flash_audio == false && html5_audio == false) {
        //MARK - show real error.
        alert("We can't play audio on your dumb browser, either due to lack of flash or lack of the HTML5/codec support.");
        return false;
      }

      if ((this.player_preference == 'flash' || html5_audio == false) && flash_audio == true) {
        this.player = ytmnd.players.flash;
        this.loader = ytmnd.loaders.flash;
      }
      else if ((this.player_preference == 'html5' || flash_audio == false) && html5_audio != false) {
        this.player = ytmnd.players.html5;
        this.loader = ytmnd.loaders.html5;
      }

      console.max('calling loader_init();');

      this.loader.loader_init();

      /**
       * Show an ad or let the interface know we aren't handling ads.
       */

      console.max('calling show_aids();');

      this.show_aids();

      /**
       * Set up the info box.
       */

      this.ui.populate_info_box(this.data.site);

      /**
       * Start waiting for assets to load.
       */

      console.max('Starting asset wait...');

      this.wait_for_assets();
    }

    this.show_aids = function()
    {
      this.loader.showing_aids(0);

      if (this.data.ad.force_wait > 0) {
        $('#a_plague_upon_your_house').show();
        $('#fm_sky_box').attr('src', ytmnd.url + 'aids/box');

        /**
         * Whine to adblock users.
         */

        console.max('WHINING: ', (aww_cmon == 1));

        if (aww_cmon == 1) {
          var uppity_speech = "";

          uppity_speech += "Hello Surfer!<br /><br />";
          uppity_speech += "Please consider adding YTMND.com to your adblocker's whitelist. <br /><br />";
          uppity_speech += "Sites like YTMND depend on advertising revenue from viewers like you to stay alive. ";
          uppity_speech += "Help keep our site freely available.";

          $('.box_aids').addClass('whine').html(uppity_speech);
        }
      }
    }

    /**
     * Sit around and wait for all the assets to load up.
     */

    this.wait_for_assets = function()
    {
      /**
       * If the loader reports that the assets aren't loaded or the user is viewing an ad, try again in fifty milliseconds.
       */

      if (ytmnd.site.loader.are_assets_loaded != true || ytmnd.site.loader.waiting_on_ad != false) {

        /*
        console.log('FG_LOADED: ' + ytmnd.site.loader.fg_image_ready);
        console.log('BG_LOADED: ' + ytmnd.site.loader.bg_image_ready);
        console.log('AU_LOADED: ' + ytmnd.site.loader.audio_ready);
        */

        setTimeout(function(){ ytmnd.site.wait_for_assets(); }, 50);
        return false;
      }


      console.max('wait_for_assets() ended in main');

      this.init_ytmnd();
    }


    /**
     * It's go time, set up the layout and prepare to display the YTMND.
     *
     * First step is to bind to the image onload handlers so we know they're fully loaded.
     */

    this.init_ytmnd = function(callback)
    {

      /**
       * Opera won't fire off a load event until the image is on the actual page, dicks.
       */

      if ($.browser.opera) {
        $('body').append(this.foreground.img);
      }

      var foreground_image_load = function(){

        console.max('foreground_image_load() fired.');

        if ($.browser.opera) {
          ytmnd.site.foreground.img.hide();
        }

        var fg_image_css = ytmnd.site.layout.image_css(ytmnd.site.data.site.foreground.placement,
                                                       ytmnd.site.data.site.foreground.url);


        ytmnd.site.foreground.handle.css(fg_image_css);

        ytmnd.site.foreground.loaded = true;
      };

      console.max('Bound foreground load');

      this.foreground.img.load(foreground_image_load);


      /**
       * If the YTMND has a background image, add an onload() for it as well.
       */

      if (this.data.site.background.type == 'image') {

        var background_image_load = function(){

          console.max('background_image_load() fired.');

          var bg_image_css = ytmnd.site.layout.image_css(ytmnd.site.data.site.background.placement,
                                                         ytmnd.site.data.site.background.url);

          ytmnd.site.background.handle.css(bg_image_css);

          ytmnd.site.background.loaded = true;
        };

        console.max('Bound background load');

        this.background.img.load(background_image_load);
      }
      else {
        this.background.loaded = true;
      }

      /**
       * Now we'll be ready when the img load events fire off.
       */

      /**
       * Precompile zoom_text.
       */

      this.layout.compile_zooming_text(this.data.site.zoom_text);

      /**
       * Start the loop which waits for everything to be ready.
       */


      this.wait_for_internal_assets();

      /**
       * Add the final src attributes to the images, which have the load functions above.
       */

      console.max('Setting src attributes, just waiting for onload.');

      if (this.data.site.background.type == 'image') {
        this.background.img.attr('src', this.data.site.background.url);
      }

      this.foreground.img.attr('src', this.data.site.foreground.url);
    }


    window.maxcounter = 0;

    this.wait_for_internal_assets = function()
    {
      if (ytmnd.site.foreground.loaded == true && ytmnd.site.background.loaded == true) {

        console.max('Internal assets loaded, calling ui.show_ytmnd()');

        /**
         * Add a check here to see if we can autoplay sound. If not, we need to show a play button beforehand.
         */
        console.max(ytmnd.site.loader.autoplay_tester);

        if (typeof ytmnd.site.loader.autoplay_tester != 'undefined') {
          var promise = ytmnd.site.loader.autoplay_tester.play();

          if (promise !== undefined) {
            promise.then(_ => {
                // Autoplay started!
                console.max('AutoPlay worked, playing YTMND.');

                ytmnd.site.ui.show_ytmnd();
                ytmnd.site.player.start_sound();
              }).catch(error => {
                  // Autoplay was prevented.

                  console.max('AutoPlay prevented. Showing play link...');
                  var play_link = function(event)
                  {
                    console.max('AutoPlay-override play link clicked!');
                    event.preventDefault();
                    ytmnd.site.ui.show_ytmnd();
                    ytmnd.site.player.start_sound();
                    $('#loader').html('<h1><a href="#">Loading..</a></h1>')
                };

                $('#loader').html('<h1><a href="#">Play</a></h1>').click(play_link);

              });
          }
        } else {
          ytmnd.site.ui.show_ytmnd();
          ytmnd.site.player.start_sound();
        }

      }
      else {
        if (window.maxcounter == 0) {
          console.max('WAITING FOR INTERNAL ASSETS', ytmnd.site.foreground, ytmnd.site.background );
          window.maxcounter = 1;
        }

        setTimeout(function(){ ytmnd.site.wait_for_internal_assets(); }, 50);
      }
    }


    this.ui.show_ytmnd = function(data)
    {
      /**
       * Add the foreground image.
       */

      $('body').append(ytmnd.site.foreground.handle);

      /**
       * Remove the loader if need be.
       */

      if ($('#foreground_img').length > 0) {
        $('#foreground_img').remove();
      }

      if (ytmnd.site.is_playing == false) {

        /**
         * Set the background color
         */

        $('body').css('background-color', '#' + ytmnd.site.data.site.background.color);


        /**
         * Add the zooming text to the page.
         */

        $('body').append(ytmnd.site.layout.compiled_zooming_text);


        /**
         * Make the restart button visible on hover.
         */

        $('#restart_button').css('visibility', 'visible');


        /**
         * Hide the loader
         */

        console.max('HIDING LOADER');

        this.hide_loader();


        /**
         * Allow people to close the aids.
         */

        $('#closer').click(function(event){ $('#a_plague_upon_your_house').remove(); }).show();

        /**
         * Set up the restart button.
         */

        $('#restart_button').click(ytmnd.site.restart);
      }


      /**
       * If the page is larger than the image, make the image wrapper the size of the page,
       * so when you scroll it will tile properly.
       */

      if ($(document).height() > ytmnd.site.foreground.handle.height()) {
        console.max('SETTING HEIGHT TO:', $(document).height());

        ytmnd.site.foreground.handle.css('min-height', $(document).height() + 'px');
        ytmnd.site.foreground.handle.css('height', '100%');
      }

      ytmnd.site.is_playing = true;
    }



    this.hide_loader = function()
    {
      this.ui.hide_loader();

      /**
       * Tell the player we're hiding it.
       */

      try {
        this.player.js_hide_player();
      }
      catch (player_error) {
        alert(player_error);
      }
    }



    /**
     * Restart function which stops the sound and animated gifs and then restarts them again,
     * effectively synchronizing the site.
     */

    this.restart = function (event)
    {
      ytmnd.site.ui.restart_button_rotation += 90;

      if (ytmnd.site.ui.restart_button_rotation == 360) {
        ytmnd.site.ui.restart_button_rotation= 0;
      }

      var ie_rotation = ytmnd.site.ui.restart_button_rotation/90;

      if ($.browser.msie) {
        $(this).css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + ie_rotation + ')');
      }
      else if ($.browser.webkit) {
        $(this).css('-webkit-transform', 'rotate(' + ytmnd.site.ui.restart_button_rotation + 'deg)');
      }
      else if ($.browser.mozilla) {
        $(this).css('-moz-transform', 'rotate(' + ytmnd.site.ui.restart_button_rotation + 'deg)');
      }
      else if ($.browser.opera) {
        $(this).css('-o-transform', 'rotate(' + ytmnd.site.ui.restart_button_rotation + 'deg)');
      }

      ytmnd.site.player.stop_sound();

      if (ytmnd.site.data.site.background.type == 'image') {
        ytmnd.site.background.loaded = false;
      }

      ytmnd.site.foreground.loaded = false;


      if (ytmnd.site.data.site.background.type == 'image' && ytmnd.site.data.site.background.placement == 'tile') {
        ytmnd.site.background.handle.css('background-image', 'none');
        var x = new Image();
        x.src = ytmnd.site.data.site.background.url;

        ytmnd.site.background.img.attr('src', ytmnd.site.data.site.background.url);
      }

      ytmnd.site.foreground.handle.attr('src', ytmnd.theme_img_url + 'sites/blank.gif');
      ytmnd.site.foreground.img.attr('src', 'about:blank');
      ytmnd.site.foreground.img.attr('src', ytmnd.site.data.site.foreground.url);

      ytmnd.site.wait_for_internal_assets();
    };
  }

  ytmnd.site = new ytmnd.site_template();


})();


$(document).ready(function() {

    console.max('Document loaded, starting data fetch');

  /**
   * Check that the YTMND parent object and needed info exist.
   */

  if (typeof ytmnd == 'undefined' || typeof ytmnd.site_data_url == 'undefined') {
    ytmnd = {};
    alert('ERROR: 1');
    return;
  }

  /**
   * Before we do anything, initialize the global site object.
   */

  ytmnd.site = new ytmnd.site_template();


  /**
   * Now load the site data.
   */

  var ytmnd_data_fetch_success = function(data, textStatus, jqXHR)
  {
    ytmnd.site.parse_site_data(data);
  }

  var ytmnd_data_fetch_error = function (jqXHR, textStatus, errorThrown)
  {

  }

  $.getJSON(ytmnd.site_data_url, function(data){ ytmnd.site.parse_site_data(data); });

});


