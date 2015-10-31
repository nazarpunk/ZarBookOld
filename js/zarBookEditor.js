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
			name : "",
			description : "",
			copyright : ""
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
	saveAs(blob, name+".zb");
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
		edges : new vis.DataSet(this.data.edges),
	};
	var container = document.getElementById(id);
	var data = {
                nodes: this.vis.nodes,
                edges: this.vis.edges
    };
    var options = {
        edges: {
    		smooth: {
    			forceDirection: "none"
    		},
			arrows: {to : true }
        },

        interaction:{hover:true}
      };

	this.vis.network = new vis.Network(container, data, options);
	
	this.vis.network.on("select", function (e){
		$.publish("select",e);
	});
	this.vis.network.on("dragStart", function(e){
		if(e.nodes.length > 0 || e.edges.length > 0) $.publish("select",e);
	});
	
	this.vis.network.on("hoverNode", function (e){$("body").css("cursor","pointer"); });
	this.vis.network.on("blurNode", function (e){ $("body").css("cursor","default"); });
	this.vis.network.on("hoverEdge", function (e){ $("body").css("cursor","pointer"); });
	this.vis.network.on("blurEdge", function (e){ $("body").css("cursor","default"); });
};

zarBook.prototype.nodeText = function(id,text){
	this.data.nodesData[id].text = text;
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

zarBook.prototype.visNodeAddChildren = function(parent){
	var children = this.visNodeAdd();
	this.visEdgeAdd(parent,children);
};

zarBook.prototype.visNodeAddParent = function(parent){
	var children = this.visNodeAdd();
	this.visEdgeAdd(children,parent);
};

zarBook.prototype.visNodeUpdate = function(options){
	this.vis.nodes.update(options);
	this.data.nodes = this.vis.nodes.get();
};

zarBook.prototype.visNodePhysics = function(id,state){
	//log(this.data.nodesData[id])
	if (typeof state !== "boolean" ) return ("physics" in this.data.nodesData[id]) ? this.data.nodesData[id].physics : true;
	
	var dashes = (state) ? false : [5,5];
	this.data.nodesData[id].physics = state;
	this.visNodeUpdate({
		id: id,
		physics : state,
		shapeProperties:{borderDashes:dashes}
	});
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
			label : ""
		});
		this.data.nodesData[parent].out[children] = id;
		this.data.nodesData[children].in[parent] = id;
		this.data.edgesData[id] = {
			from: parent,
			to: children
		};
		this.data.edges = this.vis.edges.get();
	} catch (err) {
		console.log(err);
	}
};

zarBook.prototype.visEdgeUpdate = function(options){
	 this.vis.edges.update(options);
	 this.data.edges = this.vis.edges.get();
};

zarBook.prototype.visEdgeLabel = function(id,str){
	if (typeof str === "undefined") return this.data.edgesData[id].label;
	try {
		this.visEdgeUpdate({
			id:id,
			label : str,
			font: {align: 'middle'}
		});
		this.data.edgesData[id].label = str;
		
	} catch (err) {
		console.log(err);
	}
};

zarBook.prototype.visEdgeRemove = function(id){
	try {
		this.vis.edges.remove({id: id});
		this.data.edges = this.vis.edges.get();
		
		delete this.data.nodesData[this.data.edgesData[id].from].out[this.data.edgesData[id].to];
		delete this.data.nodesData[this.data.edgesData[id].to].in[this.data.edgesData[id].from];
		delete this.data.edgesData[id];
		
	} catch (err) {
		console.log(err);
	}
};


zarBook.prototype.visPhysics = function(state){
	if (typeof state !== "boolean" ) return console.log("visPhysics not boolean");
	 this.vis.network.setOptions({
	 	physics: {enabled: state}
	 });
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
		$("#zbeBookName").html( zb.getName() );
		$("#zbManager").fadeOut();
		$("#zbeNameWrap").slideDown();
		$(".zbeIniShow").fadeIn();
		zb.visDraw("canvas");
	});
	
