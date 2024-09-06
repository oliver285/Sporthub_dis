const express = require('express');
const app = express();
const path = require('path');
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
require('dotenv').config();

const hostname = '0.0.0.0';
const port = 1234;

const TEAM_TREND_API_KEY = process.env.TEAM_TREND_API_KEY;

const SPLIT_KEY = process.env.BETTING_SPLIT_API_KEY;

// Serve static files from the 'src/resources' directory
app.use('/resources', express.static(path.join(__dirname, 'resources')));

// Create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: "hbs",
  layoutsDir: path.join(__dirname, "views", "layouts"),
  partialsDir: path.join(__dirname, "views", "partials"),
  helpers: {
    mod: function (n, m) {
      return n % m;
    },
    eq: function (a, b) {
      return a === b;
    },
    isEqual: function (a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    },
    notEqual: function (a, b, options) {
      return a != b ? options.fn(this) : options.inverse(this);
    },
    add: function (a, b) {
      return a + b;
    },
    subtract: function (a, b) {
      return a - b;
    },
    range: function (start, end) {
      var array = [];
      for (var i = start; i <= end; i++) {
        array.push(i);
      }
      return array;
    },
    lt: function (a, b) {
      return a < b;
    },
    gt: function (a, b) {
      return a > b;
    },
    isNull: function (a, options) {
      if (a == null) {
        return true ? options.fn(this) : options.inverse(this);
      } else {
        return false ? options.fn(this) : options.inverse(this);
      }
    },
    renderPurchase: function (
      title,
      product_name,
      product_price,
      isStock,
      product_id,
      stock_id
    ) {
      return (
        '<div class="modal" id="purchaseModal" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">' +
        title +
        '</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div><div class="modal-body" id="purchaseModalBody"><div class="card"><div class="card-body"><p class="card-title">$' +
        product_price +
        '</p></div></div><div id="paypal-button-container"></div></div></div></div></div><script>function postData(isStock){var xhr = new XMLHttpRequest();xhr.open("POST", "/submit-purchase", true);xhr.setRequestHeader(\'Content-Type\', \'application/json\');xhr.send(JSON.stringify({isStock: isStock,stock_id: ' +
        stock_id +
        ",product_id: " +
        product_id +
        ",}));}paypal.Buttons({style: {shape: 'pill',},createOrder: function(data, actions) {return actions.order.create({reference_id: '" +
        product_name +
        "',description: '" +
        product_name +
        "',purchase_units: [{amount: {value: '" +
        product_price +
        ".00',currency_code: 'USD',breakdown: {item_total: {value: '" +
        product_price +
        "', currency_code: 'USD'}}},items: [{name: '" +
        product_name +
        "',unit_amount: {value: '" +
        product_price +
        ".00', currency_code: 'USD'},quantity: '1',}]}],application_context: {shipping_preference: 'NO_SHIPPING'}});},onApprove: function(data, actions) {return actions.order.capture().then(function(details) {$(\"#purchaseModal\").modal('hide');postData(" +
        isStock +
        ");if(" +
        isStock +
        " == 1){Swal.fire({'title': 'Payment Received!','text': 'Your shares have been purchased! Your profile will reflect all purchased shares.','type': 'success'}).then((button) => {if(button){setTimeout(' window.location.href =  \"/profile\"', 0);}});}else{Swal.fire({'title': 'Payment Received!','text': 'Your item will be shipped in 2-4 business days. USPS Tracking #: 9649 3110 2374 6102 7765','type': 'success'}).then((button) => {if(button){setTimeout(' window.location.href =  \"/profile\"', 0);}});}});},onError: function(err){Swal.fire({'title': 'Error','text': 'We are unable to complete your payment at this time. This could be due to a declined transaction, poor internet connection, or another issue. Please try again.','type': 'error'}).then((button2) => {})}}).render('#paypal-button-container');</script>"
      );
    },
  },
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing request bodies
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Set up session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

