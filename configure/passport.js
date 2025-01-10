const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const usersDB = require("../models/usersDB");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user exists in MongoDB
        let user = await usersDB.findUser({ googleId: profile.id });

        if (user.length > 0) {
          // User already exists, return user
          return done(null, user[0]); // Take the first user from the array
        } else {
          user = await usersDB.findUser({ email: profile.emails[0].value });

          if (user.length > 0) {
            // If email id already exist, update existing user
            const newField = { googleId: profile.id, isEmailVerified: true };
            const result = await usersDB.updateUser(
              { email: profile.emails[0].value },
              newField
            );
            return done(null, result); // Pass new user to done
          } else {
            // If user doesn't exist, create a new one
            const newUser = {
              fname: profile.name.givenName,
              lname: profile.name.familyName,
              email: profile.emails[0].value,
              isEmailVerified: true,
              googleId: profile.id,
            };

            let result = await usersDB.insertUser(newUser);
            return done(null, result); // Pass new user to done
          }
        }
      } catch (error) {
        return done(error); // Handle any errors
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id); // Use _id from MongoDB
});

passport.deserializeUser(async (id, done) => {
  try {
    let user = await usersDB.findUserById(id);
    if (user.length > 0) {
      done(null, user[0]); // Take the first user from the array
    } else {
      done(null, false); // No user found
    }
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
