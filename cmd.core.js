// supplied AS IS
// 
// command parcer core

// атом системы - команда
function c(keyword){
return {
	keyword:keyword, // ключевое слово или набор слов через ИЛИ (RegExp) задается в виде строки при инициализации системы
	check: function(s){ re = new RegExp(this.keyword, 'igm'); return re.test(s) }, // проверка наличия в тексте ключевого слова
	action: function(s){flash(this.keyword+': '+s) } // выполняемая команда (переопределяется при инициализации системы)
	}
}

// молекула системы - набор команд
// но структура набора команд наследует структуру единичной команды, переопределяя её элементы
function cSet(keyword){
var set = c(keyword) // набор = команда
// действие зачаточного набора переопределяется - 
	set.action = function(s){
		if(set.checkSet(s)){
			set.find(s)
			}else{
			set.defaultAction(s)
			}
		}
// add set's methods
	set.find = function(s){
		for(c in set.cs){
			if(set.cs[c].check(s)){
				set.cs[c].action(s)
				break // comment it for batch commands
				}
			}
		}
	set.checkSet = function(s){ re = new RegExp(set.csKeywords, 'igm'); return re.test(s) }
	set.defaultAction = function(s){flash(set.keyword+': What? '+s)}
// add property
	set.csKeywords = 'dummy'
// the Set
	set.cs = {}
return set
}

function cSys(keyword){
return cSet(keyword)
}

function Debug (head, msg){
  popup(head, msg, true, '', 'PopUpHigh', 300);
}

function sayit(s,e){
var engines = {en:'eng-USA', ru:'rus-RUS'}
	e = e || 'ru'
	say(s, 'default', engines[e], 'system', 5, 5)
}
// command parcer core
