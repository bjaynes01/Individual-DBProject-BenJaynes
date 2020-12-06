if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}
const express = require('express');
const bodyParser = require('body-parser')
const mysql = require('mysql');
const flash = require('express-flash');
const session = require('express-session');
const {check, validationResult} = require('express-validator');
const basicAuth = require('express-basic-auth')

const app = express();

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Base2018",
    database: "baseballstore"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.json());
app.use(flash());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))


//Login functionality is located here. ============================================================================

//Login Route
app.get('/Login', (req, res) => {
    res.render('Login');
});

//Logout Route 
app.get('/Logout', (req, res) => {
    res.render('Login');
});

//Login Action
app.post('/LoginAction', (req, res) => {
    console.log("Email", req.body.user);
    console.log("Password", req.body.pass);
    if(req.body.user === 'Admin' && req.body.pass === 'pass'){
        // Login as Admin
        res.redirect('/adminPage')
    }else{
        // Login as User
        let str = "SELECT * FROM customers WHERE Email= '" + req.body.user +"' AND Password= '" + req.body.pass + "'";
        console.log('query: ', str)
        con.query(str, (err,rows) => {
            console.log(rows)
            if (rows.length == 0){
                req.flash('noUser', "there is not a user with those credentials")
                res.redirect('/Login')
            }else{
                app.set('ID', rows[0].Cus_ID);
                res.redirect('/Customer')
            }
        })
    }
});

// New User route
app.get('/newUser', (req, res) =>{
    res.render('NewUserLogin')
})

// New User Creation Action
app.post('/newUserAction', [
    check('Fname').not().isEmpty().withMessage('Must have a First Name'), 
    check('Lname').not().isEmpty().withMessage('Must have a Last Name'), 
    check('email').isEmail().withMessage('Must Have an Email'),
    check('Gender').notEmpty().withMessage('You must input a Gender'), 
    check('pass').notEmpty().isLength({ max:10 }).withMessage("Must Be shorter then 10 characters")
    ] , (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);

    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/addCustomer')
      } else {
        var str = "INSERT INTO `baseballstore`.`customers` (`First_Name`, `Last_Name`, `Gender`, `Email`, `Password`) VALUES ('"+ req.body.Fname +"', '" + req.body.Lname + "', '"+ req.body.Gender +"', '" + req.body.email + "', '"+ req.body.pass +"')";
        console.log(str);
        con.query(str);
        res.redirect('/Login');
      }
});



// Customer functionality Begins here ===============================================================================================

// Customer Page Route
app.get('/Customer', (req, res) =>{
    con.query('SELECT * FROM products', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        console.log('data', {ID : app.get('ID')})        
        res.render('CustomerPage', {ID : app.get('ID')});
    });
});

// Customer steamer order route
app.post('/CustomerSteamerOrder', (req, res) => {
    console.log("ID", req.body.dropDown)
    con.query('Select Emp_ID from employees', (err,rows) =>{
        var employees = []
        console.log("rows: ")
        console.log(rows)
        employees = rows;
        res.render('CustomerSteamerOrder', {"employees":employees, "Identity": req.body.dropDown});
    })
});

// customer steamer order action route
app.post('/CustomerSteamerOrderAction', [
    check('EmpID').notEmpty().isNumeric().withMessage('Must have an EmployeeID')
], (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect(308, '/CustomerSteamerOrder')
    }else{
        console.log('Got body:', req.body);
        var str = "INSERT INTO `baseballstore`.`glove_steaming` (`customer_ID`, `employee_ID`, `price`) VALUES ('" + req.body.CusID + "', '" + req.body.EmpID + "', '5')";
        console.log(str);
        con.query(str);
        app.set('ID', req.body.CusID);
        res.redirect('/Customer');
    }
});

// customer self update route
app.post('/selfUpdateCustomer', (req, res) => {
    console.log('Got body:', req.body);
    var str = null;
    if(req.body.ID !== undefined){
        str = req.body.ID
        console.log("ID", req.body.ID)
    }else{
        console.log("dropDown", req.body.dropDown)
        str = req.body.dropDown
    }
    console.log("query", "SELECT * FROM customers WHERE Cus_ID = '" + str + "'")
    con.query("SELECT * FROM customers WHERE Cus_ID = '" + str + "'", (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('CustomerSelfUpdate', {"data": rows});
    });
});

