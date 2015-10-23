"use strict";
function log(){Function.prototype.apply.apply(console.log, [console, arguments]);}

if (window.File && window.FileReader && window.FileList && window.Blob) {} else {
  alert('Ваш браузер морально устарел, обновите пожалуйста!');
};

//tiny pub/sub from https://github.com/cowboy/jquery-tiny-pubsub
(function($){
 	var o = $({});
	$.subscribe = function() { o.bind.apply( o, arguments ); };
	$.unsubscribe = function() { o.unbind.apply( o, arguments ); };
	$.publish = function() { o.trigger.apply( o, arguments ); };
})(jQuery);

function transliterate(text, engToRus){
	var	rus = "щ   ш  ч  ц  ю  я  ё  ж  ъ  ы  э  а б в г д е з и й к л м н о п р с т у ф х ь".split(/ +/g),
		eng = "shh sh ch cz yu ya yo zh _ y- e- a b v g d e z i j k l m n o p r s t u f x _".split(/ +/g);
	for(var x = 0; x < rus.length; x++) {
		text = text.split(engToRus ? eng[x] : rus[x]).join(engToRus ? rus[x] : eng[x]);
		text = text.split(engToRus ? eng[x].toUpperCase() : rus[x].toUpperCase()).join(engToRus ? rus[x].toUpperCase() : eng[x].toUpperCase());	
	}
	return text;

} 

window.zarBook = function(){
	this.data = {
		info : {
			name : ""
		},
		nodes : {},
		edges : {},
		nodesData : {},
		edgesData : {}
	};
};

zarBook.prototype.setName = function(name){
	var name = name || "Ещё одна КНИ";
	this.data.info.name  = name;
	return name;
};

zarBook.prototype.getName = function(){
	return this.data.info.name;
};

zarBook.prototype.save = function(){
	var j = $.toJSON(this.data);
	var blob = new Blob([j], {type: "text/plain;charset=utf-8"});
	var name = transliterate(this.getName());
	name = name.replace(/[^-_a-z0-9]/gi, '_').toLowerCase();
	saveAs(blob, name+".txt");
};

zarBook.prototype.getFile = function (id) {          
	var input = document.getElementById(id);
	if (!input.files) {
		alert("This browser doesn't seem to support the `files` property of file inputs.");
    }
    else if (!input.files[0]) {
      alert("Please select a file before clicking 'Load'");               
    }
    else {
		var t = this;
		var file = input.files[0];
      	var fr = new FileReader();
		var err = false;
		      	
      	fr.onload = function(e){
      		t.load(file.name,e.target.result);
      	};
      	
   		fr.readAsText(file);

		return {filename:file.name,error:false};

    }
    
};

zarBook.prototype.load = function (name,str){
	var obj = $.parseJSON(str);
	$.extend(this.data,obj);
	//this.data = obj;
	this.data.info.filename = name;
	$.publish("init");
};

zarBook.prototype.visDraw = function(id){
	this.vis = {
		nodes : new vis.DataSet(this.data.nodes),
		edges : new vis.DataSet(),
	};
	var container = document.getElementById(id);
	var data = {
                nodes: this.vis.nodes,
                edges: this.vis.edges
    };
    var options = {
        edges: {
          smooth: true,
          arrows: {to : true }
        }
      };
	this.vis.network = new vis.Network(container, data, options);
	
	this.vis.network.on("select", function (e){
		$.publish("select",e);
	});
	this.vis.network.on("dragStart", function(e){
		if(e.nodes.length > 0 || e.edges.length > 0) $.publish("select",e);
	});
	
};

zarBook.prototype.visNodeAdd = function(){
	var arr = this.data.nodesData;

	for(var id=1; ;id++){
		if (!(id in arr)) break;
	}
	
	try {
		this.vis.nodes.add(
    		{
    			id: id,
    			label: id,
    			title: "Параграф "+id
    		}
		);
		this.data.nodesData[id] = {in:{},out:{}};
		this.data.nodes = this.vis.nodes.get();
		return id;
		
	} catch (err) {
		console.log(err);
	}
};

zarBook.prototype.visNodeAddTo = function(parent){
	var children = this.visNodeAdd();
	this.visEdgeAdd(parent,children);
};

zarBook.prototype.visNodeRemove = function(id){
	try {
		var self = this;
		this.vis.nodes.remove({id: id});
		
		$.each(this.data.nodesData[id].in , function(k,v){
			delete self.data.nodesData[k].out[id];
			self.visEdgeRemove(v);
			
		});
		$.each(this.data.nodesData[id].out , function(k,v){
			delete self.data.nodesData[k].in[id];
			self.visEdgeRemove(v);
		});
		
		delete this.data.nodesData[id];
		this.data.nodes = this.vis.nodes.get();
		$.publish("select");
	}
	catch (err) {
		console.log(err);
	}
};


