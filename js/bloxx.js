/************************************************************
 * Bloxx
 *
 * A lightbox style thumbnail gallery made in Exhibeo
 *
 * Exhibeo: Web galleries – from the future!
 * http://exhibeoapp.com
 * © Copyright Softpress Systems – 2012
 *************************************************************/

(function(){
	/* Globals */
	// Does the browser support CSS Transitions and Animations?
	window.xbTransitions = window.xbTransitions || (function() {
		var thisBody = document.body || document.documentElement;
		return thisBody.style.transition !== undefined 
				|| thisBody.style.WebkitTransition !== undefined 
				|| thisBody.style.MozTransition !== undefined 
				|| thisBody.style.MsTransition !== undefined 
				|| thisBody.style.OTransition !== undefined;
	})();
	window.xbAnimations = window.xbAnimations || (function() {
		var thisBody = document.body || document.documentElement;
		return thisBody.style.animation !== undefined 
				|| thisBody.style.WebkitAnimation !== undefined 
				|| thisBody.style.MozAnimation !== undefined 
				|| thisBody.style.MsAnimation !== undefined 
				|| thisBody.style.OAnimation !== undefined;
	})();
	
	function hasTransition(el) {
		var style = window.getComputedStyle(el, null);
		return "transition" in el.style ? style.transitionDuration !== "0s" : false
				|| "WebkitTransition" in el.style ? style.WebkitTransitionDuration !== "0s" : false
				|| "MozTransition" in el.style ? style.MozTransitionDuration !== "0s" : false
				|| "MsTransition" in el.style ? style.MsTransitionDuration !== "0s" : false
				|| "OTransition" in el.style ? style.OTransitionDuration !== "0s" : false;
	}
	
	function getStyle(el, strCssRule) {
		var strValue = "";
		if(document.defaultView && document.defaultView.getComputedStyle) {
			strValue = document.defaultView.getComputedStyle(el, null).getPropertyValue(strCssRule)
				 || document.defaultView.getComputedStyle(el, null)[strCssRule];
		}
		else if(el.currentStyle) {
			strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1) {
				return p1.toUpperCase();
			});
			strValue = el.currentStyle[strCssRule];
		}
		return strValue;
	}
	
	// Shims to add handleEvent support to browsers that don't support it
	// Attribution: http://www.thecssninja.com/javascript/handleevent
	function on(el, evt, fn, bubble) {
		var evts = evt.split(" "),
			i = 0,
			l = evts.length;
		for(i; i < l; i++) {
			evt = evts[i];
			if("addEventListener" in el) { // Standards
				try {
					el.addEventListener(evt, fn, bubble);
				} catch(e) {
					if(typeof fn == "object" && fn.handleEvent) {
						el.addEventListener(evt, function(e){
							fn.handleEvent.call(fn, e);
						}, bubble);
					} else
						throw e;
				}
			}
			else if("attachEvent" in el) { // IE
				if(typeof fn == "object" && fn.handleEvent) {
					el.attachEvent("on" + evt, function(){
						fn.handleEvent.call(fn, window.event);
					});
				} else
					el.attachEvent("on" + evt, fn);
			}
		}
	}
	
	function removeEvt(el, evt, fn, bubble) {
		var evts = evt.split(" "),
			i = 0,
			l = evts.length;
		for(i; i < l; i++) {
			evt = evts[i];
			if("removeEventListener" in el) { // Standards
				try {
					el.removeEventListener(evt, fn, bubble);
				} catch(e) {
					if(typeof fn == "object" && fn.handleEvent) {
						el.removeEventListener(evt, function(e){
							fn.handleEvent.call(fn, e);
						}, bubble);
					} else
						throw e;
				}
			} 
			else if("detachEvent" in el) { // IE
				if(typeof fn == "object" && fn.handleEvent) {
					el.detachEvent("on" + evt, function(){
						fn.handleEvent.call(fn);
					});
				} else
					el.detachEvent("on" + evt, fn);
			}
		}
	}
	
	// Browser independent get window width and height
	function windowWidth() {
		return window.innerWidth || document.documentElement.clientWidth;
	}
	
	function windowHeight() {
		return window.innerHeight || document.documentElement.clientHeight;
	}
 
    function naturalDimensions(image) {
		// Modern browsers
		if("naturalWidth" in image)
			return {
				width: image.naturalWidth,
				height: image.naturalHeight
			};
 
        // Add a temporary image
		var temp = document.createElement("img"),
            dimensions = {};
		
		temp.style.visibility = "hidden";
        temp.src = image.src;
		(document.body || document.documentElement).appendChild(temp);
 
		dimensions.width = temp.clientWidth;
		dimensions.height = temp.clientHeight;
				
		(document.body || document.documentElement).removeChild(temp);
		temp = null;
		
		return dimensions;
    }
	
	Bloxx = function(element, options){
		
		var _this = this,
		// Prepare the user options
		options = options || {};
		this.titleText = document.createTextNode(options.title || "");
		this.thumbTitles = options.thumbTitles || true;
		this.thumbDescription = options.thumbDescriptions || true,
		this.captions = options.captions || true;
		this.lazyloadLimit = options.lazyload || 10;
		this.positioning = options.positioning || "compact";
        this.retina = options.retina || 1;
		this.showThumbs = options.showThumbs || false;
		
		this.element = element;
		this.body = document.body || document.documentElement;
		this.id = element.getAttribute("id");
		
		// Add a temporary object
		var temp = document.createElement("div");
		temp.style.visibility = "hidden";
		this.body.appendChild(temp);
		
		// Make the temp object the header
		temp.className = "bloxx-header";
						
		// Get its height
		this.headerHeight = temp.clientHeight;
		
		// Make it a thumb
		temp.className = "bloxx-thumb";
		
		// Get its margin (the height will be 0 + marginTop)
		this.margin = temp.clientHeight;
		// And its width (add one margin too for easily calculating grud sizes)
		this.thumbWidth = temp.clientWidth + this.margin;
		
		// Make it an image
		temp.className = "bloxx-image";
		
		// Get its border size
		this.borderSize = parseInt(getStyle(temp, "borderLeftWidth"));

		// Get rid of the temo object
		this.body.removeChild(temp);
		temp = null;
		
		// Set the language options
		this.closeGalleryText = options.closeGalleryText || "Close Gallery",
		this.closeSlidesText = options.closeSlidesText || "Close Slides",
		this.prevImageText = options.prevImageText || "Previous Image",
		this.nextImageText = options.nextImageText || "Next Image",
		this.showDescriptionText = options.showDescriptionText || "Show Description",
		this.hideDescriptionText = options.hideDescriptionText || "Hide Description",
		
		// Globals
		this.gTransitionEnd = "transitionend webkitTransitionEnd oTransitionEnd otransitionend transitionEnd";
		
		this.loader = document.createElement("div");
		this.loader.className = "xb-loading-container";
		
		var loading = this.loader.appendChild(document.createElement("div"));
		loading.className = "xb-loading";
		
		var top = loading.appendChild(document.createElement("span"));
		top.className = "top";
		var right = loading.appendChild(document.createElement("span"));
		right.className = "right";
		var bottom = loading.appendChild(document.createElement("span"));
		bottom.className = "bottom";
		var left = loading.appendChild(document.createElement("span"));
		left.className = "left";
		
		// Set up the grid
		init = function(e) {
		
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
			_this.STATE = "grid";
			
			// Prevent body from scrolling
			_this.oldBodyOverflow = _this.body.style.overflow;
			_this.body.style.overflow = "hidden";
			
			// Add the wrapper and header elements if they already exist
			if(false) {
				_this.body.appendChild(_this.wrapper);
				_this.body.appendChild(_this.gridControls);
				_this.resizeGrid();
				
			}
			// Otherwise, create everything from scratch
			else {
				_this.gridHeight = 0;
	
				// Get the anchors to populate the grid
				_this.anchors = element.getElementsByTagName("a");
				_this.length = _this.anchors.length;
				
				// Add main wrapper to page
				_this.wrapper = _this.body.appendChild(document.createElement("div"));
				_this.wrapper.className = "bloxx-grid-wrapper";
				_this.wrapper.setAttribute("id", _this.id + "-bloxx-grid-wrapper");
				
				// Add the grid controls to the page
				_this.gridControls = _this.body.appendChild(document.createElement("header"));
				_this.gridControls.className = "bloxx-header";
				_this.gridControls.setAttribute("id", _this.id + "-bloxx-header");
				
				_this.closeGridButton = _this.gridControls.appendChild(document.createElement("a"));
				_this.closeGridButton.appendChild(document.createTextNode("X"));
				_this.closeGridButton.className = "bloxx-close-grid";
				_this.closeGridButton.setAttribute("id", _this.id + "-bloxx-close-grid");
				
				_this.closeGridButton.title = _this.closeGalleryText;
				on(_this.closeGridButton, "click", _this, false);
				
				// Add the title to the page
				_this.galleryTitle = _this.gridControls.appendChild(document.createElement("h1"));
				_this.galleryTitle.appendChild(_this.titleText);
				
				// Add the grid container to the page
				_this.gridContainer = _this.wrapper.appendChild(document.createElement("div"));
				_this.gridContainer.className = "bloxx-grid";
				var style = _this.gridContainer.style;
				style.width = _this.gridWidth() + "px";
				
				// Add the grid container to the page
				_this.grid = _this.gridContainer.appendChild(document.createElement("div"));
				style = _this.grid.style;
				style.marginTop = _this.margin + "px";
				
				// Cache the thumbs
				_this.thumbs = [];
				
				// Reset the laoded variable that shows how many thumbs have been loaded
				_this.loaded = 0;
				// Start adding the thumbs
				_this.addThumb();
			}
			
			// Add resize listener to window					
			on(window, "resize orientationchange", _this, false);
			on(_this.wrapper, "scroll", _this, false);
	
			on(document, "keydown", _this, false);
		};
		
		// Initialize the gallery when the element is clicked
		on(element, "click", init, false);
	};
	
	Bloxx.prototype = {

		gridWidth: function() {
		
			// Get the number of possible columns
			this.columns = Math.floor(this.wrapper.clientWidth / this.thumbWidth);
			
			// If there are fewer images than columns then calculate the width based on the number of images
			// Otherwise use the number of possible columns
			return this.length <= this.columns ? this.length * this.thumbWidth - this.margin : this.columns * this.thumbWidth - this.margin;
			
		},
		addThumb: function(index) {
			
			// Bail if the user has clicked an image while we're still loading
			if(this.STATE == "slide")
				return;
	
			if(index)
				this.thumbs = [];
	
			// There are i images loaded so i is the (0 based) index of the next image
			var i = index || this.thumbs.length;
			
			// If there's an anchor at the ith index then start loading it
			if(this.anchors[i]) {
				var anchor = this.anchors[i],
					thumbContainer = this.grid.appendChild(document.createElement("div")),
					thumbAnchor;
				
				this.gridControls.appendChild(this.loader);
				
				// Cache the new thumb
				this.thumbs.push(thumbContainer);
				
				// Build the thumb, hiding it until we can calculate its size
				thumbContainer.className = "bloxx-thumb bloxx-vis-hide";
				thumbAnchor = thumbContainer.appendChild(anchor.cloneNode(false));
				thumbAnchor.className = "bloxx-anchor" + (/thumb-title/.test(anchor.className) ? " thumb-title" : "");
				thumbAnchor.id = null;
				thumbContainer._index = i;
				
				// Add the image from the anchors data-thumb attribute
				var thumb = thumbAnchor.appendChild(new Image());
	
				if(!this.showThumbs) {
					this.zoom(0);
				}
	
				// Add the event listener
				on(thumb, "load", this, false);
	
				thumb.src = thumbAnchor.getAttribute("data-thumb");
				thumb.style.display = "block";
			}
		},
		lazyload: function() {
			// Set the shortestColumn to the maximum value possible
			this.shortestColumn = this.gridHeight;
			// Loop through each item for the number of columns
			for(var i = 0; i < this.columns; i++) {
				// If there's no item in the column then the shortest column must be 0
				if(!this.itemsByColumn[i]) {
					this.shortestColumn = 0;
					continue;
				}
				// Record the smallest height
				this.shortestColumn = Math.min(this.shortestColumn, this.itemsByColumn[i].height);
			}
			// Load a new thumb if the shortest column is lower than the window height,
			// Or if the user scrolls to the end of the document and there are images still to load 
			// Or if there are more columns available in the window
			if(this.shortestColumn < windowHeight() 
				|| this.wrapper.scrollTop + windowHeight() == this.gridContainer.offsetTop + this.gridContainer.clientHeight
				|| this.thumbs.length < this.columns) {
				this.addThumb();
			}
		},
		zoom: function(e, index) {
			if(typeof arguments[0] === "object")
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
			else {
				index = arguments[0];
				// The index passed is out of our index
				if(index < 0 || index >= this.length)
					return;
			}
			
			var t = this.thumbs[index] || (e.target || e.srcElement);
			// If we came from a click event we need to find the index of the thumb that was clicked
			while(!/bloxx-thumb/.test(t.className)) 
				t = t.parentNode;
			for(this.index = 0; t = t.previousSibling; ++this.index) {}
			
			// Remember the scroll position of the grid
			this._scrollPosition = this.wrapper.scrollTop;
			
			this.STATE = "slide";
			this.slideShift = 0;
			this.removeList = [];
			
			// Hide the grid to improve speed
			this.gridContainer.className += " bloxx-hide";
			
			if(window.xbTransitions)
				on(this.gridContainer, this.gTransitionEnd, this, false)
			else
				this.transitionEnd(this.gridContainer);
			
			// Update the close button
			this.closeGridButton.title = this.closeSlidesText;
								
			this.prevButton = this.gridControls.appendChild(document.createElement("a"));
			this.prevButton.appendChild(document.createTextNode("<"));
			this.prevButton.className = "bloxx-prev";
			this.prevButton.setAttribute("id", this.id + "-bloxx-prev");
			this.prevButton.title = this.prevImageText;
			if(this.index > 0) {
				on(this.prevButton, "click", this, false);
			}
			else {
				this.prevButton.className += " bloxx-disabled";
				this.prevButton.title = null;
			}
			
			this.nextButton = this.gridControls.appendChild(document.createElement("a"));
			this.nextButton.appendChild(document.createTextNode(">"));
			this.nextButton.className = "bloxx-next";
			this.nextButton.setAttribute("id", this.id + "-bloxx-next");
			this.nextButton.title = this.nextImageText;
			if(this.index != this.length - 1) {
				on(this.nextButton, "click", this, false);
			}
			else {
				this.nextButton.className += " bloxx-disabled";
				this.nextButton.title = null;
			}
			
			// Create a wrapper for the slides
			this.slidesWrapper = this.body.insertBefore(document.createElement("div"), this.gridControls);
			this.slidesWrapper.className = "bloxx-slides-wrapper";
			this.slidesWrapper.setAttribute("id", this.id + "-bloxx-slides-wrapper");
			
			// Create a div to contain the image at the index
			this.activeSlide = this.slidesWrapper.appendChild(document.createElement("figure"));
			this.activeSlide.className = "bloxx-slide bloxx-slide-hide";
			
			this.addImage(this.activeSlide, this.index);
			this.resize();
			
			// Create divs either side to contain the prev/next images
			if(this.index > 0) {
				this.prevSlide =  this.slidesWrapper.insertBefore(document.createElement("figure"), this.activeSlide);
				this.prevSlide.className = "bloxx-slide bloxx-slide-prev";
				this.prevSlide.style.left = -windowWidth() + "px";
				this.prevImage = this.addImage(this.prevSlide, this.index-1);
			}
			if(this.index < this.length - 1) {
				this.nextSlide =  this.slidesWrapper.appendChild(document.createElement("figure"));
				this.nextSlide.className = "bloxx-slide bloxx-slide-next";
				this.nextSlide.style.left = windowWidth() + "px";
				this.nextImage = this.addImage(this.nextSlide, this.index+1);
			}
			
			on(this.slidesWrapper, "touchstart touchmove touchend", this, false);
		},
		addCaptions: function(anchor, image) {
			var title = anchor.title || undefined,
				description = anchor.getAttribute("data-content") || undefined,
				imageContainer = image.parentNode,
				imageDescWrap;
			
			while(!(/bloxx-image/.test(imageContainer.className)))
				imageContainer = imageContainer.parentNode;
			
			imageDescWrap = imageContainer.parentNode;
			
			while(!(/bloxx-image-wrapper/.test(imageDescWrap.className)))
				imageDescWrap = imageDescWrap.parentNode;
			
			// Update the title if there is a title, we're on the active slide and the new content is different
			if(title && this.anchors[this.index] === anchor && (this.galleryTitle.textContent || this.galleryTitle.innerText) != title) {
				this.galleryTitle.innerText = "";
				this.galleryTitle.appendChild(document.createTextNode(title));
				this.currentImage.title = title;
			}
			else if(title === undefined && this.anchors[this.index] === anchor) {
				this.galleryTitle.innerText = this.titleText.textContent;
				image.title = null;
			}
			if(description) {
				// Small device
				if(windowWidth() < 481) {
					anchor.smallDescription = true;
					var caption = imageContainer.getElementsByTagName("figcaption")[0] || imageContainer.appendChild(document.createElement("figcaption")),
						p = caption.getElementsByTagName("p")[0] || caption.appendChild(document.createElement("p"));
					caption.className = "bloxx-description-small";
					caption.style.height = 
					caption.style.width = "";
					p.innerText = "";
					p.insertAdjacentHTML("afterbegin", description);
					descriptionStatus = false;
				}
				else {
					anchor.smallDescription = false;
					var caption = imageDescWrap.getElementsByTagName("figcaption")[0] || imageDescWrap.insertBefore(document.createElement("figcaption"), imageContainer),
						capButton = caption.getElementsByTagName("div")[0] || caption.appendChild(document.createElement("div")),
						p = caption.getElementsByTagName("p")[0] || caption.appendChild(document.createElement("p"));
						
					caption.className = "bloxx-description-large";
					caption.style.top = this.borderSize + "px";
					caption.style.overflow = this.descriptionStatus ? "auto" : "hidden";
					capButton.className = "bloxx-description-button";
					capButton.setAttribute("id", this.id + "-bloxx-description-button");
					capButton.title = this.showDescriptionText;
					capButton.innerText = "";
					capButton.appendChild(document.createTextNode("Z"));
					p.innerText = "";
					p.insertAdjacentHTML("afterbegin", description);
					descriptionStatus = false;

					on(caption, "click", this, false);
					
				}
				image.alt = description;
			}
			else if(description === undefined) {
				var caption = imageDescWrap.getElementsByTagName("figcaption")[0];
				if(caption)
					caption.parentNode.removeChild(caption);
				this.currentImage.alt = null;
			}
		},
		addImage: function(slide, index) {
			
			// Clear the existing contents
			slide.innerHTML = "";
			
			// Create the slide structure
			var imageDescWrap = slide.appendChild(document.createElement("div")),
				imageContainer = imageDescWrap.appendChild(document.createElement("div")),
				image = imageContainer.appendChild(new Image()),
				anchor = this.anchors[index],
				url = anchor.getAttribute("data-url"),
				link;
			
			if(url) {
				link = imageContainer.appendChild(document.createElement("a"));
				link.href = url;
				link.appendChild(image);
			}
			
			imageDescWrap.className = "bloxx-image-wrapper";
			imageContainer.className = "bloxx-image";
			
			imageDescWrap.style.top = (this.headerHeight + this.margin) + "px"
			on(image, "load", this, false);
			image.src = anchor.href;
			image.className = "bloxx-image_img";
	
			if(!image.complete) {
				imageDescWrap.className += " bloxx-vis-hide";
				this.gridControls.appendChild(this.loader);
			}
			
			if(index == this.index) {
				this.currentImage = image;
			}
			
			if(this.captions) {
				this.addCaptions(anchor, image);
			}
			
			imageDescWrap.style.height = (image.clientHeight + 30) + "px";
			
			this.resizeSlide(image, this.anchors[index]);
			
			return image;
		},
		resizeGrid: function(forceResize) {
			
			forceResize = typeof forceResize == "boolean" || false;
			
			// Only run this code if the number of available columns changes
			if(this.columns != Math.floor(this.wrapper.clientWidth / this.thumbWidth) || forceResize) {
				
				// Set the width of the grid to the calculated width
				this.gridContainer.style.width = this.gridWidth() + "px";
				
				// Reset the grid height
				this.gridHeight = 0;
				
				// Loop through the thumbs
				for(var i = 0; i < this.thumbs.length; i++) {
					
					var thumbContainer = this.thumbs[i],
						style = thumbContainer.style;
	
					thumbContainer.className = "bloxx-thumb bloxx-thumb-transition";
					
					this.itemsByColumn = this.itemsByColumn || {};
					// Create a new object in case more columns are being added (page made wider)
					this.itemsByColumn[i % this.columns] = this.itemsByColumn[i % this.columns] || {};
					
					// If the image hasn't finished loading then we don't want to continue (it skews the data)
					if(!forceResize && !thumbContainer.getElementsByTagName("img")[0].complete) {
						return;
					}
					
					// This is the first row. Replace the existing values in itemsByColumn with these
					if(this.thumbs[i - this.columns] === undefined) {
						this.itemsByColumn[i % this.columns].item = thumbContainer;
						this.itemsByColumn[i % this.columns].height = thumbContainer.clientHeight + this.margin;
					} 
					
					// Alternate positioning. This will place each item at the highest point available
					// It will disrupt the order of thumbs if they are different sizes
					if(this.positioning === "compact") {
						var shortest = 0;
						
						// Find the shortest column and the item at the bottom of it
						if(this.thumbs[i - this.columns] !== undefined) {
							for(var j = 0; j < this.columns; j++) {
								var a = this.itemsByColumn[j].height,
									b = this.itemsByColumn[shortest].height;
								if(a === undefined)
									this.itemsByColumn[j].height;
								if(a < b) {
									shortest = j;
								}
							}
							
							var top = this.itemsByColumn[shortest].height;
							// Add this item to its column object
							this.itemsByColumn[shortest].item = thumbContainer;
							this.itemsByColumn[shortest].height = this.itemsByColumn[shortest].height + thumbContainer.clientHeight + this.margin;
						}
						
						// If we're in the first row the top will be 0 and left will be after the previous item
						style.top = this.thumbs[i - this.columns] ? top + "px" : "0px";
						style.left = this.thumbs[i - this.columns] ? (shortest * this.thumbWidth) + "px" : (i % this.columns * this.thumbWidth) + "px";
						
						// Update gridHeight if the column we just updated is taller
						if(this.itemsByColumn[shortest].height > this.gridHeight)
							this.gridHeight = this.itemsByColumn[shortest].height;
					} 
					// Regular positioning. This will place each thumb in the grid column by column
					else {	
						
						// Set the top and left positons of thumbContainer
						var height = this.itemsByColumn[i % this.columns].height;
						style.top = this.thumbs[i - this.columns] ? height + "px" : "0px";
						style.left = (i % this.columns * this.thumbWidth) + "px";
						
						// Add the height of the item to the running total (unless we're the first row)
						if(this.thumbs[i - this.columns] !== undefined) {
							this.itemsByColumn[i % this.columns].height = height + thumbContainer.clientHeight + this.margin;
						}
						
						// Update gridHeight with the height of the tallest column
						if(height > this.gridHeight)
							this.gridHeight = height;
					}
				}
				
				// Set the height of the grid container to gridHeight
				this.grid.style.height = this.gridHeight + "px";
			}
			
			// Run lazyload to load more images if we have to
			this.lazyload();
		},
		resizeSlide: function(image, anchor) {
			// Get all the items
			var description,
				imageContainer = image.parentNode,
				imageDescWrap,
				descriptionClientWidth,
				descriptionWidth,
				dimensions = naturalDimensions(image),
				
				// Get the available space for the image to fit inside
				availableHeight,
				availableWidth;
			
			while(!(/bloxx-image/.test(imageContainer.className)))
				imageContainer = imageContainer.parentNode;
			
			imageDescWrap = imageContainer.parentNode;
			
			while(!(/bloxx-image-wrapper/.test(imageDescWrap.className)))
				imageDescWrap = imageDescWrap.parentNode;
			
			description = imageDescWrap.firstElementChild;
			
			if(description && !(/bloxx-description/.test(description.className)))
				description = imageContainer.lastElementChild;
			
			if(!description || !(/bloxx-description/.test(description.className)))
				description = null;
				
			descriptionClientWidth = description ? description.clientWidth : 0,
			descriptionWidth = description && windowWidth() > 480 ? (this.descriptionStatus ? Math.max(descriptionClientWidth, 265) : 37) : 0,
			
			// Get the available space for the image to fit inside
			availableHeight = (windowHeight() - this.headerHeight - (this.borderSize * 2) - (this.margin * 2)),
			availableWidth = (windowWidth() - (this.borderSize * 2) - (this.margin * 2) - descriptionWidth);
			
			// Set the width of the item based on the available width
			imageContainer.style.width = Math.min(availableWidth, (dimensions.width / (this.retina + 1))) + "px";
			image.style.height = "auto";
			image.style.width = "100%";
			// If we're on a small device or small window
			if(windowWidth() < 481) {
				// Set the height of the container to auto)
				imageContainer.style.height = "auto";
				// Add some margin to the bottom
				imageContainer.style.marginBottom = this.margin + "px";
				// Set the height of the iamd and description container to the height of the image 
				imageDescWrap.style.height = (imageContainer.clientHeight + (this.borderSize*2) + this.margin) + "px";
				// Reset the desctiption status
				this.descriptionStatus = false;
				
				// Move the description if there is one
				image.parentNode.parentNode.parentNode.style.overflow = "auto";
				if(anchor.smallDescription !== undefined && !anchor.smallDescription) {
					// Remove the old description
					if(anchor && description) {
						description.parentNode.removeChild(description);
						this.addCaptions(anchor, image);
						anchor.smallDescription = true;
					}
				}
				imageDescWrap.style.width = (image.clientWidth + (this.borderSize * 2)) + "px";
			}
			// We're on a large device or window
			else {
				// Otherwise, make the container the height of the image
				imageContainer.style.height = (image.clientHeight) + "px";
				
				// If the image doesn't fit on the screen and we're on a large screen then resize it based on the available height
				if(imageContainer.clientHeight > availableHeight && windowWidth() > 480) {
					imageContainer.style.height = Math.min(availableHeight, (dimensions.height / (this.retina + 1))) + "px";
					image.style.width = "auto";
					image.style.height = "100%";
					imageContainer.style.width = (image.clientWidth) + "px";
				}
				
				imageDescWrap.parentNode.scrollTop = 0;
				imageDescWrap.parentNode.style.overflow = "";
				if(anchor.smallDescription) {
					// Remove the old description
					if(anchor && description) {
						description.parentNode.removeChild(description);
						this.addCaptions(anchor, image);
						anchor.smallDescription = false;
					}
				}
				// If there's a description, make sure the wrapper item is the right width
				if(description) {
					
					// The width should be the image, border and description widths combined 
					imageDescWrap.style.width = (imageContainer.clientWidth + descriptionWidth + (this.borderSize * 2)) + "px";
					
					// If the description is visible, remove the width from the description (so it uses the default value)
					if(this.descriptionStatus) {
						description.style.width = "";
						description.style.overflow = "auto";
					}
					// Otherwise, make the width slightly smaller than the box, or 200 (whichever is smallest)
					else {
						description.style.width = Math.min(200, imageContainer.clientWidth - 5) + "px";
						description.style.overflow = "hidden";
						descriptionButton = description.firstElementChild;
						descriptionButton.style.display = "none";
						descriptionButton.offsetHeight;
						descriptionButton.style.display = "block";
					}
					// Make sure the height of the description is always smaller than the image
					description.style.height = (image.clientHeight - (this.borderSize * 2)) + "px";
				}
				// If there's no description then the wrapper should just be the same width as the image and the borders
				else {
					imageDescWrap.style.width = (image.clientWidth + (this.borderSize * 2)) + "px";
				}
				// The height doesn't need to take the description into account
				imageDescWrap.style.height = (image.clientHeight + (this.borderSize * 2)) + "px";
			}
		},
		resize: function(e) {
			if(this.STATE == "grid")
				this.resizeGrid(e);
			else if(this.STATE == "slide") {
				this.resizeSlide(this.currentImage, this.anchors[this.index]);
				
				// Set the previous and next slide left edges so they are always hidden on resize
				if(this.prevImage && this.prevSlide) {
					this.prevSlide.style.left = -windowWidth() + "px";
					this.resizeSlide(this.prevImage, this.anchors[this.index-1]);
				}
				
				if(this.nextImage && this.nextSlide) {
					this.nextSlide.style.left = windowWidth() + "px";
					this.resizeSlide(this.nextImage, this.anchors[this.index+1]);
				}
			}
		},

		close: function(e) {
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
			if(this.STATE == "grid") {
				this.STATE = "";
                this.body.style.overflow = this.oldBodyOverflow;
				if(window.xbTransitions && hasTransition(this.wrapper))
					on(this.wrapper, this.gTransitionEnd, this, false);
				else
					this.transitionEnd(this.wrapper);
				this.wrapper.className += " bloxx-wrapper-close";
				this.gridControls.className += " bloxx-wrapper-close";
			}
			else if(this.STATE == "slide" && this.showThumbs) {
				this.STATE = "grid";
				this.wrapper.style.position = "";
				if(window.xbTransitions && hasTransition(this.activeSlide))
					on(this.activeSlide, this.gTransitionEnd, this, false);
				else
					this.transitionEnd(this.activeSlide);
				this.activeSlide.className = "bloxx-slide bloxx-slide-hide";
				this.prevSlide =
				this.prevImage =
				this.nextSlide =
				this.prevImage = null;
				this.gridControls.removeChild(this.prevButton);
				this.gridControls.removeChild(this.nextButton);
				this.gridContainer.className = "bloxx-grid";
				this.wrapper.scrollTop = this._scrollPosition;
				this.closeGridButton.title = this.closeGalleryText;
				this.galleryTitle.innerHTML = "";
				this.galleryTitle.appendChild(this.titleText);
				this.resize(e);
			}
			else if(!this.showThumbs) {
				this.STATE = "";
				this.activeSlide.className = "bloxx-slide bloxx-slide-hide";
				this.body.style.overflow = this.oldBodyOverflow;
				if(window.xbTransitions && hasTransition(this.wrapper))
					on(this.wrapper, this.gTransitionEnd, this, false);
				else
					this.transitionEnd(this.wrapper);
				this.wrapper.className += " bloxx-wrapper-close";
				this.gridControls.className += " bloxx-wrapper-close";
				this.prevSlide =
				this.prevImage =
				this.nextSlide =
				this.prevImage = null;
				this.gridControls.removeChild(this.prevButton);
				this.gridControls.removeChild(this.nextButton);
			}
		},
		imageLoaded: function(e) {
	
			var t = (e.target || e.srcElement);
			// Are we looking at a grid or slide?
			if(/bloxx-anchor/.test(t.parentNode.className)) {
	
				// Get the elements we need
				var anchor = t.parentNode,
					thumbContainer = anchor.parentNode;
	
				// Remove the loader
				if(this.loader.parentNode == this.gridControls)
					this.gridControls.removeChild(this.loader);
				
				// Remove the listener
				removeEvt(t, "load", this, false);
				
				// Add titles and descriptions
				if(this.thumbTitles && anchor.getAttribute("title")) {
					var title = thumbContainer.appendChild(document.createElement("h2"));
					title.appendChild(document.createTextNode(anchor.getAttribute("title")));
				}
				else {
					thumbContainer.style.paddingBottom = this.margin + "px";
				}
				
				if(this.thumbDescription && anchor.getAttribute("data-content") && false) {
					var description = thumbContainer.appendChild(document.createElement("p"));
					description.appendChild(document.createTextNode(anchor.getAttribute("data-content")));
					style = description.style;
					if(title && description.previousSibling == title) {
						title.style.marginBottom = 0;
						style.marginTop = "0.5em";
					}
				}
				
				style = thumbContainer.style;
				style.position = "absolute";
				
				var i = thumbContainer._index;
				
				// Record the items by their columns
				this.itemsByColumn = this.itemsByColumn || {};
				this.itemsByColumn[i % this.columns] = this.itemsByColumn[i % this.columns] || {};
				
				// Alternate positioning. This will place each item at the highest point available
				// This may disrupt the apparent order of thumbs
				if(this.positioning === "compact") {
					var shortest = 0;
					// This item's in the first column, just add it to the list in order
					if(this.thumbs[i - this.columns] === undefined) {
						this.itemsByColumn[i % this.columns].item = thumbContainer;
						this.itemsByColumn[i % this.columns].height = thumbContainer.clientHeight + this.margin;
					// Find the shortest column and the item at the end of it
					} 
					else {
						for(var j = 0; j < this.columns; j++) {
							var a = this.itemsByColumn[j] ? this.itemsByColumn[j].height : 0,
								b = this.itemsByColumn[shortest] ? this.itemsByColumn[shortest].height : 0;
							if(a < b) {
								shortest = j;
							}
						}
						//var left = this.itemsByColumn[shortest].item.offsetLeft;
						var top = this.itemsByColumn[shortest].height;
						this.itemsByColumn[shortest].item = thumbContainer;
						this.itemsByColumn[shortest].height = this.itemsByColumn[shortest].height + thumbContainer.clientHeight + this.margin;
					}

					// If we're in the first row the top will be 0 and left will be thumbWidth * index
					style.top = this.thumbs[i - this.columns] ? top + "px" : "0px";
					style.left = this.thumbs[i - this.columns] ? (shortest * this.thumbWidth) + "px" : (i % this.columns * this.thumbWidth) + "px";
					
					// Calculate the height of the highest column
					//this.colHeights[i % this.columns] = this.colHeights[i % this.columns] + thumbContainer.clientHeight + 15;
				
					this.gridHeight = this.gridHeight || 0;
					//var height = this.itemsByColumn[shortest].offsetTop + this.itemsByColumn[shortest].clientHeight;							
					if(this.itemsByColumn[shortest].height > this.gridHeight)
						this.gridHeight = this.itemsByColumn[shortest].height;
					
				// Regular positioning. This will place each thumb in the grid column by column. Some columns may end 
				// longer than others
				} else {
					var height = this.itemsByColumn[i % this.columns].height || 0;
					style.top = this.thumbs[i - this.columns] ? height + "px" : "0px";
					style.left = (i % this.columns * this.thumbWidth) + "px";

					this.itemsByColumn[i % this.columns].height = height + thumbContainer.clientHeight + this.margin;
					
					this.gridHeight = this.gridHeight || 0;
					if(height > this.gridHeight)
						this.gridHeight = height;
				}
	
				if(this.showThumbs) {
					// Set the class with animations
					thumbContainer.className = "bloxx-thumb bloxx-thumb-animate";
	
					if(window.xbAnimations)
						on(thumbContainer, "webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd animationEnd", this, false);
					else
						this.animationEnd(thumbContainer);
				}
	
				// Add listeners to thumbs
				on(anchor, "click", this, false);
				
				this.grid.style.height = this.gridHeight + "px";
				
				// If we haven't reacehd the lazyload limit, add more thumbs
				if((i+1) % this.lazyloadLimit)
					this.addThumb();
				// Otherwise, run lazyload to check if more elements can be added
				else {
					this.lazyload();
					on(this.wrapper, "scroll", this, false);
				}
			}
	
			// If we're in Slide view
			if(/bloxx-image_img/.test(t.className)) {
				var image = t,
					imageDescWrap = image.parentNode,
					style,
                    slide;
				
				while(!(/bloxx-image-wrapper/.test(imageDescWrap.className)))
					imageDescWrap = imageDescWrap.parentNode;
				
				slide = imageDescWrap.parentNode;
				while(slide.nodeName.toLowerCase() != "figure")
					slide = slide.parentNode;
				
				style = imageDescWrap.style;
				
				// Check the image isn't a thumb
				if(image.parentNode.className == "bloxx-anchor") {
					// This thumb will have been added to the stack but not to the grid so should be removed 
					this.thumbs.pop();
					return;
				}
				
				// Remove the listener
				removeEvt(image, "load", this, false);
				if(this.loader.parentNode == this.gridControls)
					this.gridControls.removeChild(this.loader);
				
				style.webkitTransitionProperty = style.MozTransitionProperty = style.msTransitionProperty = style.OTransitionProperty = style.transitionProperty = "opacity";
				style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = "300ms";
	
				// Set the class of the wrapper so it becomes visible
				imageDescWrap.className = "bloxx-image-wrapper";
 
				// Trigger the active slide's animation and resize the appropriate slide
				if(this.activeSlide === slide/* && !(/bloxx-slide-active/.test(this.activeSlide.className))*/) {
					this.activeSlide.className += " bloxx-slide-active";
					this.resizeSlide(image, this.anchors[this.index]);
				}
				else if(this.prevSlide === slide)
					this.resizeSlide(image, this.anchors[this.index-1]);
				else if(this.nextSlide === slide)
					this.resizeSlide(image, this.anchors[this.index+1]);
			}
			
		},
		toggleDescription: function(t) {
			this.descriptionStatus = !this.descriptionStatus;

			while(t.className != "bloxx-description-large")
				t = t.parentNode;
	
			var figCaption = t,
				imageDescWrap = figCaption.parentNode,
				descriptionButton = figCaption.firstElementChild;
	
			var style = imageDescWrap.style;
			style.webkitTransitionProperty = style.MozTransitionProperty = style.msTransitionProperty = style.OTransitionProperty = style.transitionProperty = "width";
			style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = "300ms";
			
			if(this.descriptionStatus) {
				imageDescWrap.style.width = (imageDescWrap.clientWidth + 195 + 30) + "px";
				descriptionButton.title = this.hideDescriptionText;
				figCaption.style.overflow = "auto";
			}
			else {
				imageDescWrap.style.width = (this.currentImage.parentNode.clientWidth + 35 + 30) + "px";
				figCaption.style.overflow = "hidden";
				descriptionButton.title = this.showDescriptionText;
				descriptionButton.style.display = "none";
				descriptionButton.offsetHeight;
				descriptionButton.style.display = "block";
			}
			
			if(window.xbTransitions)
				on(imageDescWrap, this.gTransitionEnd, this, false)
			else
				this.transitionEnd(imageDescWrap);
			
			this.resize();
			
		},
		previous: function() {
			// If the slide is in the index
			if(this.index > 0) {
				removeEvt(this.slidesWrapper, this.gTransitionEnd, this, false);
				
				// Update index
				this.index--;
				this.slideShift--;
				this.isAnimating = true;
				
				if(this.nextSlide) {
					this.removeList.push(this.nextSlide);
				}
				
				// Start sliding
				this.slide(this.slideShift, 300);
				
				// Add another item at the very end
				this.newPrev = this.slidesWrapper.insertBefore(document.createElement("figure"), this.prevSlide);
				this.newPrev.className = "bloxx-slide bloxx-slide-prev";
				this.newPrev.style.left = -windowWidth()*(Math.abs(this.slideShift-1)) + "px";
				
				this.nextImage = this.activeSlide.getElementsByTagName("img")[0];
				// If we're not at the last slide (index = 0) then add the image into the new prevSlide
				// and enable the left arrow
				if(this.index) {
					this.prevImage = this.addImage(this.newPrev, this.index - 1);
				}
				
				this.nextSlide = this.activeSlide;
				this.activeSlide = this.prevSlide;
				this.prevSlide = this.newPrev;
				
				// When the animation ends, remove the old previous slide and move 
				// things back to where they were
				if(window.xbTransitions)
					on(this.slidesWrapper, this.gTransitionEnd, this, false)
				else
					this.transitionEnd(this.slidesWrapper);
			}
		},
		next: function() {
			if(this.index < this.length - 1) {
				removeEvt(this.slidesWrapper, this.gTransitionEnd, this, false);
				
				// Update index
				this.index++;
				this.slideShift++;
				this.isAnimating = true;
				
				if(this.prevSlide) {
					this.removeList.push(this.prevSlide);
				}
				
				// Start sliding
				this.slide(this.slideShift, 300);
				
				// Add another item at the very end
				this.newNext = this.slidesWrapper.appendChild(document.createElement("figure"));
				this.newNext.className = "bloxx-slide bloxx-slide-next";
				this.newNext.style.left = windowWidth()*(this.slideShift+1) + "px";
				
				this.prevImage = this.activeSlide.getElementsByTagName("img")[0];
				
				if(this.index < this.length-1) {
					this.nextImage = this.addImage(this.newNext, this.index + 1);
				}
				
				this.prevSlide = this.activeSlide;
				this.activeSlide = this.nextSlide;
				this.nextSlide = this.newNext;
				
				// When the animation ends, remove the old previous slide and move 
				// things back to where they were
				if(window.xbTransitions)
					on(this.slidesWrapper, this.gTransitionEnd, this, false)
				else
					this.transitionEnd(this.slidesWrapper);
			}
		},
		slide: function(index, speed) {
			var style = this.slidesWrapper.style;
				
			// set duration speed (0 represents 1-to-1 scrolling)
			style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = speed + "ms";
		
			// translate to given index position
			style.webkitTransform = "translate3d(" + -(index * windowWidth()) + "px,0,0)";
			style.msTransform = style.MozTransform = style.OTransform = "translateX(" + -(index * windowWidth()) + "px)";
		},
		slideEnd: function() {
			this.isAnimating = false;
			
			this.prevSlide.className = "bloxx-slide bloxx-slide-prev";
			this.activeSlide.className = "bloxx-slide bloxx-slide-active";
			this.nextSlide.className = "bloxx-slide bloxx-slide-next";
			
			// Once the slide animation is complete, set the positions of the items
			this.prevSlide.style.left = -windowWidth() + "px";
			this.activeSlide.style.left = "";
			this.nextSlide.style.left = windowWidth() + "px";
			
			// Move slideWrapper back to 0
			this.slide(0,0);
			
			if(!this.index) {
				this.prevImage = null;
				this.prevButton.className += " bloxx-disabled";
				this.prevButton.title = null;
				removeEvt(this.prevButton, "click", this, false);
			}
			else if(/bloxx-disabled/.test(this.prevButton.className)) {
				this.prevButton.className = "bloxx-prev";
				this.prevButton.title = this.prevImageText;
				on(this.prevButton, "click", this, false);
			}
			
			if(this.index == this.length - 1) {
				this.nextImage = null;
				this.nextButton.className += " bloxx-disabled";
				this.nextButton.title = null;
				removeEvt(this.nextButton, "click", this, false);
			}
			else if(/bloxx-disabled/.test(this.nextButton.className)) {
				this.nextButton.className = "bloxx-next";
				this.nextButton.title = this.nextImageText;
				on(this.nextButton, "click", this, false);
			}
			
			this.currentImage = this.activeSlide.getElementsByTagName("img")[0];
			if(this.currentImage && this.currentImage.src !== this.anchors[this.index].href) {
				var loadingImage = this.currentImage.cloneNode(false);
				on(loadingImage, "load", this, false);
				loadingImage.src = this.anchors[this.index].href;
			}
			
			// Update the title
			if(this.captions) {
				var title = this.anchors[this.index].title || undefined;
				
                // Remove the old title
                this.galleryTitle.innerHTML = "";
                
				if(title)
					this.galleryTitle.appendChild(document.createTextNode(title));
			}
			
			// Reset slideshift
			this.slideShift = 0;
			// And remove any old items
			while(this.removeList.length) {
				var el = this.removeList.pop();
				this.slidesWrapper.removeChild(el);
			}
		},
		animationEnd: function(t) {
			t.className = "bloxx-thumb bloxx-thumb-transition";
		},
		transitionEnd: function(t) {
			removeEvt(t, this.gTransitionEnd, this, false);
			// The element has been removed from the DOM
			if(!t.parentNode)
				return;
	
			// Hide the grid to prevent scrolling
			if(/bloxx-grid-wrapper/.test(t.className)) {
				this.wrapper.parentNode.removeChild(this.wrapper);
				this.gridControls.parentNode.removeChild(this.gridControls);
				if(this.slidesWrapper)
					this.slidesWrapper.parentNode.removeChild(this.slidesWrapper);
			}
			else if(/bloxx-slide-/.test(t.className)) {
				this.slidesWrapper.parentNode.removeChild(this.slidesWrapper);
				this.wrapper.style.overflow = "";
			}
			else if(/bloxx-grid bloxx-hide/.test(t.className)) {
				t.className += " bloxx-hidden";
				this.wrapper.style.overflow = "hidden";
			}
			else if(/bloxx-image-wrapper/.test(t.className)) {
				// Remove the animation from the slides wrapper
				var style = t.style;
				style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = "";
			}
			else if(/bloxx-slides-wrapper/.test(t.className)) {
				this.slideEnd();
			}
		},
		scroll: function(e) {
			var t = (e.target || e.srcElement);
			if(this.shortestColumn < t.scrollTop + windowHeight()) {
				this.addThumb();
				removeEvt(this.wrapper, "scroll", this, false);
			}
		},

        /*****************************************************************
        * The following three methods are based on Brad Birdsall's excellent Swipe
        *
        * Swipe 1.0
        *
        * Brad Birdsall, Prime
        * Copyright 2011, Licensed GPL & MIT
        * http://swipejs.com
        *****************************************************************/
 
		touchStart: function(e) {
			// Get the touch start points
			this.touch = {
				startX: e.touches[0].pageX,
				startY: e.touches[0].pageY,
				// set initial timestamp of touch sequence
				time: Number( new Date() )	
			};
			
			// used for testing first onTouchMove event
			this.touch.isScrolling = undefined;
			
			// reset deltaX
			this.touch.deltaX = 0;
			
		},
		touchMove: function(e) {
			// If we detect more than one finger or a pinch, don't do anything
			if(e.touches.length > 1 || e.scale && e.scale !== 1) {
				return;
			}
			this.touch.deltaX = e.touches[0].pageX - this.touch.startX;
			
			// determine if scrolling test has run - one time test
			if ( typeof this.touch.isScrolling == "undefined") {
				this.touch.isScrolling = !!( this.touch.isScrolling || Math.abs(this.touch.deltaX) < Math.abs(e.touches[0].pageY - this.touch.startY) );
			}
			
			// if user is not trying to scroll vertically
			if (!this.touch.isScrolling) {
								
				// prevent native scrolling 
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
				
				// increase resistance if first or last slide
				this.touch.deltaX = 
				this.touch.deltaX / 
				  ( (!this.index && this.touch.deltaX > 0               // if first slide and sliding left
					|| this.index == this.length - 1              		// or if last slide and sliding right
					&& this.touch.deltaX < 0                            // and if sliding at all
				  ) ?                      
				  ( Math.abs(this.touch.deltaX) / windowWidth() + 1 )   // determine resistance level
				  : 1 );                                          		// no resistance if false
				
				var style = this.slidesWrapper.style;
				
				// Set duration for 1-to-1 scrolling)
				style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = "0ms";
			
				// translate to touch position
				style.webkitTransform = "translate3d(" + (this.touch.deltaX - this.slideShift * windowWidth()) + "px,0,0)";
				style.msTransform = style.MozTransform = style.OTransform = "translateX(" + (this.touch.deltaX - this.slideShift * windowWidth()) + "px)";
			}
		},
		touchEnd: function(e) {
			
            // If we detect more than one finger or a pinch, don't do anything
            if(e.touches.length > 1 || e.scale && e.scale !== 1) {
                return;
            }
 
			// determine if slide attempt triggers next/prev slide
			var isValidSlide = 
				  Number(new Date()) - this.touch.time < 250      	// if slide duration is less than 250ms
				  && Math.abs(this.touch.deltaX) > 20               // and if slide amt is greater than 20px
				  || Math.abs(this.touch.deltaX) > windowWidth()/2, // or if slide amt is greater than half the width
		
			// determine if slide attempt is past start and end
				isPastBounds = 
				  !this.index && this.touch.deltaX > 0                          // if first slide and slide amt is greater than 0
				  || this.index == this.length - 1 && this.touch.deltaX < 0;    // or if last slide and slide amt is less than 0
			
			// if not scrolling vertically
			if (!this.touch.isScrolling) {
				// call slide function with slide end value based on isValidSlide and isPastBounds tests
				if(isValidSlide && !isPastBounds) {
					(this.touch.deltaX > 0 ? this.previous() : this.next());
				 }
				 else {
					this.slide(this.slideShift, 300);
				 }
		
			}
			this.touch = undefined;
		},
		keydown: function(e) {
			var key = e.which || e.keyCode;
			if(this.STATE == "slide" && !this.isAnimating) {
				if(key == 37) {
					this.previous();
				}
				else if(key == 39) {
					this.next();
				}
			}
			if(key == 27) {
				this.close(e);
			}
		},
		// Events code
		handleEvent: function(e) {
			var t;
			switch (e.type) {
				case "click": 
					t = (e.target || e.srcElement)
					if(t.className === "bloxx-close-grid")
						this.close(e);
					else if(/bloxx-anchor/.test(t.className) || /bloxx-anchor/.test(t.parentNode.className))
						this.zoom(e);
					else if(/bloxx-description/.test(t.className)) 
						this.toggleDescription(t);
					else if(t.className === "bloxx-prev")
						this.previous(t);
					else if(t.className === "bloxx-next")
						this.next(t);
					break;
				case "load": 
					this.imageLoaded(e); 
					break;
				case "touchstart": 
					this.touchStart(e); 
					break;
				case "touchmove": 
					this.touchMove(e); 
					break;
				case "touchend": 
					this.touchEnd(e); 
					break;
				case "webkitTransitionEnd":
				case "msTransitionEnd":
				case "oTransitionEnd":
				case "OTransitionEnd":
				case "otransitionend":
				case "transitionEnd":
				case "transitionend": 
					t = (e.target || e.srcElement); 
					this.transitionEnd(t); 
					break;
				case "webkitAnimationEnd": 
				case "mozAnimationEnd": 
				case "oAnimationEnd": 
				case "msAnimationEnd": 
				case "animationEnd": 
					t = (e.target || e.srcElement)
					this.animationEnd(t); 
					break;
				case "scroll": 
					this.scroll(e); 
					break;
				case "resize": 
				case "orientationchange": 
					this.resize(e);
				case "keydown":
					this.keydown(e);
			}
		}
		
	};
})();