// customer self update action route.
app.post('/selfUpdateCustomerAction',[
    check('Fname').not().isEmpty().withMessage('Must have a First Name'), 
    check('Lname').not().isEmpty().withMessage('Must have a Last Name'),
    check('email').isEmail().withMessage('Must Have an Email'),
    check('Gender').notEmpty().withMessage('You must input a Gender'),
    check('pass').notEmpty().isLength({ max:10 }).withMessage("Must Be shorter then 10 characters"), 
    check('ID').notEmpty().isNumeric().withMessage('You must have an ID to update Customer')
    ] , (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect(308, '/selfUpdateCustomer')
    }else{
        var str = "UPDATE `baseballstore`.`customers` SET `First_Name` = '"+ req.body.Fname +"', `Last_Name` = '"+ req.body.Lname +"', `Gender` = '"+ req.body.Gender +"', `Email` = '" + req.body.email + "', `Password` = '" + req.body.pass + "' WHERE (`Cus_ID` = '" + req.body.ID + "')";
        con.query(str);
        app.set('ID', req.body.ID);
        res.redirect('/Customer');
    }
});

// add order route -> allows for customers to make orders from the store
app.post('/addOrder', (req, res) =>{
    console.log('Got body:', req.body);
    con.query('SELECT * FROM products', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);
        res.render('newSale', {"products": rows, "Identity": req.body.dropDown});
    });
});

// add Order Action route -> places order for customer.
app.post('/addOrderAction',[
    check('dropDown').notEmpty().isNumeric().withMessage('Must have a product_ID'), 
    check('Count').not().isEmpty().withMessage('Must have a amount of product')
    ] , (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);
    if (!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array());
    }else{
        var str;
        var q = 'SELECT * FROM products WHERE product_ID = ' + req.body.dropDown;
        console.log(q);
        con.query(q, (err,rows) => {
            if(err) throw err;
      
                console.log('Data received from Db:');
                console.log(rows);

                var cost = rows[0].price * Number(req.body.Count);
                console.log(rows[0].price)
                console.log(req.body.Count)
                str = "INSERT INTO `baseballstore`.`sales` (`Cus_ID`, `product_ID`, `amount`, `type`, `product_name`, `cost`) VALUES ('" + req.body.ID + "', '" + req.body.dropDown + "', '" + req.body.Count + "', '" + rows[0].type + "', '" + rows[0].P_name + "', '" + cost + "')";
                app.set('ID', req.body.ID);
                console.log(str);
                con.query(str);
                res.redirect('/Customer');
            });
    }
});

// view Prior Puchases -> allows the customer to se their prior purchases.
app.post('/viewPriorPurchases', (req, res) =>{
    var str = 'SELECT * FROM sales WHERE Cus_ID = ' + req.body.dropDown;
    console.log("query:", str)
    con.query(str, (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('PriorPurchase', {"sales": rows});
    });
});







// Admin functionality begins here...

// Admin page route -> has all of admin privliged actions on it, the Admin home page
app.get('/AdminPage', (req, res) =>{
    res.render('AdminHome');
});

// add Customer route -> loads the form for adding new customers
app.get('/addCustomer', (req, res) => {
    res.render('newCustomer');
});

// add Customer action route -> adds the customer if proper input is provided redirects back to addCustomer if not.
app.post('/addCustomerAction', [
    check('Fname').not().isEmpty().withMessage('Must have a First Name'), 
    check('Lname').not().isEmpty().withMessage('Must have a Last Name'), 
    check('email').isEmail().withMessage('Must Have an Email'),
    check('Gender').notEmpty().withMessage('You must input a Gender'), 
    check('pass').notEmpty().isLength({ max:10 }).withMessage("Must Be shorter then 10 characters")
    ] , (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);

    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/addCustomer')
      } else {
        var str = "INSERT INTO `baseballstore`.`customers` (`First_Name`, `Last_Name`, `Gender`, `Email`, `Password`) VALUES ('"+ req.body.Fname +"', '" + req.body.Lname + "', '"+ req.body.Gender +"', '" + req.body.email + "', '"+ req.body.pass +"')";
        console.log(str);
        con.query(str);
        res.redirect('/ManageCustomers');
      }
});

