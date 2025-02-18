$(function(){
	var n=0;
	var timer;
	
	$(".controller li").eq(n).find("a").addClass("active");
	$(".gallery li").eq(n).addClass("active");
	$(".banner .gallery li.active").css({opacity:1});
	
	$(".controller li a").click(function(){
		event.preventDefault ? event.preventDefault() : (event.returnValue = false);

		n=$(this).parent().index();
		
		$(".controller li a").removeClass("active");
		$(this).addClass("active");

		$(".gallery li").removeClass("active");
		$(".gallery li").eq(n).addClass("active");
		$(".banner .gallery li.active").animate({opacity:1}, 300, function(){
			for(var i=0; i<$(".banner .gallery li").length; i++){
				if($(".banner .gallery li").eq(i).hasClass("active") == false){
					$(".banner .gallery li").eq(i).css({opacity:0});
				}
			}
		});
		clearInterval(id);
		id=setInterval(bannerInterval, 6000);
	});
	id=setInterval(bannerInterval, 6000);
	
	function bannerInterval(){
		if(n < $(".banner .controller li").length-1){ n += 1; }
		else { n = 0; }

		$(".banner .controller li a").removeClass("active");
		$(".banner .gallery li").removeClass("active");
		$(".banner .controller li").eq(n).find("a").addClass("active");
		$(".banner .gallery li").eq(n).addClass("active");
		$(".banner .gallery li.active").animate({opacity:1}, 300, function(){
			for(var i=0; i<$(".banner .gallery li").length; i++){
				if($(".banner .gallery li").eq(i).hasClass("active") == false){
					$(".banner .gallery li").eq(i).css({opacity:0});
				}
			}
		});
	}
});