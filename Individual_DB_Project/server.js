const express = require('express');

const bodyParser = require('body-parser')

const mysql = require('mysql');
const { query } = require('express');

const { body, validationResult } = require('express-validator');

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
app.use(bodyParser.urlencoded({ extended: true }));




// Customer functionality Begins here...
app.get('/Customer', (req, res) =>{
    con.query('SELECT * FROM products', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('CustomerPage', {"products": rows});
    });
});

app.get('/CustomerSteamerOrder', (req, res) => {
    res.render('CustomerSteamerOrder');
});

app.post('/CustomerSteamerOrderAction', (req, res) => {
    console.log('Got body:', req.body);
    var str = "INSERT INTO `baseballstore`.`glove_steaming` (`customer_ID`, `employee_ID`, `price`) VALUES ('" + req.body.CusID + "', '" + req.body.EmpID + "', '5')";
    console.log(str);
    con.query(str);
    res.redirect('/Customer');
});

app.post('/selfUpdateCustomer', (req, res) => {
    console.log('Got body:', req.body);
    con.query("SELECT * FROM customers WHERE Cus_ID = '" + req.body.dropDown + "'", (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('CustomerSelfUpdate', {"data": rows});
    });
});

app.post('/selfUpdateCustomerAction', (req, res) => {
    console.log('Got body:', req.body);
    var str = "UPDATE `baseballstore`.`customers` SET `First_Name` = '"+ req.body.Fname +"', `Last_Name` = '"+ req.body.Lname +"', `Gender` = '"+ req.body.Gender +"', `Email` = '" + req.body.email + "', `Password` = '" + req.body.pass + "' WHERE (`Cus_ID` = '" + req.body.ID + "')";
    con.query(str);
    res.redirect('/Customer');
});

app.post('/addOrder', (req, res) =>{
    console.log('Got body:', req.body);
    con.query('SELECT * FROM products', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('newSale', {"products": rows});
    });
});

app.post('/addOrderAction', (req, res) => {
    console.log('Got body:', req.body);

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
        str = "INSERT INTO `baseballstore`.`sales` (`Cus_ID`, `product_ID`, `amount`, `type`, `product_name`, `cost`) VALUES ('" + '2' + "', '" + req.body.dropDown + "', '" + req.body.Count + "', '" + rows[0].type + "', '" + rows[0].P_name + "', '" + cost + "')";
        console.log(str);
        con.query(str);
    });
    
    res.redirect('/Customer');
});

app.post('/viewPriorPurchases', (req, res) =>{
    var str = 'SELECT * FROM sales WHERE Cus_ID = ' + 2;
    con.query(str, (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('PriorPurchase', {"sales": rows});
    });
});







// Admin functionality begins here...
app.get('/AdminPage', (req, res) =>{
    res.render('AdminHome');
});

app.get('/addCustomer', (req, res) => {
    res.render('newCustomer');
});

app.post('/addCustomerAction', (req, res) => {
    console.log('Got body:', req.body);
    var str = "INSERT INTO `baseballstore`.`customers` (`First_Name`, `Last_Name`, `Gender`, `Email`, `Password`) VALUES ('"+ req.body.Fname +"', '" + req.body.Lname + "', '"+ req.body.Gender +"', '" + req.body.email + "', '"+ req.body.pass +"')";
    console.log(str);
    con.query(str);
    res.redirect('/ManageCustomers');
});

app.get('/addEmployee', (req, res) => {
    res.render('newEmployee');
});

app.post('/addEmployeeAction', (req, res) => {
    console.log('Got body:', req.body);
    var str = "INSERT INTO `employees` (`First_Name`, `Last_Name`, `Gender`, `Email`, `Salary`) VALUES (" + "'" +  req.body.fname + "', '" + req.body.Lname + "', '" + req.body.Gender + "', '" +req.body.email + "', '" + req.body.salary + "')";
    console.log(str);
    con.query(str);
    res.redirect('/ManageEmployees');
});

app.get('/addProduct', (req, res) => {
    res.render('newProduct');
});

app.post('/addProductAction', (req, res) => {
    console.log('Got body:', req.body);
    var str = "INSERT INTO `baseballstore`.`products` (`P_name`, `type`, `stock`, `price`) VALUES ('" + req.body.name + "', '"+ req.body.type +"', '" + req.body.count + "', '" + req.body.price + "')";
    console.log(str);
    con.query(str);
    res.redirect('/ManageProducts');
});

app.get('/addSteamerOrder', (req, res) => {
    res.render('newSteamerOrder');
});

app.post('/addSteamerOrderAction', (req, res) => {
    console.log('Got body:', req.body);
    var str = "INSERT INTO `baseballstore`.`glove_steaming` (`customer_ID`, `employee_ID`, `price`) VALUES ('" + req.body.CusID + "', '" + req.body.EmpID + "', '5')";
    console.log(str);
    con.query(str);
    res.redirect('/Manage_Steam_Orders');
});

app.post('/deleteCustomer', (req, res) =>{
    console.log('Got body:', req.body);
    var str = "DELETE FROM `baseballstore`.`customers` WHERE (`Cus_ID` = '" + req.body.dropDown + "')";
    console.log(str);
    con.query(str);
    res.redirect('/ManageCustomers');
});

