(function(global, undefined) {
	var META_TYPE = {
		"string": "",
		"number": "",
		"boolean": "",
		"null": "",
		"undefined": "",
		"NaN": ""
	};

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
						if(equalJSON(obj1.data[i], obj2.data[i]))
							obj_rev.data[i].compare_options = "eq";
						else {
							obj_rev.data[i].compare_options = "mod";
							_compareJSON(obj_rev.data[i], obj1.data[i], obj2.data[i]);
						}
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
				case "xml": {
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
				if(obj1[prop].type !== obj2[prop].type) {
					obj_rev[prop] = {};
					obj_rev[prop].compare_options = "type_mod";
					obj_rev[prop].type = obj2[prop].type;
					obj_rev[prop].data = obj2[prop].data;
					obj_rev[prop].type1 = obj1[prop].type;
					obj_rev[prop].data1 = obj1[prop].data;
				} else {
					if(equalJSON(obj1[prop], obj2[prop])) {
						obj_rev[prop] = {};
						obj_rev[prop].compare_options = "eq";
						extendJSON(obj_rev[prop], obj1[prop], obj2[prop]);
						_compareJSON(obj_rev[prop], obj1[prop], obj2[prop]);
					} else {
						obj_rev[prop] = {};
						obj_rev[prop].compare_options = "mod";
						extendJSON(obj_rev[prop], obj1[prop], obj2[prop]);
						_compareJSON(obj_rev[prop], obj1[prop], obj2[prop]);
					}
				}
			}
		}
		return obj_rev;
	}

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

	function formatXml(xml) {
		var formatted, pad, reg;
		formatted = '';
		reg = /(>) *(<)(\/*)/g;
		xml = xml.replace(reg, '$1\n$2$3');
		xml = xml.replace(/(\/)( *)(>)/g, '$1$3\n');
		xml = xml.replace(/\n{2,}/g, '\n');
		xml = xml.replace(/\"/g, "'");
		pad = 0;
		$.each(xml.split('\n'), function(index, node) {
			var i, indent, padding, _i;
			indent = 0;
			if (node.match(/.+<\/\w[^>]*>$/)) {
				indent = 0;
			} else if (node.match(/^<\/\w/)) {
				if (pad !== 0) {
					pad -= 1;
				}
			} else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
				indent = 1;
			} else {
				indent = 0;
			}
			padding = '';
			for (i = _i = 0; 0 <= pad ? _i < pad : _i > pad; i = 0 <= pad ? ++_i : --_i) {
				padding += '  ';
			}
			formatted += padding + node + '\n';
			return pad += indent;
		});
		formatted = formatted.replace(/>/g, "&gt");
		formatted = formatted.replace(/</g, "&lt");
		return formatted;
	};

	global.compareJSON = compareJSON;
	global.formatXml = formatXml;
	global.getPath = getPath;
	global.json2Str = json2Str;
	global.extendJSON = extendJSON;
	global._compareJSON = _compareJSON;
})(this);



var obj1 = {
	"test": {
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
						"data": "This is a new file. You can read it but do not rewrite it!!"
					},
					"data for test33": {
						"type": "xml",
						"data": '<?xmlf version="1.0" encffoding="UTF-8"?> <!DOCTYPE xhtml PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.0//EN" "http://www.wapforum.org/DTD/xhtml-mobile10.dtd"> <html xmlns="http://www.w3.org/1999/xhtml">  <head> <title>UC Browfffser</title> </head>  <body> <ucf type="show_site_bar" value="ext:lp:lp_navi"></ucf> <ucf type="show_model" value="search_box"></ucf> <ucf type="show_model" value="url_box"></ucf></body></html>'
					}
				}
			}
		}
	}
};
var obj2 = {
	"test": {
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
						"data": "This is a old file. You can read it and you u can read it and you u can read it and you can rewrite it!! If you rewrite it, please note it so that we can know the details."
					},
					"data for test33": {
						"type": "xml",
						"data": '<?xml versffion="1.0" encoding="UTF-8"?> <!DOCTYPE xhtml PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.0//EN" "http://www.wapforum.org/DTD/xhtml-mobile10.dtd"> <html xmlns="http://www.w3.org/1999/xhtml">  <head> <title>UC Browser</title> </head>  <body> <ucf type="show_site_bar" value="ext:lp:lp_navi"></ucf> <ucf type="show_model" value="search_box"></ucf> <ucf type="show_model" value="url_box"></ucf></body></html>'
					}
				}
			},
			"add": {
				"type": "list",
				"data": [
					{
						"type": "text",
						"data": "add1"
					},
					{
						"type": "text",
						"data": "add1"
					},
					{
						"type": "text",
						"data": "add1"
					}
				]
			}
		}
	}
};

// var obj = [
// 	{
// 		"name": "Chenglee",
// 		"age": 22,
// 		"sex": "male"
// 	},
// 	{
// 		"name": "Cherlse",
// 		"age": 23,
// 		"sex": "male"
// 	},
// 	{
// 		"name": "Huangying",
// 		"age": 22,
// 		"sex": "female",
// 		"friends": [
// 			{
// 				"name": "Wuyanman",
// 				"sex": "female",
// 				"interest": [
// 					"swimming",
// 					"yoga",
// 					"fighting"
// 				]
// 			},
// 			{
// 				"name": "Zhuer",
// 				"sex": "female",
// 				"interest": [
// 					"Make",
// 					"yoga",
// 					"Sxx"
// 				]
// 			}
// 		]
// 	}
// ];
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
// var obj1 = {"type":"object","data":{"PbUcParam":{"type":"object","data":{"items":{"type":"list","data":[{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"calluc_chk_url"},"pvalue":{"type":"text","data":"http://125.91.5.45:8000/chkdomain.php?uc_param_str=dnfrve"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"navi_icon_addr"},"pvalue":{"type":"text","data":"http://mynavi.ucweb.com/geticon.php"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"ft_share"},"pvalue":{"type":"text","data":"http://share.ucweb.com/share/share/index?uc_param_str=bidnfrpflassve"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"Voice_Address"},"pvalue":{"type":"text","data":"http://us.vocmd.ucweb.com/mimi"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"uc_siri"},"pvalue":{"type":"text","data":"http://us.vocmd.ucweb.com/mimi"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_new"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/index?uc_param_str=frvednbilanacp"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_home"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/index?uc_param_str=dn"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_channels"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/channels?uc_param_str=dn"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"advise_menu"},"pvalue":{"type":"text","data":"http://feedback.uc.cn/self_service/wap/index?instance=EN&uc_param_str=einibicppfmivefrsiutla"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"uclx_server_addr"},"pvalue":{"type":"text","data":"http://us.uclx.ucweb.com:8097/uclx_agent/"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"flag_client_info"},"pvalue":{"type":"text","data":"on"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"Default_Home_Screen"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_regserver_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas/ucbrowser/register?register_type=email&client_id=73&uc_param_str=frpfvesscpmilaprnisieiut"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_loginserver_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas.clientLogin"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_forgetpsw_url"},"pvalue":{"type":"text","data":"http://id.uc.cn/security/forgotpassword/index?uc_param_str=nieisivefrpfbimilaprligiwiut&appId=73"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_logout_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas.clientLogout"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_useracnt_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas/?uc_param_str=frpfvesscpmilaprnisieiutst&target_client_id=4&target_redirect_uri=http%3A%2F%2Fid.uc.cn%2F%3Fuc_param_str%3Dfrpfvesscpmilaprnisieiut&client_id=73"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"cloud_help_url"},"pvalue":{"type":"text","data":"http://cloud.ucweb.com/help/sync?display=phone&pl="}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"cloud_server"},"pvalue":{"type":"text","data":"browser.cloud.ucweb.com/sync"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"liteua"},"pvalue":{"type":"text","data":"UCWEB/2.0 (MIDP-2.0; U; Adr 2.3.7; en-US; HUAWEI-U8850) U2/1.0.0 UCBrowser/8.7.0.315 U2/1.0.0 Mobile"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"dl_stat"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"url_static"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"addon_api_verify_url"},"pvalue":{"type":"text","data":"http://addon.ucweb.com/api/verify"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"preload_read_mode_whitelist_switch"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"vip_download_interurl1"},"pvalue":{"type":"text","data":"http://en.ucsec1.ucweb.com"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"vip_download_interurl2"},"pvalue":{"type":"text","data":"http://en.ucsec2.ucweb.com"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"u3_smemopt"},"pvalue":{"type":"text","data":"1"}}}]}}}}};
// var obj2 = {"type":"object","data":{"PbUcParam":{"type":"object","data":{"items":{"type":"list","data":[{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"calluc_chk_url"},"pvalue":{"type":"text","data":"http://125.91.5.45:8000/chkdomain.php?uc_param_str=dnfrve"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"navi_icon_addr"},"pvalue":{"type":"text","data":"http://mynavi.ucweb.com/geticon.php"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"ft_share"},"pvalue":{"type":"text","data":"http://share.ucweb.com/share/share/index?uc_param_str=bidnfrpflassve"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"Voice_Address"},"pvalue":{"type":"text","data":"http://us.vocmd.ucweb.com/mimi"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"uc_siri"},"pvalue":{"type":"text","data":"http://us.vocmd.ucweb.com/mimi"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_new"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/index?uc_param_str=frvednbilanacp"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_home"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/index?uc_param_str=dn"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_channels"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/channels?uc_param_str=dn"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"advise_menu"},"pvalue":{"type":"text","data":"http://feedback.uc.cn/self_service/wap/index?instance=EN&uc_param_str=einibicppfmivefrsiutla"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"uclx_server_addr"},"pvalue":{"type":"text","data":"http://us.uclx.ucweb.com:8097/uclx_agent/"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"flag_client_info"},"pvalue":{"type":"text","data":"on"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"Default_Home_Screen"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_regserver_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas/ucbrowser/register?register_type=email&client_id=73&uc_param_str=frpfvesscpmilaprnisieiut"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_loginserver_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas.clientLogin"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_forgetpsw_url"},"pvalue":{"type":"text","data":"http://id.uc.cn/security/forgotpassword/index?uc_param_str=nieisivefrpfbimilaprligiwiut&appId=73"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_logout_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas.clientLogout"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_useracnt_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas/?uc_param_str=frpfvesscpmilaprnisieiutst&target_client_id=4&target_redirect_uri=http%3A%2F%2Fid.uc.cn%2F%3Fuc_param_str%3Dfrpfvesscpmilaprnisieiut&client_id=73"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"cloud_help_url"},"pvalue":{"type":"text","data":"http://cloud.ucweb.com/help/sync?display=phone&pl="}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"cloud_server"},"pvalue":{"type":"text","data":"browser.cloud.ucweb.com/sync"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"liteua"},"pvalue":{"type":"text","data":"UCWEB/2.0 (MIDP-2.0; U; Adr 2.3.7; en-US; HUAWEI-U8850) U2/1.0.0 UCBrowser/8.7.0.315 U2/1.0.0 Mobile"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"dl_stat"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"url_static"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"addon_api_verify_url"},"pvalue":{"type":"text","data":"http://addon.ucweb.com/api/verify"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"preload_read_mode_whitelist_switch"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"vip_download_interurl1"},"pvalue":{"type":"text","data":"http://en.ucsec1.ucweb.com"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"vip_download_interurl2"},"pvalue":{"type":"text","data":"http://en.ucsec2.ucweb.com"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"u3_smemopt"},"pvalue":{"type":"text","data":"1"}}}]}}}}};
// var obj = {};
// extendJSON(obj, obj1, obj2);
// _compareJSON(obj, obj1, obj2);
// console.log(json2Str(obj));
//var obj1 = {"bUcParam":{"type":"object","data":{"items":{"type":"list","data":[{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"calluc_chk_url"},"pvalue":{"type":"text","data":"http://125.91.5.45:8000/chkdomain.php?uc_param_str=dnfrve00/chkdomain.php?uc_param_str=dnfrve00/chkdomain.php?uc_param_str=dnfrve00/chkdomain.php?uc_param_str=dnfrve00/chkdomain.php?uc_param_str=dnfrve"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"navi_icon_addr"},"pvalue":{"type":"text","data":"http://mynavi.ucweb.com/geticon.php"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"ft_share"},"pvalue":{"type":"text","data":"http://share.ucweb.com/share/share/index?uc_param_str=bidnfrpflassve"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"Voice_Address"},"pvalue":{"type":"text","data":"http://us.vocmd.ucweb.com/mimi"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"uc_siri"},"pvalue":{"type":"text","data":"http://us.vocmd.ucweb.com/mimi"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_new"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/index?uc_param_str=frvednbilanacp"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_home"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/index?uc_param_str=dn"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_channels"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/channels?uc_param_str=dn"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"advise_menu"},"pvalue":{"type":"text","data":"http://feedback.uc.cn/self_service/wap/index?instance=EN&uc_param_str=einibicppfmivefrsiutla"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"uclx_server_addr"},"pvalue":{"type":"text","data":"http://us.uclx.ucweb.com:8097/uclx_agent/"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"flag_client_info"},"pvalue":{"type":"text","data":"on"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"Default_Home_Screen"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_regserver_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas/ucbrowser/register?register_type=email&client_id=73&uc_param_str=frpfvesscpmilaprnisieiut"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_loginserver_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas.clientLogin"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_forgetpsw_url"},"pvalue":{"type":"text","data":"http://id.uc.cn/security/forgotpassword/index?uc_param_str=nieisivefrpfbimilaprligiwiut&appId=73"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_logout_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas.clientLogout"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_useracnt_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas/?uc_param_str=frpfvesscpmilaprnisieiutst&target_client_id=4&target_redirect_uri=http%3A%2F%2Fid.uc.cn%2F%3Fuc_param_str%3Dfrpfvesscpmilaprnisieiut&client_id=73"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"cloud_help_url"},"pvalue":{"type":"text","data":"http://cloud.ucweb.com/help/sync?display=phone&pl="}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"cloud_server"},"pvalue":{"type":"text","data":"browser.cloud.ucweb.com/sync"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"liteua"},"pvalue":{"type":"text","data":"UCWEB/2.0 (MIDP-2.0; U; Adr 2.3.7; en-US; HUAWEI-U8850) U2/1.0.0 UCBrowser/8.7.0.315 U2/1.0.0 Mobile"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"dl_stat"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"url_static"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"addon_api_verify_url"},"pvalue":{"type":"text","data":"http://addon.ucweb.com/api/verify"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"preload_read_mode_whitelist_switch"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"vip_download_interurl1"},"pvalue":{"type":"text","data":"http://en.ucsec1.ucweb.com"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"vip_download_interurl2"},"pvalue":{"type":"text","data":"http://en.ucsec2.ucweb.com"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"u3_smemopt"},"pvalue":{"type":"text","data":"1"}}}]}}}};
//var obj2 = {"PbUcParam":{"type":"object","data":{"items":{"type":"list","data":[{"type":"object","data":{"ptype":{"type":"text","data":"no data to yes data"},"pname":{"type":"text","data":"calluc_chk_url"},"pvalue":{"type":"text","data":"http://125.91.5.45:8000/chkdomain.php?uc_param_str=dnfrve"}}},{"type":"list","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"navi_icon_addr"},"pvalue":{"type":"text","data":"http://mynavi.ucweb.com/geticon.php"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"ft_share"},"pvalue":{"type":"text","data":"http://share.ucweb.com/share/share/index?uc_param_str=bidnfrpflase"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"Voice_Address"},"pvalue":{"type":"text","data":"http://us.vocmd.ucweb.com/mimi"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"uc_siri"},"pvalue":{"type":"text","data":"http://us.vocmd.ucweb.com/mimi"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_new"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/index?uc_param_str=frvednbilanacp"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_home"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/index?uc_param_str=dn"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_channels"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/channels?uc_param_str=dn"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"advise_menu"},"pvalue":{"type":"text","data":"http://feedback.uc.cn/self_service/wap/index?instance=EN&uc_param_str=einibicppfmivefrsiutla"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"uclx_server_addr"},"pvalue":{"type":"text","data":"http://us.uclx.ucweb.com:8097/uclx_agent/"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"flag_client_info"},"pvalue":{"type":"text","data":"on"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"Default_Home_Screen"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_regserver_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas/ucbrowser/register?register_type=email&client_id=73&uc_param_str=frpfvesscpmilaprnisieiut"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_loginserver_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas.clientLogin"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_forgetpsw_url"},"pvalue":{"type":"text","data":"http://id.uc.cn/security/forgotpassword/index?uc_param_str=nieisivefrpfbimilaprligiwiut&appId=73"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_logout_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas.clientLogout"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_useracnt_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas/?uc_param_str=frpfvesscpmilaprnisieiutst&target_client_id=4&target_redirect_uri=http%3A%2F%2Fid.uc.cn%2F%3Fuc_param_str%3Dfrpfvesscpmilaprnisieiut&client_id=73"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"cloud_help_url"},"pvalue":{"type":"text","data":"http://cloud.ucweb.com/help/sync?display=phone&pl="}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"cloud_server"},"pvalue":{"type":"text","data":"browser.cloud.ucweb.com/sync"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"liteua"},"pvalue":{"type":"text","data":"UCWEB/2.0 (MIDP-2.0; U; Adr 2.3.7; en-US; HUAWEI-U8850) U2/1.0.0 UCBrowser/8.7.0.315 U2/1.0.0 Mobile"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"dl_stat"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"url_static"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"addon_api_verify_url"},"pvalue":{"type":"text","data":"http://addon.ucweb.com/api/verify"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"preload_read_mode_whitelist_switch"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"vip_download_interurl1"},"pvalue":{"type":"text","data":"http://en.ucsec1.ucweb.com"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"vip_download_interurl2"},"pvalue":{"type":"text","data":"http://en.ucsec2.ucweb.com"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"u3_smemopt"},"pvalue":{"type":"text","data":"1"}}}]}}}};
//obj2 = {"PbUcParam":{"type":"object","data":{"items":{"type":"list","data":[{"type":"list","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"calluc_chk_url"},"pvalue":{"type":"text","data":"http://125.91.5.45:8000/chkdomain.php?uc_param_str=dnfrvhttp://125.91.5.45:8000/chkdomain.php?uc_param_str=dnfrvhttp://125.91.5.45:8000/chkdomain.php?uc_param_str=dnfrvhttp://125.91.5.45:8000/chkdomain.php?uc_param_str=dnfrvhttp://125.91.5.45:8000/chkdomain.php?uc_param_str=dnfrve"}}},{"type":"object","data":{"ptype":{"type":"text","data":"text moded"},"pname":{"type":"text","data":"navi_icon_addr"},"pvalue":{"type":"text","data":"http://mynavi.ucweb.com/geticon.php"},"padd":{"type":"text","data":"new added text"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"ft_share"},"pvalue":{"type":"text","data":"http://share.ucweb.com/share/share/index?uc_param_str=bidnfrpflassve"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"Voice_Address"},"pvalue":{"type":"text","data":"http://us.vocmd.ucweb.com/mimi"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"uc_siri"},"pvalue":{"type":"text","data":"http://us.vocmd.ucweb.com/mimi"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_new"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/index?uc_param_str=frvednbilanacp"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_home"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/index?uc_param_str=dn"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"intl_rss_channels"},"pvalue":{"type":"text","data":"http://read.ucweb.com/rss_reader/rss_reader/channels?uc_param_str=dn"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"advise_menu"},"pvalue":{"type":"text","data":"http://feedback.uc.cn/self_service/wap/index?instance=EN&uc_param_str=einibicppfmivefrsiutla"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"uclx_server_addr"},"pvalue":{"type":"text","data":"http://us.uclx.ucweb.com:8097/uclx_agent/"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"flag_client_info"},"pvalue":{"type":"text","data":"on"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"Default_Home_Screen"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_regserver_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas/ucbrowser/register?register_type=email&client_id=73&uc_param_str=frpfvesscpmilaprnisieiut"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_loginserver_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas.clientLogin"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_forgetpsw_url"},"pvalue":{"type":"text","data":"http://id.uc.cn/security/forgotpassword/index?uc_param_str=nieisivefrpfbimilaprligiwiut&appId=73"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_logout_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas.clientLogout"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"op_useracnt_url"},"pvalue":{"type":"text","data":"http://api.open.uc.cn/cas/?uc_param_str=frpfvesscpmilaprnisieiutst&target_client_id=4&target_redirect_uri=http%3A%2F%2Fid.uc.cn%2F%3Fuc_param_str%3Dfrpfvesscpmilaprnisieiut&client_id=73"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"cloud_help_url"},"pvalue":{"type":"text","data":"http://cloud.ucweb.com/help/sync?display=phone&pl="}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"cloud_server"},"pvalue":{"type":"text","data":"browser.cloud.ucweb.com/sync"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"liteua"},"pvalue":{"type":"text","data":"UCWEB/2.0 (MIDP-2.0; U; Adr 2.3.7; en-US; HUAWEI-U8850) U2/1.0.0 UCBrowser/8.7.0.315 U2/1.0.0 Mobile"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"dl_stat"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"url_static"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"addon_api_verify_url"},"pvalue":{"type":"text","data":"http://addon.ucweb.com/api/verify"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"preload_read_mode_whitelist_switch"},"pvalue":{"type":"text","data":"1"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"vip_download_interurl1"},"pvalue":{"type":"text","data":"http://en.ucsec1.ucweb.com"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"vip_download_interurl2"},"pvalue":{"type":"text","data":"http://en.ucsec2.ucweb.com"}}},{"type":"object","data":{"ptype":{"type":"text","data":" "},"pname":{"type":"text","data":"u3_smemopt"},"pvalue":{"type":"text","data":"1"}}}]}}}};
//var obj = compareJSON(obj1, obj2);
var obj = compareJSON(obj1, obj2);
console.log(json2Str(obj));
