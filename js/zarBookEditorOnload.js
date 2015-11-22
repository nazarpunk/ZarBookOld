$(function(){
//noty	
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
		
		//node in selection
		if (obj.nodes.length > 0) {
			var id = obj.nodes[0];
			
			//show-hide delete link 
			if(id==0) $("#zbeNodeDropdownDeleteLink").hide();
			else $("#zbeNodeDropdownDeleteLink").show();
						
			var nodeText = (typeof zb.data.nodesData[id].text === "undefined") ? "" : zb.data.nodesData[id].text;
			
			//set title
			$("#zbeNodeDropdownName").html(	(id==0) ? 'Начальный параграф' : 'Параграф <span class="badge">'+id+'</span>');
			$("#zbeModalNodeEditLabel").html( (id==0) ? 'Начальный параграф' : 'Редактирование параграфа <span class="badge">'+id+'</span>');
			$("#zbeModalNodeRemoveLabel").html('Удаление параграфа <span class="badge">'+id+'</span>');
			
			$("#zbeNodeDropdown").show();
			$(".zbeNodeDataNumber").data("id",id);
			
			//set node physics
			var link = $("#zbeNodePhysicsLink");
			if (zb.visNodePhysics(id)) link.html( link.data("strOff") ).data("act",0);
			else link.html( link.data("strOn") ).data("act",1);
		} else {
			$("#zbeNodeDropdown").hide();
		}
		
		//edges in selection
		if (obj.edges.length > 0){
			var arrow = "";
			
			//navbar
			if (obj.edges.length == 1) {
				arrow = (zb.data.edgesData[obj.edges[0]].multi) ? 'fa-arrows-h' : 'fa-long-arrow-right';
				var edgeText = "Ребро&nbsp;"+ '<span class="badge">'+zb.data.edgesData[obj.edges[0]].from+'&nbsp;<i class="fa '+arrow+' "></i>&nbsp;'+zb.data.edgesData[obj.edges[0]].to+'</span>&nbsp'; 
			} else {
				var edgeText = "Рёбра&nbsp; ("+obj.edges.length+"шт.)"; 
			}
			
			$("#zbeEdgeLink").show();
			$("#zbeEdgeLinkTitle").html(edgeText);
			
			//label modal
			var edgesBadgesStr = "";
			var edgesInputStr = "";
			$.each(obj.edges,function(k,v){
				var edgeLabel = (typeof zb.data.edgesData[v].label === "undefined") ? "" : zb.data.edgesData[v].label;
				arrow = (zb.data.edgesData[v].multi) ? 'fa-arrows-h' : 'fa-long-arrow-right';
				
				edgesInputStr += '<p><div class="input-group">\
					<span class="input-group-addon">\
					<span class="badge">'+zb.data.edgesData[v].from+'&nbsp;<i class="fa '+arrow+'"></i>&nbsp;'+zb.data.edgesData[v].to+'</span></span>\
					<input type="text" name="'+v+'" class="form-control" placeholder="'+edgeLabel+'" value="'+edgeLabel+'">\
					</div></p>';					
			});
			$("#zbeModalEdgesLabelBody").html(edgesInputStr);
			$(".zbeEdgesDataNumbers").data("id",$.toJSON(obj.edges));
			
		} else { 
			$("#zbeEdgeLink").hide();
		}

	});
	
//markitup
	$("textarea").markItUp( {
		nameSpace: "xbbcode", // Useful to prevent multi-instances CSS conflict
		previewParserPath:	'', // path to your XBBCode parser
		onShiftEnter:	{keepDefault:false, replaceWith:'[br /]\n'},
		onCtrlEnter:	{keepDefault:false, openWith:'\n[p]', closeWith:'[/p]\n'},
		onTab:			{keepDefault:false, openWith:'	 '},
		markupSet: [
			{name:'N', openWith:'[n=(!( class="[![Class]!]")!)]', closeWith:'[/n]' },
			{name:'H1', key:'1', openWith:'[h1(!( class="[![Class]!]")!)]', closeWith:'[/h1]'},
			{name:'H2', key:'2', openWith:'[h2(!( class="[![Class]!]")!)]', closeWith:'[/h2]'},
			{name:'H3', key:'3', openWith:'[h3(!( class="[![Class]!]")!)]', closeWith:'[/h3]'},
			{name:'H4', key:'4', openWith:'[h4(!( class="[![Class]!]")!)]', closeWith:'[/h4]'},
			{name:'H5', key:'5', openWith:'[h5(!( class="[![Class]!]")!)]', closeWith:'[/h5]'},
			{name:'H6', key:'6', openWith:'[h6(!( class="[![Class]!]")!)]', closeWith:'[/h6]'},
			{name:'P', openWith:'[p(!( class="[![Class]!]")!)]', closeWith:'[/p]' },
			{name:'B', key:'B', openWith:'(!([b]|!|[b])!)', closeWith:'(!([/b]|!|[/b])!)' },
			{name:'I', key:'I', openWith:'(!([i]|!|[i])!)', closeWith:'(!([/i]|!|[/i])!)' },
			{name:'U', key:'U', openWith:'(!([u]|!|[u])!)', closeWith:'(!([/u]|!|[/u])!)' },
			{name:'UL', openWith:'[ul]\n', closeWith:'[/ul]\n' },
			{name:'OL', openWith:'[ol]\n', closeWith:'[/ol]\n' },
			{name:'LI', openWith:'[li]', closeWith:'[/li]' },
		]
});

	$(".markItUpHeader > ul")
		.addClass('btn-group')
		.find("li")
		.css("padding",0)
		.addClass('btn btn-default btn-sm')
		.find("a").addClass('btn btn-sm');

