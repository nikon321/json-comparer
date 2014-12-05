var META_TYPE = {
	"string": "",
	"number": "",
	"boolean": "",
	"null": "",
	"undefined": "",
	"NaN": ""
}

function copyJSON(obj) {
	var obj_rev = {};
	if(type(obj) === "object") {
		for(prop in obj) {
			obj_rev[prop] = copyJSON(obj[prop]);
		}
	} else if(type(obj) === "array") {
		obj_rev = new Array(obj.length);
		for(var i = 0, len = obj_rev.length; i < len; i++) {
			obj_rev[i] = {};
		}
		obj.forEach(function(val, index, ary) {
			obj_rev[index] = copyJSON(val);
		});
	} else {
		obj_rev = obj;
	}
	return obj_rev;
}

function extendJSON(obj_rev, obj1, obj2) {
	obj2 = obj2 ? obj2 : {};
	if(type(obj1) === "object" && type(obj2) === "object") {
		for(prop in obj1) {
			if(typeof obj1[prop] in META_TYPE) {
				obj_rev[prop] = obj1[prop];
			} else if(obj1[prop] instanceof Array) {
				obj_rev[prop] = new Array(obj1[prop].length);
				obj1[prop].forEach(function(val, index, ary) {
					obj_rev[prop][index] = copyJSON(val);
				});
			} else if(typeof obj1[prop] === "object") {
				obj_rev[prop] = {};
				extendJSON(obj_rev[prop], obj1[prop]);
			}
		}

		for(prop in obj2) {
			if(typeof obj2[prop] in META_TYPE) {
				obj_rev[prop] = obj2[prop];
			} else if(obj2[prop] instanceof Array) {
				if(prop in obj_rev) {
					// obj2[prop].forEach(function(val, index) {
					// 	if(obj_rev[prop].indexOf(val) === -1) {
					// 		obj_rev[prop].push(val);
					// 	}
					// });
					var ary_tmp = new Array(obj_rev[prop].length),
						prop_tmp = "";
					obj_rev[prop].forEach(function(val, index, ary) {
						ary_tmp[index] = json2Str(copyJSON(val));
					});
					//var ary_tmp2 = new Array(obj2[prop].length);
					obj2[prop].forEach(function(val, index, ary) {
						//ary_tmp2[index] = json2Str(copyJSON(val));
						prop_tmp = json2Str(copyJSON(val));
						if(ary_tmp.indexOf(prop_tmp) === -1) {
							obj_rev[prop].push(copyJSON(val));
						}
					});

				} else {
					//obj_rev[prop] = obj2[prop];
					obj_rev[prop] = new Array(obj2[prop].length);
					obj2[prop].forEach(function(val, index, ary) {
						obj_rev[prop][index] = copyJSON(val);
					});
				}
			} else if(typeof obj2[prop] === "object") {
				if(!(prop in obj_rev)) {
					obj_rev[prop] = {};
				}
				extendJSON(obj_rev[prop], {}, obj2[prop]);
			}
		}
	}
}

function compareJSON(obj_rev, obj1, obj2) {
	//$.extend(true, obj_rev, obj1, obj2);
	//console.log(obj_rev);
	
	for(prop in obj_rev) {
		if(prop !== "type") {
			//console.log(prop);
			if(prop in obj2 && !(prop in obj1)) {
				//obj_rev[prop] = $.extend({}, obj2[prop]);
				obj_rev[prop].compare_options = "add";
			} else if(!(prop in obj2) && prop in obj1) {
				//obj_rev[prop] = $.extend({}, obj1[prop]);
				obj_rev[prop].compare_options = "del";
			} else {
				// if($.type(obj_rev[prop]) in {"string":"", "number":"", "boolean":"", "null":"", "undefined":""}) {
				// 	//console.log(prop);
				// 	//console.log(obj2[prop], obj1[prop]);
				// 	if(obj2[prop] === obj1[prop]) {
				// 		obj_rev.compare_options = "eq";
				// 	} else {
				// 		obj_rev.compare_options = "mod";
				// 	}
				// } else {
				// 	compareJSON(obj_rev[prop], obj1[prop], obj2[prop]);
				// }
				if(obj1[prop].type !== obj2[prop].type) {
					obj_rev[prop].compare_options = "mod";
				} else {
					if(obj1[prop].type === "text") {
						if(obj1.data === obj2.data) {
							obj_rev[prop].compare_options = "eq";
						} else {
							obj_rev[prop].compare_options = "mod";
						}
					} else {
						compareJSON(obj_rev[prop], obj1[prop], obj2[prop]);
					}
				}
			}
		}
	}
	return true
}

