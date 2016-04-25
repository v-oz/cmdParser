
// financisto SBRF SMS command set

function financistoCommandSystem(c){
try{
  sys = cSys('MAES1478') // ключевое слово в СМС, определяющее любую транзакцию по карте(счету), которую следует обработать
  if(sys.check(c)){
    sys.cs = {setCash:Cash(), setIncome:Income(), setBuy:Buy(), setFee:Fee()} // набор категорий транзакций
    var kw = []; for (var set in sys.cs) {kw.push(sys.cs[set].keyword); }     // сборка ключевых слов из категорий
    sys.csKeywords = kw.join('|');
    sys.action(c)
    }
  }catch(e){
    Debug('Exception',e.name+' '+e.message);
  }
}


function Cash(){
  var set = cSet('выдача наличных')
  set.defaultAction = function(s){ // если в категории один вид транзакций, то категория редуцируется до команды
    var r, note, sign = '-', o = getCommon(s,sign);
    if (r = s.match(/ATM\s+\d+/)) {note = r[0];} else {note = '';}
    o.template_name = "'наличные'";
    o.payee = "'наличные'";
    o.note = "'"+note+"'";
    runSQLite(o);
  }
  return set
}

function Income(){
  var set = cSet('зачисление')
  set.cs = {c1:c('ZARPLATA')} // в категории обрабатываются шаблонная транзакция и прочие
  var kw = []; for (var cmd in set.cs) {kw.push(set.cs[cmd].keyword); }
  set.csKeywords = kw.join('|');
  set.cs.c1.action = function(s){ // зачисление по шаблону
    var sign = '', o = getCommon(s,sign);
    o.category = "'зп'";
    runSQLite(o);
  }
  set.defaultAction = function(s){ // прочее зачисление
    var sign = '', o = getCommon(s,sign);
    runSQLite(o);
  }
  return set
}

function Buy(){
  var set = cSet('покупка|покупки') // в СМС ключевое слово категории м.б. разным
  set.cs = {c1:c('PIK KOMFORT'), c2:c('возврат'), c3:c('ОТКАЗ'), c4:c('отмена')} // создание набора команд (+ключевые слова транзакций)
  var kw = []; for (var cmd in set.cs) {kw.push(set.cs[cmd].keyword); }
  set.csKeywords = kw.join('|');
  set.cs.c1.action = function(s){ // покупка по шаблону
    var r, d, sign = '-', o = getCommon(s,sign);
    d = new Date(); d.setMonth(d.getMonth()/* устанавливает предыдущий месяц. вот так :) */);
    o.category = "'квартира'"; // массовая замена полей в подстановочном объекте
    o.template_name = "'ЖКУ'";
    o.note = "'"+d.getFullYear()+'-'+d.getMonth()+"'";
    o.payee = "'ПИК-К'";
    runSQLite(o);
  }
  set.cs.c2.action = function(s){ // возврат
    var sign = '', o = getCommon(s,sign);
    o.note = "'возврат'";
    runSQLite(o);
  }
  set.cs.c3.action = function(s){ // ОТКАЗ - транзакции не было, но отрабоать придётся
     flash('ОТКАЗ');
  }
  set.cs.c4.action = function(s){ // отмена - обычно после привязки карты к кошельку
    var sign = '', o = getCommon(s,sign);
    o.note = "'отмена'";
    runSQLite(o);
  }
  set.defaultAction = function(s){ // прочие покупки
    var r, payee, sign = '-', o = getCommon(s,sign);
    if (r = s.match(/\d+\.?\d*р\s+(.+)\s+Баланс:\s+\d+\.?\d*р/)) {payee = r[1];} else {payee = '';} // попытка выцепить получателя платежа из СМС
    o.note = "'"+payee+"'"; // Пишем в комментарий. Потом руками перенесём в получателя
    // Там слишком сложное внедрение нового получателя 
    // я думал просто вставить имя, но нужно заполнить запись в payee и взять ID. 
    // Зачем тогда текстовое поле в транзакциях?
    runSQLite(o);
  }
  return set
}