zarBook.prototype.visEdgeAdd = function(parent,children){
	var arr = this.data.edgesData;

	for(var id=1; ;id++){
		if (!(id in arr)) break;
	}
	try {
		this.vis.edges.add({
			id : id,
			from : parent,
			to : children,
		});
		this.data.nodesData[parent].out[children] = id;
		this.data.nodesData[children].in[parent] = id;
		this.data.edgesData[id] = 0;
		this.data.edges = this.vis.edges.get();
	} catch (err) {
		console.log(err);
	}
};

zarBook.prototype.visEdgeUpdate = function(options){
	 this.vis.edges.update(options);
};

zarBook.prototype.visEdgeRemove = function(id){
	try {
		this.vis.edges.remove({id: id});
		delete this.data.edgesData[id];
		this.data.edges = this.vis.edges.get();
	}
	catch (err) {
		console.log(err);
	}
};

$(function(){

	
	$.extend($.noty.defaults,{
    	type: 'information',
    	layout: 'bottomRight',
    	timeout: 5000,
    	text: '', // can be html or string
    	force: false, // adds notification to the beginning of queue when set to true
    	modal: false,
		animation   : {
			open  : 'animated bounceInRight',
			close : 'animated bounceOutRight',
			easing: 'swing',
			speed : 500
		}
	});

//init	
	var zb = new zarBook();
	
	$.subscribe("init",function(e){
		$("#zbeName").html( zb.getName() );
		$("#zbManager").fadeOut();
		$("#zbeNameWrap").slideDown();
		$("#zbeSaveBtn,#zbeNewBtn").fadeIn();
		zb.visDraw("canvas");
	});
	
//select event
	$.subscribe("select",function(e,obj){
		if (typeof obj === "undefined") obj = {nodes:[],edges:[]};
		
		if (obj.nodes.length > 0) {
			var id = obj.nodes[0];
			$("#zbeNodeDropdown").show();
			$(".zbeNodeNumber").html(id);
			$(".zbeNodeDataNumber").data("id",id);
		} else {
			$("#zbeNodeDropdown").hide();
		}
		
		if (obj.edges.length > 0){
			$("#zbeEdgeDropdown").show();
		} else { 
			$("#zbeEdgeDropdown").hide();
		}

		//log(obj);
	});
	
//node add
	$("#zbeNodeAddLink").click(function(e){
		e.preventDefault();
		zb.visNodeAdd();
	});	
	
//node add children 
	$("#zbeNodeAddChildrenLink").bind("click",function(e){
		e.preventDefault();
		var parent = $(this).data("id");
		zb.visNodeAddTo(parent);
	});
	
//node remove
	$("#zbeNodeRemoveLink").bind("click",function(){
		var id = $(this).data("id");
		zb.visNodeRemove(id);
		$('#zbeModalNodeRemove').modal('hide');
	});


	
	$("#zbCreateBookFrm").submit(function(e){
		e.preventDefault();
		zb.setName($(this).find("input[type=text]").val());
		noty({text: "<b>"+zb.getName()+ "</b>" + " успешно создана"});
		$.publish("init");
	}).trigger("submit")
	;
	
	$("#zbeNewBtn").bind("click",function(e){
		e.preventDefault();
		$("#zbUploadFormInput").val("");
		window.location.reload();
	});

	$("#zbeSaveBtn").bind("click",function(e){
		e.preventDefault();
		zb.save();
	});
	
	$("#zbUploadForm").submit(function(e) {
		e.preventDefault();
		var result = zb.getFile("zbUploadFormInput");
		noty({text: "<b>"+result.filename+ "</b>" + " успешно загружен"});
	});
	
	if( $("#zbUploadFormInput").val() != "" ) {
		$("#zbUploadForm").trigger("submit");
	}


	

//change name	
	var i = $("#zbeNameChButton").data("editTxt");
	$("#zbeNameChButton").html(i).click(function(e){
		var act = $(this).data("act");
		var block = $("#zbeName");
		var input = $("#zbenameChInput");
		var bookName = block.hide().text();
		
		if (act=="edit") {
			var name = $(this).data("saveTxt");
			$(this).text( name ).data("act","save");
			input.show().val(bookName);
		} else {
			var data = $(this).data("editTxt");
			$(this).html( data ).data("act","edit");
			var name = input.hide().val();
			block.show().text( name );
			zb.setName(name);
			noty({type:"alert",text:"Название изменено"});
		}
	});
});