// Database configuration and connection
//Get script.js
//const scripts = require('./resources/js/script');
// -------------------------------------  DB CONFIG AND CONNECT   ---------------------------------------
const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};
const db = pgp(dbConfig);

// Test database connection
db.connect()
  .then(obj => {
    console.log('Database connection successful');
    obj.done(); // success, release the connection
  })
  .catch(error => {
    console.error('Database connection error:', error);
    console.error('Connection details:', dbConfig);
  });

// Routes
// Middleware to pass user & vendor session data to views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.vendor = req.session.vendor || null;
  next();
});
// ------------------------------------- Defining User login credentials --------------------------------------
const user = {
  user_id: undefined,
  username: undefined,
  password: undefined,
  first_name: undefined,
  last_name: undefined,
  email: undefined,
  img_path: undefined,
  date: undefined,
};
// ------------------------------------- Defining Vendor Info --------------------------------------
const vendor = {
  vendor_id: undefined,
  account_balance: undefined
};

// -------------------------------------  ROUTES for home.hbs   ----------------------------------------------
// ROUTES

app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});
app.get('/', (req, res) => {
  res.render('pages/home');
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});
// Route for sports data
app.get('/data', (req, res) => {
  res.render('pages/data');
});

// Route for stocks
app.get('/stocks', (req, res) => {
  res.render('pages/stocks');
});

// Route for store

// Register Route
app.post("/register", async (req, res) => {
  const { first_name, last_name, username, email, password } = req.body;

  // Validate input
  if (!first_name || !last_name || !username || !email || !password) {
    return res.status(400).render('pages/register', { message: 'All fields are required.', error: true });
  }
  if (password.length < 6) {
    return res.status(400).render('pages/register', { message: 'Password must be at least 6 characters long.', error: true });
  }

  // Additional email validation can be added here

  const checkQuery = "SELECT COUNT(*) FROM users WHERE username = $1";

  try {
    const result = await db.one(checkQuery, [username]);
    const count = parseInt(result.count);

    if (count > 0) {
      return res.status(400).render('pages/register', { message: 'Username already exists. Please choose a different username.', error: true });
    } else {
      const password_hash = await bcrypt.hash(password, 10);
      const userInsertQuery = 'INSERT INTO users (first_name, last_name, username, email, password) VALUES ($1, $2, $3, $4, $5)';
      await db.none(userInsertQuery, [first_name, last_name, username, email, password_hash]);
      return res.status(200).render('pages/login', { message: 'Successfully registered', error: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).render('pages/register', { message: 'Error registering user. Please try again later.', error: true });
  }
});


// Login submission endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = $1';
  try {
    const user = await db.oneOrNone(query, [username]);
    if (!user) {
      return res.render('pages/register', { message: 'Username does not exist', error: true });
    }
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.user = user;
      req.session.save(() => {
        res.status(200).render('pages/profile', {
          message: 'Successfully logged in.',
          error: false,
          username: req.session.user.username,
          first_name: req.session.user.first_name,
          last_name: req.session.user.last_name,
          email: req.session.user.email,
          date: req.session.user.time_registered
        });
        console.log(message);
      });

      const vendorQuery = 'SELECT * FROM vendors WHERE user_id = $1 LIMIT 1';
      const values = [user.user_id];

      db.one(vendorQuery, values)
        .then(data => {
          const vendor = {
            vendor_id: data.vendor_id,
            account_balance: data.account_balance
          };
          req.session.vendor = vendor;
        })
        .catch(err => {
          console.log(err);
        });
    } else {
      res.render('pages/login', { message: 'Incorrect password.', error: true });
    }
  } catch (error) {
    console.error(error);
    res.render('pages/login', { message: 'An error occurred. Please try again.', error: true });
  }
});

// Authentication middleware
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

