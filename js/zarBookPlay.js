"use strict";
if (typeof window.zarBook === "undefined"){
	window.zarBook = function(){
	};
}

zarBook.prototype.play = function(obj){
	this.playData = {
		body : obj.body,
		header : obj.header,
		data : obj.data,
	};
	var data = this.playData.data;
	var name = data.info.name;
	this.playData.header.html(name);
	
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
	this.playNode(0);
};

zarBook.prototype.playNode = function(id){
	var data = this.playData.data;
	var text = "";
	if (typeof data.nodesData[id] !== "undefined")
		if (typeof data.nodesData[id].text == "undefined") text = "ОШИБКА!!1"; 
		else text = data.nodesData[id].text;
		
	var obj = XBBCODE.process({text: text});
	var str = obj.html.replace(/\r\n|\r|\n/g,"<br />");
	this.playData.body.html(str);	
};