// add Employee route -> loads the page used to add new Employees
app.get('/addEmployee', (req, res) => {
    res.render('newEmployee');
});

// add Employee Action route -> adds the employee to the database table if proper information is provided.
app.post('/addEmployeeAction', [
    check('fname').not().isEmpty().withMessage('Must have a First Name'), 
    check('Lname').not().isEmpty().withMessage('Must have a Last Name'), 
    check('email').isEmail().withMessage('Must Have an Email'), 
    check('Gender').notEmpty().withMessage('You must input a Gender'), 
    check('salary').notEmpty().isNumeric().withMessage("Must have a Salary that is a Number")
], (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/addEmployee')
    }else{
        console.log('Got body:', req.body);
        var str = "INSERT INTO `employees` (`First_Name`, `Last_Name`, `Gender`, `Email`, `Salary`) VALUES (" + "'" +  req.body.fname + "', '" + req.body.Lname + "', '" + req.body.Gender + "', '" +req.body.email + "', '" + req.body.salary + "')";
        console.log(str);
        con.query(str);
        res.redirect('/ManageEmployees');
    }
});

// add product route -> loads the form for adding products to the database tables
app.get('/addProduct', (req, res) => {
    res.render('newProduct');
});

// add Product Action route -> adds the product to the database table if proper inormation is provided.
app.post('/addProductAction', [
    check('name').notEmpty().withMessage('Must have a Product Name'), 
    check('type').notEmpty().not().isNumeric().withMessage('Must have a Product Type that is not numeric'), 
    check('count').notEmpty().isNumeric().withMessage('Must have a count that is numeric'), 
    check('price').notEmpty().isNumeric().withMessage("Must have a Price that is numeric")
], (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/addProduct')
    }else{
        var str = "INSERT INTO `baseballstore`.`products` (`P_name`, `type`, `stock`, `price`) VALUES ('" + req.body.name + "', '"+ req.body.type +"', '" + req.body.count + "', '" + req.body.price + "')";
        console.log(str);
        con.query(str);
        res.redirect('/ManageProducts');
    }
});

// add Sale route loads the form used to add sales to the database.
app.get('/addSale', (req, res) =>{
    console.log('Got body:', req.body);
    con.query('SELECT * FROM products', (err,rows) => {
        if(err) throw err;
        var products = rows;
        console.log('Data received from Db:');
        console.log(rows);
        con.query('SELECT Cus_ID FROM customers', (err,rows) => {
            if(err) throw err;
            var customers = rows;
            console.log('Data received from Db:');
            console.log(rows);
            res.render('newAdminSale', {"products": products, "customers": customers, "Identity": req.body.dropDown});
        });
    });
});

// adds Sales to the database if proper input is provided.
app.post('/addSaleAction',[
    check('productID').notEmpty().isNumeric().withMessage('Must have a Product ID'), 
    check('CusID').notEmpty().isNumeric().withMessage('Must have a Customer ID'), 
    check('Count').not().isEmpty().withMessage('Must have a amount of product')
    ] , (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);
    if (!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array());
    }else{
        var str;
        var q = 'SELECT * FROM products WHERE product_ID = ' + req.body.productID;
        console.log(q);
        con.query(q, (err,rows) => {
            if(err) throw err;
      
                console.log('Data received from Db:');
                console.log(rows);

                var cost = rows[0].price * Number(req.body.Count);
                console.log(rows[0].price)
                console.log(req.body.Count)
                str = "INSERT INTO `baseballstore`.`sales` (`Cus_ID`, `product_ID`, `amount`, `type`, `product_name`, `cost`) VALUES ('" + req.body.CusID + "', '" + req.body.productID + "', '" + req.body.Count + "', '" + rows[0].type + "', '" + rows[0].P_name + "', '" + cost + "')";
                app.set('ID', req.body.ID);
                console.log(str);
                con.query(str);
                res.redirect('/ManageSales');
            });
    }
});

