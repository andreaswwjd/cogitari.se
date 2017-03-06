//Data
var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
        callback(null, xhr.response);
      } else {
        callback(status);
      }
    };
    xhr.send();
};

var is_touch_device = (function() {
  return 'ontouchstart' in window        // works on most browsers 
      || navigator.maxTouchPoints;       // works on IE10/11 and Surface
})();
if(is_touch_device){ console.log('Is touch device. Scroll paralax effect turned off.') }

var screen_width = screen.availWidth;
var screen_height = screen.availHeight;
var site_width = document.body.clientWidth;
var site_height = document.body.clientHeight;
var changePerspective = function(event){
	if(!is_touch_device){
		var window_mid = window.scrollY+screen.availHeight/2;
		d3.select('#content').style('perspective-origin', '0px '+window_mid+'px').style('perspective', '2000px');
	}
}

//Menu
var header = document.getElementsByTagName('header')[0];
var menu_icon = document.getElementById('menu');
menu_icon.onclick = function(){
	header.toggle();
}
header.open = function(){
	this.isOpen = true; 
	header.style.height = '100%';
}
header.close = function(){
	this.isOpen = false; 
	header.style.height = '2.5em';
}
header.toggle = function(){
	this.isOpen ? this.close() : this.open() ;
}


// var card_width = 244;
var card_width = 244;
var open_card_x = 0.05*site_width;
var flip_time = 600;
var selection = undefined;
var act_time = 0;
var animation_turnoff = false;

getJSON('js/data.json', function(err, data) {
	if (err) {
		console.log(err);
	} else {
		loadItems(data);
	}
});

