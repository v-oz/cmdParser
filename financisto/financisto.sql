BEGIN;
INSERT INTO transactions (from_account_id,to_account_id,category_id,from_amount,to_amount,datetime,template_name, note, payee_id, payee)
VALUES(
(select _id from account where number=%%fromAccCard%% or title=%%fromAccTitle%%), 
(select case when (select _id from account where number=%%toAccCard%% or title=%%toAccTitle%%) is null then 0 else (select _id from account where number=%%toAccCard%% or title=%%toAccTitle%%) end),
(select case when (select _id from category where title=%%category%%) is null then 0 else (select _id from category where title=%%category%%) end),
%%from_amount%%,
%%to_amount%%,
(select strftime('%s','now')*1000),
%%template_name%%,
%%note%%,
(select case when (select _id from payee where title=%%payee%%) is null then 0 else (select _id from payee where title=%%payee%%) end),
(select case when (select _id from payee where title=%%payee%%) is null then %%payee%% else '' end)
);

UPDATE account SET 
total_amount=(select (SELECT total_amount FROM account WHERE _id=(select _id from account where number=%%fromAccCard%% or title=%%fromAccTitle%%)) + %%from_amount%%)
WHERE _id=(select _id from account where number=%%fromAccCard%% or title=%%fromAccTitle%%);

INSERT INTO running_balance VALUES (
(select _id from account where number=%%fromAccCard%% or title=%%fromAccTitle%%),
(SELECT MAX(_id) FROM transactions),
(select strftime('%s','now')*1000),
(SELECT total_amount FROM account WHERE _id=(select _id from account where number=%%fromAccCard%% or title=%%fromAccTitle%%))
);
COMMIT;
SELECT total_amount FROM account WHERE _id=(select _id from account where number=%%fromAccCard%% or title=%%fromAccTitle%%);