// add Steamer Order route -> loads the form used to add Glove Steaming orders to the glove_steaming table int the database.
app.get('/addSteamerOrder', (req, res) => {
    con.query('Select Cus_ID from customers', (err,rows) =>{
        var customers = []
        console.log("rows: ")
        console.log(rows)
        customers = rows;
        var employees = []
        con.query('Select Emp_ID from employees', (err,rows) =>{
            console.log("rows: ")
            console.log(rows)
            employees = rows;
            res.render('newSteamerOrder', {"customers":customers, "employees":employees});
        })
    })
});

// Add Steamer Order Action Route -> Adds the Glove steaming Order to the database if proper input is provided.
app.post('/addSteamerOrderAction', [
    check('CusID').notEmpty().isNumeric().withMessage('Must have a CustomerID'), 
    check('EmpID').notEmpty().isNumeric().withMessage('Must have an EmployeeID')
    ], (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/addSteamerOrder')
    }else{
        var str = "INSERT INTO `baseballstore`.`glove_steaming` (`customer_ID`, `employee_ID`, `price`) VALUES ('" + req.body.CusID + "', '" + req.body.EmpID + "', '5')";
        console.log(str);
        con.query(str);
        res.redirect('/Manage_Steam_Orders');
    }
});

// Delete customer route -> deletes customer provided that a ID is selected on the Manage customer page.
app.post('/deleteCustomer', (req, res) =>{
    console.log('Got body:', req.body);
    var str = "DELETE FROM `baseballstore`.`customers` WHERE (`Cus_ID` = '" + req.body.dropDown + "')";
    console.log(str);
    con.query(str);
    res.redirect('/ManageCustomers');
});

// Delete Employee Route -> Deletes employees provided that an ID is selected on the Manage Employee page.
app.post('/deleteEmployee', (req, res) =>{
    console.log('Got body:', req.body);
    var str = "DELETE FROM `baseballstore`.`employees` WHERE (`Emp_ID` = '" + req.body.dropDown + "')";
    console.log(str);
    con.query(str);
    res.redirect('/ManageEmployees');
});

// Delete Product Route -> deletes a product providded that products ID is selected on the Manage Products page.
app.post('/deleteProduct', (req, res) =>{
    console.log('Got body:', req.body);
    var str = "DELETE FROM `baseballstore`.`products` WHERE (`product_ID` = '" + req.body.dropDown + "')";
    console.log(str);
    con.query(str);
    res.redirect('/ManageProducts');
});

// Delete Steamer Order Route -> deletes a Glove Steamer Order providded that glove_steaming ID is selected on the Manage Steamer Orders page.
app.post('/deleteSteamerOrder', (req, res) =>{
    console.log('Got body:', req.body);
    var str = "DELETE FROM `baseballstore`.`glove_steaming` WHERE (`glove_steaming_ID` = '" + req.body.dropDown + "')";
    console.log(str);
    con.query(str);
    res.redirect('/Manage_Steam_Orders');
});

// Delete Sale Route -> deletes a sale providded that Sales ID is selected on the Manage Sales page.
app.post('/deleteSale', (req, res) =>{
    console.log('Got body:', req.body);
    var str = "DELETE FROM `baseballstore`.`sales` WHERE (`sales_ID` = '" + req.body.dropDown + "')";
    console.log(str);
    con.query(str);
    res.redirect('/ManageSales');
});

// Loads the Manage Customer Page
app.get('/ManageCustomers', (req, res) => {
    con.query('SELECT * FROM customers', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('Manage_Cus', {"customers": rows});
    });
});

// Loads the Manage Employees Page
app.get('/ManageEmployees', (req, res) => {
    con.query('SELECT * FROM employees', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('Manage_Emp', {"employees": rows});
    });
});

// Loads the Manage Products Page
app.get('/ManageProducts', (req, res) => {
    con.query('SELECT * FROM products', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('Manage_Product', {"products": rows});
    });
});

// Loads the Manage Steamer orders Page.
app.get('/Manage_Steam_Orders', (req, res) => {
    con.query('SELECT * FROM glove_steaming', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('Manage_Steam_Orders', {"steams": rows});
    });
});

// Loads the Manage Sales Page.
app.get('/ManageSales', (req, res) => {
    con.query('SELECT * FROM sales', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('Manage_Sales', {"sales": rows});
    });
})