app.post('/deleteEmployee', (req, res) =>{
    console.log('Got body:', req.body);
    var str = "DELETE FROM `baseballstore`.`employees` WHERE (`Emp_ID` = '" + req.body.dropDown + "')";
    console.log(str);
    con.query(str);
    res.redirect('/ManageEmployees');
});

app.post('/deleteProduct', (req, res) =>{
    console.log('Got body:', req.body);
    var str = "DELETE FROM `baseballstore`.`products` WHERE (`product_ID` = '" + req.body.dropDown + "')";
    console.log(str);
    con.query(str);
    res.redirect('/ManageProducts');
});

app.post('/deleteSteamerOrder', (req, res) =>{
    console.log('Got body:', req.body);
    var str = "DELETE FROM `baseballstore`.`glove_steaming` WHERE (`glove_steaming_ID` = '" + req.body.dropDown + "')";
    console.log(str);
    con.query(str);
    res.redirect('/Manage_Steam_Orders');
});

app.get('/Login', (req, res) => {
    res.render('Login');
});

app.get('/Logout', (req, res) => {
    res.render('Login');
});

app.get('/ManageCustomers', (req, res) => {
    con.query('SELECT * FROM customers', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('Manage_Cus', {"customers": rows});
    });
});

app.get('/ManageEmployees', (req, res) => {
    con.query('SELECT * FROM employees', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('Manage_Emp', {"employees": rows});
    });
});

app.get('/ManageProducts', (req, res) => {
    con.query('SELECT * FROM products', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('Manage_Product', {"products": rows});
    });
});

app.get('/Manage_Steam_Orders', (req, res) => {
    con.query('SELECT * FROM glove_steaming', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('Manage_Steam_Orders', {"steams": rows});
    });
});

app.get('/Reports', (req, res) => {
    res.render('Reports');
});

app.post('/updateCustomer', (req, res) => {
    console.log('Got body:', req.body);
    con.query("SELECT * FROM customers WHERE Cus_ID = '" + req.body.dropDown + "'", (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('updateCustomer', {"data": rows});
    });
});

app.post('/updateCustomerAction', (req, res) => {
    console.log('Got body:', req.body);
    var str = "UPDATE `baseballstore`.`customers` SET `First_Name` = '"+ req.body.Fname +"', `Last_Name` = '"+ req.body.Lname +"', `Gender` = '"+ req.body.Gender +"', `Email` = '" + req.body.email + "', `Password` = '" + req.body.pass + "' WHERE (`Cus_ID` = '" + req.body.ID + "')";
    con.query(str);
    res.redirect('/ManageCustomers');
});

app.post('/updateEmployee', (req, res) => {
    console.log('Got body:', req.body);
    con.query("SELECT * FROM employees WHERE Emp_ID = '" + req.body.dropDown + "'", (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('updateEmployee', {"data": rows});
    });
});

app.post('/updateEmployeeAction', (req, res) => {
    console.log('Got body:', req.body);
    var str = "UPDATE `baseballstore`.`employees` SET `First_Name` = '"+ req.body.fname +"', `Last_Name` = '"+ req.body.Lname +"', `Gender` = '"+ req.body.Gender +"', `Email` = '"+ req.body.email +"', `Salary` = '"+ req.body.salary +"' WHERE (`Emp_ID` = '" + req.body.ID + "')";
    con.query(str);
    res.redirect('/ManageEmployees');
});

app.post('/updateProduct', (req, res) => {
    console.log('Got body:', req.body);
    con.query("SELECT * FROM products WHERE product_ID = '" + req.body.dropDown + "'", (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('updateProduct', {"data": rows});
    });
});

app.post('/updateProductAction', (req, res) => {
    console.log('Got body:', req.body);
    var str = "UPDATE `baseballstore`.`products` SET `P_name` = '"+ req.body.name +"', `type` = '"+ req.body.type +"', `stock` = '"+ req.body.count +"', `price` = '"+ req.body.price +"' WHERE (`product_ID` = '"+ req.body.ID +"')";
    con.query(str);
    res.redirect('/ManageProducts');
});

app.post('/updateSteamerOrder', (req, res) => {
    console.log('Got body:', req.body);
    con.query("SELECT * FROM glove_steaming WHERE glove_steaming_ID = '" + req.body.dropDown + "'", (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('updateSteamerOrder', {"data": rows});
    });
});

app.post('/updateSteamerOrderAction', (req, res) => {
    console.log('Got body:', req.body);
    var str = "UPDATE `baseballstore`.`glove_steaming` SET `customer_ID` = '"+ req.body.CusID +"', `employee_ID` = '" + req.body.EmpID + "', `price` = '5' WHERE (`glove_steaming_ID` = '"+ req.body.ID +"')";
    con.query(str);
    res.redirect('/Manage_Steam_Orders');
});

app.get('/viewCustomers', (req, res) =>{
    con.query('SELECT * FROM customers', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewCustomers', {"customers": rows});
    });
});

app.get('/viewEmployees', (req, res) =>{
    con.query('SELECT * FROM employees', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewEmployees', {"employees": rows});
    });
});

app.get('/viewProducts', (req, res) =>{
    con.query('SELECT * FROM products', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewProducts', {"products": rows});
    });
});

app.get('/viewSales', (req, res) =>{
    con.query('SELECT * FROM sales', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('viewSales', {"sales": rows});
    });
});

app.listen(3000);