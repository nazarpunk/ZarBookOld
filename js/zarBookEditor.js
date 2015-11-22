"use strict";
function log(){Function.prototype.apply.apply(console.log, [console, arguments]);}

if (window.File && window.FileReader && window.FileList && window.Blob) {} else {
  alert('Ваш браузер морально устарел, обновите пожалуйста!');
};

//https://github.com/cowboy/jquery-tiny-pubsub
(function($){
 	var o = $({});
	$.subscribe = function() { o.bind.apply( o, arguments ); };
	$.unsubscribe = function() { o.unbind.apply( o, arguments ); };
	$.publish = function() { o.trigger.apply( o, arguments ); };
})(jQuery);

//http://javascript.ru/forum/168115-post5.html
String.prototype.translit = function(text, engToRus){
	var text = this;
	var	rus = "щ   ш  ч  ц  ю  я  ё  ж  ъ  ы  э  а б в г д е з и й к л м н о п р с т у ф х ь".split(/ +/g),
		eng = "shh sh ch cz yu ya yo zh _ y- e- a b v g d e z i j k l m n o p r s t u f x _".split(/ +/g);
	for(var x = 0; x < rus.length; x++) {
		text = text.split(engToRus ? eng[x] : rus[x]).join(engToRus ? rus[x] : eng[x]);
		text = text.split(engToRus ? eng[x].toUpperCase() : rus[x].toUpperCase()).join(engToRus ? rus[x].toUpperCase() : eng[x].toUpperCase());	
	}
	return text;
};
//php-like matches
String.prototype.matches = function(re){
	var arr;
	var str = this;
	var obj = {
		0 : new Array,
		1 : new Array
	};
	var i = 0;
	while ((arr = re.exec(str)) != null){
		obj[0][i]=arr[1];
		obj[1][i]=arr[0];
		i++;
	};
	
	return obj;
};

Array.prototype.toObject = function(obj) {
	obj = obj || {};
	var val = obj.value || 0;

	var obj = {};
	var length = this.length;
	for(var i=0; i < length ; i++) {
		obj[this[i]] = val;
	}
	return obj;
};


//http://habrahabr.ru/post/248229/
Array.prototype.intersect = function(B) {
	var A = this;
	var m = A.length, n = B.length, c = 0, C = [];
	for (var i = 0; i < m; i++)
	{ 
		var j = 0, k = 0;
		while (B[j] !== A[ i ] && j < n) j++;
		while (C[k] !== A[ i ] && k < c) k++;
		if (j != n && k == c) C[c++] = A[ i ];
	}
	return C;
};
Array.prototype.diff = function(B) {
	var A = this;
	var M = A.length, N = B.length, c = 0, C = [];
	for (var i = 0; i < M; i++)
	{
		var j = 0, k = 0;
		while (B[j] !== A[ i ] && j < N) j++;
		while (C[k] !== A[ i ] && k < c) k++;
		if (j == N && k == c) C[c++] = A[ i ];
	}
	return C;
};
Array.prototype.sum = function(B) {
	var A = this;
	var M = A.length, N = B.length, count = 0, C = [];
	C = A;
	count = M;
	var cnt = 0;
	for (var i=0;i<N;i++)
	{ 
		var plus = false;
		for (var j=0;j<M;j++)
			if (C[j] == B[i]) {plus = true; break;}
		if (plus === false) C[count++] = B[i];
	}
	return C;
};
Array.prototype.diffSym = function(B) {
	var A = this;
	var M = A.length, N = B.length, c = 0, C = [];
	for (var i = 0; i < M; i++)
	{
		var j = 0, k = 0;
		while (B[j] !== A[ i ] && j < N) j++;
		while (C[k] !== A[ i ] && k < c) k++;
		if (j == N && k == c) C[c++] = A[ i ];
	}
	for (var i = 0; i < N; i++)
	{
		var j = 0, k = 0;
		while (A[j] !== B[ i ] && j < M) j++;
		while (C[k] !== B[ i ] && k < c) k++;
		if (j == M && k == c) C[c++] = B[ i ];
	}
	return C;
};