// Loads the Reports page.
app.get('/Reports', (req, res) => {
    con.query('Select Cus_ID from customers', (err,rows) =>{
        var customers = []
        console.log("rows: ")
        console.log(rows)
        customers = rows;
        var employees = []
        con.query('Select Emp_ID from employees', (err,rows) =>{
            console.log("rows: ")
            console.log(rows)
            employees = rows;
            con.query('Select product_ID from products', (err,rows) =>{
                var products = []
                console.log("rows: ")
                console.log(rows)
                products = rows;
                res.render('Reports', {"customers":customers, "employees":employees, "products": products});
            })
        })
    })
});

// loads the update Customer form
app.post('/updateCustomer', (req, res) => {
    console.log('Got body:', req.body);
    var str;
    if(req.body.ID != null){
        str = "SELECT * FROM customers WHERE Cus_ID = '" + req.body.ID + "'";
    }else{
        str = "SELECT * FROM customers WHERE Cus_ID = '" + req.body.dropDown + "'"
    }
    con.query(str, (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('updateCustomer', {"data": rows});
    });
});

// updates a customer when it is given proper input.
app.post('/updateCustomerAction',[
    check('Fname').notEmpty().withMessage('Must have a First Name'), 
    check('Lname').notEmpty().withMessage('Must have a Last Name'), 
    check('email').isEmail().withMessage('Must Have an Email'), 
    check('Gender').notEmpty().withMessage('You must input a Gender'), 
    check('pass').notEmpty().isNumeric().isLength({ max:10 }).withMessage("Must Be shorter then 10 characters"), 
    check('ID').notEmpty().isNumeric().withMessage('You must have an ID to update Customer')
    ] , (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect(308, '/updateCustomer')
    }else{
        var str = "UPDATE `baseballstore`.`customers` SET `First_Name` = '"+ req.body.Fname +"', `Last_Name` = '"+ req.body.Lname +"', `Gender` = '"+ req.body.Gender +"', `Email` = '" + req.body.email + "', `Password` = '" + req.body.pass + "' WHERE (`Cus_ID` = '" + req.body.ID + "')";
        con.query(str);
        res.redirect('/ManageCustomers');
    }
});

// loads the form to update employees
app.post('/updateEmployee', (req, res) => {
    console.log('Got body:', req.body);
    var str;
    if(req.body.ID != null){
        str = "SELECT * FROM employees WHERE Emp_ID = '" + req.body.ID + "'";
    }else{
        str = "SELECT * FROM employees WHERE Emp_ID = '" + req.body.dropDown + "'";
    }
    con.query(str, (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('updateEmployee', {"data": rows});
    });
});

// updates the employee in the database table given the form was filled out with good data, else redirect with correction statements.
app.post('/updateEmployeeAction',[
    check('fname').not().isEmpty().withMessage('Must have a First Name'), 
    check('Lname').not().isEmpty().withMessage('Must have a Last Name'), 
    check('email').isEmail().withMessage('Must Have an Email'), 
    check('Gender').notEmpty().withMessage('You must input a Gender'), 
    check('salary').notEmpty().isNumeric().withMessage("Must have a Salary that is a Number"), 
    check('ID').notEmpty().isNumeric().withMessage('You must have an ID to update Employee')
    ], (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect(308, '/updateEmployee')
    }else{
        var str = "UPDATE `baseballstore`.`employees` SET `First_Name` = '"+ req.body.fname +"', `Last_Name` = '"+ req.body.Lname +"', `Gender` = '"+ req.body.Gender +"', `Email` = '"+ req.body.email +"', `Salary` = '"+ req.body.salary +"' WHERE (`Emp_ID` = '" + req.body.ID + "')";
        con.query(str);
        res.redirect('/ManageEmployees');
    }
});

// loads the form for updating products.
app.post('/updateProduct', (req, res) => {
    console.log('Got body:', req.body);
    var str;
    if(req.body.ID != null){
        str = "SELECT * FROM products WHERE product_ID = '"+ req.body.ID + "'";
    }else{
        str = "SELECT * FROM products WHERE product_ID = '"+ req.body.dropDown + "'";
    }
    con.query(str, (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('updateProduct', {"data": rows});
    });
});