app.get("/store", auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  const offset = (page - 1) * limit;
  const productId = req.query.product_id;
  var filterApplied = 0;
  var forYou;
  var min;
  var max;
  var type;
  var tags;
  var productResults;
  if (req.query.min) {
    min = parseInt(req.query.min);
    max = parseInt(req.query.max);
    filterApplied = 1;
  } else {
    min = -1;
    max = -1;
  }
  if (req.query.type) {
    type = req.query.type;
    filterApplied = 1;
  } else {
    type = -1;
  }
  if (req.query.tags) {
    tags = req.query.tags;
    filterApplied = 1;
  } else {
    tags = -1;
  }
  if (req.query.forYou) {
    forYou = 1;
    filterApplied = 1;
  } else {
    forYou = -1;
  }
  try {
    if (productId) {
      const product = await db.one(
        "SELECT * FROM products WHERE product_id = $1",
        [productId]
      );
      res.render("pages/store", {
        product,
        product_results: null,
        current_page: null,
        total_pages: null,
        mp_product: 0,
      });
    } else {
      const totalProducts = await db.one("SELECT COUNT(*) FROM products");
      const totalPages = Math.ceil(totalProducts.count / limit);
      if (min != -1) {
        productResults = await db.any(
          "SELECT * FROM products WHERE fromVendor = 0 AND price BETWEEN $1 AND $2 LIMIT $3 OFFSET $4",
          [min, max, limit, offset]
        );
      } else if (type != -1) {
        productResults = await db.any(
          "SELECT * FROM products WHERE fromVendor = 0 AND product_type = $1 LIMIT $2 OFFSET $3",
          [type, limit, offset]
        );
      } else if (tags != -1) {
        productResults = await db.any(
          "SELECT * FROM products WHERE fromVendor = 0 AND product_tags LIKE $1 LIMIT $2 OFFSET $3",
          ["%" + tags + "%", limit, offset]
        );
      } else if (forYou != -1) {
        const teamsQuery =
          "SELECT team_id FROM users_to_teams WHERE user_id = $1";
        const teamsValues = [req.session.user.user_id];
        var teamsArray = [];
        var teamNamesArray = [];
        try {
          const teamsResults = await db.any(teamsQuery, teamsValues);
          if (teamsResults) {
            for (var i = 0; i < teamsResults.length; i++) {
              teamsArray.push(teamsResults[i].team_id);
            }
            for (var i = 0; i < teamsArray.length; i++) {
              const namesQuery =
                "SELECT team_name FROM teams WHERE team_id = $1";
              const namesValues = [teamsArray[i]];
              const namesResults = await db.any(namesQuery, namesValues);
              if (namesResults) {
                teamNamesArray.push(namesResults[0].team_name);
              }
            }
          }
        } catch (error) {
          console.log(error);
        }
        var likeString = "";
        for (var i = 0; i < teamNamesArray.length; i++) {
          if (i == teamNamesArray.length - 1) {
            likeString += "product_tags LIKE '%" + teamNamesArray[i] + "%'";
          } else {
            likeString += "product_tags LIKE '%" + teamNamesArray[i] + "%' OR ";
          }
        }
        if (teamNamesArray.length > 0) {
          productResults = await db.any(
            "SELECT * FROM products WHERE fromVendor = 0 AND " +
              likeString +
              " LIMIT $1 OFFSET $2",
            [limit, offset]
          );
        } else {
          productResults = [];
        }
      } else {
        productResults = await db.any(
          "SELECT * FROM products WHERE fromVendor = 0 LIMIT $1 OFFSET $2",
          [limit, offset]
        );
      }
      res.render("pages/store", {
        product: null,
        product_results: productResults,
        current_page: page,
        total_pages: totalPages,
        user_id: req.session.user.user_id,
        filter_applied: filterApplied,
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error" + error);
  }
});

app.get("/marketplace", auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  const offset = (page - 1) * limit;
  const productId = req.query.product_id;
  var filterApplied = 0;
  var forYou;
  var min;
  var max;
  var type;
  var tags;
  var productResults;
  if (req.query.min) {
    min = parseInt(req.query.min);
    max = parseInt(req.query.max);
    filterApplied = 1;
  } else {
    min = -1;
    max = -1;
  }
  if (req.query.type) {
    type = req.query.type;
    filterApplied = 1;
  } else {
    type = -1;
  }
  if (req.query.tags) {
    tags = req.query.tags;
    filterApplied = 1;
  } else {
    tags = -1;
  }
  if (req.query.forYou) {
    forYou = 1;
    filterApplied = 1;
  } else {
    forYou = -1;
  }
  try {
    if (productId) {
      const product = await db.one(
        "SELECT * FROM products WHERE product_id = $1",
        [productId]
      );
      res.render("pages/marketplace", {
        product,
        product_results: null,
        current_page: null,
        total_pages: null,
        mp_product: 1,
      });
    } else {
      const totalProducts = await db.one("SELECT COUNT(*) FROM products");
      const totalPages = Math.ceil(totalProducts.count / limit);
      if (min != -1) {
        productResults = await db.any(
          "SELECT * FROM products WHERE fromVendor = 1 AND price BETWEEN $1 AND $2 LIMIT $3 OFFSET $4",
          [min, max, limit, offset]
        );
      } else if (type != -1) {
        productResults = await db.any(
          "SELECT * FROM products WHERE fromVendor = 1 AND product_type = $1 LIMIT $2 OFFSET $3",
          [type, limit, offset]
        );
      } else if (tags != -1) {
        productResults = await db.any(
          "SELECT * FROM products WHERE fromVendor = 1 AND product_tags LIKE $1 LIMIT $2 OFFSET $3",
          ["%" + tags + "%", limit, offset]
        );
      } else if (forYou != -1) {
        const teamsQuery =
          "SELECT team_id FROM users_to_teams WHERE user_id = $1";
        const teamsValues = [req.session.user.user_id];
        var teamsArray = [];
        var teamNamesArray = [];
        try {
          const teamsResults = await db.any(teamsQuery, teamsValues);
          if (teamsResults) {
            for (var i = 0; i < teamsResults.length; i++) {
              teamsArray.push(teamsResults[i].team_id);
            }
            for (var i = 0; i < teamsArray.length; i++) {
              const namesQuery =
                "SELECT team_name FROM teams WHERE team_id = $1";
              const namesValues = [teamsArray[i]];
              const namesResults = await db.any(namesQuery, namesValues);
              if (namesResults) {
                teamNamesArray.push(namesResults[0].team_name);
              }
            }
          }
        } catch (error) {
          console.log(error);
        }
        var likeString = "";
        for (var i = 0; i < teamNamesArray.length; i++) {
          if (i == teamNamesArray.length - 1) {
            likeString += "product_tags LIKE '%" + teamNamesArray[i] + "%'";
          } else {
            likeString += "product_tags LIKE '%" + teamNamesArray[i] + "%' OR ";
          }
        }
        if (teamNamesArray.length > 0) {
          productResults = await db.any(
            "SELECT * FROM products WHERE fromVendor = 1 AND " +
              likeString +
              " LIMIT $1 OFFSET $2",
            [limit, offset]
          );
        } else {
          productResults = [];
        }
      } else {
        productResults = await db.any(
          "SELECT * FROM products WHERE fromVendor = 1 LIMIT $1 OFFSET $2",
          [limit, offset]
        );
      }
      var vendor_id = null;
      try {
        vendorResult = await db.any(
          "SELECT vendor_id FROM vendors WHERE user_id = $1 LIMIT 1",
          [req.session.user.user_id]
        );
        if (vendorResult) {
          vendor_id = vendorResult[0].vendor_id;
        }
      } catch (error) {
        console.log(error);
      }
      res.render("pages/marketplace", {
        product: null,
        product_results: productResults,
        current_page: page,
        total_pages: totalPages,
        user_id: req.session.user.user_id,
        filter_applied: filterApplied,
        vendor_id: vendor_id,
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error" + error);
  }
});

// Profile route
app.get("/profile", auth, async (req, res) => {
  var teamData = [];
  var userTeamData2Array = [];
  var isVendor = 0;
  const teamQuery = "SELECT * FROM teams";
  try {
    teamData = await db.many(teamQuery);
  } catch (error) {
    teamData = [];
    console.log(error);
  }
  const userTeamQuery =
    "SELECT team_id FROM users_to_teams WHERE user_id = $1 LIMIT 5";
  const userTeamValues = [req.session.user.user_id];
  try {
    const userTeamData = await db.any(userTeamQuery, userTeamValues);
    if (userTeamData) {
      var userTeamDataArray = [];
      for (var i = 0; i < userTeamData.length; i++) {
        userTeamDataArray.push(userTeamData[i].team_id);
      }
      for (var i = 0; i < userTeamDataArray.length; i++) {
        const userTeamQuery2 = "SELECT * FROM teams WHERE team_id = $1 LIMIT 1";
        const userTeamValues2 = [userTeamDataArray[i]];
        const userTeamData2 = await db.one(userTeamQuery2, userTeamValues2);
        if (userTeamData2) {
          userTeamData2Array.push(userTeamData2);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
  const vendorQuery = "SELECT * FROM vendors WHERE user_id = $1 LIMIT 1";
  const values = [req.session.user.user_id];
  try {
    const vendorData = await db.oneOrNone(vendorQuery, values);
    if (vendorData) {
      const vendor = {
        vendor_id: vendorData.vendor_id,
        account_balance: vendorData.account_balance,
      };
      req.session.vendor = vendor;
      var isVendor = 1;
    }
  } catch (error) {
    console.log(error);
  }
  const historyQuery =
    "SELECT * FROM purchase_history WHERE user_id = $1 ORDER BY id DESC LIMIT 5";
  const historyValues = [req.session.user.user_id];
  var historyData2Array = [];
  try {
    const historyData = await db.any(historyQuery, historyValues);
    if (historyData) {
      var historyDataArray = [];
      for (var i = 0; i < historyData.length; i++) {
        historyDataArray.push(historyData[i].product_id);
      }
      for (var i = 0; i < historyDataArray.length; i++) {
        const historyQuery2 =
          "SELECT * FROM products WHERE product_id = $1 LIMIT 1";
        const historyValues2 = [historyDataArray[i]];
        const historyData2 = await db.one(historyQuery2, historyValues2);
        if (historyData2) {
          historyData2Array.push(historyData2);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
  if (isVendor == 1) {
    const forSaleQuery =
      "SELECT product_id FROM vendors_to_products WHERE vendor_id = $1 ORDER BY id DESC LIMIT 2";
    const forSaleValues = [req.session.vendor.vendor_id];
    var forSaleData2Array = [];
    try {
      const forSaleData = await db.any(forSaleQuery, forSaleValues);
      if (forSaleData) {
        var forSaleDataArray = [];
        for (var i = 0; i < forSaleData.length; i++) {
          forSaleDataArray.push(forSaleData[i].product_id);
        }
        for (var i = 0; i < forSaleDataArray.length; i++) {
          const forSaleQuery2 =
            "SELECT img_path FROM products WHERE product_id = $1 LIMIT 1";
          const forSaleValues2 = [forSaleDataArray[i]];
          const forSaleData2 = await db.one(forSaleQuery2, forSaleValues2);
          if (forSaleData2) {
            forSaleData2Array.push(forSaleData2.img_path);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
    res.render("pages/profile", {
      message: "Successfully logged in.",
      error: false,
      user_id: req.session.user.user_id,
      username: req.session.user.username,
      first_name: req.session.user.first_name,
      last_name: req.session.user.last_name,
      email: req.session.user.email,
      img_path: req.session.user.img_path,
      date: req.session.user.time_registered,
      vendor_id: req.session.vendor.vendor_id,
      account_balance: req.session.vendor.account_balance,
      team_data: teamData,
      user_team_data: userTeamData2Array,
      history_data: historyData2Array,
      for_sale_data: forSaleData2Array,
    });
  } else {
    res.render("pages/profile", {
      message: "Successfully logged in.",
      error: false,
      user_id: req.session.user.user_id,
      username: req.session.user.username,
      first_name: req.session.user.first_name,
      last_name: req.session.user.last_name,
      email: req.session.user.email,
      date: req.session.user.time_registered,
      team_data: teamData,
      user_team_data: userTeamData2Array,
      history_data: historyData2Array,
    });
  }
});

app.get("/add-vendor", auth, (req, res) => {
  const addVendorQuery =
    "INSERT INTO vendors (user_id, account_balance) VALUES ($1, 0)";
  const values = [req.session.user.user_id];

  db.none(addVendorQuery, values)
    .then(() => {
      res.redirect("/profile");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/edit-teams", async (req, res) => {
  const deleteTeamQuery = "DELETE FROM users_to_teams WHERE user_id = $1";
  const deleteValues = [req.session.user.user_id];
  try {
    const deleteTeam = await db.any(deleteTeamQuery, deleteValues);
    if (deleteTeam) {
      const teams = req.body.teams;
      var teamArray = teams.split(",");
      for (var i = 0; i < teamArray.length; i++) {
        const insertTeamQuery =
          "INSERT INTO users_to_teams (user_id, team_id) VALUES ($1, $2)";
        const insertValues = [req.session.user.user_id, teamArray[i]];
        try {
          const insertTeam = await db.any(insertTeamQuery, insertValues);
          if (insertTeam) {
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
  res.redirect("/profile");
});

app.post("/edit-user", async (req, res) => {
  const { first_name, last_name, username } = req.body;
  const query =
    "UPDATE users SET first_name = $1, last_name = $2, username = $3 WHERE user_id = $4";
  const values = [first_name, last_name, username, req.session.user.user_id];
  try {
    const updateUser = await db.any(query, values);
    if (updateUser) {
      req.session.user.first_name = first_name;
      req.session.user.last_name = last_name;
      req.session.user.username = username;
    }
  } catch (error) {
    console.log(error);
  }
  res.redirect("/profile");
});

app.post("/submit-profile-picture", async (req, res) => {
  const { picture } = req.body;
  const query = "UPDATE users SET img_path = $1 WHERE user_id = $2";
  const values = [picture, req.session.user.user_id];
  try {
    const updatePicture = await db.any(query, values);
    if (updatePicture) {
      req.session.user.img_path = picture;
    }
  } catch (error) {
    console.log(error);
  }
  res.redirect("/profile");
});

app.get("/delete-account", async (req, res) => {
  const vendorQuery =
    "SELECT vendor_id FROM vendors WHERE user_id = $1 LIMIT 1";
  const vendorValues = [req.session.user.user_id];
  try {
    const vendor_id = await db.any(vendorQuery, vendorValues);
    if (vendor_id) {
      const productQuery =
        "SELECT product_id FROM vendors_to_products WHERE vendor_id = $1";
      const productValues = [vendor_id.vendor_id];
      try {
        const product_id = await db.any(productQuery, productValues);
        if (product_id) {
          var productArray = [];
          for (var i = 0; i < product_id.length; i++) {
            productArray.push(product_id[i].product_id);
          }
          for (var i = 0; i < productArray.length; i++) {
            const productDeleteQuery =
              "DELETE FROM products WHERE product_id = $1";
            const productDeleteValues = [productArray[i]];
            try {
              const deleteProduct = await db.any(
                productDeleteQuery,
                productDeleteValues
              );
            } catch (error) {
              console.log(error);
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
      const productVendorDeleteQuery =
        "DELETE FROM vendors_to_products WHERE vendor_id = $1";
      const productVendorDeleteValues = [vendor_id.vendor_id];
      try {
        const deleteVendorProduct = await db.any(
          productVendorDeleteQuery,
          productVendorDeleteValues
        );
      } catch (error) {
        console.log(error);
      }
      const vendorDeleteQuery = "DELETE FROM vendors WHERE vendor_id = $1";
      const vendorDeleteValues = [vendor_id.vendor_id];
      try {
        const deleteVendor = await db.any(
          vendorDeleteQuery,
          vendorDeleteValues
        );
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
  }
  const userTeamQuery = "DELETE FROM users_to_teams WHERE user_id = $1";
  const userTeamValues = [req.session.user.user_id];
  try {
    const deleteUserTeams = await db.any(userTeamQuery, userTeamValues);
  } catch (error) {
    console.log(error);
  }
  const purchaseHistoryQuery =
    "DELETE FROM purchase_history WHERE user_id = $1";
  const purchaseHistoryValues = [req.session.user.user_id];
  try {
    const deletePurchaseHistory = await db.any(
      purchaseHistoryQuery,
      purchaseHistoryValues
    );
  } catch (error) {
    console.log(error);
  }
  const query = "DELETE FROM users WHERE user_id = $1";
  const values = [req.session.user.user_id];
  try {
    const deleteUser = await db.any(query, values);
    if (deleteUser) {
      res.redirect("/logout");
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/submit-purchase", async (req, res) => {
  const { isStock, stock_id, product_id } = req.body;
  if (isStock == 0) {
    const query =
      "INSERT INTO purchase_history (user_id, product_id) VALUES ($1, $2)";
    const values = [req.session.user.user_id, product_id];
    try {
      const insertPurchase = await db.any(query, values);
    } catch (error) {
      console.log(error);
    }
  } else {
  }
});

app.get("/sell-item", auth, (req, res) => {
  res.render("pages/sell-item");
});

app.post("/sell-item", auth, async (req, res) => {
  const {
    pictureInput,
    itemName,
    itemType,
    league,
    itemPrice,
    itemQuantity,
    itemDescription,
  } = req.body;
  const tags = itemName + " " + league;
  const query =
    "INSERT INTO products (product_name, product_type, product_tags, price, quantity, img_path, description, fromVendor) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)";
  const values = [
    itemName,
    itemType,
    tags,
    itemPrice,
    itemQuantity,
    pictureInput,
    itemDescription,
    1,
  ];
  try {
    const insertItem = await db.any(query, values);
    if (insertItem) {
      const id = await db.any(
        "SELECT product_id FROM products ORDER BY product_id DESC LIMIT 1"
      );
      if (id) {
        const insertVendorProduct = await db.any(
          "INSERT INTO vendors_to_products (vendor_id, product_id) VALUES ($1, $2)",
          [req.session.vendor.vendor_id, id[0].product_id]
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
  res.redirect("/marketplace");
});

// Logout endpoint
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/profile');
    }
    res.clearCookie('connect.sid');
    res.status(200).render('pages/login', { message: 'You have been logged out successfully!', error: false });
  });
});

// Server setup

// Authentication middleware

// -------------------------------------  STOCK JS   ----------------------------------------------

app.get("/stocks/api", async (req, res) => {
  let { ticker, start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    start_date = '2022-01-09';
    end_date = '2023-11-10';
  }

  if (!ticker) {
    return res.status(400).send("Ticker symbol is required.");
  }

  try {
    const query = "SELECT * FROM stocks WHERE ticker = $1";
    const stockData = await db.oneOrNone(query, [ticker]);

    if (stockData) {
      // If stock data exists in the database, return it
      console.log(`Data found in database for ticker: ${ticker}`);
      return res.json({
        timestamps: stockData.timestamps,
        closePrices: stockData.closeprices,
        tradingVolume: stockData.tradingvolume,
        volumePrice: stockData.volumeprice
      });
    } else {
      // If stock data does not exist, fetch from external API
      const apiKey = 'Vv4ccSgpX99Ia9ppOLxwmIyW_tG4Sjm3';
      const params = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${start_date}/${end_date}?adjusted=true&sort=asc&apiKey=${apiKey}`;
      const response = await fetch(params);

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.results) {
        return res.status(404).send("No data found for the given ticker.");
      }

      // Convert timestamps to readable dates
      const timestamps = data.results.map(entry => new Date(entry.t).toISOString().split('T')[0]);
      const closePrices = data.results.map(entry => entry.c);
      const tradingVolume = data.results.map(entry => entry.v);
      const openPrice = data.results.map(entry => entry.o);

      // Save the new stock data into the database
      const insertQuery = `
              INSERT INTO stocks (ticker, timestamps, closePrices, tradingVolume, openprice)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (ticker) DO NOTHING
          `;
      await db.none(insertQuery, [ticker, timestamps, closePrices, tradingVolume, openPrice]);

      console.log(`Data fetched from API and saved for ticker: ${ticker}`);

      return res.json({
        timestamps: timestamps,
        closePrices: closePrices,
        tradingVolume: tradingVolume,
        openPrice: openPrice
      });
    }
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/stockreq", async (req, res) => {
  const { ticker, start_date, end_date } = req.query;

  // Log formatted dates to verify
  console.log("Formatted Start Date:", start_date);
  console.log("Formatted End Date:", end_date);
  console.log("The ticker is", ticker);
  console.log(start_date);
  if (!ticker || !start_date || !end_date) {
    console.log("Missing required fields");
    console.log(start_date, end_date);
    return res
      .status(400)
      .json({ error: "Ticker, start date, and end date are required." });
  }

  try {
    const apiKey = env.STOCK_API_KEY;
    const params = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${start_date}/${end_date}?adjusted=true&sort=asc&apiKey=${apiKey}`;
    console.log(`Fetching data from API with URL: ${params}`);

    const response = await fetch(params);
    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data.results) {
      console.log("No data found for the given ticker.");
      return res
        .status(404)
        .json({ error: "No data found for the given ticker." });
    }

    const timestamps = data.results.map((entry) => entry.t);
    const closePrices = data.results.map((entry) => entry.c);

    console.log("Data fetched successfully:", { timestamps, closePrices });
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//----------------------------------------SPORTS DATA JS-------------------------------------------------------------------

app.post("/Teamtrends", async (req, res) => {
  const team = req.body.team; // Get team from POST request body

  if (!team) {
    return res.status(400).send("Team parameter is required.");
  }

  const query = `https://api.sportsdata.io/v3/cfb/odds/json/TeamTrends/${team}?key=${TEAM_TREND_API_KEY}`;

  try {
    const response = await fetch(query);
    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    res.render('partials/teamtrends', { team, data }); // Pass data to the template

  } catch (error) {
    console.error("Error fetching team trends:", error);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/gamestats", async (req, res) => {
  const gameid = req.body.gameid; // Get team from POST request body

  if (!gameid) {
    return res.status(400).send("Team parameter is required.");
  }

  const query = `https://api.sportsdata.io/v3/cfb/odds/json/BettingSplitsByGameId/${gameid}?key=${SPLIT_KEY}`;

  try {
    const response = await fetch(query);
    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    res.render('partials/bettingSplits', { gameid, data }); // Pass data to the template

  } catch (error) {
    console.error("Error fetching team trends:", error);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/BoxScores", async (req, res) => {
  const team = req.body.team;
  const opponent = req.body.opponent;

  const query = `https://api.sportsdata.io/v3/cfb/odds/json/MatchupTrends/${team}/${opponent}?key=4a43fbe39b644597859730d456c898a1`;

  try {
    const response = await fetch(query);
    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    // Pass data to the template
    res.render("partials/BoxScore", { team, data });
  } catch (error) {
    console.error("Error fetching team trends:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// Start the server
module.exports = app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

