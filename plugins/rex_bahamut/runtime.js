﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

/////////////////////////////////////
// Plugin class
cr.plugins_.Rex_Bahamut = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var pluginProto = cr.plugins_.Rex_Bahamut.prototype;
		
	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};
	
	var typeProto = pluginProto.Type.prototype;

	typeProto.onCreate = function()
	{
	    jsfile_load("jquery.xdomainajax.js");
	};
	
	var jsfile_load = function(file_name)
	{
	    var scripts=document.getElementsByTagName("script");
	    var exist=false;
	    for(var i=0;i<scripts.length;i++)
	    {
	    	if(scripts[i].src.indexOf(file_name) != -1)
	    	{
	    		exist=true;
	    		break;
	    	}
	    }
	    if(!exist)
	    {
	    	var newScriptTag=document.createElement("script");
	    	newScriptTag.setAttribute("type","text/javascript");
	    	newScriptTag.setAttribute("src", file_name);
	    	document.getElementsByTagName("head")[0].appendChild(newScriptTag);
	    }
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
	};
	
	var instanceProto = pluginProto.Instance.prototype;

	instanceProto.onCreate = function()
	{
	    this._user_data = {};
	    this._tag = "";
	    this._current_user_name = "";
		this.exp_CurFriendName = "";
		this.exp_CurFriendNickname = "";
	};	
		
    var _is_vaild_html = function(content)
    {
        return (content != "") && content.indexOf("查詢失敗") == (-1);
    };

    var _index_get = function (content, startIndex, k)
    {
        return content.indexOf(k, startIndex) + k.length;        
    }

	var _user2nickname = function(content, startIndex)
	{
	    var startIndex = _index_get(content, startIndex, "暱稱：");
	    var startIndex = content.indexOf(">", startIndex) +1;
	    var endIndex = content.indexOf("<", startIndex);
	    var value = content.substring(startIndex, endIndex);
	    return value;
	};
	var _user2level = function(content, startIndex)
	{	    
	    // level
	    var startIndex = _index_get(content, startIndex, "LV");
	    var endIndex = content.indexOf(" ", startIndex);
	    var lv = parseFloat( content.substring(startIndex, endIndex) );
	    // race
	    var startIndex = content.indexOf(" ", endIndex+1) + 1;
	    var endIndex = content.indexOf(" ", startIndex);
	    var race = content.substring(startIndex, endIndex);
	    // occupation
	    var startIndex = content.indexOf(" ", endIndex+1) + 1;
	    var endIndex = content.indexOf("<", startIndex);
	    var occupation = content.substring(startIndex, endIndex);
        return [lv, race, occupation];
	};		   
	var _user2property = function(content, startIndex, property_name)
	{	    
	    property_name += "：";
	    var startIndex = _index_get(content, startIndex, property_name);
	    var endIndex = content.indexOf("<", startIndex);
	    var value = content.substring(startIndex, endIndex);	    
        return parseFloat(value);
	};
	
    var _get_friendlist = function(content)
    {
	    var friend_list = [];
		var bound_index = content.indexOf("<!--內容左側區塊結束-->");		
	    var key = '<a href="http://home.gamer.com.tw/';		
		var key_length = key.length;
		var startIndex = content.indexOf(key);		
		var name, endIndex, nickname;		
		while (startIndex < bound_index)
		{
		    startIndex += key_length;
		    endIndex = content.indexOf('"', startIndex);
			name = content.substring(startIndex, endIndex);
			nickname = _friendlist_name2nickname(content, name, endIndex);
			startIndex = content.indexOf(key, endIndex+1);
			friend_list.push([name,nickname]);			
		}
        return friend_list;
    };  

    var _friendlist_name2nickname = function (content, name, startIndex)
	{
		var nickname, nickname_start_index, nickname_endIndex, nickname_key;	
	    nickname_key = name + "<br/>\n";
		nickname_start_index = content.indexOf(nickname_key, startIndex);
		nickname_start_index += nickname_key.length;
		nickname_endIndex = content.indexOf("</a></td>", nickname_start_index);
		nickname = content.substring(nickname_start_index, nickname_endIndex);
		return nickname;
	};	

    instanceProto.filled_user_data = function (content, usr_name)
    {
        if (!_is_vaild_html(content))
        {
            return false;
        }
        
        if (!this._user_data.hasOwnProperty(usr_name))
        {
            this._user_data[usr_name] = {}; 
        }
        var user_data = this._user_data[usr_name]; 
        var startIndex = _index_get(content, 'MSG-mydata1">', 0);
        user_data.Nickname = _user2nickname(content, startIndex);
        var lv = _user2level(content, startIndex);
        user_data.LV = lv[0];
        user_data.RACE = lv[1];
        user_data.OCCUPATION = lv[2];
        
        var startIndex = _index_get(content, 'MSG-mydata3">', startIndex);         
        user_data.STR = _user2property(content, startIndex, "STR");
        user_data.DEX = _user2property(content, startIndex, "DEX");
        user_data.INT = _user2property(content, startIndex, "INT");
        user_data.LUK = _user2property(content, startIndex, "LUK");
        user_data.VIT = _user2property(content, startIndex, "VIT");
        user_data.AGI = _user2property(content, startIndex, "AGI");
        user_data.MND = _user2property(content, startIndex, "MND");
	
        return true;
    }
    
    
    instanceProto.filled_friend_list = function (content, usr_name)
    {
        if (!_is_vaild_html(content))
        {
            return false;
        }
        
        if (!this._user_data.hasOwnProperty(usr_name))
        {
            this._user_data[usr_name] = {}; 
        }
        this._user_data[usr_name].friend_list = _get_friendlist(content);
        return true;   
    };
	//////////////////////////////////////
	// Conditions
	function Cnds() {};
	pluginProto.cnds = new Cnds(); 

	Cnds.prototype.OnGetUserData = function(tag)
	{    
		return (this._tag == tag);
	};
	
	Cnds.prototype.OnGetUserDataFailed = function(tag)
	{
		return (this._tag == tag);
	}; 

	Cnds.prototype.OnGetFriendList = function(tag)
	{    
		return (this._tag == tag);
	};
	
	Cnds.prototype.OnGetFriendListFailed = function(tag)
	{
		return (this._tag == tag);
	}; 

	Cnds.prototype.OnGetGameCard = function(tag)
	{    
	//	return (this._tag == tag);
	};
	
	Cnds.prototype.OnGetGameCardFailed = function(tag)
	{
	//	return (this._tag == tag);
	};
			
	Cnds.prototype.ForEachFriend = function (user_name)
	{   
        var current_event = this.runtime.getCurrentEventStack().current_event;
		
        var usr_data = this._user_data[user_name];
		if (usr_data == null)
		    return false;
        var friend_list = usr_data.friend_list;
		if (friend_list == null)
		    return false;		
        var friend_cnt=friend_list.length;
		var i, friend_item;
		for (i=0; i<friend_cnt; i++)
	    {
		    friend_item = friend_list[i];
            this.exp_CurFriendName = friend_item[0];
            this.exp_CurFriendNickname = friend_item[1];
		    this.runtime.pushCopySol(current_event.solModifiers);
			current_event.retrigger();
			this.runtime.popSol(current_event.solModifiers);
		}

		this.exp_CurFriendName = "";
		this.exp_CurFriendNickname = "";
		return false;        
	}; 	
	//////////////////////////////////////
	// Actions
	function Acts() {};
	pluginProto.acts = new Acts();
	
	Acts.prototype.CleanUserData = function()
	{
	    var name;
	    for (name in this._user_data)
	        delete this._user_data[name];
	};
	
	Acts.prototype.GetUserData = function(user_name, tag)
	{       
	    this._current_user_name = user_name;	    
	    var self = this;
	    var is_success = false;
        window["xdmAjax"]({
            "url": "http://home.gamer.com.tw/homeindex.php?owner="+user_name,
            "type": 'GET',
            "success": function(res) {
                var content = res.responseText;
                content = content.replace(/\r\n/g, "\n");                
                is_success = self.filled_user_data(content, user_name);
            },
            "error": function()
		    {
		        is_success = false;
		    },
		    "complete": function()
		    {
		        self._current_user_name = user_name;
		        var trg_method = (is_success)? 
		                         cr.plugins_.Rex_Bahamut.prototype.cnds.OnGetUserData:
		                         cr.plugins_.Rex_Bahamut.prototype.cnds.OnGetUserDataFailed;
		        self._tag = tag;
		        self.runtime.trigger(trg_method, self);
		    }
        });  	    
	}; 
	
	Acts.prototype.GetFriendList = function(user_name, tag)
	{       
	    this._current_user_name = user_name;	    
	    var self = this;
	    var is_success = false;
        window["xdmAjax"]({
            "url": "http://home.gamer.com.tw/friend.php?owner="+user_name,
            "type": 'GET',
            "success": function(res) {
                var content = res.responseText;
                content = content.replace(/\r\n/g, "\n");
                is_success = self.filled_friend_list(content, user_name);
            },
            "error": function()
		     {
		         is_success = false;
		     },
		     "complete": function()
		     {
		        self._current_user_name = user_name;
		        var trg_method = (is_success)? 
		                         cr.plugins_.Rex_Bahamut.prototype.cnds.OnGetFriendList:
		                         cr.plugins_.Rex_Bahamut.prototype.cnds.OnGetFriendListFailed;
		        self._tag = tag;
		        self.runtime.trigger(trg_method, self);
		     }
        });	
	}; 	
	
	Acts.prototype.GetGameCard = function(user_name, tag) {}; 	
	//////////////////////////////////////
	// Expressions
	function Exps() {};
	pluginProto.exps = new Exps();
	
	Exps.prototype.CurUserName = function(ret)
	{   
		ret.set_string(this._current_user_name);         
	}; 
		
	Exps.prototype.STR = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;
		var val = (this._user_data[user_name] == null)?
		           0:this._user_data[user_name].STR;
		ret.set_float(val);         
	}; 

	Exps.prototype.DEX = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;
		var val = (this._user_data[user_name] == null)?
		           0:this._user_data[user_name].DEX;
		ret.set_float(val);     		
	}; 	
	
	Exps.prototype.INT = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;
		var val = (this._user_data[user_name] == null)?
		           0:this._user_data[user_name].INT;
		ret.set_float(val);		
	}; 

	Exps.prototype.LUK = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;
		var val = (this._user_data[user_name] == null)?
		           0:this._user_data[user_name].LUK;
		ret.set_float(val);			
	}; 	
	
	Exps.prototype.VIT = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;
		var val = (this._user_data[user_name] == null)?
		           0:this._user_data[user_name].VIT;
		ret.set_float(val);	        
	}; 	
	
	Exps.prototype.AGI = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;
		var val = (this._user_data[user_name] == null)?
		           0:this._user_data[user_name].AGI;
		ret.set_float(val);	      
	}; 

	Exps.prototype.MND = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;
		var val = (this._user_data[user_name] == null)?
		           0:this._user_data[user_name].MND;
		ret.set_float(val);	      
	};

	Exps.prototype.ImageURL = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;	    
	    var img_url = "http://avatar2.bahamut.com.tw/avataruserpic/"+
	                  user_name.charAt(0) +"/"+ user_name.charAt(1)+ "/"+ user_name +"/"+ user_name +".png";
		ret.set_string(img_url);
	}; 	
	
	Exps.prototype.CurFriendName = function(ret)
	{   
		ret.set_string(this.exp_CurFriendName);         
	}; 
	
	Exps.prototype.CurFriendNickname = function(ret)
	{   
		ret.set_string(this.exp_CurFriendNickname);         
	}; 	

	Exps.prototype.GameCardURL = function(ret, user_name)
	{   
		ret.set_string("");
	}; 	
	
	Exps.prototype.Nickname = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;
		var val = (this._user_data[user_name] == null)?
		           "":this._user_data[user_name].Nickname;
		ret.set_string(val);	      
	};
	
	Exps.prototype.LV = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;
		var val = (this._user_data[user_name] == null)?
		           0:this._user_data[user_name].LV;
		ret.set_float(val);	      
	};
	
	Exps.prototype.RACE = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;
		var val = (this._user_data[user_name] == null)?
		           "":this._user_data[user_name].RACE;
		ret.set_string(val);	      
	};			
	
	Exps.prototype.OCCUPATION = function(ret, user_name)
	{   
	    if (user_name == null)
	       user_name = this._current_user_name;
		var val = (this._user_data[user_name] == null)?
		           "":this._user_data[user_name].OCCUPATION;
		ret.set_string(val);	      
	};		
}());