//book core
window.zarBook = function(){
	this.data = {
		info : {
			name : ""
		},
		nodes : {},
		nodesData : {},
		
		edges : {},
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
	var name = this.getName().translit();
	name = name.replace(/[^-_a-z0-9]/gi, '_').toLowerCase();
	saveAs(blob, name+".zb");
};

zarBook.prototype.getFile = function (id) {
	var input = document.getElementById(id);
	if (!input.files) {
		alert("This browser doesn't seem to support the `files` property of file inputs.");
	} else if (!input.files[0]) {
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

zarBook.prototype.nodeText = function(id,text,add){
	if (typeof text === "undefined") return this.data.nodesData[id].text;
	if (add === true) this.data.nodesData[id].text += text;
	else this.data.nodesData[id].text = text;
};

zarBook.prototype.nodeLabel = function(id,str){
	if (typeof str === 'undefined') return this.data.nodesData[id].label; 
	this.data.nodesData[id].label = str;
	var label = (str=="") ? id : id+'\n'+str; 
	
	this.visNodeUpdate({
		id:id,
		label: label
	});
};


zarBook.prototype.nodeParse = function(obj){
	var nodeId = obj.id;
	var nodeText = obj.text;
	var re = /\[n=(\d+)\]/g;
	var reSelf = new RegExp('\\[n='+nodeId+'\\]','g');
	var nodes = this.data.nodesData;
	var nodeData = nodes[nodeId];
	
	//new node replace
	while (nodeText.match(/\[n=\]/g) != null){
		nodeText = nodeText.replace("[n=]","[n="+this.nodeUniqId(nodeText.matches(re)[0].toObject())+"]");
	}

	//parse bb
	var obj = XBBCODE.process({text: nodeText});
	//self link match
	if (reSelf.test(nodeText)) {
		obj.error = true;
		obj.errorQueue.push('Присутствует ссылка на самого себя');
	}
	if (obj.error == true) return {
		error: true,
		errorQueue : obj.errorQueue
	};
	
	
	var nodeHtml = obj.html.replace(/\r\n|\r|\n/g,"<br />");
	
	//return
	var nodeOut = Object.keys(nodeData.out);
	var nodesMatch = nodeText.matches(re)[0];
	
	var nodesRemove = nodeOut.diff(nodesMatch);
	var nodesAdd = nodesMatch.diff(Object.keys(nodes));
	var nodesLink = nodesMatch.diff(nodesAdd).diff(nodeOut);
	
	return {
		text: nodeText,
		html: nodeHtml,
		error: false,
		nodesRemove: nodesRemove,
		nodesAdd: nodesAdd,
		nodesLink: nodesLink
	};	

};

zarBook.prototype.nodeExist = function(id){
	return (id in this.data.nodesData);
};

zarBook.prototype.nodeUniqId = function(obj){
	var exc = obj || {};
	var nodes = this.data.nodesData;
	
	for(var id=1; ;id++){
		if (!(id in nodes) && !(id in exc)) break;
	}
	return id;
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
	var color = {
		def : { //default
			background : 'rgb(151,194,252)',
			border : 'rgb(43,124,233)',
			hover: {
				background: 'rgb(210,229,255)',
				border : 'rgb(43,124,233)'
			},
			highlight: {
				background: 'rgb(210,229,255)',
				border : 'rgb(43,124,233)'
			}
		},
		yellow : {
			background: 'rgb(240, 173, 78)',
			border: 'rgb(238, 162, 54)',
			hover: {
				background: 'rgb(236, 151, 31)',
				border: 'rgb(213, 133, 18)',
			},
			highlight: {
				background: 'rgb(236, 151, 31)',
				border: 'rgb(152, 95, 13)'
			}
		},
		red : {
			background: 'rgb(217, 83, 79)',
			border : 'rgb(212, 63, 58)',
			hover: {
				background: 'rgb(201, 48, 44)',
				border: 'rgb(172, 41, 37)'
			},
			highlight: {
				background: 'rgb(201, 48, 44)',
				border: 'rgb(118, 28, 25)'
			}
		},
		green: {
			background: 'rgb(92, 184, 92)',
			border: 'rgb(76, 174, 76)',
			hover: {
				background: 'rgb(68, 157, 68)',
				border: 'rgb(57, 132, 57)',
			},
			highlight: {
				background: 'rgb(68, 157, 68)',
				border: 'rgb(37, 86, 37)'
			}
		},
		aqua: {
			background: 'rgb(91, 192, 222)',
			border: 'rgb(70, 184, 218)',
			hover: {
				background: 'rgb(49, 176, 213)',
				border: 'rgb(38, 154, 188)',
			},
			highlight: {
				background: 'rgb(49, 176, 213)',
				border: 'rgb(27, 109, 133)'
			}
		},
	};
	var size = 10;
	var options = {
		edges: {
			smooth: {
				forceDirection: "none"
			},
			arrows: {to : true }
		},
		nodes: {
			font: {size: 20},
		},
		groups: {
			End : { //link to start
				shape: 'diamond',
				color : color.aqua,
				size: size
			},
			EndAlone : {
				shape: 'diamond',
				color: color.red,
				size: size
			},
			InOut : { //вход выход
				shape: 'dot',
				color : color.def,
				size: size
			},
			In : { // вход !выход
				shape: 'triangle',
				color: color.yellow,
				size: size
			},
			Out : { // !вход выход
				shape: 'triangleDown',
				color: color.yellow,
				size: size
			},
			Alone : { //!вход !выход
				shape: 'square',
				color: color.red,
				size: size
			},
			Start : { 
				shape: 'star',
				color: color.green,
				size: size+10
			},
			StartAlone : { 
				shape: 'star',
				color: color.red,
				size: size
			}
		},
		interaction:{hover:true}
	};

	this.vis.network = new vis.Network(container, data, options);
	
	this.vis.network.on("select", function (e){
		$.publish("select",e);
	});
	this.vis.network.on("dragStart", function(e){
		if (e.nodes.length > 0 || e.edges.length > 0) $.publish("select",e);
	});
	
	this.vis.network.on("doubleClick", function(e){
		if (e.nodes.length > 0)
		$.publish("dblclick",e);
	});
	
	this.vis.network.on("hoverNode", function (e){ var c = this.body.container;$(c).css("cursor","pointer"); });
	this.vis.network.on("blurNode", function (e){ var c = this.body.container;$(c).css("cursor","default"); });
	this.vis.network.on("hoverEdge", function (e){ var c = this.body.container;$(c).css("cursor","pointer"); });
	this.vis.network.on("blurEdge", function (e){ var c = this.body.container;$(c).css("cursor","default"); });
	
};


zarBook.prototype.visNodeAdd = function(obj){ //return id
	if (typeof obj === "undefined") obj = {};
	if (typeof obj.id === "undefined") obj.id = "";

	var id = (isNaN(parseInt(obj.id))) ? this.nodeUniqId() : obj.id;

	if (this.nodeExist(id)) return id;
	
	var text = obj.text || "";
	var check = obj.check || false;
	var group = obj.group || 'Alone';
	
	var title = (id > 0) ? "Параграф "+id : "Стартовый параграф";
	var label = (id > 0) ? id : "Начало";
	
	try {
		this.vis.nodes.add(
			{
				id: id,
				label: label,
				title: title,
				group: group
			}
		);
		this.data.nodesData[id] = {in:{},out:{},text:text,label:""};
		this.data.nodes = this.vis.nodes.get();
	

		if(check) this.visNodeCheck(id);	
		return id;
		
	} catch (err) {
		console.log(err);
	}
};

zarBook.prototype.visNodeAddChildren = function(parent,children){
	var child = this.visNodeAdd({id:children});
	var re = new RegExp('\\[n='+parent+'\\]','g');
	if (!re.test(this.nodeText(parent)))
		this.nodeText(parent," [n="+child+"]Параграф "+child+"[/n] ",true);
	this.visEdgeAdd({from:parent,to:child});
};

zarBook.prototype.visNodeAddParent = function(id){
	var parent = this.visNodeAdd();
	var re = new RegExp('\\[n='+parent+'\\]','g');
	if (!re.test(this.nodeText(parent)))
		this.nodeText(parent," [n="+id+"]Параграф "+id+"[/n] ");
	this.visEdgeAdd({from:parent,to:id});
};

zarBook.prototype.visNodeCheck = function(arr){
	if (typeof arr === "number") arr = [arr];
	
	for (var i = 0; i < arr.length; i++){
		var id = arr[i];
		var node = this.data.nodesData[id];
		
		var nodeType = "";

		var inL = Object.keys(node.in).length;
		var outL = Object.keys(node.out).length;
	
		if (inL == 0 && outL == 0) nodeType = "Alone";
		else if (inL > 0 && outL == 0) nodeType = "In";
		else if (inL == 0 && outL > 0) nodeType = "Out";
		else if (inL > 0 && outL > 0) nodeType = "InOut";
				
		if (id==0) {
			nodeType = "Start";
			if (outL == 0) nodeType = "StartAlone";
		}
		if (0 in node.out){
			nodeType = "End";
			if (inL == 0) nodeType = "EndAlone";
		}
	
		this.visNodeUpdate({
			id:id,
			group: nodeType
		});
	}
	
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


zarBook.prototype.visEdgeAdd = function(obj){
	var parent = obj.from;
	var children = obj.to;
	var error = false;

	var nodes = this.data.nodesData;
	var edges = this.data.edgesData;
	
	//can exist
	if (children in nodes[parent].out) error = true;
	
	//can multiple
	if (parent in nodes[children].out) {
		error = true;
		var id = nodes[children].out[parent];

		nodes[parent].out[children] = id;
		nodes[children].in[parent] = id;
		
		edges[id].multi = true;

		this.visEdgeUpdate({
			id: nodes[children].out[parent],
			arrows:{
				from: true,
				to: true
			},
		});
	}
	
	if (error) {
		this.visNodeCheck([parent,children]);
		return;
	}
		
	//new edge
	for(var id=1; ;id++){
		if (!(id in edges)) break;
	}
	
	try {
		this.vis.edges.add({
			id : id,
			from : parent,
			to : children,
			label : "",
			color: "rgb(43, 124, 233)",
		});
	} catch (err) { console.log(err); }
	
	nodes[parent].out[children] = id;
	nodes[children].in[parent] = id;
	edges[id] = {
		from: parent,
		to: children,
		multi: false
	};
	this.data.edges = this.vis.edges.get();
	
	this.visEdgeUpdate({id:id}); //for check start link
	this.visNodeCheck([parent,children]);
};


zarBook.prototype.visEdgeUpdate = function(options){
	//hide edges to start
	var edge = this.data.edgesData[options.id];
	if (edge.from == 0 || edge.to == 0) {
		$.extend(options,{
			dashes: true,
			physics: false
		});
	}
	
	//apply
	try{ this.vis.edges.update(options); }
	catch (err) { console.log(err); }
	
	this.data.edges = this.vis.edges.get();
};

zarBook.prototype.visEdgeLabel = function(id,str){
	if (typeof str === "undefined") return this.data.edgesData[id].label;
	this.visEdgeUpdate({
		id:id,
		label : str,
		font: {align: 'middle'}
	});
	this.data.edgesData[id].label = str;
};

zarBook.prototype.visEdgeRemove = function(obj){
	var nodes = this.data.nodesData;
	var edgeId = nodes[obj.from].out[obj.to];
	var edge = this.data.edgesData[edgeId];
	
	//remove arrow
	if (edge.from == obj.to){
		delete this.data.nodesData[obj.from].out[obj.to];
		edge.multi = false;
		
		this.visEdgeUpdate({
			id: edgeId,
			arrows:{
				from:false,
				to: true
			}
		});
		
		
		this.visNodeCheck([edge.from,edge.to]);
		return;
	}
	
	//reverse and remove arrow
	if (edge.from == obj.from && obj.from in nodes[obj.to].out){
		delete this.data.nodesData[obj.to].in[obj.from];
		delete this.data.nodesData[obj.from].out[obj.to];
		
		edge.multi = false;
		
		//reverse data
		var from = edge.from;
		var to = edge.to;
		edge.from = to;
		edge.to = from;

		//update
		this.visEdgeUpdate({
			id: edgeId,
			from: to,
			to: from,
			arrows:{
				from:false,
				to: true
			}
		});
		this.visNodeCheck([from,to]);
		return;
	}
	
	//remove edge
	try { this.vis.edges.remove({id: edgeId}); }
	catch (err) { console.log(err);}		

	delete this.data.nodesData[edge.from].out[edge.to];
	delete this.data.nodesData[edge.to].in[edge.from];
	delete this.data.edgesData[edgeId];
		
	this.visNodeCheck([edge.from,edge.to]);
};


zarBook.prototype.visPhysics = function(state){
	if (typeof state !== "boolean" ) return console.log("visPhysics not boolean");
	 this.vis.network.setOptions({
	 	physics: {enabled: state}
	 });
};