//select event
	$.subscribe("select",function(e,obj){
		if (typeof obj === "undefined") obj = {nodes:[],edges:[]};
		
		if (obj.nodes.length > 0) {
			var id = obj.nodes[0];
			var nodeText = (typeof zb.data.nodesData[id].text === "undefined") ? "" : zb.data.nodesData[id].text;
			$("#zbeNodeDropdown").show();
			$(".zbeNodeNumber").html(id);
			$(".zbeNodeDataNumber").data("id",id);
			$(".zbeNodeValText").val(nodeText);
			
			//set node physics
			var link = $("#zbeNodePhysicsLink");
			if (zb.visNodePhysics(id)) {
				var str = link.data("strOff");
				link.html( str ).data("act",0);
			} else {
				var str = link.data("strOn");
				link.html( str ).data("act",1);;
			}
				
			
		} else {
			$("#zbeNodeDropdown").hide();
		}
		
		if (obj.edges.length > 0){
			var edgeText =  (obj.edges.length == 1) 
				? "Ребро&nbsp;"+ '<span class="badge">'+zb.data.edgesData[obj.edges[0]].from+'&rarr;'+zb.data.edgesData[obj.edges[0]].to+'</span>&nbsp'
				: "Рёбра&nbsp; ("+obj.edges.length+"шт.)";
			
			var edgesBadgesStr = "";
			var edgesInputStr = "";
			$.each(obj.edges,function(k,v){
				var edgeLabel = (typeof zb.data.edgesData[v].label === "undefined") ? "" : zb.data.edgesData[v].label;
				edgesBadgesStr += '<span class="badge">'+zb.data.edgesData[v].from+'&rarr;'+zb.data.edgesData[v].to+'</span>&nbsp';
				edgesInputStr += '<p><div class="input-group">\
					<span class="input-group-addon">\
					<span class="badge">'+zb.data.edgesData[v].from+'&rarr;'+zb.data.edgesData[v].to+'</span></span>\
					<input type="text" name="'+v+'" class="form-control" placeholder="'+edgeLabel+'" value="'+edgeLabel+'">\
					</div></p>';					
				});
			$(".zbeEdgesInputs").html(edgesInputStr);
			$(".zbeEdgesBadges").html(edgesBadgesStr);
			$(".zbeEdgesDataNumbers").data("id",$.toJSON(obj.edges));
			
			$("#zbeEdgeDropdown").show();
			
			$("#zbeEdgeDropdownTitle").html(edgeText);
		} else { 
			$("#zbeEdgeDropdown").hide();
		}

	});
	
//editor
 $("textarea").markItUp( {
    nameSpace:       "xbbcode", // Useful to prevent multi-instances CSS conflict
	previewParserPath:	'', // path to your XBBCode parser
	onShiftEnter:	{keepDefault:false, replaceWith:'[br /]\n'},
	onCtrlEnter:	{keepDefault:false, openWith:'\n[p]', closeWith:'[/p]\n'},
	onTab:			{keepDefault:false, openWith:'	 '},
	markupSet: [
		{name:'N', openWith:'[n=(!( class="[![Class]!]")!)]', closeWith:'[/n]' },
		{separator:'|' },
		{name:'H1', key:'1', openWith:'[h1(!( class="[![Class]!]")!)]', closeWith:'[/h1]'},
		{name:'H2', key:'2', openWith:'[h2(!( class="[![Class]!]")!)]', closeWith:'[/h2]'},
		{name:'H3', key:'3', openWith:'[h3(!( class="[![Class]!]")!)]', closeWith:'[/h3]'},
		{name:'H4', key:'4', openWith:'[h4(!( class="[![Class]!]")!)]', closeWith:'[/h4]'},
		{name:'H5', key:'5', openWith:'[h5(!( class="[![Class]!]")!)]', closeWith:'[/h5]'},
		{name:'H6', key:'6', openWith:'[h6(!( class="[![Class]!]")!)]', closeWith:'[/h6]'},
		{separator:'|' },
		{name:'P', openWith:'[p(!( class="[![Class]!]")!)]', closeWith:'[/p]' },
		{separator:'|' },
		{name:'B', key:'B', openWith:'(!([b]|!|[b])!)', closeWith:'(!([/b]|!|[/b])!)' },
		{name:'I', key:'I', openWith:'(!([i]|!|[i])!)', closeWith:'(!([/i]|!|[/i])!)' },
		{name:'U', key:'U', openWith:'(!([u]|!|[u])!)', closeWith:'(!([/u]|!|[/u])!)' },
		{separator:'' },
		{name:'UL', openWith:'[ul]\n', closeWith:'[/ul]\n' },
		{name:'OL', openWith:'[ol]\n', closeWith:'[/ol]\n' },
		{name:'LI', openWith:'[li]', closeWith:'[/li]' },
		//{separator:'' },
		//{name:'', key:'P', replaceWith:'[img src="[![Source:!:http://]!]" alt="[![Alternative text]!]" /]' },
		//{name:'', key:'L', openWith:'[a href="[![Link:!:http://]!]"(!( title="[![Title]!]")!)]', closeWith:'[/a]', placeHolder:'Your text to link...' },
		//{separator:'' },
		//{name:'', className:'clean', replaceWith:function(markitup) { return markitup.selection.replace(/\[(.*?)\]/g, "") } },
		//{name:'', className:'preview', call:'preview' }
	]
});

