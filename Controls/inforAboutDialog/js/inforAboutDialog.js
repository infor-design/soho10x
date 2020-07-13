/*
* Infor About Dialog
*/
(function($) {
  $.widget('ui.inforAboutDialog', {
  options: {
      productName: '<Product Name>',  //text for product name
      details: null,  //controls full details text text for details text area.
      copyRightYear: null,
      additionalDetails: true,
      version: '10.0.1',
      copyRight: null
    },
    widgetEventPrefix: 'about',
    close: function() {
      this.destroy();
      this._trigger('close');
      if (this._activeElement) {
        this._activeElement.focus();
        this._activeElement = null;
      }
      $('body > *').removeAttr('aria-hidden');
    },
    destroy: function() {
      $('#inforAboutDialog').remove();
      $(document).unbind('keypress.inforabout');
    },
    dialog: null,
    _init: function() {
      var self = this,
      o = self.options,
      root = $('<div id="inforAboutDialog" style="display:none"></div>'),
      $productName = $('<h1 class="productName">' + o.productName + '</h1>').uniqueId().wrap('<span>'),
      $logo = $('<div class="inforLogoTm"></div>'),
      $okbutton = $('<button type="button" class="inforAboutCloseButton" title="' + Globalize.localize('Close') + '"><span></span></button>'),
      details = '',
      $details = null,
      container = null;

      var browserDetails = '<span class="padded">Browser : ' + navigator.sayswho + '</span>' +
               '<span>OS : ' + navigator.platform + '</span>' +
               '<span>Language : ' + (navigator.appName === 'Microsoft Internet Explorer' ? navigator.userLanguage : navigator.language) + '</span>' +
               '<span>Cookies Enabled : ' + navigator.cookieEnabled + '</span>';

      if (!o.copyRight) {
        o.copyRight = '<span class="padded">'+ Globalize.localize('AboutText') +'</span>';
      }
      o.copyRight = o.copyRight.replace('@year', (o.copyRightYear ? o.copyRightYear : '2015'));
      details = (o.details ? o.details : o.productName + ' ' + o.version + o.copyRight + (o.additionalDetails ? browserDetails : ''));
      $details = $('<p>' + details + '</p>');
      container = $('<div class="container"></div>').append($logo, $productName, $details);

      root.append($okbutton, container);
      $('body').append(root);
      $('body > *').not(root).attr('aria-hidden', true);

      //Adjust aria tags
      root.attr({
        'aria-labelledby': $productName.attr('id'),
        'aria-describedby': $('#aboutText').attr('id')
      });

      this._activeElement = document.activeElement;

      root.fadeIn('slow', function() {
        if ($details[0].scrollHeight > $details[0].clientHeight || $details[0].scrollWidth > $details[0].clientWidth) {
          $details.addClass('isOverflowed');
        }
      });

      $okbutton.click(function() {
        self.close();
      }).focus();

      //esc closes..
      $(document).bind('keydown.inforabout', function(e) {
        if (e.which === 0 || e.which === 27) {
          self.close();
        }
      });
    }
  });

  navigator.sayswho= (function(){
    var ua= navigator.userAgent, tem,
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])){
      tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
      return 'IE '+(tem[1] || '');
    }
    if (M[1]=== 'Chrome'){
      tem= ua.match(/\bOPR\/(\d+)/);
      if (tem !== null) {
        return 'Opera '+tem[1];
      }
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i)) !== null) {
      M.splice(1, 1, tem[1]);
    }
    return M.join(' ');
  })();

})(jQuery);
