/*
Lavaca 1.0.5
Copyright (c) 2012 Mutual Mobile

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
(function(ns, $, View) {

var UNDEFINED;

/**
 * @class app.ui.BaseView
 * @super Lavaca.mvc.View
 *
 * A View from which all other application Views can extend.
 * Adds support for animating between views.
 */
ns.BaseView = View.extend(function() {
	View.apply(this, arguments);
	this
    .mapWidget('.scrollable', Lavaca.ui.Scrollable)
    .mapEvent('.cancel', 'tap', this.onTapCancel);
}, {
  /**
   * @field {Number} column
   * @default 0
   * The horizontal column in which the view should live
   */
  column: 0,
  /**
   * @field {String} template
   * @default 'default'
   * The name of the template used by the view
   */
  template: 'default',
  /**
   * @field {String} animation
   * @default 'slide'
   * The name of the animation used by the view
   */
  animation: 'slide',
  /**
   * @method onRenderSuccess
   * Executes when the template renders successfully. This implementation
   * adds support for animations between views, based off of the animation
   * property on the prototype.
   *
   * @param {Event} e  The render event. This object should have a string property named "html"
   *   that contains the template's rendered HTML output.
   */
  onRenderSuccess: function(e) {
    View.prototype.onRenderSuccess.apply(this, arguments);
    if (app.animations) {
      this.shell.addClass(this.animation);
    }
  },
  /**
   * @method onTapCancel
   * Handler for when a cancel control is tapped
   *
   * @param {Event} e  The tap event.
   */
  onTapCancel: function(e) {
    e.preventDefault();
    app.viewManager.dismiss(e.currentTarget);
  },
  /**
   * @method enter
   * Executes when the user navigates to this view. This implementation
   * adds support for animations between views, based off of the animation
   * property on the prototype.
   *
   * @param {jQuery} container  The parent element of all views
   * @param {Array} exitingViews  The views that are exiting as this one enters
   * @return {Lavaca.util.Promise} A promise
   */
  enter: function(container, exitingViews) {
    return View.prototype.enter.apply(this, arguments)
      .then(function() {
        if (app.animations && (this.layer > 0 || exitingViews.length > 0)) {
          this.shell.removeClass('reverse');
          if (exitingViews.length || container[0].childNodes.length) {
            if (this.column !== UNDEFINED) {
              var i = -1,
                  exitingView;
              while (exitingView = exitingViews[++i]) {
                if (exitingView.layer == this.layer
                    && exitingView.column !== UNDEFINED
                    && exitingView.column > this.column) {
                  this.shell.addClass('reverse');
                  exitingView.shell.addClass('reverse');
                }
              }
            }
            var self = this;
            this.shell
              .nextAnimationEnd(function(e) {
                self.trigger('entercomplete');
              })
              .removeClass('out')
              .addClass('in');
          }
        } else {
          this.shell.addClass('show');
          this.trigger('entercomplete');
        }
      });
  },
  /**
   * @method exit
   * Executes when the user navigates away from this view. This implementation
   * adds support for animations between views, based off of the animation
   * property on the prototype.
   *
   * @param {jQuery} container  The parent element of all views
   * @param {Array} enteringViews  The views that are entering as this one exits
   * @return {Lavaca.util.Promise} A promise
   */
  exit: function(container, enteringViews) {
    if (app.animations && (this.layer > 0 || enteringViews.length > 0)) {
      this.shell.removeClass('reverse');
      var self = this,
          args = arguments,
          promise = new Lavaca.util.Promise(this);
      this.shell
        .nextAnimationEnd(function(e) {
          self.shell.removeClass('in out show');
          View.prototype.exit.apply(self, arguments).then(function() {
            promise.resolve();
          });
        })
        .removeClass('in')
        .addClass('out');
      return promise;
    } else {
      this.shell.removeClass('show');
      return View.prototype.exit.apply(this, arguments);
    }
  },
  /**
   * @method redraw
   * Re-renders the view's template and replaces the DOM nodes that match
   * the selector argument. If no selector argument is provided, the whole view
   * will be re-rendered. If the first parameter is passed as <code>false</code>
   * the resulting html will pe passed with the promise and nothing will be replaced.
   * Note: the number of elements that match the provided selector must be identical
   * in the current markup and in the newly rendered markup or else the returned
   * promise will be rejected.
   *
   * @sig
   * Re-renders the view's template using the view's model
   * and redraws the entire view
   * @return {Lavaca.util.Promise} A promise
   *
   * @sig
   * Re-renders the view's template using the specified model
   * and redraws the entire view
   * @param {Object} model  The data model to be passed to the template
   * @return {Lavaca.util.Promise} A promise
   *
   * @sig
   * Re-renders the view's template using the view's model and only redraws the
   * elements that match the specified selector string.
   * Note: The numbers of items that match the selector must
   * be exactly the same in the view's current markup and in the newly rendered
   * markup. If that is not the case, the returned promise will be rejected and
   * nothing will be redrawn.
   * @param {String} selector  Selector string that defines elements to redraw
   * @return {Lavaca.util.Promise} A promise
   *
   * @sig
   * Re-renders the view's template using the specified model and only redraws the
   * elements that match the specified selector string.
   * Note: The numbers of items that match the selector must
   * be exactly the same in the view's current markup and in the newly rendered
   * markup. If that is not the case, the returned promise will be rejected and
   * nothing will be redrawn.
   * @param {String} selector  Selector string that defines elements that will be updated
   * @param {Object} model  The data model to be passed to the template
   * @return {Lavaca.util.Promise} A promise
   *
   * @sig
   * Re-renders the view's template using the view's model. If shouldRedraw is true,
   * the entire view will be redrawn. If shouldRedraw is false, nothing will be redrawn,
   * but the returned promise will be resolved with the newly rendered content. This allows
   * the caller to attach a success handler to the returned promise and define their own
   * redrawing behavior.
   * @param {Boolean} shouldRedraw  Whether the view should be automatically redrawn.
   * @return {Lavaca.util.Promise}  A promise
   *
   * @sig
   * Re-renders the view's template using the specified model. If shouldRedraw is true,
   * the entire view will be redrawn. If shouldRedraw is false, nothing will be redrawn,
   * but the returned promise will be resolved with the newly rendered content. This allows
   * the caller to attach a success handler to the returned promise and define their own
   * redrawing behavior.
   * @param {Boolean} shouldRedraw  Whether the view should be automatically redrawn.
   * @param {Object} model  The data model to be passed to the template
   * @return {Lavaca.util.Promise}  A promise
   */
  redraw: function(selector, model) {
    var self = this,
        templateRenderPromise = new Promise(this),
        redrawPromise = new Promise(this),
        template = Lavaca.ui.Template.get(this.template),
        replaceAll;
    if (typeof selector === 'object' || selector instanceof Model) {
      model = selector;
      selector = null;
    }
    else if (typeof selector == 'boolean') {
      replaceAll = selector;
      selector = null;
    } else if (!selector) {
      replaceAll = true;
    }
    if(!this.hasRendered) {
      return redrawPromise.rejector('View has not been rendered yet and cannot be redrawn.');
    }
    model = model || this.model;
    if (model instanceof Model) {
      model = model.toObject();
    }
    templateRenderPromise
      .success(function(html) {
        if (replaceAll) {
          this.el.html(html);
          redrawPromise.resolve(html);
          return;
        }
        if(selector) {
          var $newEl = $('<div>' + html + '</div>').find(selector),
              $oldEl = this.el.find(selector);
          if($newEl.length > 0 && $newEl.length === $oldEl.length) {
            $oldEl.each(function(index) {
              $(this).replaceWith($newEl.eq(index));
            });
            redrawPromise.resolve(html);
          } else {
            redrawPromise.reject('Count of items matching selector is not the same in the original html and in the newly rendered html.');
          }
        } else {
          redrawPromise.resolve(html);
        }
      })
      .error(redrawPromise.rejector());
    template
      .render(model)
      .success(templateRenderPromise.resolver())
      .error(templateRenderPromise.rejector());
    return redrawPromise;
  }
});

})(Lavaca.resolve('app.ui.views', true), Lavaca.$, Lavaca.mvc.View);