var loadItems = function(items){
	d3.select('#menubar')
		.selectAll('a.menu')
		.data(items.sections.concat([items.about, items.contact]))
		.enter().append('a')
			.attr('class', 'menu')
			.on('click', function(d){ 
				var Y = document.getElementById(d.id).getClientRects()[0].top+window.scrollY;
				window.smoothScroll(Y-150, 800);
				header.close();
			})
			// .attr('href', function(d){ return ''; /*d.href*/ })
				.append('h2')
				.html(function(d,i){ return d.title });


	var overlay = d3.select("div#sections")
		.append('div')
		.attr('id', 'overlay')
		.on('click', function(){
			d3.selectAll('article.active').dispatch('click');
		});

	var activeboxes = d3.select("div#sections")
		.selectAll(".activebox")
		.data(items.sections)
		.enter().append('div')
		.attr('class', 'activebox')
		.attr('id', function(section){ return "activebox_"+section.id; })
		.style('position', 'absolute')
		.style('top', function(s,i){ return i*550+"px";});


	var sections = d3.select("div#sections")
		.selectAll("section")
		.data(items.sections)
		.enter().append("section")
		.attr('id', function(section){ return section.id; })
		.html(function(section){ return "<img class='title_img' style='position: absolute; top: -100px;' src='img/Title_"+section.title+".png'>"});
// <div id='activebox_"+section.id+"' class='activebox'></div>
	//Cards
	sections.each(function(section){
			
		d3.select(this).selectAll('article.card')
			.data(section.articles)
			.enter().append('article')
			.attr('class', 'card')
			
			.html(function(article) { return '<div class="article"><div class="paper"><h1>'+article.title+'</h1></div><div class="paper" style="height: 333px;"><div class="thumbnail"><img src="'+article.thumbnail+'"><hr><p><i>'+article.description+'</i></p></div><div class="content" style="display: none"><p>'+article.read_more+'</p></div></div></div><div class="paper article_content">'+article.content_html+'</div>'})
			// .style('transform', 'translateZ(-100px)')
			.style('left', function(article,i) {
				this.left = i*card_width;
				return this.left+'px';
			})
			.on('activate', function(article){
				this.active = true;
				console.log('activebox_'+article.type+'_section');
				document.getElementById('activebox_'+article.type+'_section').appendChild(this);
			})
			.on('deactivate', function(article){
				this.active = false;
				document.getElementById(article.type+'_section').appendChild(this);
			})
			.on('blur', function(){
				d3.select('#logo_banner').style('filter', this.opening ? 'blur(2px)' : 'blur(0px)')
				d3.selectAll('section').style('filter', this.opening ? 'blur(2px)' : 'blur(0px)')
			})
			.on('no_animation', function(){
				var self = this;
				overlay.style('z-index', self.active ? 1 : 0).style('opacity', self.active ? 0.6 : 0);
				d3.select(self).attr('class', self.active ? 'card active open' : 'card');
				d3.select(self).selectAll('div.paper').style("box-shadow", self.active ? "10px 23px 50px -10px rgba(0, 0, 0, 0.26)" : "0 3px 6px rgba(0, 0, 0, 0.16)");
				d3.select('#logo_banner').style('filter', this.active ? 'blur(2px)' : 'blur(0px)')
				d3.selectAll('section').style('filter', this.active ? 'blur(2px)' : 'blur(0px)')
				d3.select(self).selectAll('div.content').style("display", self.active ? 'block': 'none');
				d3.select(self)
					.transition().duration(flip_time)
					.styleTween("left", function(d,i) {
						console.log('left')
						var tx = d3.interpolate(d.index*card_width, open_card_x);
					    return function(t) {
					        return self.active ? tx(t)+"px":tx(1-t)+"px";
					    };
					})
					
			})
			.on('click', function(d){
				var self = this;
				act_time = Date.now();
				if(animation_turnoff){
					!this.active ? d3.select(self).dispatch('activate') : d3.select(self).dispatch('deactivate'); 
					d3.select(self).dispatch('no_animation');
				}else{
					
					!this.active ? d3.select(self).dispatch('activate') : 'Deactivation occures later at end of animation'; 

					//Shadows
					d3.select(self).selectAll('div.paper')
						.transition().duration(flip_time)
						.on('start', function(){
							self.opening = !self.isOpen;
							self.closing = self.isOpen;
							d3.select(self).dispatch('blur')

							if( self.opening ){
								overlay.style('z-index', 1).style('opacity', 0.6);
								d3.select(self).attr('class', 'card active');
							}else{
								overlay.style('opacity', 0);
								d3.select(self).attr('class', 'card active');
							}	
						})
						// .html('<div class="thumbnail"></div><hr>')
						.styleTween("background", function() {
						    var i = d3.interpolate('#ffffff','#949494');
						    return function(t) {
						        return i((1-Math.cos(t*2*Math.PI))/2); 
						    };
						})
						.styleTween("box-shadow", function() { 
							return function(){ return self.opening ? "10px 23px 50px -10px rgba(0, 0, 0, 0.26)" : "0 3px 6px rgba(0, 0, 0, 0.16)"; } 
						});
					//Img
					d3.select(self).selectAll('img')
						.transition().duration(flip_time)
						.styleTween("-webkit-filter", function(){
							var br = d3.interpolate('brightness(100%)', 'brightness(5%)');
							return function(t) {
						        return br((1-Math.cos(t*2*Math.PI))/2); 
						    };
						});
					//Content
					d3.select(self).selectAll('div.thumbnail')
						.transition().duration(flip_time)
						.styleTween("display", function(){
							return function(t) {
						        return t>0.5&&self.opening || (1-t)>0.5&&self.closing ? 'none': 'block';
						    };
						});
					d3.select(self).selectAll('div.content')
						.transition().duration(flip_time)
						.styleTween("display", function(){
							return function(t) {
						        return t>0.5&&self.opening || (1-t)>0.5&&self.closing ? 'block': 'none';
						    };
						});

					// Transform
					d3.select(self)
						// .attr('class', 'card active')
						.transition().duration(flip_time)
						.styleTween("transform", function() {
							var tf_ry = d3.interpolate(0, 180);
							var tf_tz = d3.interpolate(0, 30);
							// var tf_sc = d3.interpolate(1, 1.2);
						    return function(t) {
						    	var rt = t>0.5 ? t-1 : t;
						    	// var xt = t<0.5? 0 : t*2-1;
						    	// var xxt = t<0.5? t*2 : 1;
						        return self.opening ? 
						        	"rotateY(" + tf_ry(rt) + "deg) translateZ("+tf_tz(t)+"px)" : //open
						        	"rotateY(" + tf_ry(rt*-1) + "deg) translateZ("+tf_tz(1-t)+"px)" ; //close

						        	// "rotateY(" + tf_ry(rt) + "deg) scale("+tf_sc(t)+")" : //open
						        	// "rotateY(" + tf_ry(rt*-1) + "deg) scale("+tf_sc(1-t)+")" ; //close
						    };
						})
						.styleTween("left", function(d,i) {
							var tx = d3.interpolate(this.left, open_card_x);
						    return function(t) {
						        return self.opening ? 
						        	tx(t)+"px":
						        	tx(1-t)+"px";
						    };
						})
						.on('end', function() {
							act_time = Date.now()-act_time;
							if (act_time>flip_time*1.2) {
								animation_turnoff = confirm(act_time+'ms: Wow, that was hacky.. Wanna turn off transitions?');;
							}
							self.opening = false;
							self.closing = false;
							self.isOpen = !self.isOpen;
							if(!self.isOpen){
								d3.select(self).attr('class', 'card');
								overlay.style('z-index', 0).style('opacity', 0);
								d3.select(self).dispatch('deactivate')
							}else{
								d3.select(self).attr('class', 'card active open');
							}
						});
				}
			});
		d3.select(this)
			.on('touchstart', function(){
				!this.touchstart ? this.touchstart = {moveX: 0}: 'pass';
				this.touchstart.x = d3.event.touches[0].clientX;
				this.touchstart.y = d3.event.touches[0].clientY;
				this.touchstart.dir = undefined;
				console.log(this.touchstart)
			})
			.on('touchmove', function(){
				// console.log(d3.event.touches[0].clientX - this.touchstart.x + (this.touchstart.moveX || 0))
				var moveX = d3.event.touches[0].clientX - this.touchstart.x;
				var moveY = d3.event.touches[0].clientY - this.touchstart.y;
				if(!this.touchstart.dir && moveX*moveX > 25){ this.touchstart.dir = 'x'; }
				if(!this.touchstart.dir && moveY*moveY > 25){ this.touchstart.dir = 'y'; }
				// moveX += this.touchstart.moveX;
				if(this.touchstart.dir == 'x'){
					d3.event.preventDefault();
					// d3.select('#'+section.id).selectAll('.card').style('margin-left', (moveX + this.touchstart.moveX || moveX)+'px');
					d3.select('#'+section.id).selectAll('.card').style('left', function(){console.log(this.left); return (this.left + moveX )+'px'});
				}
			})
			.on('touchend', function(){
				if(this.touchstart.dir == 'x'){
					console.log(d3.event)
					var moveX = d3.event.changedTouches[0].clientX - this.touchstart.x;

					// var moveX = d3.event.changedTouches[0].clientX - this.touchstart.x + this.touchstart.moveX;
					console.log(Math.round(moveX/card_width))
					// if(moveX*moveX> 100*100){
						var n = Math.round(moveX/card_width);

						d3.select('#'+section.id).selectAll('.card').transition().duration(300).styleTween('left', function(){
							var l = d3.interpolate(this.left+moveX, this.left+(n*card_width));
							this.left += n*card_width;
						    return function(t) {
						        return l(t)+"px";
						    };
						});
						// d3.select('#'+section.id).selectAll('.card').style('left', function(){ return this.left +'px'});
					// }else{
					// 	// d3.select('#'+section.id).selectAll('.card').style('left', function(){ this.left += moveX; return this.left +'px'});

					// 	d3.select('#'+section.id).selectAll('.card').transition().duration(300).styleTween('left', function(){
					// 		var l = d3.interpolate(this.left+moveX, this.left);
					// 	    return function(t) {
					// 	        return l(t)+"px";
					// 	    };
					// 	});
					// }
					// this.touchstart.moveX = moveX;

				}
			});
	});
}