//editor previev 
	$("#zbeModalNodeEditPrevievLink").bind("click",function(e){
		var str = $("#zbeModalNodeEditArea").val();
		var obj = XBBCODE.process({text: str});
		if (obj.error == true){
			var strError = "";
			$.each(obj.errorQueue,function(k,v){
				strError += "<li>"+v+"</li>";
			});
			str = '<div class="alert alert-danger"><ul>'+strError+'</ul></div>';
			$("#zbeModalNodeEditPreviev").html(str);
		} else 
			str = obj.html;
			str = str.replace(/\r\n|\r|\n/g,"<br />");		
			$("#zbeModalNodeEditPreviev").html(str);
	});
	
//editor save 
	$("#zbeNodeEditSaveLink").bind("click",function(e){
		var id = $(this).data("id");
		var str = $("#zbeModalNodeEditArea").val();
		zb.nodeText(id,str);
		$("#zbeModalNodeEdit").modal("hide");
	});

	
//edges label 
	$("#zbeModalEdgesLabelForm").bind("submit",function(e){
		e.preventDefault();
		var obj = $(this).serializeArray();
		$.each(obj,function(k,v){
			zb.visEdgeLabel(v.name,v.value);			
		});
		$("#zbeModalEdgesLabel").modal("hide");
	});	
	
//edges remove 
	$("#zbeEdgesRemoveLink").bind("click",function(e){
		e.preventDefault();
		var id = $(this).data("id");
		id = $.parseJSON(id);
		$.each(id,function(k,v){
			zb.visEdgeRemove(v);
		});
		$("#zbeModalEdgesRemove").modal("hide");
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
		zb.visNodeAddChildren(parent);
	});
	
//node add parent 
	$("#zbeNodeAddParentLink").bind("click",function(e){
		e.preventDefault();
		var parent = $(this).data("id");
		zb.visNodeAddParent(parent);
	});
	
//node concat
	$("#zbeModalNodeConcatForm").submit(function(e){
		e.preventDefault();
		var err = 0;
		var inputParent = $("#zbeModalNodeConcatParentInput");
		var inputParentWrap = inputParent.closest(".form-group").removeClass('has-error');
		var valParent = inputParent.val();
		var helpParent = $("#zbeModalNodeConcatParentHelp").empty();
		
		var inputChildren = $("#zbeModalNodeConcatChildrenInput");
		var inputChildrenWrap = inputChildren.closest(".form-group").removeClass('has-error');
		var valChildren = inputChildren.val();
		var helpChildren = $("#zbeModalNodeConcatChildrenHelp").empty();
		
		var helpForm = $("#zbeModalNodeConcatHelp").empty();

		var nodeId = $(this).data("id");
		
		var valid = function(val){
			var parseVal = parseInt(val);
			var err = "valid";
			if (val=="") return "skip";
				
			if (isNaN(parseVal))
				return "Это значение не является целым числом!";
			if (parseVal == 0)
				return "Номерация параграфов начинается с единицы!";
			if (parseVal == nodeId)
				return "Нельзя связать параграф с самим собой!";			
			if (parseVal in zb.data.nodesData[nodeId].in || parseVal in zb.data.nodesData[nodeId].out)
				return "Эти параграфы уже связаны";			
			if (!(parseVal in zb.data.nodesData))
				return "Параграф с таким номером ещё не создан";
			return err;
		};
		
		var strParent = valid(valParent);
		if (strParent != "valid" && strParent != "skip") {
			inputParentWrap.addClass("has-error");
			helpParent.html(strParent);
		}

		var strChildren = valid(valChildren);
		if (strChildren != "valid" && strChildren != "skip") {
			inputChildrenWrap.addClass("has-error");
			helpChildren.html(strChildren);
		}

		if (strParent == "skip" && strChildren == "skip")
			return helpForm.html("Вы оставили оба поля пустыми и отправили форму! Why, Mr. Anderson?");
		
		if (parseInt(valParent) == parseInt(valChildren))
			return helpForm.html("Если Вы можете представить предкопотомка, то я искренне завидую Вашей фантазии.");
		
		if (strParent != "valid" && strParent != "skip" && strChildren != "valid" && strChildren != "skip")
			return helpForm.html("Форма заполнена неверно. Выпейте кофе и попытайтесь ещё раз.");
			
		if ((strParent != "valid" || strParent == "skip") && (strChildren != "valid" || strChildren == "skip"))
			return helpForm.html("Одно из значений заполнено неверно, проверьте ещё раз.");
		
		if (strParent == "valid") zb.visEdgeAdd(parseInt(valParent),nodeId);
		if (strChildren == "valid") zb.visEdgeAdd(nodeId,parseInt(valChildren));
		
		$("#zbeModalNodeConcat").modal("hide");
		
	});	
	
