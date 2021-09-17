import express from 'express';
import knex from 'knex';
import cors from 'cors';

const PORT = process.env.PORT;

// ****** DATABASE section *************************
// Its for fix poblem with using free Heroku database 
//  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// const db = knex({
//   client: 'pg',
//   connection: {
//     connectionString: process.env.DATABASE_URL,
//     ssl: true,
//   }
// });
const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    port : 5432,
    user : 'postgres',
    password : '123',
    database : 'banksbase'
  }
});
// *************************************************

const app = express();

// ****** MIDDLEWARE *******************************
app.use(express.json());
app.use(cors());
// *************************************************

// ******* /banks **********************************
app.get('/banks', (req, res) => {
  db('banks').select('*')
  .then((data) => {
    if(data) {
      res.status(200).json(data);
    } else {
      res.status(404).json('Database is empty');
    }
  })
  .catch((err) => res.status(400).json(err));
})
// *************************************************

// ******* /banks/create ***************************
app.post('/banks/create', (req, res) => {
const {bankname, interestrate, maxloan, mindownpayment, loanterm} = req.body;
// validation of received data
if(bankname && interestrate && maxloan && mindownpayment && loanterm) {
  if(bankname.length < 2) return res.status(400).json("invalid bank name");
  if(interestrate.length < 2) return res.status(400).json("invalid interest rate");
  if(maxloan.length < 2) return res.status(400).json("invalid maximum loan");
  if(mindownpayment.length < 2) return res.status(400).json("invalid minimum down payment");
  if(loanterm.length < 2) return res.status(400).json("invalid loan term");
  // all data is good, check the existence of such bank
  db('banks').select('*')
  .where({bankname})
  .then((data) => {
    if(data[0].id) return res.status(400).json('Such bank already exists');
  })
  .catch((err) => { 
    // if such bank doesn't exist, add him to the base
    db('banks')
    .returning('*')
    .insert({bankname, interestrate, maxloan, mindownpayment, loanterm})
    .then(data => res.status(200).json(data[0]))
    .catch(err => res.status(400).json('Banks database error, cannot add data'));
  });

} else res.status(400).json("invalid bank's data");
});
// *************************************************

// ******* /banks/delete ***************************
app.delete('/banks/delete', (req, res) =>{
  const {id} = req.body;
  // validation of received data
  if(id) {
  // if id is good, check the existence of such bank
    db('banks').select('*')
    .where({id})
    .then((bank) => {
      if(bank[0].id) {
        // if the bank exists, delete the bank from the database
        db('banks')
        .where({id: bank[0].id})
        .del()
        .then(() => res.status(200).json('success'))
        .catch(err => res.status(400).json('Banks database error, cannot delete data'))
      }
    })
    .catch((err) =>  res.status(400).json('Such bank does not exists'));
    // if requsted data are wrong
  } else res.status(400).json("invalid bank's data");
});
// *************************************************

// ******* /banks/:id (EDIT get data) **************
app.get('/banks/:id', (req, res) => {
    if(req.params.id) {
      db('banks')
      .where({id: req.params.id})
      .select('*')
      .then((bank) => {
        if(bank[0].id) {
          // if the bank exists, send it's data to the front-end
          return res.status(200).json(bank[0]);
        }
      })
      .catch(err => res.status(400).json('Such bank does not exist'));
    } else res.status(400).json('invalid :id parameter');
});
// *************************************************

// ******* /banks/:id (EDIT pun new data) **********
app.put('/banks/:id', (req, res) => {
  const {bankname, interestrate, maxloan, mindownpayment, loanterm} = req.body;
  
  // validation of received data
  if(bankname && interestrate && maxloan && mindownpayment && loanterm) {
    if(bankname.length < 2) return res.status(400).json("invalid bank name");
    if(interestrate.length < 2) return res.status(400).json("invalid interest rate");
    if(maxloan.length < 2) return res.status(400).json("invalid maximum loan");
    if(mindownpayment.length < 2) return res.status(400).json("invalid minimum down payment");
    if(loanterm.length < 2) return res.status(400).json("invalid loan term");
      // all data is good, check the existence of such bank
    if(req.params.id) {
      db('banks')
      .where({id: req.params.id})
      .select('*')
      .then((bank) => {
        if(bank[0].id) {
          // if the bank exists, update it's data in the database
          db('banks')
          .where({id: req.params.id})
          .update({bankname, interestrate, maxloan, mindownpayment, loanterm})
          .then(() => res.status(200).json('success, bank\'s data updated'))
          .catch(err => res.status(400).json('Banks database error: cannot undate data'))
        }
      })
      .catch(err => res.status(400).json('Such bank does not exist'));
    } else res.status(400).json('invalid :id parameter');
  } else res.status(400).json('invalid bank\'s data');
});
// *************************************************

// ******* /mortgage-calculator/:bankname (GET bank by name) **********
app.get('/mortgage-calculator/:bankname', (req, res) => {
  const { bankname } = req.params;
    if(bankname) {
      db('banks')
      .where({bankname})
      .select('*')
      .then((bank) => res.status(200).json(bank[0]))
      .catch(err => res.status(400).json('Such bank does not exist'));
    } else res.status(400).json('invalid :bankname parameter');

});
// *************************************************

app.listen(3001, () => {
  console.log(`Server is running`);
});