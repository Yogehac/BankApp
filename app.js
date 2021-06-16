if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}
const express = require('express');
const port = process.env.PORT || 3000;
const path = require('path');
const ejsMate = require('ejs-mate');
const Account = require('./models/accounts');
const session = require('express-session');
const flash = require('connect-flash');

const MongoDBStore = require('connect-mongo');

const app = express();

const mongoose = require('mongoose');
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1/BankApp';
mongoose
	.connect(dbUrl, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useUnifiedTopology: true,
		useFindAndModify: false
	})
	.then(() => {
		console.log('MONGOOSE Database connected');
	})
	.catch((e) => {
		console.log('MONGOOSE CONNECTION FAILED');
		console.log(e);
	});

app.engine('ejs', ejsMate);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const secret = process.env.SECRET || 'thisisabadsecret';

const store = new MongoDBStore({
	mongoUrl: dbUrl,
	secret,
	touchAfter: 24 * 60 * 60
});

store.on('error', function(e) {
	console.log('SESSION STORE ERROR', e);
});
const sessionConfig = {
	store,
	name: 'majaYoge',
	secret,
	resave: false,
	saveUninitialized: true
};

app.use(session(sessionConfig));
app.use(flash());

app.use((req, res, next) => {
	res.locals.success = req.flash('success');
	next();
});

app.get('/', (req, res) => {
	res.render('home');
});

app.get('/about', (req, res) => {
	res.render('about');
});
app.get('/accounts', async (req, res) => {
	const accounts = await Account.find({});
	res.render('accounts/index', { accounts });
});
app.get('/accounts/:id', async (req, res) => {
	const { id } = req.params;
	const account = await Account.findById(id);
	res.render('accounts/show', { account });
});
app.get('/accounts/:id/transfer', async (req, res) => {
	const { id } = req.params;
	const allAccounts = await Account.find({ _id: { $nin: id } });
	const account = await Account.findById(id);
	res.render('accounts/transfer', { account, allAccounts });
});
app.post('/accounts/:id', async (req, res) => {
	const { id } = req.params;
	const { sentAmt, benificiaryId } = req.body;
	const account = await Account.findById(id);
	const benificiary = await Account.findById(benificiaryId);
	account.balance = account.balance - sentAmt;
	account.transactions.push({ reciever: benificiary.name, amount: sentAmt, avlBaln: account.balance });
	benificiary.balance = benificiary.balance + parseInt(sentAmt);
	benificiary.transactions.push({ sender: account.name, amount: sentAmt, avlBaln: benificiary.balance });
	account.save();
	benificiary.save();
	req.flash('success', 'Successfully made payment!');
	res.redirect(`/accounts/${id}`);
});
app.get('/accounts/:id/transactions', async (req, res) => {
	const { id } = req.params;
	const account = await Account.findById(id);
	res.render('accounts/transactions', { account });
});

app.listen(port, () => {
	console.log(`Serving on PORT ${port}`);
});
