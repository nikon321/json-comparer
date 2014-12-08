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
		for(var prop in obj) {
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
		for(var prop in obj1) {
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

		for(var prop in obj2) {
			if(typeof obj2[prop] in META_TYPE) {
				obj_rev[prop] = obj2[prop];
			} else if(obj2[prop] instanceof Array) {
				if(prop in obj_rev) {
					var ary_tmp = new Array(obj_rev[prop].length),
						prop_tmp = "";
					obj_rev[prop].forEach(function(val, index, ary) {
						ary_tmp[index] = json2Str(copyJSON(val));
					});
					obj2[prop].forEach(function(val, index, ary) {
						//ary_tmp2[index] = json2Str(copyJSON(val));
						prop_tmp = json2Str(copyJSON(val));
						if(ary_tmp.indexOf(prop_tmp) === -1) {
							obj_rev[prop].push(copyJSON(val));
						}
					});

				} else {
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

function _compareJSON(obj_rev, obj1, obj2) {
	if(obj1.type !== obj2.type) {
		obj_rev.compare_options = "type_mod";
		obj_rev.type1 = obj1.type;
		obj_rev.data1 = obj1.data;
		obj_rev.type = obj2.type;
		obj_rev.data = obj2.data;
	} else {
		switch(obj1.type) {
			case "object": {
				for(var prop in obj_rev.data) {
					if(prop in obj2.data && !(prop in obj1.data)) {
						obj_rev.data[prop].compare_options = "add";
					} else if(!(prop in obj2.data) && prop in obj1.data) {
						obj_rev.data[prop].compare_options = "del";
					} else {
						if(equalJSON(obj1.data[prop], obj2.data[prop])) {
							obj_rev.data[prop].compare_options = "eq";
						} else {
							obj_rev.data[prop].compare_options = "mod";
							_compareJSON(obj_rev.data[prop], obj1.data[prop], obj2.data[prop]);
						}
					}
				}
			} break;
			case "list": {
				var max_len = obj1.data.length > obj2.data.length ? obj1.data.length : obj2.data.length;
				var min_len = obj1.data.length < obj2.data.length ? obj1.data.length : obj2.data.length;
				obj_rev.data = copyJSON(obj2.data);
				obj_rev.data = obj_rev.data.concat(copyJSON(obj1.data.slice(obj2.data.length)));
				for(var i = 0; i < min_len; i++) {
					_compareJSON(obj_rev.data[i], obj1.data[i], obj2.data[i]);
				}
				if(obj2.data.length === max_len) {
					for(var i = min_len; i < max_len; i++) {
						obj_rev.data[i].compare_options = "add";
					}
				} else {
					for(var i = min_len; i < max_len; i++) {
						obj_rev.data[i].compare_options = "del";
					}
				}
			} break;
			case "text": {
				if(obj1.data === obj2.data) {
					obj_rev.compare_options = "eq";
				} else {
					obj_rev.compare_options = "mod";
					obj_rev.data1 = obj1.data;
				}
			} break;
			default: {}
		}
	}
}

function compareJSON(obj1, obj2) {
	var prop_set = {},
		prop = "",
		obj_rev = {};
	for(prop in obj1) {
		prop_set[prop] = true;
	}
	for(prop in obj2) {
		prop_set[prop] = true;
	}
	for(prop in prop_set) {
		if(prop in obj2 && !(prop in obj1)) {
			obj_rev[prop] = copyJSON(obj2[prop]);
			obj_rev[prop].compare_options = "add";
		} else if(!(prop in obj2) && prop in obj1) {
			obj_rev[prop] = copyJSON(obj1[prop]);
			obj_rev[prop].compare_options = "del";
		} else {
			extendJSON(obj_rev, obj1[prop], obj2[prop]);
			_compareJSON(obj_rev, obj1[prop], obj2[prop]);
		}
	}
	return obj_rev;
}

var obj1 = {
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
					"type": "list",
					"data": [{
						"type": "text",
						"data": "Chenglee"
					}, {
						"type": "text",
						"data": "JAck"
					}, {
						"type": "text",
						"data": "Cherry"
					}]
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
		},
		"info": {
			"type": "object",
			"data": {
				"birth": {
					"type": "text",
					"data": "1992.10.25"
				},
				"name": {
					"type": "text",
					"data": "Chenglee"
				},
				"id": {
					"type": "text",
					"data": "GZ4300"
				},
				"gf": {
					"type": "object",
					"data": {
						"name": {
							"data": "zhuer",
							"type": "text"
						},
						"sex": {
							"data": "female",
							"type": "text"
						},
						"age": {
							"data": "23",
							"type": "text"
						},
						"interest": {
							"type": "list",
							"data": [{
								"type": "text",
								"data": "swimming"
							}, {
								"type": "text",
								"data": "make"
							}, {
								"type": "object",
								"data": {
									"name": {
										"type": "text",
										"data": "fighting"
									},
									"good": {
										"type": "text",
										"data": "no"
									}
								}
							}]
						}
					}
				}
			}
		},
		"test": {
			"type": "object",
			"data": {
				"data for test": {
					"type": "text",
					"data": "DAtA FOR TEST"
				},
				"data for test33": {
					"type": "text",
					"data": "DAtA FOR TEST33"
				}
			}
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
		},
		"info": {
			"type": "object",
			"data": {
				"birth": {
					"type": "text",
					"data": "1992.10.25"
				},
				"name": {
					"type": "text",
					"data": "Cherlse"
				},
				"id": {
					"type": "text",
					"data": "GZ4300"
				},
				"gf": {
					"type": "object",
					"data": {
						"name": {
							"data": "Huangying",
							"type": "text"
						},
						"sex": {
							"data": "female",
							"type": "text"
						},
						"age": {
							"data": "23",
							"type": "text"
						},
						"interest": {
							"type": "list",
							"data": [{
								"type": "text",
								"data": "swimming"
							}, {
								"type": "text",
								"data": "make"
							}]
						}
					}
				}
			}
		},
		"test": {
			"type": "object",
			"data": {
				"data for test": {
					"type": "text",
					"data": "DATA FOR TEST"
				}
			}
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
		for(var prop in obj) {
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
	var obj_tmp = copyJSON(obj);
	if(type(obj_tmp) === "object") return "{" + _json2Str(obj_tmp) + "}";
	if(type(obj_tmp) === "array") return "[" + _json2Str(obj_tmp) + "]";
	return "" + obj_tmp;
}

function equalJSON(obj1, obj2) {
	var str1 = json2Str(obj1),
		str2 = json2Str(obj2);
	return str1 === str2;		
}

function getPath($ele) {
	var ary = [],
		data_path = "",
		$parent = $ele.parent();
	while(!$parent.hasClass("tree")) {
		if(data_path = $parent.attr("data-path")) {
			ary.unshift("[data-path=" + data_path + "]");
		}
		$parent = $parent.parent();
	}
	return ary.join(" ");
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
_compareJSON(obj, obj1, obj2);
console.log(json2Str(obj));
