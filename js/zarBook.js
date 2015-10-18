	
function log(){Function.prototype.apply.apply(console.log, [console, arguments]);}

if (window.File && window.FileReader && window.FileList && window.Blob) {

} else {
  alert('Ваш браузер морально устарел, обновите пожалуйста!');
};

transliterate = (function() {
		var
			rus = "щ   ш  ч  ц  ю  я  ё  ж  ъ  ы  э  а б в г д е з и й к л м н о п р с т у ф х ь".split(/ +/g),
			eng = "shh sh ch cz yu ya yo zh _ y- e- a b v g d e z i j k l m n o p r s t u f x _".split(/ +/g)
		;
		return function(text, engToRus) {
			var x;
			for(x = 0; x < rus.length; x++) {
				text = text.split(engToRus ? eng[x] : rus[x]).join(engToRus ? rus[x] : eng[x]);
				text = text.split(engToRus ? eng[x].toUpperCase() : rus[x].toUpperCase()).join(engToRus ? rus[x].toUpperCase() : eng[x].toUpperCase());	
			}
			return text;
		};
	}
)();


window.zarBook = function(){
	this.data = {
		info : {
			name : ""
		} 
	};
};

zarBook.prototype.setName = function(name){
	var name = name || "Ещё одна книга-игра";
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
      fr.onload = function(e){
      	t.load(e.target.result);
      };
      fr.readAsText(file);
    }
};

zarBook.prototype.load = function (str){
	var obj = $.parseJSON(str);
	this.data= obj;

};


$(function(){
	$.extend($.noty.defaults,{
    	type: 'information',
    	layout: 'bottomLeft',
    	timeout: 10000,
    	text: '', // can be html or string
    	force: false, // adds notification to the beginning of queue when set to true
    	modal: false,
		animation   : {
			open  : 'animated bounceInLeft',
			close : 'animated bounceOutLeft',
			easing: 'swing',
			speed : 500
		}
	});
	
	
	
	var zb = new zarBook();
	$("#zbCreateBookFrm").submit(function(e){
		e.preventDefault();
		var name = zb.setName($(this).find("input[type=text]").val());
		$("#zbeName").html( name );
		//noty({text:});
		noty({text: "<b>"+name+ "</b>" + " успешно создана"});
		$("#zbManager").slideUp();
		$("#zbEditor,#zbeSaveBtn").fadeIn();
	});
	
	$("#zbeSaveBtn").bind("click",function(e){
		e.preventDefault();
		zb.save();
	});
	
	$("#zbUploadForm").submit(function(e) {
		e.preventDefault();
		var c = zb.getFile("zbUploadFormInput");
				
	});
	
	

	
	
});