//node physics 
	$("#zbeNodePhysicsLink").bind("click",function(e){
		e.preventDefault();
		var self = $(this);
		var id = self.data("id");
		var act = self.data("act");
		
		if (act == 0){
			var str = self.data("act",1).data("strOn");
			var state = false; 
		} else {
			var str = self.data("act",0).data("strOff");
			var state = true;
		}
		$(this).html(str);
		zb.visNodePhysics(id,state);
	});


//node remove
	$("#zbeNodeRemoveLink").bind("click",function(){
		var id = $(this).data("id");
		zb.visNodeRemove(id);
		$('#zbeModalNodeRemove').modal('hide');
	});

//disable physics on modal
	$('.modal').on('show.bs.modal', function () {
  		zb.visPhysics(false);
  		$(this).find(".modalShowEmpty").empty();
	});
	$('.modal').on('hidden.bs.modal', function () {
  		zb.visPhysics(true);
	});
	
//book settings modal 
	$('#zbeModalBookSetting').on('show.bs.modal', function () {
		$("#zbeModalBookSettingNameInput").val(zb.getName());
		$("#zbeModalBookSettingDescriptionArea").val(zb.data.info.description);
		$("#zbeModalBookSettingCopyrightArea").val(zb.data.info.copyright);
		
	});
	
//book modal save 
	$("#zbeModalBookSettingForm").bind("submit",function(e){
		e.preventDefault();
		var name = $("#zbeModalBookSettingNameInput").val();
		zb.setName( name );
		$("#zbeBookName").text(name);
		
		zb.data.info.description = $("#zbeModalBookSettingDescriptionArea").val();
		zb.data.info.copyright = $("#zbeModalBookSettingCopyrightArea").val();
		$('#zbeModalBookSetting').modal("hide");
	});
	
//book modal play
	$('#zbeModalBookPlay').on('show.bs.modal', function () {
		zb.play({
			body : $("#zbeModalBookPlayBody"),
			header : $("#zbeModalBookPlayHeader"),
			footer : $("#zbeModalBookPlayFooter"),
			data : zb.data,
		});
		
	});
	

	

//book TEMP	
	$("#zbCreateBookFrm").submit(function(e){
		e.preventDefault();
		zb.setName($(this).find("input[type=text]").val());
		noty({text: "<b>"+zb.getName()+ "</b>" + " успешно создана"});
		$.publish("init");
	});
	
//book new	
	$("#zbeBookNewLink").bind("click",function(e){
		e.preventDefault();
		$("#zbeBookUploadFormInputFile").val("");
		window.location.reload();
	});

	$("#zbeSaveBtn").bind("click",function(e){
		e.preventDefault();
		zb.save();
	});
	

//book load
	$('#zbeBookUploadFormInputFile').change(function(){
    	$('#zbeBookUploadFormInputText').val($(this).val());
	}).trigger("change");
	
	$("#zbeBookUploadForm").submit(function(e) {
		e.preventDefault();
		var result = zb.getFile("zbeBookUploadFormInputFile");
		noty({text: "<b>"+result.filename+ "</b>" + " успешно загружен"});
	});
	
	
//refresh
	if( $("#zbeBookUploadFormInputFile").val() != "" ) {
		//$("#zbeBookUploadForm").trigger("submit");
	} else {
	//	$("#zbCreateBookFrm").trigger("submit");
	}
	
	$("#zbeBookUploadFormInputFile, #zbeBookUploadFormInputText").val("");
	
	
});
