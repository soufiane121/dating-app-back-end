const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const secretKey = process.env.MY_SECRET_KEY; // require("./keys").mySecretKey;
const User = require("../models/User");
const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secretKey;

module.exports = function (passport) {
	passport.use(
		new JwtStrategy(opts, function (jwt_payload, done) {
			User.findOne({ _id: jwt_payload }, function (err, user) {
				if (err) {
					return done(err, false);
				}
				if (user) {
					return done(null, user);
				} else {
					return done(null, false);
					// or you could create a new account
				}
			});
		})
	);
};