// updates the prodcut in the database table given the form was provided with the correct data.
app.post('/updateProductAction', [
    check('name').notEmpty().withMessage('Must have a Product Name'),
    check('type').not().isEmpty().withMessage('Must have a Product Type'),
    check('count').notEmpty().isNumeric().withMessage('Must have a count that is numeric'),
    check('price').notEmpty().isNumeric().withMessage("Must have a Price that is numeric"), 
    check('ID').notEmpty().isNumeric().withMessage('You must have an ID to update Product')], (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect(308, '/updateProduct')
    }else{
        var str = "UPDATE `baseballstore`.`products` SET `P_name` = '"+ req.body.name +"', `type` = '"+ req.body.type +"', `stock` = '"+ req.body.count +"', `price` = '"+ req.body.price +"' WHERE (`product_ID` = '"+ req.body.ID +"')";
        con.query(str);
        res.redirect('/ManageProducts');
    }
});

// loads the form for updating steamer orders
app.post('/updateSteamerOrder', (req, res) => {
    console.log('Got body:', req.body);
    var str;
    if(req.body.ID != null){
        str = "SELECT * FROM glove_steaming WHERE glove_steaming_ID = '"+ req.body.ID + "'";
    }else{
        str = "SELECT * FROM glove_steaming WHERE glove_steaming_ID = '"+ req.body.dropDown + "'";
    }
    con.query(str, (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('updateSteamerOrder', {"data": rows});
    });
});

// updates teh steamer order if proper data was provided to the form.
app.post('/updateSteamerOrderAction', [
    check('CusID').notEmpty().isNumeric().withMessage('Must have a CustomerID'), 
    check('EmpID').notEmpty().isNumeric().withMessage('Must have an EmployeeID'), 
    check('ID').notEmpty().isNumeric().withMessage('You must have an ID to update Steamer Order')
    ], (req, res) => {
    const errors = validationResult(req);
    console.log('Got body:', req.body);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect(308, '/updateSteamerOrder')
    }else{
        var str = "UPDATE `baseballstore`.`glove_steaming` SET `customer_ID` = '"+ req.body.CusID +"', `employee_ID` = '" + req.body.EmpID + "', `price` = '5' WHERE (`glove_steaming_ID` = '"+ req.body.ID +"')";
        con.query(str);
        res.redirect('/Manage_Steam_Orders');
    }
});


// Report Page functionality Begins here =============================================================================================

// loads the Customers report.
app.get('/viewCustomers', (req, res) =>{
    con.query('SELECT * FROM customers', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewCustomers', {"customers": rows});
    });
});

// loads the Employees report.
app.get('/viewEmployees', (req, res) =>{
    con.query('SELECT * FROM employees', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewEmployees', {"employees": rows});
    });
});

// loads the Products report.
app.get('/viewProducts', (req, res) =>{
    con.query('SELECT * FROM products', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewProducts', {"products": rows});
    });
});

// loads the Sales report
app.get('/viewSales', (req, res) =>{
    con.query('SELECT * FROM sales', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewSales', {"sales": rows});
    });
});

// loads the sales Report for a certain product.
app.post('/viewSalesProduct', (req, res) =>{
    con.query('SELECT * FROM sales WHERE product_ID = ' + req.body.productID, (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewSales', {"sales": rows});
    });
});

// loads the sales report for a certain Customer.
app.post('/viewSalesCustomer', (req, res) =>{
    con.query('SELECT * FROM sales WHERE Cus_ID = ' + req.body.CusID, (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewSales', {"sales": rows});
    });
});

// Loads the Glove steamer order report.
app.get('/viewSteamerOrders', (req, res) =>{
    con.query('SELECT * FROM glove_steaming', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewSteamingOrders', {"steams": rows});
    });
});

// Loads the Glove steamer order report for a certain employee.
app.post('/viewGloveSteamingEmployee', (req, res) =>{
    con.query('SELECT * FROM glove_steaming WHERE employee_ID = ' + req.body.EmpID, (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewSteamingOrders', {"steams": rows});
    });
});

// Loads the Glove Steaming Order for a certain Customer.
app.post('/viewGloveSteamingCustomer', (req, res) =>{
    con.query('SELECT * FROM glove_steaming WHERE customer_ID = ' + req.body.CusID, (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewSteamingOrders', {"steams": rows});
    });
});

app.listen(3000);