"use strict";
if (typeof window.zarBook === "undefined"){
	window.zarBook = function(){
	};
}

zarBook.prototype.play = function(obj){
	this.playData = {
		body : obj.body,
		header : obj.header,
		footer : obj.footer,
		data : obj.data,
	};
	var data = this.playData.data;
	var name = XBBCODE.process({text: data.info.name});
	this.playData.header.html(name.html);
	name = XBBCODE.process({text: data.info.copyright});
	this.playData.footer.html(name.html);
	
	var self = this;
	this.playData.body
		.unbind('click')
		.bind('click',function(e){
			var elem = $(e.target);
			if (elem.hasClass("zbNodeLink")){
				e.preventDefault();
				var id = elem.data("nodeId");
				self.playNode(id);
			}
		
		});
	
	
	//lets play!
	this.playNode("start");
};

zarBook.prototype.playNode = function(id){
	var data = this.playData.data;
	var text = ""
	if (typeof data.nodesData[id] !== "undefined")
		if (typeof data.nodesData[id].text == "undefined") text = "ОШИБКА!!1"; 
		else text = data.nodesData[id].text;
	
	if (id=="start") text = data.info.description;
	
	var str = XBBCODE.process({text: text});
	
	this.playData.body.html(str.html);
	
};
