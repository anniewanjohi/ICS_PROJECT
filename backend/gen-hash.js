const bcrypt = require('bcrypt');
const password = 'Student@123';
bcrypt.hash(password, 10, function(err, hash) {
    if (err) throw err;
    console.log(hash);
});
