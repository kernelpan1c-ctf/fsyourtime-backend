/**
 * Created by Kevin on 10/16/15.
 */
function create(attrs, cb) {
    async.waterfall([
        // check for duplicate email
        function (next) {
            db.table('user').filter({email: attrs.email}).count().run(db.conn, next);
        },
        // check for duplicate username
        function (count, next) {
            if (count > 0) {
                cb('Email already exists!');
            } else {
                db.table('user').filter({username: attrs.username}).count().run(db.conn, next);
            }
        },
        // Insert the new user
        function (count, next) {
            if (count > 0) {
                cb('Username already exists!');
            } else {
                db.table('user').insert(attrs, { 'return_vals': true }).run(db.conn, next);
            }
        }
    ]);


    userInfo = JSON.parse(body);
    console.log(userInfo);
    identEntry = new identdb.identificationModel();
    identEntry.jsession = userInfo.sessionid;
    identEntry.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Logged in. Continuing...');
        }
    });

}),