const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const { User } = require("../models"); // Adjust path if needed
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { email: profile.emails[0].value } });  
        if (!user) {
          user = await User.create({
            email: profile.emails[0].value,
            provider: "google",
          });

         user.newUser = true;
         } else {
         user.newUser = false;
       }
       return done(null, user);
        
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ["id", "emails", "name"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { email: profile.emails[0].value } });
      if (!user) {
      user = await User.create({
      email: profile.emails[0].value,
      provider: "facebook",
     });
     user.newUser = true;
    } else {
       user.newUser = false;
     }
      return done(null, user);
      } catch (err) {
        return done(err, null, newUser);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user. ID_Users);
});

passport.deserializeUser(async ( ID_Users, done) => {
  try {
    const user = await User.findByPk( ID_Users);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
module.exports = passport;