var obj1 = {
	"type": "object",
	"data": {
		"name": {
			"type": "list",
			"data": [
				{
					"type": "text",
					"data": "Chenglee"
				},
				{
					"type": "text",
					"data": "Tom"
				},
				{
					"type": "object",
					"data": [
						"Chenglee",
						"Cherlse",
						"Tommmmmm"
					]
				}
			]
		},
		"age": {
			"type": "text",
			"data": "33"
		},
		"interest": {
			"type": "text",
			"data": "swimming"
		}
	}
};
var obj2 = {
	"type": "object",
	"data": {
		"name": {
			"type": "list",
			"data": [
				{
					"type": "text",
					"data": "Marry"
				},
				{
					"type": "text",
					"data": "Tom"
				},
				{
					"type": "text",
					"data": "Jack"
				}
			]
		},
		"age": {
			"type": "text",
			"data": "33"
		},
		"sex": {
			"type": "text",
			"data": "male"
		}
	}
};

var obj = [
	{
		"name": "Chenglee",
		"age": 22,
		"sex": "male"
	},
	{
		"name": "Cherlse",
		"age": 23,
		"sex": "male"
	},
	{
		"name": "Huangying",
		"age": 22,
		"sex": "female",
		"friends": [
			{
				"name": "Wuyanman",
				"sex": "female",
				"interest": [
					"swimming",
					"yoga",
					"fighting"
				]
			},
			{
				"name": "Zhuer",
				"sex": "female",
				"interest": [
					"Make",
					"yoga",
					"Sxx"
				]
			}
		]
	}
];

function type(arg) {
	if(arg instanceof Array) return "array";
	return typeof arg;
}

function _json2Str(obj) {
	var props = [],
		strs = [];
	if(type(obj) === "object") {
		for(prop in obj) {
			props.push(prop);
		}
		props.sort();
		props.forEach(function(prop, index, ary) {
			if(type(obj[prop]) in META_TYPE) {
				strs.push("\"" + prop + "\":\"" + obj[prop]  + "\"");
			} else if(type(obj[prop]) === "array") {
				strs.push("\"" + prop + "\":" + "[" + _json2Str(obj[prop]) + "]");
			} else if(type(obj[prop]) === "object") {
				strs.push("\"" + prop + "\":" + "{" + _json2Str(obj[prop]) + "}");
			}
		});
		return strs.join(",");
	} else if(type(obj) === "array") {
		obj.forEach(function(val, index, ary) {
			if(type(val) === "array") {
				ary[index] = "[" + _json2Str(ary[index]) + "]";
			}
			else if(type(val) === "object")
				ary[index] = "{" + _json2Str(ary[index]) + "}";
			else
				ary[index] = "\"" + ary[index] + "\"";
		});
		//obj.sort();
		return obj.toString();
	}
}

function json2Str(obj) {
	var obj_tmp = obj;
	if(type(obj_tmp) === "object") return "{" + _json2Str(obj_tmp) + "}";
	if(type(obj_tmp) === "array") return "[" + _json2Str(obj_tmp) + "]";
	return "" + obj_tmp;
}
// console.log(obj);
// console.log(json2Str(obj));
// console.log(json2Str(obj1));
// console.log(json2Str(obj2));
// console.log(obj);

// var a = [{a: 1, b: 2},{r:8, fs: [3,4,5,6]}, 0];
// var b = copyJSON(a);
// console.log(a, b);

// var co = copyJSON(obj);
// console.log(co);
// console.log(copyJSON(obj1));
// console.log(copyJSON(obj2));

var obj = {};
extendJSON(obj, obj1, obj2);
console.log(obj)