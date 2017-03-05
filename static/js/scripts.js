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

var active = false;
var screen_width = screen.availWidth;
var screen_height = screen.availHeight;
// document.body.style.width = screen_width+'px';
// document.getElementsByTagName('header')[0].style.width = screen_width+'px';
var site_width = document.body.clientWidth;
var site_height = document.body.clientHeight;
var scrolling = function(event){
	if(active){
		// event.bubbles = false;
		event.preventDefault();
		event.stopPropagation();
		// d3.select('.active').style('margin-top', window.scrollY+'px')
	}
	var window_mid = window.scrollY+screen.availHeight/2;
	d3.select('#content').style('perspective-origin', '0px '+window_mid+'px').style('perspective', '2000px');

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
			.attr('href', function(d){ return d.href })
			.attr('class', 'menu')
			.append('h2')
			.html(function(d,i){ return d.title });


	var overlay = d3.select("div#sections")
		.append('div')
		.attr('id', 'overlay')
		.on('click', function(){
			d3.selectAll('article.active').dispatch('click');
		});

	var activebox = d3.select("div#sections")
		.append('div')
		.attr('id', 'activebox')
		.style('position', 'absolute');


	var sections = d3.select("div#sections")
		.selectAll("section")
		.data(items.sections)
		.enter().append("section")
		.attr('id', function(section){ return section.id; });

	//Cards
	sections.each(function(section){
			
		d3.select(this).selectAll('article.card')
			.data(section.articles)
			.enter().append('article')
			.attr('class', 'card')
			
			.html(function(article) { return '<div class="article"><div class="paper"><h1>'+article.title+'</h1></div><div class="paper" style="height: 333px;"><div class="thumbnail"><img src="'+article.thumbnail+'"><hr><p><i>'+article.description+'</i></p></div><div class="content" style="display: none"><p>'+article.read_more+'</p></div></div></div><div class="paper article_content">'+article.content_html+'</div>'})
			// .style('transform', 'translateZ(-100px)')
			.style('left', function(article,i) {
				return i*card_width+'px';
			})
			.on('activate', function(article){
				this.active = true;
				document.getElementById('activebox').appendChild(this);
				active = true;
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
						var tf_tz = d3.interpolate(0, 100);
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
						var tx = d3.interpolate(d.index*card_width, open_card_x);
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
		var touchstart = {x:0,y:0};
		var direction = undefined;
		d3.select(this).selectAll('article.card')
			.on('touchstart', function(){
				touchstart = {
					x: d3.event.touches[0].clientX,
					y: d3.event.touches[0].clientY
				};
			})
			.on('touchmove', function(){
				var moveX = d3.event.touches[0].clientX - touchstart.x;
				var moveY = d3.event.touches[0].clientY - touchstart.y;
				if(!direction && moveX*moveX > 25){
					direction = 'x';
				}
				if(!direction && moveY*moveY > 25){
					direction = 'y';
				}
				if(direction == 'x'){
					d3.event.preventDefault();
					d3.select('#'+section.id).selectAll('.articles').style('left', moveX+'px');
					console.log(('#'+section.id));
				}
			})
			.on('touchend', function(){
				if(direction == 'x'){
					var moveX = d3.event.changedTouches[0].clientX - touchstart.x;
					console.log(Math.round(moveX/card_width))
					if(moveX*moveX> 100*100){
						var n = Math.round(moveX/card_width)*card_width;

						d3.select('#'+section.id).selectAll('.articles').style('left', function(){return n ? n+'px' : '0px'});
					}
					direction = undefined;
				}
			});
	});
}