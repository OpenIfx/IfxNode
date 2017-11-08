// Test insertion of BLOB and CLOB data using FILE NAME.
// No need to read the file into memory buffer.
// Author: bimaljha@in.ibm.com

var common = require("./common")
    , ifxnjs = require("../")
    , assert = require("assert")
    , fs = require('fs')
    , cn = common.connectionString;

ifxnjs.open(cn, function (err,conn) 
{
  if (err) 
  {
    console.log(err);
    process.exit(-1);
  }
  try {
      conn.querySync("drop table mytab");
  } catch (e) {};
  try {
    conn.querySync("create table mytab (empId int, photo BYTE, desc TEXT)");
    } catch (e) {};
  
  var img1= 'data/phool.jpg'; //fs.readFileSync('phool.jpg','binary');
  var text= 'data/desc.txt'; //fs.readFileSync('trc.fmt','ascii');

  var len1  = fs.statSync(img1)["size"];
  var len2  = fs.statSync(text)["size"];
  console.log( "img1.length = " + len1);
  console.log( "text.length = " + len2);

  conn.prepare("insert into mytab(empId, photo, desc) VALUES (?, ?, ?)", 
      function (err, stmt) 
   {
    if (err) 
    {
      console.log(err);
      return conn.closeSync();
    }
    //var photo = [3, -2, -98, img1];  // We can use such array too.
    //var photo = {ParamType:"FILE", CType:"BINARY", "SQLType:"BLOB", Data:img1};
    // Except, numbers and string; all other datatypes like LOBS, GRAPHIC, File, etc
    // must be passed as JSON Object or Array.
    var photo = {ParamType:"FILE", DataType: "BLOB", "Data":img1};
    var desc = {ParamType: "FILE", "DataType": "CLOB", Data: text};
	console.log(photo);
	console.log(desc);
	stmt.execute([18, photo, desc], function (err, result) 
	{
      if( err ) console.log(err);  
      else result.closeSync();
	  
	  conn.prepare("select * from mytab", function (err, stmt)
      {
        if(err) 
        {
          console.log(err);
          return conn.closeSync();
        }

        stmt.execute([], function(err, result) {
          if(err) console.log(err);
          else 
          {
            data = result.fetchAllSync();
            fs.writeFileSync('phool2.jpg', data[0].PHOTO, 'binary');
            fs.writeFileSync('desc2.txt', data[0].DESC, 'ascii');
            try {
                conn.querySync("drop table mytab");
            } catch (e) {};
            result.closeSync();
  
            var size1 = fs.statSync("phool2.jpg")["size"];
            var size2 = fs.statSync("desc2.txt")["size"];
            console.log("Lengths after select = " + size1+ ", " + size2);
            assert(len1, size1);
            assert(len2, size2);

            fs.unlinkSync("phool2.jpg");
            fs.unlink("desc2.txt", function () { console.log('done'); });
          }
        });
      });
	});
  });
});

