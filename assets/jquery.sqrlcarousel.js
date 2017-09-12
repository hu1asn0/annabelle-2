/**
 * sqrlCarousel
*/

;(function ( $, window, document, undefined ) {
  'use strict';

  $.fn.sqrlCarousel = function( options) {
    // Establish our default settings
    var defaults = {
        items: 4,
        autoHeight: true,
        animationDuration: 200,
        wrapperClass: 'sqrlcarouselwrap',
        nextSelector: '.sqrlcarousel-next',
        prevSelector: '.sqrlcarousel-prev',
        controlSelector: '.sqrlcarousel-control',
        imagesLoadedClassWatch: '.product-photos',
        autoHeightElementWatch: '.product-photos .ProductPhotoImg',
        autoReplaceMainImage: '.ProductPhotoImg',

        // CALLBACKS
        onCarouselLoad: function() { return true; },
        onCarouselItemClick: function() { return true; }
    };

   // create a namespace to be used throughout the plugin
    var carousel = {},

    // set a reference to our slider element
    el = this;

    // Return if slider is already initialized
    if ($(el).data('sqrlCarousel')) { return; }

    /**
     * ===================================================================================
     * = PRIVATE FUNCTIONS
     * ===================================================================================
    */

    /**
     * Initializes namespace settings to be used throughout plugin
     */
    var init = function() {
      // Return if slider is already initialized
      if ($(el).data('sqrlCarousel')) { return; }
      // merge user-supplied options with the defaults

      carousel.settings = $.extend({}, defaults, options);

      // store the original children
      carousel.list = el.children("ul")
      carousel.children = el.find("li");

      // setup init. values
      carousel.scrollActive = false;
      carousel.scrollPosition = "top";
      // mobile orient. change 
      carousel.noChangeCountToEnd = 100; 
      carousel.noEndTimeout = 1000;
      
      // perform all DOM / CSS modifications
      setup();
    }

    var setup = function() {
      el.wrap('<div class="' + carousel.settings.wrapperClass + '"></div>');
      carousel.wrap = el.parent();

      // Setup Element Wrapper 
      $(carousel.settings.imagesLoadedClassWatch).imagesLoaded( function() {
        calculateLayout();

        // now setup events
        setupEvents();

        carousel.settings.onCarouselLoad.call(el);
      });
    }

    var calculateLayout = function(){
      carousel.calcItemHeight = el.find("ul li").first().height();
      
      if (carousel.settings.autoHeight == false){
        carousel.calcTotalHeight = carousel.calcItemHeight * carousel.settings.items;
        carousel.wrap.css({ position:'relative', overflow:'hidden', width:'100%' });
        el.css({ height: carousel.calcTotalHeight + 'px', width:'auto',  overflow: 'auto' });
      } else {

        carousel.calcMaxHeight = $(carousel.settings.autoHeightElementWatch).height();
        carousel.calcMaxItemsInWrap = parseInt( carousel.calcMaxHeight / carousel.calcItemHeight );
        carousel.calcItemsOutsideWrap = carousel.children.length - carousel.calcMaxItemsInWrap;

        // set overflow css - only if we have more thumbnails then space avaiable to show them
        if (carousel.calcMaxItemsInWrap < carousel.children.length){
          carousel.scrollActive = true;
          carousel.calcTotalHeight =  carousel.calcMaxItemsInWrap * carousel.calcItemHeight;
          carousel.wrap.css({ position:'relative', overflow:'hidden', width:'100%' });
          el.css({ height: carousel.calcTotalHeight + 'px', width:'auto',  overflow: 'hidden' });          
        } else {
          // just show full height carousel - no need to scroll
          carousel.scrollActive = false;
          carousel.calcTotalHeight =  carousel.children.length * carousel.calcItemHeight;
          carousel.wrap.css({ position:'relative', overflow:'hidden', width:'100%' });
          el.css({ height: carousel.calcTotalHeight + 'px', width:'auto',  overflow: 'hidden' });
        }
      }

      setNavigation();      
    }

    var setNavigation = function(){
      if (carousel.scrollActive == true){
        if ( carousel.scrollPosition == "top" ){
          $(carousel.settings.prevSelector).css( "display", "none");  
          $(carousel.settings.nextSelector).css( "display", "block");
        } else if ( carousel.scrollPosition == "scrolling" ){
          $(carousel.settings.prevSelector).css( "display", "block");  
          $(carousel.settings.nextSelector).css( "display", "block");
        } else if ( carousel.scrollPosition == "bottom" ){
          $(carousel.settings.prevSelector).css( "display", "block");  
          $(carousel.settings.nextSelector).css( "display", "none");
        }
      } else {
        $(carousel.settings.prevSelector).css( "display", "none");
        $(carousel.settings.nextSelector).css( "display", "none");
      }
    }

    var setupEvents = function(){      
      // Setup Events for Scroll Button Click
      $(carousel.settings.nextSelector).on('click', function(e){
        e.preventDefault();
        el.stop().animate( { 'scrollTop' : "+=" + carousel.calcItemHeight }, { duration : carousel.settings.animationDuration });
        return false;
      });

      // Setup Events for Scroll Button Click
      $(carousel.settings.prevSelector).on('click', function(e){
        e.preventDefault();
        el.stop().animate( { 'scrollTop' : "-=" + carousel.calcItemHeight }, { duration : carousel.settings.animationDuration });
        return false;
      });

      // set navigation based on scroll position
      el.on('scroll', function() {
        if($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
          carousel.scrollPosition = "bottom";
        } else if (el.scrollTop() == 0){
          carousel.scrollPosition = "top";
        } else {
          carousel.scrollPosition = "scrolling";
        };

        setNavigation();
      });

      // Setup Callback for children click
      carousel.children.on('click', function(e){
        e.preventDefault();
        carousel.children.removeClass("active");
        $(this).addClass("active");
        if (carousel.settings.autoReplaceMainImage != ""){
          $(carousel.settings.autoReplaceMainImage).attr("src", $(this).children("img").attr("data-image"));
          $(carousel.settings.autoReplaceMainImage).attr("data-image-large", $(this).children("img").attr("data-image-large"));
        }
        carousel.settings.onCarouselItemClick.call(el, $(this));
        return false;
      });

      // on window resize - recalc all positions
      $(window).on('resize', function() {
        calculateLayout();
      });

      // mobile fix - orientationchange fired but layout is not recalc.
      $(window).on('orientationchange', function() {

        var interval,
            timeout,
            end,
            lastInnerWidth,
            lastInnerHeight,
            noChangeCount;

        end = function () {
            clearInterval(interval);
            clearTimeout(timeout);

            interval = null;
            timeout = null;

            // "orientationchangeend"
            calculateLayout();
        };

        interval = setInterval(function () {
            if (global.innerWidth === lastInnerWidth && global.innerHeight === lastInnerHeight) {
                noChangeCount++;

                if (noChangeCount === carousel.noChangeCountToEnd) {
                    // The interval resolved the issue first.

                    end();
                }
            } else {
                lastInnerWidth = global.innerWidth;
                lastInnerHeight = global.innerHeight;
                noChangeCount = 0;
            }
        });

        timeout = setTimeout(function () {
            // The timeout happened first.

            end();
        }, carousel.noEndTimeout);        
      });

    }


    /**
     * ===================================================================================
     * = PUBLIC FUNCTIONS
     * ===================================================================================
    */
    el.resetSelection = function() {
       el.find("li").removeClass("active");
    }


    init();

    $(el).data('sqrlCarousel', this);

    // allow jQuery chaining
    return this;
  }

})( jQuery, window, document );