function Fee(){
  var set = cSet('оплата')
  set.cs = {c1:c('926312'), c2:c('926203'),c3:c('Мобильного банка')}
  var kw = []; for (var cmd in set.cs) {kw.push(set.cs[cmd].keyword); }
  set.csKeywords = kw.join('|');
  set.cs.c1.action = function(s){ // оплата 312
    var sign = '-', o = getCommon(s,sign);
    o.template_name = "'312'";
    o.payee = "'мегафон'";
    o.category = "'телефон'";
    o.note = "'79263121234'";
    runSQLite(o);
  }
  set.cs.c2.action = function(s){ // оплата 203
    var sign = '-', o = getCommon(s,sign);
    o.template_name = "'203'";
    o.payee = "'мегафон'";
    o.category = "'телефон'";
    o.note = "'79262031234'";
    runSQLite(o);
  }
  set.cs.c3.action = function(s){ // оплата Мобильного банка
    var sign = '-', o = getCommon(s,sign);
    o.template_name = "'моб. банк'";
    o.note = "'моб. банк'";
    o.payee = "'СБ РФ'";
    runSQLite(o);
  }
  set.defaultAction = function(s){ // прочая оплата
    var r, note, sign = '-', o = getCommon(s,sign);
    if (r = s.match(/\d+\.?\d*р\s+(.+)\s+Баланс:\s+\d+\.?\d*р/)) {note = r[1];} else {note = '';}
    o.note = "'"+note+"'"; // описание оплаты - в комментарий
    runSQLite(o);
  }
  return set
}

// Создаём подстановочный объект с полями по умолчанию. И заполняем поля, общие для всех транзакций.
function getCommon(s,sign){
  var r, cnt = 0, re = /(\d+\.?\d*)р/g;
  var ret = {"fromAccCard":0, "fromAccTitle":"''", "toAccCard":"0", "toAccTitle":"''", "category":"''", "from_amount":"0", "to_amount":"0", "template_name":"''", "note":"''", "payee":"''"};
  while (r = re.exec(s)){ // вынимаем сумму транзакции и итоговый баланс для сверки после занесения в базу
    if (cnt == 0) {ret.from_amount = sign+''+r[1]*100;}
    if (cnt == 1) {ret.balance = r[1];}
    cnt++;
  }
  if (r = s.match(/MAES(\d{4})/)) {ret.fromAccCard = r[1];} // счет в базе выбирается либо по ID, либо по title из таблицы account. Здесь - по ID
  return ret;
}


// SQLite "interface"
 
function runSQLite(o){
  var sql,re,out,cmd;
  var path_sql = "/sdcard/Tasker/mystuff/sql/financisto.sql";
  var path_db  = "/data/data/ru.orangesoftware.financisto/databases/financisto.db";

  sql = readFile(path_sql); // берём SQL шаблон

  for (f in o){                 // по всем полям подстановочного объекта
    eval("re = /%%"+f+"%%/gm"); // строим RegExp (иначе не заставил работать)
    sql = sql.replace(re,o[f]); // заменяем по RegExp
  }

  cmd = 'sqlite3 '+path_db+' "'+sql+'"'; // строим команду
  if (debug === undefined){ // отладочная переменная - инициализируется в таскере или на глобальном уровне в скрипте
    out = shell (cmd, true, 45); // исполняем через RunShell
    if (out === undefined) {  alert ("SQLite failed");} // sqlite3 fails
    else{ // даже с неправильным SQL попадаем сюда
    if (o.balance == (out/100) ) // надеемся, что SQL правильный и вернул total balance в сотых долях валюты счета
      { flash ("Balance OK"); } else {Debug('Mismatch!', "DB Balance: "+out/100+"\nSMS Balance: "+o.balance); } // показываем результат. если баланс не сходится, то через popup
    }
  }else{Debug('SQLite', cmd);/*writeFile('/sdcard/Tasker/mystuff/sql/test.sql',sql, false);*/ } // или просо показываем то, что будем исполнять
}

// financisto SBRF SMS command set
