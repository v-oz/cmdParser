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
var set = c(keyword) // набор = команда. ключевое слово для срабатывания действия набора
// действие зачаточного набора переопределяется - 
	set.action = function(s){
		if(set.checkSet(s)){ // если в тексте есть ключевые слова команд этого набора
			set.find(s)  // найти эту команду и выполнить её действие
			}else{
			set.defaultAction(s) // или отработать по умолчанию.
			}
		}
// Найти команду и выполнить её действие, если ключевое слово есть в тексте
	set.find = function(s){
		for(c in set.cs){
			if(set.cs[c].check(s)){
				set.cs[c].action(s)
				break // если в тексте может быть несколько команд из этого набора, закомментировать строку
				// иначе выполнится первая попавшаяся
				}
			}
		}
	set.checkSet = function(s){ re = new RegExp(set.csKeywords, 'igm'); return re.test(s) }
	set.defaultAction = function(s){flash(set.keyword+': What? '+s)}
// ключевые слова набора определяются на этапе построения целевой системы
	set.csKeywords = 'dummy'
// команды набора так же определяются на этапе построения целевой системы
	set.cs = {}
return set
}

// типовая система.
// настраивается на этапе построения целевой системы
function cSys(keyword){
return cSet(keyword)
}

// command parcer core
