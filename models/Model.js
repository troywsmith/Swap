const db = require("../database/connection");

const Model = {};

Model.all = () => {
  return db.any(`
  SELECT * 
  FROM users, transactions
  WHERE users.id = transactions.sending_user_id
  ORDER BY transactions.dateandtime DESC`);
};

Model.allUsers = () => {
  return db.any(`
  SELECT * 
  FROM users
  ORDER BY username ASC`);
};

Model.findUser = id => db.one(`
  SELECT * 
  FROM users 
  WHERE id = $1`, [id]);

Model.findByUsername = username =>
  db.one(`
  SELECT * 
  FROM users 
  WHERE username = $1`, [username]);

Model.findIdbyUsername = username =>
  db.one(`
  SELECT id 
  FROM users 
  WHERE username = $1`, [username]);

Model.createUser = user =>
  db.one(
    `
    INSERT INTO users (username, password_digest, email, wallet_address, privateKey, bal, account_active) 
    VALUES ('${user.username}', '${user.password_digest}', '${user.email}', '${user.wallet_address}', '${user.privateKey}', 10, TRUE) 
    RETURNING *;
    `, user
  );

Model.updateMaster = () => 
db.none(
  `UPDATE users
  SET bal = bal - 10
  WHERE id = 1`
);

Model.updateUser = updatedData => 
db.none(
  `UPDATE users
  SET username = '${updatedData.username}',
  email = '${updatedData.email}',
  phone = '${updatedData.phone}',
  address = '${updatedData.address}'
  WHERE id = ${updatedData.userId}`, updatedData
);

Model.deleteUser = userId => 
db.none(
  `UPDATE users
  SET account_active = 'FALSE'
  WHERE id = ${userId}`, userId
);


Model.updateBalances = data =>
  db.none(
    `
    BEGIN TRANSACTION;

    UPDATE users
    SET bal = bal - ${data.amount}
    WHERE id = ${data.sending_user_id};

    UPDATE users
    SET bal = bal + ${data.amount}
    WHERE username = '${data.receiving_username}';

    INSERT INTO transactions (sending_user_id, receiving_username, amount, dateandtime) 
    VALUES (${data.sending_user_id}, '${data.receiving_username}', ${data.amount}, '${data.dateandtime}') 
    RETURNING *;

    COMMIT;
    `, data
  );

Model.allTransactions = () => {
  return db.any("SELECT * FROM transactions");
};

Model.findTransactionById = id => {
  return db.one("SELECT * FROM transactions WHERE id = ${id}", 
  {id: id});
};

Model.findTransactionsByUserId = (id) => {
  return db.any(`
  SELECT * 
  FROM users, transactions
  WHERE (users.id = transactions.sending_user_id AND users.id = ${id})
  OR (users.username = transactions.receiving_username AND users.id = ${id})
  ORDER BY transactions.dateandtime DESC
`, 
  {id: id});
};

Model.jointable = (id) => {
  return db.any(`
  SELECT * 
  FROM users 
  INNER JOIN transactions ON (users.id = transactions.sending_user_id)
  WHERE (users.id = transactions.sending_user_id OR users.username = transactions.receiving_username)
  AND (users.id = ${id})
  ORDER BY transactions.dateandtime DESC
`, 
  {id: id});
};


module.exports = Model;