//node editor submit 
	$("#zbeModalNodeEditForm").submit(function(e){
		e.preventDefault();
		var id = $(this).data("id");
		var act = ( $(document.activeElement).val() == "preview") ? "preview" : "save";
		var area = $("#zbeModalNodeEditArea");
		var elem = $("#zbeModalNodeEditPreviev");
		
		var obj = zb.nodeParse({id:id,text:area.val()});
		
		if (obj.error){
			var strError = "";
				$.each(obj.errorQueue, function(k,v){
				strError += "<li>"+v+"</li>";
			});
			elem.html('<div class="alert alert-danger"><ul>'+strError+'</ul></div>');
			noty({text:"Допущены ошибки",type:"error",killer:true});
			return;
		}
		area.val(obj.text);
		
		var str = '';
		var i = 0;
		
		if (act=="preview"){
			for(i = 0; i < obj.nodesAdd.length; i++){
				str += '<li>Будет создан дочерний параграф <span class="badge">'+obj.nodesAdd[i]+'</span></li>';
			}
			for(i = 0; i < obj.nodesLink.length; i++){
				if (obj.nodesLink[i] > 0)
					str += '<li>Будет создана ссылка на параграф <span class="badge">'+obj.nodesLink[i]+'</span></li>';
				else
					str += '<li>Будет создана ссылка на <b>стартовый параграф</b></li>';
			}
			if (str != '')
				obj.html += '<div class="alert alert-info"><ul>'+str+'</ul></div>';

			str = '';
			for(i = 0; i < obj.nodesRemove.length; i++){
				if (obj.nodesRemove[i] > 0)
					str += '<li>Будет удалена ссылка на параграф <span class="badge">'+obj.nodesRemove[i]+'</span></li>';
				else
					str += '<li>Будет удалена ссылка на <b>стартовый параграф</b></li>';
			}
			if (str != '')
				obj.html += '<div class="alert alert-warning"><ul>'+str+'</ul></div>';
			
			elem.hide().html(obj.html).find("ul > br, ol > br, h1 + br, h2 + br, h3 + br, h4 + br, h5 + br, h6 + br").remove();
			elem.show();
			return;
		}
		
		$("#zbeModalNodeEdit").modal('hide');
		zb.nodeText(id,obj.text);
		zb.nodeLabel(id,$("#zbeModalNodeEditLabelInput").val());
		
		for(i = 0; i < obj.nodesAdd.length; i++){
			zb.visNodeAddChildren(id,obj.nodesAdd[i]);
		}
		for(i = 0; i < obj.nodesLink.length; i++){
			zb.visEdgeAdd({from:id,to:obj.nodesLink[i]});
		}
		for(i = 0; i < obj.nodesRemove.length; i++){
			zb.visEdgeRemove({from:id,to:obj.nodesRemove[i]});
		}
		
		
		
		
	});

//node editor modal
	$('#zbeModalNodeEdit').on('show.bs.modal', function () {
		var id= $(this).data("id");
		
		$("#zbeModalNodeEditPreviev").empty();
		$("#zbeModalNodeEditArea").val(zb.nodeText(id));
		$("#zbeModalNodeEditLabelInput").val(zb.nodeLabel(id));
		
		if (id==0) $("#zbeModalNodeEditLabelInput").hide();
		else $("#zbeModalNodeEditLabelInput").show();
		
	});
	$.subscribe("dblclick",function(e){
		$("#zbeModalNodeEdit").modal("show");
	});
		
//node add
	$("#zbeNodeAddLink").click(function(e){
		e.preventDefault();
		zb.visNodeAdd({check:true});
	});	
	
//node add children 
	$("#zbeNodeAddChildrenLink").bind("click",function(e){
		e.preventDefault();
		var parent = parseInt( $(this).data("id") );
		zb.visNodeAddChildren(parent);
	});
	
//node add parent 
	$("#zbeNodeAddParentLink").bind("click",function(e){
		e.preventDefault();
		var parent = parseInt( $(this).data("id") );
		zb.visNodeAddParent(parent);
	});

//node remove
	$("#zbeNodeRemoveLink").bind("click",function(){
		var id = $(this).data("id");
		zb.visNodeRemove(id);
		$('#zbeModalNodeRemove').modal('hide');
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

//disable physics on modal
	$('.modal').on('show.bs.modal', function () {
  		zb.visPhysics(false);
	});
	$('.modal').on('hidden.bs.modal', function () {
  		zb.visPhysics(true);
	});
	
//book modal settings 
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
		
		//creat start
		zb.visNodeAdd({id:0,check:true});
		zb.visNodeAddChildren(0);
		zb.visNodeAddChildren(1);
		zb.visNodeAddChildren(1);
		zb.vis.network.fit();

		
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
		//$("#zbCreateBookFrm").trigger("submit");
	}
		
	$("#zbeBookUploadFormInputFile, #zbeBookUploadFormInputText").val("");
	
	$(document).bind("contextmenu",function(e){
       log(zb.data);
    });
});