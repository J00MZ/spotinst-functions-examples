/*
This serverless function queries a MySQL database and will either instert a new value 
into the data table or it will return all the values in the data table depending on
the URL parameters that are entered. If you enter in number=1 to the URL it will 
perform an insert, however if you have not enterend in the right parameters or you
are entering a value that already exisits in the table you will get an error. 

To personalize this function you will need to enter in your MySQL credentials 
bellow as well as edit the query parameters in the checkParams() function and in the
checkNewValue() function. Lastly you will want to change the query paramters for the
insert function bellow
*/
const mysql = require('mysql');
// set up connection to DB
const pool = mysql.createPool({
    host: {Your Host},
    user: {Your Username},
    password: {Your Password},
    database: {Your Database},
    port: 3306
});

/*
This function takes in the request parametes where the URL parameters live. To 
personalize this function you will want to change the req.query.{params} to be the 
parameters that you are looking for. It will return a bool value if all the parameters
defined are met.

@param req    request that comes from the serverless framework. To access the query
              params you will do req.query.{param}
@return bool  true if all parameters are met and false if one or more is undefined
*/
function checkParams(event){
	return (event.query.firstName==undefined || event.query.lastName==undefined ||
	        event.query.email==undefined || event.query.instances==undefined)
}

/*
This function takes in the connection to the database and the serverless request
to perform a secondary request to the database to check that the value that has been
entered is not already in the data table. You will want to enter in your own columns
from your data table and put them in the query

@param con    connection variable that is used to connection to the MySQL database
              to format this connection checkthe main function pool variable
@param req    request that comes from the serverless framework. To access the query
              params you will do req.query.{param}
@return bool  true if there are at least one instance of the row in the data table and
              false if it is original 
*/
function checkInTable(con, event){
	return con.query("SELECT COUNT(*) FROM customers "+
		               "WHERE first_name='"+event.query.firstName+"' "+
		               "AND last_name='"+event.query.lastName+"' "+
		               "AND email='"+event.query.email+"';", (err,res)=>{
		if(res[0]['COUNT(*)']>0) return true
		else return false });
}


/*
This is the main function that is executed by the serverless framework. We takes in the
request object which has the URL parameters stored. We then connect to the MySQL 
database using a data pool because serverless perfers asyncronous functions. The first
check is to see if the user has entered number=1 as a parameter. If they have not we
will return all the values in the datatable. If they have, then we will try and insert
a new row into the data table. Before we can do this we will check that all the URL
parameters have been met and that the row we are inserting is not already in the
data table. If all these checks pass we will insert the new row. We return a promise
object because the serverless frameworks requirements. If there are any errors a 
status code of 400 is retuned and an appropriate message

@params event    event object that is generated by the serverless framework where
                 the URL parameters are stored
@return callback this is required to be returned by the serverless framework
*/
module.exports.main = function main (event, context, callback) {
	let query = ""
	pool.getConnection((err, con)=>{
		console.log(err)
		console.log(con)
		// if number param == 1 try to insert new value if not return all values in DB
		if(event.query.number==1){
			// if parameters are not met return error
			if(checkParams(event)){
		    	callback(null, {
					statusCode: 400, 
					body: "Parameters not defined"
				});
			// if row in datatable return error
			}else if(checkInTable(con, event)){
		    	callback(null, {
					statusCode: 400, 
					body: "You have already entered this value"
				});	
			}else{
				query = "INSERT INTO players (firstName, lastName, email, company) VALUES"
				query +=  "('"+event.query.firstName+"', '"+event.query.lastName+"', '"
					            +event.query.email+"', '"+event.query.company+"');"
			}			
		}else{
			query = "SELECT * FROM players"
		}
		console.log(query)
		con.query(query,(err,res)=>{
			con.release()
			console.log(res)
	    	callback(null, {
				statusCode: 200, 
				body: "Success"
			});	 
		})
	})
};
