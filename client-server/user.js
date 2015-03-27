/************
** Användare
********/

var User = function(){

	var id, nick;


	var getNick = function(){
		return nick;
	}

	return {
		id: id,
		getNick: getNick
	}
}; 

exports.User = User;